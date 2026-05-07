import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { username, email, password } = body
  
  try {
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password,
        level: 'user',
        profile_image: '/images/profile/default-profile.jpeg'
      }
    })
    return { success: true, userId: user.id }
  } catch (error: any) {
    throw createError({ statusCode: 409, statusMessage: 'User already exists' })
  }
})
