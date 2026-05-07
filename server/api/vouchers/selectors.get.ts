import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const users = await prisma.user.findMany({
    select: { id: true, username: true, email: true },
    where: { level: 'user' }
  })

  const categories = await prisma.category.findMany({
    select: { id: true, name: true }
  })

  const products = await prisma.product.findMany({
    select: { id: true, name: true }
  })

  return { users, categories, products }
})
