
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  try {
    const genders = await prisma.gender.findMany()
    console.log('Genders:', genders)
    console.log('Success: Tables are accessible')
  } catch (e) {
    console.error('Error accessing tables:', e)
  } finally {
    await prisma.$disconnect()
  }
}

main()
