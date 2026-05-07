import { d as defineEventHandler, r as readBody, c as createError } from '../../../../nitro/nitro.mjs';
import { p as prisma } from '../../../../_/prisma.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@prisma/client';

const wallet_put = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { user_id, balance, pin } = body;
  if (!user_id) {
    throw createError({
      statusCode: 400,
      statusMessage: "User ID is required"
    });
  }
  const updateData = {};
  if (balance !== void 0) updateData.balance = parseFloat(balance);
  if (pin !== void 0) updateData.pin = pin;
  const wallet = await prisma.userWallet.upsert({
    where: { user_id: parseInt(user_id) },
    update: updateData,
    create: {
      user_id: parseInt(user_id),
      balance: parseFloat(balance) || 0,
      pin: pin || "123456"
    }
  });
  return {
    success: true,
    wallet
  };
});

export { wallet_put as default };
//# sourceMappingURL=wallet.put.mjs.map
