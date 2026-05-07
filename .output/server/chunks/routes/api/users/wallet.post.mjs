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

const wallet_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { user_id, pin } = body;
  if (!user_id || !pin) {
    throw createError({
      statusCode: 400,
      statusMessage: "User ID and PIN are required"
    });
  }
  const existing = await prisma.userWallet.findUnique({
    where: { user_id: parseInt(user_id) }
  });
  if (existing) {
    throw createError({
      statusCode: 400,
      statusMessage: "WardanaPay account already exists"
    });
  }
  const wallet = await prisma.userWallet.create({
    data: {
      user_id: parseInt(user_id),
      pin,
      // In production, hash this PIN
      balance: 0
    }
  });
  return {
    success: true,
    wallet
  };
});

export { wallet_post as default };
//# sourceMappingURL=wallet.post.mjs.map
