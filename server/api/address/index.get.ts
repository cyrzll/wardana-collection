import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const user_id = parseInt(query.user_id as string)

  if (!user_id) return []

  return await prisma.address.findMany({
    where: { user_id },
    orderBy: [
      { is_primary: 'desc' },
      { created_at: 'desc' }
    ]
  })
})
