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
  return await prisma.user.update({
    where: { id },
    data: {
      username: body.username,
      email: body.email,
      level: body.level,
      status: body.status,
      profile_image: body.profile_image
    }
  });
});

export { _id__put as default };
//# sourceMappingURL=_id_.put.mjs.map
