import prisma from '../../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { order_id, status } = body

  if (!order_id || !status) {
    throw createError({ statusCode: 400, statusMessage: 'Order ID and Status are required' })
  }

  const order = await prisma.order.findUnique({
    where: { id: parseInt(order_id) }
  })

  if (!order) {
    throw createError({ statusCode: 404, statusMessage: 'Pesanan tidak ditemukan' })
  }

  const descriptions: any = {
    dikirim: 'Pesanan sedang dalam perjalanan ke alamat Anda',
    selesai: 'Pesanan telah diterima oleh pembeli. Transaksi selesai.',
    dikemas: 'Pesanan sedang disiapkan oleh penjual'
  }

  return await prisma.$transaction(async (tx) => {
    // 1. Update Order Status
    await tx.order.update({
      where: { id: order.id },
      data: { 
        status,
        updated_at: new Date()
      }
    })

    // 2. Add Status History
    await tx.orderStatus.create({
      data: {
        order_id: order.id,
        status,
        description: descriptions[status] || `Status diperbarui menjadi ${status}`
      }
    })

    return {
      success: true,
      message: 'Status pesanan berhasil diperbarui'
    }
  })
})
