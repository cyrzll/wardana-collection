import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Invalid ID' })
  
  const body = await readBody(event)

  return await prisma.user.update({
    where: { id },
    data: {
      username: body.username,
      email: body.email,
      level: body.level,
      status: body.status,
      profile_image: body.profile_image
    }
  })
})
