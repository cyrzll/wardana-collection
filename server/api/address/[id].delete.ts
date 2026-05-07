import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(event.context.params?.id as string)
  const query = getQuery(event)
  const user_id = parseInt(query.user_id as string)

  if (!id || !user_id) throw createError({ statusCode: 400, statusMessage: 'Missing ID' })

  // Check if it's primary
  const target = await prisma.address.findUnique({ where: { id } })
  
  await prisma.address.delete({ where: { id } })

  // If we deleted the primary, set the next available one as primary
  if (target?.is_primary) {
    const next = await prisma.address.findFirst({
      where: { user_id },
      orderBy: { created_at: 'desc' }
    })
    if (next) {
      await prisma.address.update({
        where: { id: next.id },
        data: { is_primary: true }
      })
    }
  }

  return { success: true }
})
