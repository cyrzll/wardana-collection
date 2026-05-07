import { d as defineEventHandler, r as readBody, c as createError } from '../../../../nitro/nitro.mjs';
import { p as prisma } from '../../../../_/prisma.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@prisma/client';

const cancel_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { order_id, reason } = body;
  if (!order_id) {
    throw createError({ statusCode: 400, statusMessage: "Order ID is required" });
  }
  const order = await prisma.order.findUnique({
    where: { id: parseInt(order_id) }
  });
  if (!order) {
    throw createError({ statusCode: 404, statusMessage: "Pesanan tidak ditemukan" });
  }
  if (order.status !== "dikemas") {
    throw createError({ statusCode: 400, statusMessage: "Pesanan sudah diproses dan tidak dapat dibatalkan" });
  }
  return await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "batal",
        payment_status: "refunded_by_seller"
      }
    });
    await tx.orderStatus.create({
      data: {
        order_id: order.id,
        status: "batal",
        description: `Dibatalkan oleh seller. Alasan: ${reason || "Tidak disebutkan"}`
      }
    });
    if (order.payment_method === "wardanapay") {
      await tx.userWallet.update({
        where: { user_id: order.user_id },
        data: { balance: { increment: order.final_amount } }
      });
    }
    return {
      success: true,
      message: "Pesanan berhasil dibatalkan dan saldo dikembalikan ke pembeli"
    };
  });
});

export { cancel_post as default };
//# sourceMappingURL=cancel.post.mjs.map
