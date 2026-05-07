import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function test() {
  try {
    const userId = 3
    console.log('Testing wallet fetch for user_id:', userId)
    const wallet = await prisma.userWallet.findUnique({
      where: { user_id: userId }
    })
    console.log('Result:', wallet)
  } catch (e) {
    console.error('Error:', e)
  } finally {
    await prisma.$disconnect()
  }
}

test()
