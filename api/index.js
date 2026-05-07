const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Static folder for images (Image CDN)
app.use('/images', express.static(path.join(__dirname, 'public/images')));

// Routes
const categoriesRouter = require('./routes/categories');
const productsRouter = require('./routes/products');
const addressRouter = require('./routes/address');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const gendersRouter = require('./routes/genders');
const vouchersRouter = require('./routes/vouchers');
const adminRouter = require('./routes/admin');
const cartRouter = require('./routes/cart');
const adminOrdersRouter = require('./routes/admin_orders');
const adminCashflowRouter = require('./routes/admin_cashflow');
const shippingRouter = require('./routes/shipping');
const ordersRouter = require('./routes/orders');

app.use('/api/categories', categoriesRouter);
app.use('/api/products', productsRouter);
app.use('/api/address', addressRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/genders', gendersRouter);
app.use('/api/vouchers', vouchersRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/orders', adminOrdersRouter);
app.use('/api/admin/cashflow', adminCashflowRouter);
app.use('/api/cart', cartRouter);
app.use('/api/shipping', shippingRouter);
app.use('/api/orders', ordersRouter);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
