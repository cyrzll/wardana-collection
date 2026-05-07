import prisma from '../../utils/prisma'

interface LoginResponse {
  user: {
    id: number
    username: string
    email: string
    level: string
    profile_image: string | null
  }
}

export default defineEventHandler(async (event): Promise<LoginResponse> => {
  const body = await readBody(event)
  const { email: identifier, password } = body
  
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { username: identifier }
      ],
      password: password
    }
  })

  if (!user) throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  return { 
    user: { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      level: user.level, 
      profile_image: user.profile_image 
    } 
  }
})
