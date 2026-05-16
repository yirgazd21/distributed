const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose'); // Make sure mongoose is imported here


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

// Create HTTP server wrapping the Express app
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

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
// Peer-to-Peer Real-Time Database Sync Link
mongoose.connection.once('open', () => {
  console.log("Connected to Distributed Database Cluster. Watching for peer updates...");
  
  // Access the underlying database instance initialized by connectDB()
  const db = mongoose.connection.db;

  // Watch your products collection across peers
  const productStream = db.collection('products').watch();
  productStream.on('change', (change) => {
    if (change.operationType === 'insert') {
      console.log("New product added by a peer! Broadcasting...");
      io.emit('peer-product-added', change.fullDocument);
    }
  });

  

  // Watch your orders collection across peers
  const orderStream = db.collection('orders').watch();
  orderStream.on('change', (change) => {
    if (change.operationType === 'insert') {
      console.log("New order placed on a peer node! Broadcasting...");
      io.emit('peer-order-placed', change.fullDocument);
    }
  });
});

// CRITICAL: Changed from app.listen to server.listen
server.listen(PORT, "0.0.0.0", (err) => {
  if (err) {
    console.log(err);
  }
  console.log(`Backend is listening successfully at PORT ${PORT} over ZeroTier network.`);
});
