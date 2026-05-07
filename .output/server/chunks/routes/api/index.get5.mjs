import { d as defineEventHandler } from '../../nitro/nitro.mjs';
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

const index_get = defineEventHandler(async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      level: true,
      profile_image: true,
      status: true,
      wallet: true
    }
  });
});

export { index_get as default };
//# sourceMappingURL=index.get5.mjs.map
