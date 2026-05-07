import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { user_id, product_id, type, variant_name, size } = body

  if (!user_id || !product_id || !type) {
    throw createError({ statusCode: 400, statusMessage: 'Missing fields' })
  }

  const where: any = {
    user_id,
    product_id,
    type
  }

  if (type === 'cart') {
    where.variant_name = variant_name || null
    where.size = size || null
  }

  const item = await prisma.cart.findFirst({ where })
  if (!item) return { success: true }

  await prisma.cart.delete({
    where: { id: item.id }
  })

  return { success: true }
})
