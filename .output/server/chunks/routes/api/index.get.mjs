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
  const user_id = parseInt(query.user_id);
  if (!user_id) return [];
  return await prisma.address.findMany({
    where: { user_id },
    orderBy: [
      { is_primary: "desc" },
      { created_at: "desc" }
    ]
  });
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
