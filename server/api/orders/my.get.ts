import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const userId = parseInt(query.user_id as string)
  const status = query.status as string

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'User ID is required'
    })
  }

  const where: any = {
    user_id: userId
  }

  if (status && status !== 'all') {
    where.status = status
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: true,
      statuses: {
        orderBy: { created_at: 'desc' }
      }
    },
    orderBy: {
      created_at: 'desc'
    }
  })

  return orders
})
