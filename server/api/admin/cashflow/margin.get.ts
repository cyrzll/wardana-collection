import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default defineEventHandler(async (event) => {
  try {
    const orders = await prisma.order.findMany({
      where: { status: 'selesai' },
      include: { items: true }
    })

    const products = await prisma.product.findMany({
      include: { category: true }
    })
    
    const productMap = products.reduce((acc: any, p) => {
      acc[p.id] = p
      return acc
    }, {})

    const now = new Date()
    
    // Time helpers
    const startOfThisWeek = new Date(now);
    startOfThisWeek.setDate(now.getDate() - now.getDay());
    startOfThisWeek.setHours(0,0,0,0);

    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfThisWeek.getDate() - 7);

    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Data containers
    const weeklyData: any = {}
    for (let i = 7; i >= 0; i--) {
      const d = new Date(startOfThisWeek)
      d.setDate(d.getDate() - (i * 7))
      const label = `W${Math.floor(d.getDate() / 7) + 1} ${d.toLocaleString('default', { month: 'short' })}`
      weeklyData[label] = { profit: 0, revenue: 0, date: new Date(d) }
    }

    const monthlyData: any = {}
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleString('default', { month: 'short', year: '2-digit' })
      monthlyData[label] = { profit: 0, revenue: 0, date: new Date(d) }
    }

    const yearlyData: any = {}
    for (let i = 2; i >= 0; i--) {
      const year = now.getFullYear() - i
      yearlyData[year] = { profit: 0, revenue: 0 }
    }

    let stats = {
      thisWeekProfit: 0,
      lastWeekProfit: 0,
      thisMonthProfit: 0,
      lastMonthProfit: 0,
      totalRevenue: 0,
      totalProfit: 0,
      totalCost: 0,
    }

    const categorySales: any = {}

    orders.forEach(order => {
      const orderDate = new Date(order.created_at)
      const year = orderDate.getFullYear()
      const monthLabel = orderDate.toLocaleString('default', { month: 'short', year: '2-digit' })

      order.items.forEach(item => {
        const product = productMap[item.product_id]
        const cost = product ? product.cost_price * item.quantity : 0
        const revenue = item.price * item.quantity
        const profit = revenue - cost

        stats.totalRevenue += revenue
        stats.totalProfit += profit
        stats.totalCost += cost

        // Yearly
        if (yearlyData[year]) {
          yearlyData[year].profit += profit
          yearlyData[year].revenue += revenue
        }

        // Monthly
        if (monthlyData[monthLabel]) {
          monthlyData[monthLabel].profit += profit
          monthlyData[monthLabel].revenue += revenue
        }

        // Weekly
        Object.keys(weeklyData).forEach(label => {
          const weekStart = weeklyData[label].date
          const weekEnd = new Date(weekStart)
          weekEnd.setDate(weekEnd.getDate() + 7)
          if (orderDate >= weekStart && orderDate < weekEnd) {
            weeklyData[label].profit += profit
            weeklyData[label].revenue += revenue
          }
        })

        // Category breakdown
        const catName = product?.category?.name || 'Uncategorized'
        categorySales[catName] = (categorySales[catName] || 0) + item.quantity

        // Comparisons
        if (orderDate >= startOfThisWeek) {
          stats.thisWeekProfit += profit
        } else if (orderDate >= startOfLastWeek && orderDate < startOfThisWeek) {
          stats.lastWeekProfit += profit
        }

        if (orderDate >= startOfThisMonth) {
          stats.thisMonthProfit += profit
        } else if (orderDate >= startOfLastMonth && orderDate < startOfThisMonth) {
          stats.lastMonthProfit += profit
        }
      })
    })

    const calcGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    return {
      summary: {
        totalRevenue: stats.totalRevenue,
        totalProfit: stats.totalProfit,
        marginPercentage: stats.totalRevenue > 0 ? ((stats.totalProfit / stats.totalRevenue) * 100).toFixed(2) : 0,
      },
      comparisons: {
        weekly: {
          current: stats.thisWeekProfit,
          previous: stats.lastWeekProfit,
          growth: calcGrowth(stats.thisWeekProfit, stats.lastWeekProfit).toFixed(1)
        },
        monthly: {
          current: stats.thisMonthProfit,
          previous: stats.lastMonthProfit,
          growth: calcGrowth(stats.thisMonthProfit, stats.lastMonthProfit).toFixed(1)
        }
      },
      categories: Object.entries(categorySales).map(([name, value]) => ({ name, value })),
      trends: {
        weekly: Object.entries(weeklyData).map(([name, data]: any) => ({ name, profit: data.profit, revenue: data.revenue })),
        monthly: Object.entries(monthlyData).map(([name, data]: any) => ({ name, profit: data.profit, revenue: data.revenue })),
        yearly: Object.entries(yearlyData).map(([name, data]: any) => ({ name, profit: data.profit, revenue: data.revenue })),
      }
    }
  } catch (e: any) {
    throw createError({ statusCode: 500, statusMessage: e.message })
  }
})
