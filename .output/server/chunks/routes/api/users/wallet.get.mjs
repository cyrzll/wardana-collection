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

const wallet_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const userId = parseInt(query.user_id);
  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: "User ID is required"
    });
  }
  const wallet = await prisma.userWallet.findUnique({
    where: { user_id: userId }
  });
  return wallet;
});

export { wallet_get as default };
//# sourceMappingURL=wallet.get.mjs.map
