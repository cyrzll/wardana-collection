import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const orders = await prisma.order.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        user: {
          select: {
            username: true,
            email: true
          }
        }
      }
    })

    return orders.map(order => ({
      id: order.id,
      date: order.created_at,
      reference: order.order_number,
      type: 'Order Payment',
      customer: order.user.username,
      method: order.payment_method,
      amount: order.final_amount,
      status: order.status
    }))
  } catch (e: any) {
    throw createError({
      statusCode: 500,
      statusMessage: e.message
    })
  }
})
