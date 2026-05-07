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

const claim_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { user_id, voucher_id } = body;
  if (!user_id || !voucher_id) {
    throw createError({ statusCode: 400, statusMessage: "Missing fields" });
  }
  const existing = await prisma.userVoucher.findFirst({
    where: { user_id, voucher_id }
  });
  if (existing) {
    throw createError({ statusCode: 400, statusMessage: "Voucher already claimed" });
  }
  const voucher = await prisma.voucher.findUnique({
    where: { id: voucher_id }
  });
  if (!voucher || voucher.status !== "active") {
    throw createError({ statusCode: 400, statusMessage: "Voucher not found or inactive" });
  }
  if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
    throw createError({ statusCode: 400, statusMessage: "Voucher has reached its usage limit" });
  }
  const claimed = await prisma.userVoucher.create({
    data: {
      user_id,
      voucher_id
    }
  });
  return { success: true, claimed };
});

export { claim_post as default };
//# sourceMappingURL=claim.post.mjs.map
