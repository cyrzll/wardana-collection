import { d as defineEventHandler, c as createError } from '../../../../nitro/nitro.mjs';
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
const transactions_get = defineEventHandler(async (event) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { created_at: "desc" },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    });
    return orders.map((order) => ({
      id: order.id,
      date: order.created_at,
      reference: order.order_number,
      type: "Order Payment",
      customer: order.user.username,
      method: order.payment_method,
      amount: order.final_amount,
      status: order.status
    }));
  } catch (e) {
    throw createError({
      statusCode: 500,
      statusMessage: e.message
    });
  }
});

export { transactions_get as default };
//# sourceMappingURL=transactions.get.mjs.map
