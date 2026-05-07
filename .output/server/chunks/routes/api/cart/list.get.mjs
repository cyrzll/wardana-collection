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

const list_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const user_id = parseInt(query.user_id);
  if (!user_id) return { cart: [], wishlist: [] };
  const items = await prisma.cart.findMany({
    where: { user_id },
    include: {
      product: true
    },
    orderBy: { created_at: "desc" }
  });
  const cart = items.filter((i) => i.type === "cart").map((i) => {
    var _a;
    const product = i.product;
    const variants = JSON.parse(product.variants || "[]");
    const selectedVariant = variants.find((v) => v.name === i.variant_name);
    const displayImage = ((_a = selectedVariant == null ? void 0 : selectedVariant.images) == null ? void 0 : _a.length) ? selectedVariant.images[0] : JSON.parse(product.images || "[]")[0];
    const displayPrice = (selectedVariant == null ? void 0 : selectedVariant.price) ? Math.round(selectedVariant.price * (1 - selectedVariant.discount / 100)) : product.price;
    return {
      id: i.id,
      product_id: i.product_id,
      name: product.name,
      image: displayImage,
      price: displayPrice,
      quantity: i.quantity,
      variant: i.variant_name,
      size: i.size
    };
  });
  const wishlist = items.filter((i) => i.type === "wishlist").map((i) => {
    var _a;
    const product = i.product;
    const variants = JSON.parse(product.variants || "[]");
    const selectedVariant = variants.find((v) => v.name === i.variant_name);
    const displayImage = ((_a = selectedVariant == null ? void 0 : selectedVariant.images) == null ? void 0 : _a.length) ? selectedVariant.images[0] : JSON.parse(product.images || "[]")[0];
    return {
      id: i.id,
      product_id: i.product_id,
      name: product.name,
      image: displayImage,
      price: product.price,
      variant: i.variant_name,
      size: i.size
    };
  });
  return { cart, wishlist };
});

export { list_get as default };
//# sourceMappingURL=list.get.mjs.map
