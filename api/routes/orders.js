const express = require('express');
const router = express.Router();
const db = require('../utils/firebase');

router.get('/my', async (req, res) => {
  try {
    const { user_id, status } = req.query;
    if (!user_id) return res.status(400).json({ error: 'User ID is required' });

    const snapshot = await db.ref('orders').once('value');
    const orders = snapshot.val() || {};
    
    let userOrders = Object.values(orders)
      .filter(o => o && o.user_id == user_id);

    if (status && status !== 'all') {
      userOrders = userOrders.filter(o => o.status === status);
    }

    // Sort by created_at desc
    userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json(userOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/cancel', async (req, res) => {
  try {
    const { order_id, user_id } = req.body;
    if (!order_id || !user_id) return res.status(400).json({ error: 'Order ID and User ID are required' });

    const ordersSnap = await db.ref('orders').once('value');
    const orders = ordersSnap.val() || {};
    const entry = Object.entries(orders).find(([k, v]) => v && v.id == order_id);

    if (!entry) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    const [orderKey, order] = entry;

    if (order.user_id != user_id) return res.status(403).json({ error: 'Bukan pemilik pesanan' });
    if (order.status !== 'dikemas') return res.status(400).json({ error: 'Pesanan tidak dapat dibatalkan' });

    // Update Order
    await db.ref(`orders/${orderKey}`).update({
      status: 'batal',
      payment_status: 'refunded',
      updated_at: new Date().toISOString()
    });

    // Refund Wallet
    if (order.payment_method === 'wardanapay') {
      const walletsSnap = await db.ref('user_wallets').once('value');
      const wallets = walletsSnap.val() || {};
      const walletEntry = Object.entries(wallets).find(([k, v]) => v && v.user_id == user_id);
      
      if (walletEntry) {
        const [wKey, wallet] = walletEntry;
        await db.ref(`user_wallets/${wKey}`).update({
          balance: parseFloat(wallet.balance) + parseFloat(order.final_amount),
          updated_at: new Date().toISOString()
        });
      }
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

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/complete', async (req, res) => {
  try {
    const { order_id, user_id } = req.body;
    if (!order_id || !user_id) return res.status(400).json({ error: 'Data tidak valid' });

    const ordersSnap = await db.ref('orders').once('value');
    const orders = ordersSnap.val() || {};
    const entry = Object.entries(orders).find(([k, v]) => v && v.id == order_id);

    if (!entry) return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
    const [orderKey, order] = entry;

    if (order.user_id != user_id) return res.status(403).json({ error: 'Bukan pemilik pesanan' });
    if (order.status !== 'dikirim') return res.status(400).json({ error: 'Hanya pesanan yang dikirim yang dapat diselesaikan' });

    await db.ref(`orders/${orderKey}`).update({
      status: 'selesai',
      updated_at: new Date().toISOString()
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  console.log('--- New Order Request ---');
  console.log('Full Body:', JSON.stringify(req.body, null, 2));
  
  const { 
    user_id, 
    items, 
    shipping_fee, 
    harga_discount, 
    ongkir_discount, 
    final_amount,
    recipient_name,
    phone,
    full_address,
    payment_method,
    pin,
    voucher_ids // array of user_voucher ids
  } = req.body;
  console.log('User ID:', user_id);
  console.log('Payment Method:', payment_method);
  console.log('PIN provided:', !!pin);

  if (!user_id || !items || items.length === 0) {
    console.log('Error: Incomplete data', { user_id, itemsCount: items?.length });
    return res.status(400).json({ error: 'Data pesanan tidak lengkap' });
  }

  try {
    // 1. If WardanaPay, verify PIN and Balance
    if (payment_method === 'wardanapay') {
      const walletsSnap = await db.ref('user_wallets').once('value');
      const wallets = walletsSnap.val() || {};
      const walletEntry = Object.entries(wallets).find(([k, v]) => v && v.user_id == user_id);

      if (!walletEntry) {
        console.log('Error: Wallet not found for user', user_id);
        return res.status(400).json({ error: 'Dompet WardanaPay belum aktif' });
      }

      const [walletKey, wallet] = walletEntry;

      if (wallet.pin && wallet.pin.toString() !== pin?.toString()) {
        console.log('Error: PIN mismatch for user', user_id, { provided: pin, stored: wallet.pin });
        return res.status(400).json({ error: 'PIN WardanaPay salah' });
      }

      if (parseFloat(wallet.balance) < parseFloat(final_amount)) {
        console.log('Error: Insufficient balance', { 
          balance: wallet.balance, 
          balanceType: typeof wallet.balance,
          required: final_amount,
          requiredType: typeof final_amount 
        });
        return res.status(400).json({ error: 'Saldo WardanaPay tidak mencukupi' });
      }

      // Deduct Wallet Balance
      await db.ref(`user_wallets/${walletKey}`).update({
        balance: parseFloat(wallet.balance) - parseFloat(final_amount),
        updated_at: new Date().toISOString()
      });
    }

    // 2. Create Order
    const ordersSnap = await db.ref('orders').once('value');
    const orders = ordersSnap.val() || {};
    const ordersList = Object.values(orders).filter(o => o !== null);
    const maxId = ordersList.length > 0 ? Math.max(...ordersList.map(o => o.id || 0)) : 0;
    const newId = maxId + 1;
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newOrder = {
      id: newId,
      user_id: parseInt(user_id),
      order_number: orderNumber,
      total_amount: items.reduce((acc, item) => acc + (item.price * item.quantity), 0),
      shipping_fee: parseFloat(shipping_fee || 0),
      discount_amount: parseFloat(harga_discount || 0) + parseFloat(ongkir_discount || 0),
      final_amount: parseFloat(final_amount),
      status: 'dikemas',
      payment_method: payment_method || 'wardanapay',
      payment_status: 'paid',
      recipient_name,
      phone,
      full_address,
      items: items.map((item) => ({
        product_id: item.product_id,
        product_name: item.name,
        quantity: item.quantity,
        price: item.price,
        variant: item.variant,
        size: item.size,
        image: item.image
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.ref('orders').push(newOrder);

    // 3. Update Vouchers as used
    if (voucher_ids && voucher_ids.length > 0) {
      const userVouchersSnap = await db.ref('user_vouchers').once('value');
      const userVouchers = userVouchersSnap.val() || {};
      
      for (const vid of voucher_ids) {
        const entry = Object.entries(userVouchers).find(([k, v]) => v && v.id == vid);
        if (entry) {
          await db.ref(`user_vouchers/${entry[0]}`).update({
            is_used: true,
            used_at: new Date().toISOString()
          });
        }
      }
    }

    // 4. Clear Cart Items
    const cartSnap = await db.ref('carts').once('value');
    const carts = cartSnap.val() || {};
    const productIds = items.map(item => item.product_id);
    
    for (const [key, cart] of Object.entries(carts)) {
      if (cart && cart.user_id == user_id && productIds.includes(cart.product_id)) {
        await db.ref(`carts/${key}`).remove();
      }
    }

    // 5. Deduct Product Stock
    const productsSnap = await db.ref('products').once('value');
    const allProducts = productsSnap.val() || {};

    for (const item of items) {
      const productEntry = Object.entries(allProducts).find(([k, v]) => v && v.id == item.product_id);
      if (productEntry) {
        const [pKey, product] = productEntry;
        let variants = typeof product.variants === 'string' ? JSON.parse(product.variants || '[]') : (product.variants || []);
        
        // Update size-specific stock within the variant
        let stockUpdated = false;
        variants = variants.map(v => {
          if (v.name === item.variant) {
            v.sizes = (v.sizes || []).map(s => {
              if (s.name === item.size) {
                s.stock = Math.max(0, parseInt(s.stock || 0) - parseInt(item.quantity));
                stockUpdated = true;
              }
              return s;
            });
          }
          return v;
        });

        if (stockUpdated) {
          const newTotalStock = Math.max(0, parseInt(product.stock || 0) - parseInt(item.quantity));
          await db.ref(`products/${pKey}`).update({
            variants: JSON.stringify(variants),
            stock: newTotalStock,
            updated_at: new Date().toISOString()
          });
        }
      }
    }

    res.json({
      success: true,
      order: newOrder
    });
  } catch (error) {
    console.error('--- Order Processing Error ---');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
