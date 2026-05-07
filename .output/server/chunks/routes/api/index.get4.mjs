import { d as defineEventHandler, g as getQuery } from '../../nitro/nitro.mjs';
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
  const query = getQuery(event);
  const category_id = query.category_id ? parseInt(query.category_id) : void 0;
  const gender_id = query.gender_id ? parseInt(query.gender_id) : void 0;
  const products = await prisma.product.findMany({
    where: {
      category_id,
      gender_id
    },
    include: {
      category: true,
      gender: true
    }
  });
  return products.map((p) => {
    var _a, _b;
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      description: p.description,
      category_id: p.category_id,
      gender_id: p.gender_id,
      category_name: (_a = p.category) == null ? void 0 : _a.name,
      gender_name: (_b = p.gender) == null ? void 0 : _b.name,
      images: JSON.parse(p.images || "[]"),
      options: JSON.parse(p.options || "[]"),
      sizes: JSON.parse(p.sizes || "[]"),
      cost_price: p.cost_price || 0,
      selling_price: p.selling_price || 0,
      discount: p.discount || 0,
      stock: p.stock || 0,
      variants: p.variants ? JSON.parse(p.variants) : []
    };
  });
});

export { index_get as default };
//# sourceMappingURL=index.get4.mjs.map
