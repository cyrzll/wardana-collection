import { d as defineEventHandler, r as readBody, c as createError } from '../../nitro/nitro.mjs';
import { p as prisma } from '../../_/prisma.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@prisma/client';

const index_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const {
    user_id,
    items,
    shipping_fee,
    harga_discount,
    ongkir_discount,
    final_amount,
    recipient_name,
    phone,
    full_address,
    payment_method,
    pin,
    voucher_ids
    // array of user_voucher ids
  } = body;
  if (!user_id || !items || items.length === 0) {
    throw createError({ statusCode: 400, statusMessage: "Data pesanan tidak lengkap" });
  }
  if (payment_method === "wardanapay") {
    const wallet = await prisma.userWallet.findUnique({
      where: { user_id: parseInt(user_id) }
    });
    if (!wallet) {
      throw createError({ statusCode: 400, statusMessage: "Dompet WardanaPay belum aktif" });
    }
    if (wallet.pin !== pin) {
      throw createError({ statusCode: 400, statusMessage: "PIN WardanaPay salah" });
    }
    if (wallet.balance < final_amount) {
      throw createError({ statusCode: 400, statusMessage: "Saldo WardanaPay tidak mencukupi" });
    }
  }
  const order = await prisma.$transaction(async (tx) => {
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1e3)}`;
    const newOrder = await tx.order.create({
      data: {
        user_id: parseInt(user_id),
        order_number: orderNumber,
        total_amount: items.reduce((acc, item) => acc + item.price * item.quantity, 0),
        shipping_fee: parseFloat(shipping_fee),
        discount_amount: parseFloat(harga_discount || 0) + parseFloat(ongkir_discount || 0),
        final_amount: parseFloat(final_amount),
        status: "dikemas",
        payment_method: payment_method || "wardanapay",
        payment_status: "paid",
        recipient_name,
        phone,
        full_address,
        items: {
          create: items.map((item) => ({
            product_id: item.product_id,
            product_name: item.name,
            quantity: item.quantity,
            price: item.price,
            variant: item.variant,
            size: item.size,
            image: item.image
          }))
        },
        statuses: {
          create: {
            status: "dikemas",
            description: "Pesanan sedang disiapkan oleh penjual"
          }
        }
      }
    });
    if (voucher_ids && voucher_ids.length > 0) {
      await tx.userVoucher.updateMany({
        where: { id: { in: voucher_ids.map((id) => parseInt(id)) } },
        data: {
          is_used: true,
          used_at: /* @__PURE__ */ new Date()
        }
      });
    }
    if (payment_method === "wardanapay") {
      await tx.userWallet.update({
        where: { user_id: parseInt(user_id) },
        data: { balance: { decrement: parseFloat(final_amount) } }
      });
    }
    await tx.cart.deleteMany({
      where: {
        user_id: parseInt(user_id),
        type: "cart",
        product_id: { in: items.map((item) => item.product_id) }
      }
    });
    return newOrder;
  });
  return {
    success: true,
    order
  };
});

export { index_post as default };
//# sourceMappingURL=index.post5.mjs.map
