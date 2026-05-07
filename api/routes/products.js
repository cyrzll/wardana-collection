const express = require('express');
const router = express.Router();
const db = require('../utils/firebase');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../public/images/product');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
  try {
    const { category_id, gender_id } = req.query;
    const [productsSnap, categoriesSnap, gendersSnap] = await Promise.all([
      db.ref('products').once('value'),
      db.ref('categories').once('value'),
      db.ref('genders').once('value')
    ]);

    const productsData = productsSnap.val() || {};
    const categoriesData = categoriesSnap.val() || {};
    const gendersData = gendersSnap.val() || {};

    let products = Object.values(productsData);

    if (category_id) {
      products = products.filter(p => p.category_id == category_id);
    }
    if (gender_id) {
      products = products.filter(p => p.gender_id == gender_id);
    }

    const result = products.map(p => {
      const category = Object.values(categoriesData).find(c => c.id == p.category_id);
      const gender = Object.values(gendersData).find(g => g.id == p.gender_id);

      return {
        ...p,
        category_name: category?.name,
        gender_name: gender?.name,
        images: typeof p.images === 'string' ? JSON.parse(p.images || '[]') : (p.images || []),
        options: typeof p.options === 'string' ? JSON.parse(p.options || '[]') : (p.options || []),
        sizes: typeof p.sizes === 'string' ? JSON.parse(p.sizes || '[]') : (p.sizes || []),
        variants: typeof p.variants === 'string' ? JSON.parse(p.variants || '[]') : (p.variants || [])
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.ref('products').once('value');
    const products = snapshot.val() || {};
    const productEntry = Object.entries(products).find(([k, v]) => v.id == id);
    
    if (!productEntry) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const [key, product] = productEntry;
    const categoriesSnap = await db.ref('categories').once('value');
    const categoriesData = categoriesSnap.val() || {};
    const category = Object.values(categoriesData).find(c => c.id == product.category_id);

    res.json({
      ...product,
      category_name: category?.name,
      images: typeof product.images === 'string' ? JSON.parse(product.images || '[]') : (product.images || []),
      options: typeof product.options === 'string' ? JSON.parse(product.options || '[]') : (product.options || []),
      sizes: typeof product.sizes === 'string' ? JSON.parse(product.sizes || '[]') : (product.sizes || []),
      variants: typeof product.variants === 'string' ? JSON.parse(product.variants || '[]') : (product.variants || [])
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.ref('products').once('value');
    const products = snapshot.val() || {};
    const productEntry = Object.entries(products).find(([k, v]) => v.id == id);
    
    if (productEntry) {
      await db.ref(`products/${productEntry[0]}`).remove();
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', upload.any(), async (req, res) => {
  try {
    const { name, description, category_id, gender_id, variants_config } = req.body;
    const variantsConfig = JSON.parse(variants_config || '[]');
    
    const processedVariants = [];
    let totalStock = 0;
    const allImages = [];

    variantsConfig.forEach((config, idx) => {
      const variantImages = [];
      const files = req.files.filter(f => f.fieldname === `variant_${idx}_image_0`);
      
      files.forEach(file => {
        const imagePath = `/images/product/${file.filename}`;
        variantImages.push(imagePath);
      });

      processedVariants.push({
        ...config,
        images: variantImages
      });
      
      allImages.push(...variantImages);
      totalStock += parseInt(config.stock || 0);
    });

    const firstVariant = processedVariants[0] || {};
    const sellingPrice = parseFloat(firstVariant.price || 0);
    const discount = parseFloat(firstVariant.discount || 0);
    const price = Math.round(sellingPrice * (1 - (discount / 100)));

    const productsSnap = await db.ref('products').once('value');
    const products = productsSnap.val() || {};
    const maxId = Object.values(products).length > 0 ? Math.max(...Object.values(products).map(p => p.id || 0)) : 0;
    const newId = maxId + 1;

    const newProduct = {
      id: newId,
      name,
      description,
      category_id: parseInt(category_id),
      gender_id: parseInt(gender_id),
      cost_price: parseFloat(firstVariant.costPrice || 0),
      discount: discount,
      price: price,
      selling_price: sellingPrice,
      stock: totalStock,
      images: JSON.stringify(allImages),
      options: JSON.stringify(processedVariants.map(v => v.name)),
      sizes: JSON.stringify([...new Set(processedVariants.flatMap(v => v.sizes || []))]),
      variants: JSON.stringify(processedVariants),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newRef = db.ref('products').push();
    await newRef.set(newProduct);
    res.json({ success: true, product: newProduct });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', upload.any(), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category_id, gender_id, variants_config } = req.body;
    const variantsConfig = JSON.parse(variants_config || '[]');
    
    const snapshot = await db.ref('products').once('value');
    const products = snapshot.val() || {};
    const productEntry = Object.entries(products).find(([k, v]) => v.id == id);
    
    if (!productEntry) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const [key, existingProduct] = productEntry;
    const processedVariants = [];
    let totalStock = 0;
    const allImages = [];

    variantsConfig.forEach((config, idx) => {
      const variantImages = [...(config.existingImages || [])];
      const files = req.files.filter(f => f.fieldname === `variant_${idx}_image_0`);
      
      files.forEach(file => {
        const imagePath = `/images/product/${file.filename}`;
        variantImages.push(imagePath);
      });

      processedVariants.push({
        ...config,
        images: variantImages
      });
      
      allImages.push(...variantImages);
      totalStock += parseInt(config.stock || 0);
    });

    const firstVariant = processedVariants[0] || {};
    const sellingPrice = parseFloat(firstVariant.price || 0);
    const discount = parseFloat(firstVariant.discount || 0);
    const price = Math.round(sellingPrice * (1 - (discount / 100)));

    const updatedProduct = {
      ...existingProduct,
      name,
      description,
      category_id: parseInt(category_id),
      gender_id: parseInt(gender_id),
      cost_price: parseFloat(firstVariant.costPrice || 0),
      discount: discount,
      price: price,
      selling_price: sellingPrice,
      stock: totalStock,
      images: JSON.stringify(allImages),
      options: JSON.stringify(processedVariants.map(v => v.name)),
      sizes: JSON.stringify([...new Set(processedVariants.flatMap(v => v.sizes || []))]),
      variants: JSON.stringify(processedVariants),
      updated_at: new Date().toISOString()
    };

    await db.ref(`products/${key}`).set(updatedProduct);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
