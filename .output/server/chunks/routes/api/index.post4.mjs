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
  if (!(body == null ? void 0 : body.name)) throw createError({ statusCode: 400, statusMessage: "Name is required" });
  return await prisma.gender.create({
    data: {
      name: body.name
    }
  });
});

export { index_post as default };
//# sourceMappingURL=index.post4.mjs.map
