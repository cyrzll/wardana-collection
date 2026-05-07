
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Seeding data...')
  
  // Categories
  const categories = ['T-Shirt', 'Shirt', 'Outerwear', 'Pants', 'Accessories']
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  }

  // Genders
  const genders = ['Pria', 'Wanita', 'Unisex']
  for (const name of genders) {
    await prisma.gender.upsert({
      where: { name },
      update: {},
      create: { name }
    })
  }

  console.log('Seeding completed.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
