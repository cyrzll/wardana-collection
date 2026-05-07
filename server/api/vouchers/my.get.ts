import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const user_id = parseInt(query.user_id as string)

  if (!user_id) return []

  const userVouchers = await prisma.userVoucher.findMany({
    where: { user_id },
    include: {
      voucher: true
    },
    orderBy: { claimed_at: 'desc' }
  })

  return userVouchers.map(uv => ({
    id: uv.id,
    voucher_id: uv.voucher_id,
    code: uv.voucher.code,
    title: uv.voucher.title,
    type: uv.voucher.type,
    discount_value: uv.voucher.discount_value,
    discount_type: uv.voucher.discount_type,
    min_purchase: uv.voucher.min_purchase, // Added this too
    is_used: uv.is_used,
    claimed_at: uv.claimed_at,
    end_date: uv.voucher.end_date
  }))
})
