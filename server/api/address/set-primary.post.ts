import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { user_id, address_id } = body

  if (!user_id || !address_id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing fields' })
  }

  // 1. Unset all
  await prisma.address.updateMany({
    where: { user_id },
    data: { is_primary: false }
  })

  // 2. Set this one
  const updated = await prisma.address.update({
    where: { id: address_id },
    data: { is_primary: true }
  })

  return { success: true, address: updated }
})
