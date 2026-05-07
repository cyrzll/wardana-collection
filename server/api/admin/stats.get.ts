import prisma from '../../utils/prisma'

export default defineEventHandler(async () => {
  const now = new Date()
  const startOfToday = new Date(now)
  startOfToday.setHours(0,0,0,0)

  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfYesterday.getDate() - 1)

  const [totalUsers, totalProducts, totalCategories, orders, products] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.findMany({ 
      where: { status: { not: 'keranjang' } },
      include: { items: true } 
    }),
    prisma.product.findMany({
      include: { category: true }
    })
  ])

  // Order Status Breakdown
  const orderStatusCounts = {
    dikemas: 0,
    dikirim: 0,
    selesai: 0,
    dibatalkan: 0
  }

  // Recap variables
  let todayRevenue = 0
  let todayProfit = 0
  let yesterdayRevenue = 0
  let yesterdayProfit = 0

  // Profit Trend & Category Sales
  const productMap = products.reduce((acc: any, p) => {
    acc[p.id] = p
    return acc
  }, {})

  const last7Days: any[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0,0,0,0)
    last7Days.push({ 
      date: d, 
      label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
      profit: 0,
      revenue: 0 
    })
  }

  const categorySales: any = {}

  orders.forEach(order => {
    const orderDate = new Date(order.created_at)
    const orderTime = orderDate.getTime()
    
    // Status Logic
    if (order.status in orderStatusCounts) {
      orderStatusCounts[order.status as keyof typeof orderStatusCounts]++
    }

    const dayStart = new Date(orderDate)
    dayStart.setHours(0,0,0,0)
    const dayEntry = last7Days.find(d => d.date.getTime() === dayStart.getTime())
    
    order.items.forEach(item => {
      const prod = productMap[item.product_id]
      const cost = prod ? prod.cost_price * item.quantity : 0
      const revenue = item.price * item.quantity
      const profit = revenue - cost
      
      // Trend Logic
      if (dayEntry) {
        dayEntry.revenue += revenue
        dayEntry.profit += profit
      }

      // Today vs Yesterday Logic
      if (orderTime >= startOfToday.getTime()) {
        todayRevenue += revenue
        todayProfit += profit
      } else if (orderTime >= startOfYesterday.getTime() && orderTime < startOfToday.getTime()) {
        yesterdayRevenue += revenue
        yesterdayProfit += profit
      }

      // Category Logic
      const catName = prod?.category?.name || 'Lainnya'
      categorySales[catName] = (categorySales[catName] || 0) + item.quantity
    })
  })

  const calcGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  return {
    totalUsers,
    totalProducts,
    totalCategories,
    orderStatusCounts,
    todayRecap: {
      revenue: todayRevenue,
      profit: todayProfit,
      margin: todayRevenue > 0 ? ((todayProfit / todayRevenue) * 100).toFixed(1) : 0,
      profitGrowth: calcGrowth(todayProfit, yesterdayProfit).toFixed(1)
    },
    trends: last7Days.map(d => ({ label: d.label, profit: d.profit, revenue: d.revenue })),
    categories: Object.entries(categorySales).map(([name, value]) => ({ name, value }))
  }
})
