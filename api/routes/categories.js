const express = require('express');
const router = express.Router();
const db = require('../utils/firebase');

router.get('/', async (req, res) => {
  try {
    const snapshot = await db.ref('categories').once('value');
    const data = snapshot.val() || {};
    res.json(Object.values(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const snapshot = await db.ref('categories').once('value');
    const categories = snapshot.val() || {};
    const maxId = Object.values(categories).length > 0 ? Math.max(...Object.values(categories).map(c => c.id || 0)) : 0;
    const newId = maxId + 1;

    const newRef = db.ref('categories').push();
    const newCategory = { id: newId, name };
    await newRef.set(newCategory);
    res.json(newCategory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const snapshot = await db.ref('categories').once('value');
    const categories = snapshot.val() || {};
    const entry = Object.entries(categories).find(([k, v]) => v.id == id);
    
    if (entry) {
      await db.ref(`categories/${entry[0]}`).update({ name });
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Category not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.ref('categories').once('value');
    const categories = snapshot.val() || {};
    const entry = Object.entries(categories).find(([k, v]) => v.id == id);
    
    if (entry) {
      await db.ref(`categories/${entry[0]}`).remove();
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
