const express = require('express');
const router = express.Router();
const db = require('../utils/firebase');

router.get('/list', async (req, res) => {
  try {
    const user_id = parseInt(req.query.user_id);
    if (!user_id) return res.json({ cart: [], wishlist: [] });

    const [cartSnap, productsSnap] = await Promise.all([
      db.ref('carts').once('value'),
      db.ref('products').once('value')
    ]);

    const allItems = cartSnap.val() || {};
    const allProducts = productsSnap.val() || {};
    
    const userItems = Object.values(allItems).filter(i => i.user_id == user_id);
    
    const formatItem = (i) => {
      const product = Object.values(allProducts).find(p => p.id == i.product_id);
      if (!product) return null;

      const variants = typeof product.variants === 'string' ? JSON.parse(product.variants || '[]') : (product.variants || []);
      const selectedVariant = variants.find(v => v.name === i.variant_name);
      
      const images = typeof product.images === 'string' ? JSON.parse(product.images || '[]') : (product.images || []);
      const displayImage = (selectedVariant?.images?.length) 
        ? selectedVariant.images[0] 
        : images[0];

      const displayPrice = selectedVariant?.price 
        ? Math.round(selectedVariant.price * (1 - ((selectedVariant.discount || 0) / 100))) 
        : product.price;

      return {
        id: i.id,
        product_id: i.product_id,
        name: product.name,
        image: displayImage,
        price: displayPrice,
        quantity: i.quantity,
        variant: i.variant_name,
        size: i.size
      };
    };

    const cart = userItems.filter(i => i.type === 'cart').map(formatItem).filter(Boolean);
    const wishlist = userItems.filter(i => i.type === 'wishlist').map(formatItem).filter(Boolean);

    res.json({ cart, wishlist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { user_id, product_id, type, quantity, variant_name, size } = req.body;
    if (!user_id || !product_id || !type) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const snapshot = await db.ref('carts').once('value');
    const allItems = snapshot.val() || {};
    const itemEntries = Object.entries(allItems);

    const existingEntry = itemEntries.find(([k, v]) => 
      v.user_id == user_id && 
      v.product_id == product_id && 
      v.type == type && 
      v.variant_name == (variant_name || null) && 
      v.size == (size || null)
    );

    if (existingEntry && type === 'cart') {
      const [key, item] = existingEntry;
      const updatedItem = {
        ...item,
        quantity: (item.quantity || 0) + (parseInt(quantity) || 1),
        updated_at: new Date().toISOString()
      };
      await db.ref(`carts/${key}`).set(updatedItem);
      return res.json(updatedItem);
    }

    if (existingEntry && type === 'wishlist') {
      return res.json({ message: 'Already in wishlist' });
    }

    const maxId = itemEntries.length > 0 ? Math.max(...itemEntries.map(([k, v]) => v.id || 0)) : 0;
    const newId = maxId + 1;
    const newRef = db.ref('carts').push();
    const newItem = {
      id: newId,
      user_id: parseInt(user_id),
      product_id: parseInt(product_id),
      type,
      quantity: parseInt(quantity) || 1,
      variant_name: variant_name || null,
      size: size || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    await newRef.set(newItem);
    res.json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    const { user_id, product_id, type, variant_name, size } = req.body;
    const snapshot = await db.ref('carts').once('value');
    const allItems = snapshot.val() || {};
    
    const entryToDelete = Object.entries(allItems).find(([k, v]) => 
      v.user_id == user_id && 
      v.product_id == product_id && 
      v.type == type &&
      (type !== 'cart' || (v.variant_name == (variant_name || null) && v.size == (size || null)))
    );

    if (entryToDelete) {
      await db.ref(`carts/${entryToDelete[0]}`).remove();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
