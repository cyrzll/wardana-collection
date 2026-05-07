import { d as defineEventHandler, g as getQuery } from '../../../nitro/nitro.mjs';
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

const index_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const status = query.status;
  const where = {};
  if (status && status !== "all") {
    where.status = status;
  }
  const orders = await prisma.order.findMany({
    where,
    include: {
      user: true,
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

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
