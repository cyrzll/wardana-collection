import { d as defineEventHandler, a as getRouterParam, c as createError } from '../../../nitro/nitro.mjs';
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

const _id__get = defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, "id") || "");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Invalid ID" });
  const product = await prisma.product.findUnique({
    where: { id }
  });
  if (!product) throw createError({ statusCode: 404, statusMessage: "Product not found" });
  return {
    ...product,
    images: JSON.parse(product.images || "[]"),
    options: JSON.parse(product.options || "[]"),
    sizes: JSON.parse(product.sizes || "[]"),
    cost_price: product.cost_price || 0,
    selling_price: product.selling_price || 0,
    discount: product.discount || 0,
    stock: product.stock || 0,
    variants: product.variants ? JSON.parse(product.variants) : []
  };
});

export { _id__get as default };
//# sourceMappingURL=_id_.get.mjs.map
