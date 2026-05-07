import { d as defineEventHandler, a as getRouterParam, c as createError, r as readBody } from '../../../nitro/nitro.mjs';
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

const _id__put = defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, "id") || "");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Invalid ID" });
  const body = await readBody(event);
  if (!(body == null ? void 0 : body.name)) throw createError({ statusCode: 400, statusMessage: "Name is required" });
  return await prisma.gender.update({
    where: { id },
    data: {
      name: body.name
    }
  });
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
