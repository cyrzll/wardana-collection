const express = require('express');
const router = express.Router();
const db = require('../utils/firebase');

router.get('/stats', async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const startOfYesterday = new Date(startOfToday);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const [usersSnap, productsSnap, categoriesSnap, ordersSnap] = await Promise.all([
      db.ref('users').once('value'),
      db.ref('products').once('value'),
      db.ref('categories').once('value'),
      db.ref('orders').once('value')
    ]);

    const users = usersSnap.val() || {};
    const products = productsSnap.val() || {};
    const categories = categoriesSnap.val() || {};
    const allOrders = ordersSnap.val() || {};

    const totalUsers = Object.keys(users).length;
    const totalProducts = Object.keys(products).length;
    const totalCategories = Object.keys(categories).length;

    const orders = Object.values(allOrders).filter(o => o.status !== 'keranjang');
    const productList = Object.values(products);
    const categoryList = Object.values(categories);

    const productMap = productList.reduce((acc, p) => {
      acc[p.id] = {
        ...p,
        category: categoryList.find(c => c.id == p.category_id)
      };
      return acc;
    }, {});

    const orderStatusCounts = {
      dikemas: 0,
      dikirim: 0,
      selesai: 0,
      dibatalkan: 0
    };

    let todayRevenue = 0;
    let todayProfit = 0;
    let yesterdayRevenue = 0;
    let yesterdayProfit = 0;

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      last7Days.push({
        date: d,
        label: d.toLocaleDateString('id-ID', { weekday: 'short' }),
        profit: 0,
        revenue: 0
      });
    }

    const categorySales = {};

    orders.forEach(order => {
      const orderDate = new Date(order.created_at);
      const orderTime = orderDate.getTime();

      if (order.status in orderStatusCounts) {
        orderStatusCounts[order.status]++;
      }

      const dayStart = new Date(orderDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEntry = last7Days.find(d => d.date.getTime() === dayStart.getTime());

      const items = order.items || [];
      items.forEach(item => {
        const prod = productMap[item.product_id];
        const cost = prod ? (prod.cost_price || 0) * item.quantity : 0;
        const revenue = (item.price || 0) * item.quantity;
        const profit = revenue - cost;

        if (dayEntry) {
          dayEntry.revenue += revenue;
          dayEntry.profit += profit;
        }

        if (orderTime >= startOfToday.getTime()) {
          todayRevenue += revenue;
          todayProfit += profit;
        } else if (orderTime >= startOfYesterday.getTime() && orderTime < startOfToday.getTime()) {
          yesterdayRevenue += revenue;
          yesterdayProfit += profit;
        }

        const catName = prod?.category?.name || 'Lainnya';
        categorySales[catName] = (categorySales[catName] || 0) + item.quantity;
      });
    });

    const calcGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    res.json({
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
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
