const express = require('express');
const router = express.Router();
const db = require('../utils/firebase');

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const [ordersSnap, usersSnap, addressesSnap] = await Promise.all([
      db.ref('orders').once('value'),
      db.ref('users').once('value'),
      db.ref('addresses').once('value')
    ]);

    const allOrders = ordersSnap.val() || {};
    const allUsers = usersSnap.val() || {};
    const allAddresses = addressesSnap.val() || {};

    let orders = Object.values(allOrders).filter(o => o.status !== 'keranjang');

    if (status && status !== 'semua') {
      orders = orders.filter(o => o.status === status);
    }

    const result = orders.map(order => {
      const user = Object.values(allUsers).find(u => u.id == order.user_id);
      const address = Object.values(allAddresses).find(a => a.id == order.address_id);

      return {
        ...order,
        user: {
          username: user?.username || 'Unknown',
          email: user?.email || ''
        },
        items: typeof order.items === 'string' ? JSON.parse(order.items || '[]') : (order.items || []),
        address_detail: address ? `${address.recipient_name}, ${address.phone_number}, ${address.full_address}` : 'No Address',
        // Fallbacks for missing fields in template
        recipient_name: order.recipient_name || address?.recipient_name || user?.username || 'Unknown',
        phone: order.phone || address?.phone_number || '',
        final_amount: order.final_amount || order.total_amount || 0,
        payment_method: order.payment_method || 'Manual'
      };
    });

    res.json(result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/status', async (req, res) => {
  try {
    const { order_id, status } = req.body;
    const snapshot = await db.ref('orders').once('value');
    const orders = snapshot.val() || {};
    const entry = Object.entries(orders).find(([k, v]) => v.id == order_id);

    if (entry) {
      await db.ref(`orders/${entry[0]}`).update({ 
        status,
        updated_at: new Date().toISOString()
      });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cancel', async (req, res) => {
  try {
    const { order_id, reason } = req.body;
    const snapshot = await db.ref('orders').once('value');
    const orders = snapshot.val() || {};
    const entry = Object.entries(orders).find(([k, v]) => v.id == order_id);

    if (entry) {
      const [key, order] = entry;
      // Refund wallet balance if necessary
      const walletSnap = await db.ref('user_wallets').once('value');
      const wallets = walletSnap.val() || {};
      const walletEntry = Object.entries(wallets).find(([k, v]) => v.user_id == order.user_id);

      if (walletEntry) {
        const [wKey, wallet] = walletEntry;
        const totalToRefund = order.final_amount || order.total_amount || 0;
        await db.ref(`user_wallets/${wKey}`).update({
          balance: (wallet.balance || 0) + totalToRefund,
          updated_at: new Date().toISOString()
        });
      }

      // Restore Product Stock
      const productsSnap = await db.ref('products').once('value');
      const allProducts = productsSnap.val() || {};
      const items = Array.isArray(order.items) ? order.items : (typeof order.items === 'string' ? JSON.parse(order.items || '[]') : []);

      for (const item of items) {
        const productEntry = Object.entries(allProducts).find(([k, v]) => v && v.id == item.product_id);
        if (productEntry) {
          const [pKey, product] = productEntry;
          let variants = typeof product.variants === 'string' ? JSON.parse(product.variants || '[]') : (product.variants || []);
          
          let stockUpdated = false;
          variants = variants.map(v => {
            if (v.name === item.variant) {
              v.sizes = (v.sizes || []).map(s => {
                if (s.name === item.size) {
                  s.stock = parseInt(s.stock || 0) + parseInt(item.quantity);
                  stockUpdated = true;
                }
                return s;
              });
            }
            return v;
          });

          if (stockUpdated) {
            const newTotalStock = parseInt(product.stock || 0) + parseInt(item.quantity);
            await db.ref(`products/${pKey}`).update({
              variants: JSON.stringify(variants),
              stock: newTotalStock,
              updated_at: new Date().toISOString()
            });
          }
        }
      }

      await db.ref(`orders/${key}`).update({ 
        status: 'batal',
        cancel_reason: reason,
        updated_at: new Date().toISOString()
      });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
