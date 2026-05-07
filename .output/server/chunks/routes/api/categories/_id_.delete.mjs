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

const _id__delete = defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, "id") || "");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Invalid ID" });
  await prisma.category.delete({
    where: { id }
  });
  return { success: true };
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
