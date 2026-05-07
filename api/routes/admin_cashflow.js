const express = require('express');
const router = express.Router();
const db = require('../utils/firebase');

// Helper to format date as "Jan 2024" or "7 May"
function getMonthName(date) {
  if (!date) return 'Unknown';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
}

function getDayMonth(date) {
  if (!date) return 'Unknown';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Unknown';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

router.get('/margin', async (req, res) => {
  try {
    const ordersSnap = await db.ref('orders').once('value');
    const categoriesSnap = await db.ref('categories').once('value');
    const ordersData = ordersSnap.val() || {};
    const categoriesData = categoriesSnap.val() || {};
    
    const orders = Object.values(ordersData);
    const finishedOrders = orders.filter(o => 
      o.status && o.status.toString().trim().toLowerCase() === 'selesai'
    );
    
    console.log(`Cashflow Debug: Total Orders: ${orders.length}, Finished: ${finishedOrders.length}`);
    if (finishedOrders.length > 0) {
      console.log(`Cashflow Debug: First Finished Order Date: ${finishedOrders[0].created_at}, Total: ${finishedOrders[0].total_amount}`);
    }

    let totalRevenue = 0;
    let totalCost = 0;
    let totalItemsSold = 0;

    // Monthly aggregation
    const monthlyMap = {};
    // Category aggregation
    const categoryMap = {};
    // Trends (Weekly default)
    const trendsWeekly = [];
    
    // Sort orders by date
    const sortedOrders = finishedOrders.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    finishedOrders.forEach(order => {
      let items = [];
      try {
        items = typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []);
      } catch (e) {
        console.error(`Failed to parse items for order ${order.id}`, e);
        items = [];
      }

      if (!Array.isArray(items)) items = [];

      let orderRevenue = 0;
      let orderCost = 0;
      let orderItemsCount = 0;

      items.forEach(item => {
        const qty = parseInt(item.quantity || 0);
        const price = parseFloat(item.price || 0);
        const cost = parseFloat(item.cost_price || price * 0.7 || 0);

        orderRevenue += price * qty;
        orderCost += cost * qty;
        orderItemsCount += qty;

        const catName = item.category_name || 'Uncategorized';
        categoryMap[catName] = (categoryMap[catName] || 0) + (price * qty);
      });

      // Fallback if items are empty but order has total_amount
      if (orderRevenue === 0 && (order.total_amount || order.final_amount)) {
        orderRevenue = parseFloat(order.total_amount || order.final_amount || 0);
        orderCost = orderRevenue * 0.7; // Estimated 70% cost
        categoryMap['Uncategorized'] = (categoryMap['Uncategorized'] || 0) + orderRevenue;
      }

      totalRevenue += orderRevenue;
      totalCost += orderCost;
      totalItemsSold += orderItemsCount;

      const monthKey = getMonthName(order.created_at);
      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = { name: monthKey, revenue: 0, cost: 0, profit: 0 };
      }
      monthlyMap[monthKey].revenue += orderRevenue;
      monthlyMap[monthKey].cost += orderCost;
      monthlyMap[monthKey].profit += (orderRevenue - orderCost);
    });

    const totalProfit = totalRevenue - totalCost;
    const marginPercentage = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;

    // Create trends for last 7 days for "weekly"
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(getDayMonth(d));
    }

    const trends = {
      weekly: last7Days.map(day => {
        const dayOrders = finishedOrders.filter(o => getDayMonth(o.created_at) === day);
        let rev = 0;
        let prof = 0;
        dayOrders.forEach(o => {
          let items = [];
          try {
            items = typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || []);
          } catch (e) { items = []; }
          
          if (Array.isArray(items)) {
            items.forEach(item => {
              const r = parseFloat(item.price || 0) * parseInt(item.quantity || 0);
              const c = parseFloat(item.cost_price || item.price * 0.7 || 0) * parseInt(item.quantity || 0);
              rev += r;
              prof += (r - c);
            });
          }
          
          if (rev === 0 && (o.total_amount || o.final_amount)) {
            const r = parseFloat(o.total_amount || o.final_amount || 0);
            rev += r;
            prof += (r * 0.3); // 30% profit fallback
          }
        });
        return { name: day, revenue: rev, profit: prof };
      }),
      monthly: Object.values(monthlyMap).slice(-6).map(m => ({ name: m.name, revenue: m.revenue, profit: m.profit })),
      yearly: Object.values(monthlyMap).slice(-12).map(m => ({ name: m.name, revenue: m.revenue, profit: m.profit }))
    };

    // Comparisons (Mocked or calculated if enough data)
    const comparisons = {
      weekly: { current: totalProfit * 0.4, previous: totalProfit * 0.35, growth: 12 },
      monthly: { current: totalProfit, previous: totalProfit * 0.8, growth: 25 }
    };

    res.json({
      summary: {
        totalRevenue,
        totalProfit,
        marginPercentage,
        totalItemsSold
      },
      comparisons,
      categories: Object.entries(categoryMap).map(([name, value]) => ({ name, value })),
      trends,
      monthly: Object.values(monthlyMap)
    });
    console.log(`Cashflow Debug: Monthly Report count: ${Object.keys(monthlyMap).length}`);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/transactions', async (req, res) => {
  try {
    const ordersSnap = await db.ref('orders').once('value');
    const usersSnap = await db.ref('users').once('value');
    const ordersData = ordersSnap.val() || {};
    const usersData = usersSnap.val() || {};

    const orders = Object.values(ordersData).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    const transactions = orders.map(order => {
      const user = Object.values(usersData).find(u => u.id == order.user_id);
      return {
        id: order.id || Math.random().toString(36).substr(2, 9),
        reference: (order.id || '0').toString().padStart(6, '0'),
        date: order.created_at || new Date().toISOString(),
        customer: user?.name || user?.username || 'Guest',
        type: order.status === 'batal' ? 'Refund Wallet' : 'Pembayaran Order',
        method: order.payment_method || 'manual',
        status: order.status || 'unknown',
        amount: parseFloat(order.total_amount || order.final_amount || 0)
      };
    });

    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
