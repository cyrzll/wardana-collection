import { d as defineEventHandler } from '../../../nitro/nitro.mjs';
import { p as prisma } from '../../../_/prisma.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import '@prisma/client';

const stats_get = defineEventHandler(async () => {
  const now = /* @__PURE__ */ new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const [totalUsers, totalProducts, totalCategories, orders, products] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.findMany({
      where: { status: { not: "keranjang" } },
      include: { items: true }
    }),
    prisma.product.findMany({
      include: { category: true }
    })
  ]);
  const orderStatusCounts = {
    dikemas: 0,
    dikirim: 0,
    selesai: 0,
    dibatalkan: 0
  };
  let todayRevenue = 0;
  let todayProfit = 0;
  let yesterdayProfit = 0;
  const productMap = products.reduce((acc, p) => {
    acc[p.id] = p;
    return acc;
  }, {});
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    last7Days.push({
      date: d,
      label: d.toLocaleDateString("id-ID", { weekday: "short" }),
      profit: 0,
      revenue: 0
    });
  }
  const categorySales = {};
  orders.forEach((order) => {
    const orderDate = new Date(order.created_at);
    const orderTime = orderDate.getTime();
    if (order.status in orderStatusCounts) {
      orderStatusCounts[order.status]++;
    }
    const dayStart = new Date(orderDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEntry = last7Days.find((d) => d.date.getTime() === dayStart.getTime());
    order.items.forEach((item) => {
      var _a;
      const prod = productMap[item.product_id];
      const cost = prod ? prod.cost_price * item.quantity : 0;
      const revenue = item.price * item.quantity;
      const profit = revenue - cost;
      if (dayEntry) {
        dayEntry.revenue += revenue;
        dayEntry.profit += profit;
      }
      if (orderTime >= startOfToday.getTime()) {
        todayRevenue += revenue;
        todayProfit += profit;
      } else if (orderTime >= startOfYesterday.getTime() && orderTime < startOfToday.getTime()) {
        yesterdayProfit += profit;
      }
      const catName = ((_a = prod == null ? void 0 : prod.category) == null ? void 0 : _a.name) || "Lainnya";
      categorySales[catName] = (categorySales[catName] || 0) + item.quantity;
    });
  });
  const calcGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return (current - previous) / previous * 100;
  };
  return {
    totalUsers,
    totalProducts,
    totalCategories,
    orderStatusCounts,
    todayRecap: {
      revenue: todayRevenue,
      profit: todayProfit,
      margin: todayRevenue > 0 ? (todayProfit / todayRevenue * 100).toFixed(1) : 0,
      profitGrowth: calcGrowth(todayProfit, yesterdayProfit).toFixed(1)
    },
    trends: last7Days.map((d) => ({ label: d.label, profit: d.profit, revenue: d.revenue })),
    categories: Object.entries(categorySales).map(([name, value]) => ({ name, value }))
  };
});

export { stats_get as default };
//# sourceMappingURL=stats.get.mjs.map
