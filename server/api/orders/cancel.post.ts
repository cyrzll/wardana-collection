import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { order_id, user_id } = body

  if (!order_id || !user_id) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID and User ID are required' })
  }

  const order = await prisma.order.findUnique({
    where: { id: parseInt(order_id) },
    include: { user: true }
  })

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Pesanan tidak ditemukan' })
  }

  if (order.user_id !== parseInt(user_id)) {
    throw createError({ statusCode: 403, statusMessage: 'Bukan pemilik pesanan' })
  }

  if (order.status !== 'dikemas') {
    throw createError({ statusCode: 400, statusMessage: 'Pesanan tidak dapat dibatalkan karena sudah dalam proses pengiriman' })
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update Order Status
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: { 
        status: 'batal',
        payment_status: 'refunded'
      }
    })

    // 2. Add Status Record
    await tx.orderStatus.create({
      data: {
        order_id: order.id,
        status: 'batal',
        description: 'Pesanan dibatalkan oleh pembeli'
      }
    })

    // 3. Refund Wallet Balance if paid with WardanaPay
    if (order.payment_method === 'wardanapay') {
      await tx.userWallet.update({
        where: { user_id: order.user_id },
        data: { balance: { increment: order.final_amount } }
      })
    }

    return {
      success: true,
      message: 'Pesanan berhasil dibatalkan dan saldo telah dikembalikan'
    }
  })
})
