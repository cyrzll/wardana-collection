const express = require('express');
const router = express.Router();
const db = require('../utils/firebase');

router.get('/', async (req, res) => {
  try {
    const snapshot = await db.ref('vouchers').once('value');
    const vouchers = snapshot.val() || {};
    res.json(Object.values(vouchers));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/selectors', async (req, res) => {
  try {
    const usersSnapshot = await db.ref('users').once('value');
    const categoriesSnapshot = await db.ref('categories').once('value');
    const productsSnapshot = await db.ref('products').once('value');

    const users = Object.values(usersSnapshot.val() || {})
      .filter(u => u.level === 'user')
      .map(u => ({ id: u.id, username: u.username, email: u.email }));

    const categories = Object.values(categoriesSnapshot.val() || {})
      .map(c => ({ id: c.id, name: c.name }));

    const products = Object.values(productsSnapshot.val() || {})
      .map(p => ({ id: p.id, name: p.name }));

    res.json({ users, categories, products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/my', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.json([]);

    const snapshot = await db.ref('user_vouchers').once('value');
    const userVouchers = Object.values(snapshot.val() || {}).filter(uv => uv.user_id == user_id);
    
    const vouchersSnapshot = await db.ref('vouchers').once('value');
    const allVouchers = vouchersSnapshot.val() || {};
    
    const myVouchers = userVouchers.map(uv => ({
      ...uv,
      voucher: Object.values(allVouchers).find(v => v.id == uv.voucher_id)
    }));

    res.json(myVouchers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
