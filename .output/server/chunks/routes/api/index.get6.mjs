import { d as defineEventHandler } from '../../nitro/nitro.mjs';
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

const index_get = defineEventHandler(async (event) => {
  const vouchers = await prisma.voucher.findMany({
    include: {
      _count: {
        select: { user_vouchers: true }
      }
    },
    orderBy: { created_at: "desc" }
  });
  return vouchers.map((v) => ({
    ...v,
    claim_count: v._count.user_vouchers,
    target_users: JSON.parse(v.target_users || "[]"),
    target_categories: JSON.parse(v.target_categories || "[]"),
    target_products: JSON.parse(v.target_products || "[]")
  }));
});

export { index_get as default };
//# sourceMappingURL=index.get6.mjs.map
