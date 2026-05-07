import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const vouchers = await prisma.voucher.findMany({
    include: {
      _count: {
        select: { user_vouchers: true }
      }
    },
    orderBy: { created_at: 'desc' }
  })
  
  return vouchers.map(v => ({
    ...v,
    claim_count: v._count.user_vouchers,
    target_users: JSON.parse(v.target_users || '[]'),
    target_categories: JSON.parse(v.target_categories || '[]'),
    target_products: JSON.parse(v.target_products || '[]')
  }))
})
