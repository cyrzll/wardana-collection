import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  if (!body?.email || !body?.password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required' })
  }

  return await prisma.user.create({
    data: {
      username: body.username || body.email.split('@')[0],
      email: body.email,
      password: body.password,
      level: body.level || 'user',
      status: body.status || 'active',
      profile_image: body.profile_image || '/images/profile/default-profile.jpeg'
    }
  })
})
