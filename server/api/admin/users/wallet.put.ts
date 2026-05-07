export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { user_id, balance, pin } = body

  if (!user_id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    })
  }

  const updateData: any = {}
  if (balance !== undefined) updateData.balance = parseFloat(balance)
  if (pin !== undefined) updateData.pin = pin

  const wallet = await prisma.userWallet.upsert({
    where: { user_id: parseInt(user_id) },
    update: updateData,
    create: {
      user_id: parseInt(user_id),
      balance: parseFloat(balance) || 0,
      pin: pin || '123456'
    }
  })

  return {
    success: true,
    wallet
  }
})
