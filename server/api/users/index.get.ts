import prisma from '../../utils/prisma'

export default defineEventHandler(async () => {
  return await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      level: true,
      profile_image: true,
      status: true,
      wallet: true
    }
  })
})
