const express = require('express');
const router = express.Router();
const db = require('../utils/firebase');

router.get('/', async (req, res) => {
  try {
    const snapshot = await db.ref('genders').once('value');
    const genders = snapshot.val() || {};
    res.json(Object.values(genders));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const snapshot = await db.ref('genders').once('value');
    const genders = snapshot.val() || {};
    const maxId = Object.values(genders).length > 0 ? Math.max(...Object.values(genders).map(g => g.id || 0)) : 0;
    const newId = maxId + 1;
    
    const newRef = db.ref('genders').push();
    const newGender = { id: newId, name };
    await newRef.set(newGender);
    res.json(newGender);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const snapshot = await db.ref('genders').once('value');
    const genders = snapshot.val() || {};
    const entry = Object.entries(genders).find(([k, v]) => v.id == id);
    
    if (entry) {
      await db.ref(`genders/${entry[0]}`).update({ name });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Gender not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.ref('genders').once('value');
    const genders = snapshot.val() || {};
    const entry = Object.entries(genders).find(([k, v]) => v.id == id);
    
    if (entry) {
      await db.ref(`genders/${entry[0]}`).remove();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
