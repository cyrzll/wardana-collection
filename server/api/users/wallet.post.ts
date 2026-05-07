
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { user_id, pin } = body

  if (!user_id || !pin) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID and PIN are required',
    })
  }

  // Check if wallet already exists
  const existing = await prisma.userWallet.findUnique({
    where: { user_id: parseInt(user_id) }
  })

  if (existing) {
    throw createError({
      statusCode: 400,
      statusMessage: 'WardanaPay account already exists',
    })
  }

  const wallet = await prisma.userWallet.create({
    data: {
      user_id: parseInt(user_id),
      pin: pin, // In production, hash this PIN
      balance: 0
    }
  })

  return {
    success: true,
    wallet
  }
})
