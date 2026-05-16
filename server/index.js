const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const path = require('path');
const uploadRoutes = require('./routes/uploadRoutes');
const orderRoutes = require('./routes/orderRoutes');
const sellerRoutes = require('./routes/sellerRoutes');
const sellerProductRoutes = require('./routes/sellerProductRoutes');
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const adminSellerRoutes = require('./routes/adminSellerRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminOrderRoutes = require('./routes/adminOrderRoutes');
const adminFinanceRoutes = require('./routes/adminFinanceRoutes');
const adminSupportRoutes = require('./routes/adminSupportRoutes');
const adminSystemRoutes = require('./routes/adminSystemRoutes');
const platformUpdateRoutes = require('./routes/platformUpdateRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
// const paymentRoutes = require('./routes/paymentRoutes'); // COMMENTED OUT - using orderRoutes for Chapa instead

dotenv.config();

const app = express();
const PORT = process.env.PORT;

// middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

connectDB();

// routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);

// sellers routes
app.use('/api/sellers', sellerRoutes);
app.use('/api/sellers/products', sellerProductRoutes);
app.use('/api/admin/auth', adminAuthRoutes);
app.use('/api/admin/sellers', adminSellerRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/finance', adminFinanceRoutes);
app.use('/api/admin/support', adminSupportRoutes);
app.use('/api/admin/system', adminSystemRoutes);
app.use('/api/platform', platformUpdateRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/webhooks', webhookRoutes);
// app.use('/api/payments', paymentRoutes); // COMMENTED OUT - using orderRoutes for Chapa instead

// MAKE THE FOLDER PUBLIC
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// server/index.js
dotenv.config();

// --- DEBUG: Check if the key is loaded ---
console.log("--- ENV CHECK ---");
console.log("CHAPA_SECRET_KEY exists:", !!process.env.CHAPA_SECRET_KEY);
console.log("First 15 chars of key:", process.env.CHAPA_SECRET_KEY ? process.env.CHAPA_SECRET_KEY.substring(0, 15) : "NOT FOUND");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("-----------------");
// -----------------------------------------
// port listener
app.listen(PORT, (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`Backend is listening successfully at PORT ${PORT}.`);
});