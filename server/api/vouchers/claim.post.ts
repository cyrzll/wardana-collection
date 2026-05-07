import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { user_id, voucher_id } = body

  if (!user_id || !voucher_id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing fields' })
  }

  // 1. Check if already claimed
  const existing = await prisma.userVoucher.findFirst({
    where: { user_id, voucher_id }
  })

  if (existing) {
    throw createError({ statusCode: 400, statusMessage: 'Voucher already claimed' })
  }

  // 2. Check voucher validity and limit
  const voucher = await prisma.voucher.findUnique({
    where: { id: voucher_id }
  })

  if (!voucher || voucher.status !== 'active') {
    throw createError({ statusCode: 400, statusMessage: 'Voucher not found or inactive' })
  }

  if (voucher.usage_limit && voucher.used_count >= voucher.usage_limit) {
    throw createError({ statusCode: 400, statusMessage: 'Voucher has reached its usage limit' })
  }

  // 3. Create UserVoucher
  const claimed = await prisma.userVoucher.create({
    data: {
      user_id,
      voucher_id
    }
  })

  return { success: true, claimed }
})
