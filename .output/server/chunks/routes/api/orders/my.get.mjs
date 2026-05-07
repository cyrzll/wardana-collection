import { d as defineEventHandler, g as getQuery, c as createError } from '../../../nitro/nitro.mjs';
import { p as prisma } from '../../../_/prisma.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@prisma/client';

const my_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const userId = parseInt(query.user_id);
  const status = query.status;
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "User ID is required"
    });
  }
  const where = {
    user_id: userId
  };
  if (status && status !== "all") {
    where.status = status;
  }
  const orders = await prisma.order.findMany({
    where,
    include: {
      items: true,
      statuses: {
        orderBy: { created_at: "desc" }
      }
    },
    orderBy: {
      created_at: "desc"
    }
  });
  return orders;
});

export { my_get as default };
//# sourceMappingURL=my.get.mjs.map
