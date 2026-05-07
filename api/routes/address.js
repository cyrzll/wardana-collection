const express = require('express');
const router = express.Router();
const db = require('../utils/firebase');

router.get('/', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.json([]);

    const snapshot = await db.ref('addresses').once('value');
    const data = snapshot.val() || {};
    
    let addresses = Object.values(data).filter(a => a.user_id == user_id);
    
    // Sort: primary first, then by created_at desc
    addresses.sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    res.json(addresses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const addressData = req.body;
    const newRef = db.ref('addresses').push();
    const id = newRef.key;
    
    const newAddress = {
      ...addressData,
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await newRef.set(newAddress);
    res.json(newAddress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
