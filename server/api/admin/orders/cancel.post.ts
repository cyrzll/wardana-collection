import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { order_id, reason } = body

  if (!order_id) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID is required' })
  }

  const order = await prisma.order.findUnique({
    where: { id: parseInt(order_id) }
  })

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Pesanan tidak ditemukan' })
  }

  if (order.status !== 'dikemas') {
    throw createError({ statusCode: 400, statusMessage: 'Pesanan sudah diproses dan tidak dapat dibatalkan' })
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update Order
    await tx.order.update({
      where: { id: order.id },
      data: { 
        status: 'batal',
        payment_status: 'refunded_by_seller'
      }
    })

    // 2. Add Status Record
    await tx.orderStatus.create({
      data: {
        order_id: order.id,
        status: 'batal',
        description: `Dibatalkan oleh seller. Alasan: ${reason || 'Tidak disebutkan'}`
      }
    })

    // 3. Refund to User Wallet if paid with WardanaPay
    if (order.payment_method === 'wardanapay') {
      await tx.userWallet.update({
        where: { user_id: order.user_id },
        data: { balance: { increment: order.final_amount } }
      })
    }

    return {
      success: true,
      message: 'Pesanan berhasil dibatalkan dan saldo dikembalikan ke pembeli'
    }
  })
})
