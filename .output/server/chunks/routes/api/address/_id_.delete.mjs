import { d as defineEventHandler, g as getQuery, c as createError } from '../../../nitro/nitro.mjs';
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
  var _a;
  const id = parseInt((_a = event.context.params) == null ? void 0 : _a.id);
  const query = getQuery(event);
  const user_id = parseInt(query.user_id);
  if (!id || !user_id) throw createError({ statusCode: 400, statusMessage: "Missing ID" });
  const target = await prisma.address.findUnique({ where: { id } });
  await prisma.address.delete({ where: { id } });
  if (target == null ? void 0 : target.is_primary) {
    const next = await prisma.address.findFirst({
      where: { user_id },
      orderBy: { created_at: "desc" }
    });
    if (next) {
      await prisma.address.update({
        where: { id: next.id },
        data: { is_primary: true }
      });
    }
  }
  return { success: true };
});

export { _id__delete as default };
//# sourceMappingURL=_id_.delete.mjs.map
