import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = parseInt(query.user_id as string)

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required',
    })
  }

  const wallet = await prisma.userWallet.findUnique({
    where: { user_id: userId }
  })

  return wallet
})
