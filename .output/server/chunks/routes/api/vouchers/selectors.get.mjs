import { d as defineEventHandler } from '../../../nitro/nitro.mjs';
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

const selectors_get = defineEventHandler(async (event) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true },
    where: { level: "user" }
  });
  const categories = await prisma.category.findMany({
    select: { id: true, name: true }
  });
  const products = await prisma.product.findMany({
    select: { id: true, name: true }
  });
  return { users, categories, products };
});

export { selectors_get as default };
//# sourceMappingURL=selectors.get.mjs.map
