import prisma from '../../utils/prisma'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const user_id = parseInt(query.user_id as string)

  if (!user_id) return []

  // Get all active vouchers
  const allActive = await prisma.voucher.findMany({
    where: { 
      status: 'active',
      // Optional: add date filtering
      OR: [
        { end_date: null },
        { end_date: { gt: new Date() } }
      ]
    },
    include: {
      user_vouchers: {
        where: { user_id }
      }
    }
  })

  // Filter based on targeting and already claimed
  const available = allActive.filter(v => {
    // 1. Check if already claimed
    if (v.user_vouchers.length > 0) return false

    // 2. Check if reached total usage limit
    if (v.usage_limit && v.used_count >= v.usage_limit) return false

    // 3. Check target user
    if (v.target_user_type === 'specific') {
      const targetIds = JSON.parse(v.target_users || '[]')
      if (!targetIds.includes(user_id)) return false
    }

    return true
  })

  return available.map(v => ({
    id: v.id,
    code: v.code,
    title: v.title,
    type: v.type,
    discount_value: v.discount_value,
    discount_type: v.discount_type,
    min_purchase: v.min_purchase,
    end_date: v.end_date
  }))
})
