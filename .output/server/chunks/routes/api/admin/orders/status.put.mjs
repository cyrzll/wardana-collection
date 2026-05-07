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

const status_put = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { order_id, status } = body;
  if (!order_id || !status) {
    throw createError({ statusCode: 400, statusMessage: "Order ID and Status are required" });
  }
  const order = await prisma.order.findUnique({
    where: { id: parseInt(order_id) }
  });
  if (!order) {
    throw createError({ statusCode: 404, statusMessage: "Pesanan tidak ditemukan" });
  }
  const descriptions = {
    dikirim: "Pesanan sedang dalam perjalanan ke alamat Anda",
    selesai: "Pesanan telah diterima oleh pembeli. Transaksi selesai.",
    dikemas: "Pesanan sedang disiapkan oleh penjual"
  };
  return await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status,
        updated_at: /* @__PURE__ */ new Date()
      }
    });
    await tx.orderStatus.create({
      data: {
        order_id: order.id,
        status,
        description: descriptions[status] || `Status diperbarui menjadi ${status}`
      }
    });
    return {
      success: true,
      message: "Status pesanan berhasil diperbarui"
    };
  });
});

export { status_put as default };
//# sourceMappingURL=status.put.mjs.map
