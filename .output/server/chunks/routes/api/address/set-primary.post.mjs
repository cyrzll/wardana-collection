import { d as defineEventHandler, r as readBody, c as createError } from '../../../nitro/nitro.mjs';
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

const setPrimary_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { user_id, address_id } = body;
  if (!user_id || !address_id) {
    throw createError({ statusCode: 400, statusMessage: "Missing fields" });
  }
  await prisma.address.updateMany({
    where: { user_id },
    data: { is_primary: false }
  });
  const updated = await prisma.address.update({
    where: { id: address_id },
    data: { is_primary: true }
  });
  return { success: true, address: updated };
});

export { setPrimary_post as default };
//# sourceMappingURL=set-primary.post.mjs.map
