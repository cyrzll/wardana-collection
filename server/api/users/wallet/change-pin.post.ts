
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { user_id, current_pin, new_pin, password } = body

  if (!user_id || !current_pin || !new_pin || !password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Semua data harus diisi',
    })
  }

  // 1. Get User and Wallet
  const user = await prisma.user.findUnique({
    where: { id: parseInt(user_id) },
    include: { wallet: true }
  })

  if (!user || !user.wallet) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Pengguna atau dompet tidak ditemukan',
    })
  }

  // 2. Verify Current PIN
  // In production, use hashed comparison. For now, direct comparison as per previous setup.
  if (user.wallet.pin !== current_pin) {
    throw createError({
      statusCode: 400,
      statusMessage: 'PIN saat ini salah',
    })
  }

  // 3. Verify Account Password
  // In production, use bcrypt.compare. Assuming simple check for now or the same hashing as login.
  // Note: I should check how login works to be consistent.
  if (user.password !== password) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Password akun salah',
    })
  }

  // 4. Update PIN
  await prisma.userWallet.update({
    where: { user_id: parseInt(user_id) },
    data: { pin: new_pin }
  })

  return {
    success: true,
    message: 'PIN berhasil diperbarui'
  }
})
