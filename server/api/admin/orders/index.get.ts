import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const status = query.status as string

  const where: any = {}
  if (status && status !== 'all') {
    where.status = status
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: true,
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
