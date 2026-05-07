import { d as defineEventHandler, r as readBody } from '../../nitro/nitro.mjs';
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
    code,
    title,
    type,
    discount_value,
    discount_type,
    min_purchase,
    max_discount,
    target_user_type,
    target_users,
    target_scope,
    target_categories,
    target_products,
    start_date,
    end_date,
    usage_limit
  } = body;
  const voucher = await prisma.voucher.create({
    data: {
      code,
      title,
      type,
      discount_value: parseFloat(discount_value),
      discount_type,
      min_purchase: parseFloat(min_purchase || 0),
      max_discount: max_discount ? parseFloat(max_discount) : null,
      target_user_type,
      target_users: JSON.stringify(target_users || []),
      target_scope,
      target_categories: JSON.stringify(target_categories || []),
      target_products: JSON.stringify(target_products || []),
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      usage_limit: usage_limit ? parseInt(usage_limit) : null
    }
  });
  return voucher;
});

export { index_post as default };
//# sourceMappingURL=index.post8.mjs.map
