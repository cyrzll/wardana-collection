import { d as defineEventHandler, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
import { PrismaClient } from '@prisma/client';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const prisma = new PrismaClient();
const complete_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { order_id, user_id } = body;
  if (!order_id || !user_id) {
    throw createError({ statusCode: 400, statusMessage: "Data tidak valid" });
  }
  try {
    const order = await prisma.order.findUnique({
      where: { id: order_id }
    });
    if (!order || order.user_id !== user_id) {
      throw createError({ statusCode: 404, statusMessage: "Pesanan tidak ditemukan" });
    }
    if (order.status !== "dikirim") {
      throw createError({ statusCode: 400, statusMessage: "Hanya pesanan dengan status dikirim yang dapat diselesaikan" });
    }
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: order_id },
        data: { status: "selesai" }
      });
      await tx.orderStatus.create({
        data: {
          order_id,
          status: "selesai",
          description: "Pesanan telah diterima dan diselesaikan oleh pembeli"
        }
      });
      return updated;
    });
    return updatedOrder;
  } catch (e) {
    throw createError({
      statusCode: e.statusCode || 500,
      statusMessage: e.statusMessage || e.message || "Gagal menyelesaikan pesanan"
    });
  }
});

export { complete_post as default };
//# sourceMappingURL=complete.post.mjs.map
