const express = require('express');
const router = express.Router();
const db = require('../utils/firebase');

router.get('/', async (req, res) => {
  try {
    const [usersSnap, walletsSnap] = await Promise.all([
      db.ref('users').once('value'),
      db.ref('user_wallets').once('value')
    ]);

    const users = usersSnap.val() || {};
    const wallets = walletsSnap.val() || {};
    
    const walletsArray = Object.values(wallets);
    const result = Object.values(users).map(user => {
      const wallet = walletsArray.find(w => w && w.user_id == user.id);
      return {
        ...user,
        wallet: wallet || null
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Wallet Routes (MUST BE ABOVE Parameterized Routes)
router.get('/wallet', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.json(null);

    const snapshot = await db.ref('user_wallets').once('value');
    const wallets = snapshot.val() || {};
    const wallet = Object.values(wallets).find(w => w.user_id == user_id);
    
    if (!wallet) {
      return res.json({ balance: 0 });
    }

    res.json(wallet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/wallet', async (req, res) => {
  try {
    const { user_id, amount, type } = req.body;
    const snapshot = await db.ref('user_wallets').once('value');
    const wallets = snapshot.val() || {};
    
    let walletEntry = Object.entries(wallets).find(([k, v]) => v.user_id == user_id);
    
    if (!walletEntry) {
      const newRef = db.ref('user_wallets').push();
      const newWallet = {
        user_id: parseInt(user_id),
        balance: type === 'topup' ? parseInt(amount) : 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await newRef.set(newWallet);
      return res.json(newWallet);
    }

    const [key, wallet] = walletEntry;
    const currentBalance = wallet.balance || 0;
    const newBalance = type === 'topup' ? currentBalance + parseInt(amount) : currentBalance - parseInt(amount);
    
    const updatedWallet = {
      ...wallet,
      balance: newBalance,
      updated_at: new Date().toISOString()
    };
    
    await db.ref(`user_wallets/${key}`).set(updatedWallet);
    res.json(updatedWallet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/wallet', async (req, res) => {
  try {
    const { user_id, balance, pin } = req.body;
    const snapshot = await db.ref('user_wallets').once('value');
    const wallets = snapshot.val() || {};
    
    let walletEntry = Object.entries(wallets).find(([k, v]) => v.user_id == user_id);
    
    if (!walletEntry) {
      const newRef = db.ref('user_wallets').push();
      const newWallet = {
        user_id: parseInt(user_id),
        balance: parseFloat(balance) || 0,
        pin: pin || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      await newRef.set(newWallet);
      return res.json(newWallet);
    }

    const [key, wallet] = walletEntry;
    const updatedWallet = {
      ...wallet,
      balance: parseFloat(balance),
      updated_at: new Date().toISOString()
    };
    
    if (pin) updatedWallet.pin = pin;
    
    await db.ref(`user_wallets/${key}`).set(updatedWallet);
    res.json(updatedWallet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Management Routes
router.post('/', async (req, res) => {
  try {
    const { username, email, password, level } = req.body;
    const snapshot = await db.ref('users').once('value');
    const users = snapshot.val() || {};
    const maxId = Object.values(users).length > 0 ? Math.max(...Object.values(users).map(u => u.id || 0)) : 0;
    const newId = maxId + 1;

    const newRef = db.ref('users').push();
    const newUser = {
      id: newId,
      username,
      email,
      password,
      level: level || 'user',
      profile_image: '/images/profile/default-profile.jpeg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await newRef.set(newUser);
    res.json(newUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const snapshot = await db.ref('users').once('value');
    const users = snapshot.val() || {};
    const entry = Object.entries(users).find(([k, v]) => v.id == id);
    
    if (entry) {
      const updatedUser = { 
        ...entry[1], 
        ...updateData,
        updated_at: new Date().toISOString()
      };
      await db.ref(`users/${entry[0]}`).set(updatedUser);
      res.json(updatedUser);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.ref('users').once('value');
    const users = snapshot.val() || {};
    const entry = Object.entries(users).find(([k, v]) => v.id == id);
    
    if (entry) {
      await db.ref(`users/${entry[0]}`).remove();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
