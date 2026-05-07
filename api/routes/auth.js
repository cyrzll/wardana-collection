const express = require('express');
const router = express.Router();
const db = require('../utils/firebase');

router.post('/login', async (req, res) => {
  try {
    const { email: identifier, password } = req.body;
    
    const snapshot = await db.ref('users').once('value');
    const users = snapshot.val() || {};
    
    const user = Object.values(users).find(u => 
      (u.email === identifier || u.username === identifier) && u.password === password
    );

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        level: user.level,
        profile_image: user.profile_image
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user exists
    const snapshot = await db.ref('users').once('value');
    const users = snapshot.val() || {};
    const exists = Object.values(users).some(u => u.email === email || u.username === username);
    
    if (exists) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Get max ID
    const userList = Object.values(users);
    const maxId = userList.length > 0 ? Math.max(...userList.map(u => u.id || 0)) : 0;
    const newId = maxId + 1;

    const newRef = db.ref('users').push();
    const newUser = {
      id: newId,
      username,
      email,
      password,
      level: 'user',
      profile_image: '/images/profile/default-profile.jpeg',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    await newRef.set(newUser);
    res.json({ success: true, userId: newId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
