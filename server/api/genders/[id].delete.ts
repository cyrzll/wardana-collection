import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })

  await prisma.gender.delete({
    where: { id }
  })

  return { success: true }
})
