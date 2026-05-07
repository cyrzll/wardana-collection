import { PrismaClient } from '@prisma/client'

async function main() {
  const prisma = new PrismaClient()
  try {
    const userCount = await prisma.user.count()
    const productCount = await prisma.product.count()
    const categoryCount = await prisma.category.count()
    console.log({ userCount, productCount, categoryCount })
  } catch (e) {
    console.error(e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
