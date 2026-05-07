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

const index_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { user_id, product_id, type, quantity, variant_name, size } = body;
  if (!user_id || !product_id || !type) {
    throw createError({ statusCode: 400, statusMessage: "Authentication required" });
  }
  if (type === "cart") {
    const existing = await prisma.cart.findFirst({
      where: {
        user_id,
        product_id,
        type: "cart",
        variant_name: variant_name || null,
        size: size || null
      }
    });
    if (existing) {
      return await prisma.cart.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + (parseInt(quantity) || 1) }
      });
    }
    return await prisma.cart.create({
      data: {
        user_id,
        product_id,
        type: "cart",
        quantity: parseInt(quantity) || 1,
        variant_name: variant_name || null,
        size: size || null
      }
    });
  }
  if (type === "wishlist") {
    const existing = await prisma.cart.findFirst({
      where: {
        user_id,
        product_id,
        type: "wishlist",
        variant_name: variant_name || null,
        size: size || null
      }
    });
    if (existing) return { message: "Already in wishlist" };
    return await prisma.cart.create({
      data: {
        user_id,
        product_id,
        type: "wishlist",
        quantity: 1,
        variant_name: variant_name || null,
        size: size || null
      }
    });
  }
  throw createError({ statusCode: 400, statusMessage: "Invalid type" });
});

export { index_post as default };
//# sourceMappingURL=index.post2.mjs.map
