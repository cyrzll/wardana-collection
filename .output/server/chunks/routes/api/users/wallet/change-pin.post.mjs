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

const changePin_post = defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { user_id, current_pin, new_pin, password } = body;
  if (!user_id || !current_pin || !new_pin || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Semua data harus diisi"
    });
  }
  const user = await prisma.user.findUnique({
    where: { id: parseInt(user_id) },
    include: { wallet: true }
  });
  if (!user || !user.wallet) {
    throw createError({
      statusCode: 404,
      statusMessage: "Pengguna atau dompet tidak ditemukan"
    });
  }
  if (user.wallet.pin !== current_pin) {
    throw createError({
      statusCode: 400,
      statusMessage: "PIN saat ini salah"
    });
  }
  if (user.password !== password) {
    throw createError({
      statusCode: 400,
      statusMessage: "Password akun salah"
    });
  }
  await prisma.userWallet.update({
    where: { user_id: parseInt(user_id) },
    data: { pin: new_pin }
  });
  return {
    success: true,
    message: "PIN berhasil diperbarui"
  };
});

export { changePin_post as default };
//# sourceMappingURL=change-pin.post.mjs.map
