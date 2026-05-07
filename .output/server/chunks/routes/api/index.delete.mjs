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

const index_delete = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { user_id, product_id, type, variant_name, size } = body;
  if (!user_id || !product_id || !type) {
    throw createError({ statusCode: 400, statusMessage: "Missing fields" });
  }
  const where = {
    user_id,
    product_id,
    type
  };
  if (type === "cart") {
    where.variant_name = variant_name || null;
    where.size = size || null;
  }
  const item = await prisma.cart.findFirst({ where });
  if (!item) return { success: true };
  await prisma.cart.delete({
    where: { id: item.id }
  });
  return { success: true };
});

export { index_delete as default };
//# sourceMappingURL=index.delete.mjs.map
