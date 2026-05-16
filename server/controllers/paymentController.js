const axios = require('axios');
const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Seller = require('../models/sellerModel');
const SellerWalletTransaction = require('../models/sellerWalletTransactionModel');

const reserveOrderStock = async (orderItems) => {
  for (const item of orderItems) {
    const product = await Product.findById(item.product);
    if (!product) {
      throw new Error(`Product not found: ${item.name}`);
    }
    if (product.countInStock < item.qty) {
      throw new Error(`Not enough stock for ${product.name}. Available: ${product.countInStock}`);
    }
    product.countInStock -= item.qty;
    await product.save();
  }
};

const verifyChapaPayment = async (req, res) => {
  try {
    const { tx_ref } = req.body;
    const orderId = req.params.id;

    if (!tx_ref) {
      return res.status(400).json({ message: 'Transaction reference is required for Chapa verification' });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to verify this order' });
    }

    if (order.isPaid) {
      return res.json(order);
    }

    const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
    if (!chapaSecretKey) {
      return res.status(500).json({ message: 'Chapa secret key is not configured' });
    }

    const verifyUrl = `https://api.chapa.co/v1/transaction/verify/${tx_ref}`;

    const response = await axios.get(verifyUrl, {
      headers: {
        Authorization: `Bearer ${chapaSecretKey}`,
      },
    });

    const verification = response.data;

    if (!verification || verification.status !== 'success' || !verification.data) {
      return res.status(402).json({ message: 'Chapa payment verification failed' });
    }

    const transaction = verification.data;
    if (String(transaction.status).toLowerCase() !== 'success') {
      return res.status(402).json({ message: 'Chapa payment is not completed' });
    }

    const amountPaid = Number(transaction.amount || 0);
    if (amountPaid !== Number(order.totalPrice)) {
      return res.status(400).json({ message: 'Payment amount does not match order total' });
    }

    await reserveOrderStock(order.orderItems);

    order.isPaid = true;
    order.paymentStatus = 'success';
    order.paidAt = Date.now();
    order.paymentResult = {
      id: transaction.id || transaction.tx_ref || tx_ref,
      status: transaction.status || 'success',
      update_time: transaction.paid_at || new Date().toISOString(),
      email_address: transaction.customer_email || req.user.email || '',
    };

    const sellerRevenueMap = new Map();
    for (const item of order.orderItems) {
      if (!item.seller) continue;
      const sellerId = item.seller.toString();
      const currentAmount = sellerRevenueMap.get(sellerId) || 0;
      sellerRevenueMap.set(sellerId, currentAmount + Number(item.sellerRevenue || 0));
    }

    for (const [sellerId, amount] of sellerRevenueMap.entries()) {
      if (amount <= 0) continue;

      const existingTx = await SellerWalletTransaction.findOne({
        seller: sellerId,
        order: order._id,
        type: 'CREDIT',
      });

      if (!existingTx) {
        await Seller.findByIdAndUpdate(sellerId, { $inc: { walletBalance: amount } });
        await SellerWalletTransaction.create({
          seller: sellerId,
          order: order._id,
          amount,
          type: 'CREDIT',
          note: `Order payment settled: ${order._id}`,
        });
      }
    }

    const updatedOrder = await order.save();
    res.json(updatedOrder);
  } catch (error) {
    console.error('Verify Chapa Error:', error.message);
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

const initializeChapaPayment = async (req, res) => {
  try {
    console.log("========== CHAPA PAYMENT INIT ==========");
    console.log("Body keys:", Object.keys(req.body));
    console.log("orderItems received:", req.body.orderItems?.length, 'items');
    console.log("amount:", req.body.amount, "email:", req.body.email);
    
    const {
      amount, email, first_name, last_name, tx_ref,
      // Cart data to create the order atomically
      orderItems, shippingAddress, paymentMethod,
      itemsPrice, shippingPrice, taxPrice, totalPrice,
    } = req.body;

    // Validate required fields
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Valid amount is required' });
    if (!email) return res.status(400).json({ message: 'Email is required' });
    if (!tx_ref) return res.status(400).json({ message: 'Transaction reference is required' });
    if (!orderItems || orderItems.length === 0) {
      console.error("orderItems missing or empty. Full body:", JSON.stringify(req.body, null, 2));
      return res.status(400).json({ message: 'Order items are required' });
    }

    const chapaSecretKey = process.env.CHAPA_SECRET_KEY;
    if (!chapaSecretKey) return res.status(500).json({ message: 'Chapa secret key not configured' });

    // 1. Create the order with paymentStatus: 'pending' BEFORE redirecting to Chapa
    const calculatedItems = orderItems.map((item) => ({
      name: item.name,
      qty: item.qty,
      image: item.image,
      price: item.price,
      product: item._id,
      seller: item.user || item.seller,
      platformFee: (item.price * item.qty) * 0.10,
      sellerRevenue: (item.price * item.qty) * 0.90,
    }));

    const order = new Order({
      user: req.user._id,
      orderItems: calculatedItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'Chapa',
      itemsPrice,
      shippingPrice,
      taxPrice,
      totalPrice,
      paymentStatus: 'pending',
      tx_ref,
    });

    const savedOrder = await order.save();

    // 2. Initialize Chapa with the real order ID in the return_url
    const formattedAmount = Math.round(Number(amount)).toString();
    const customerFirstName = first_name?.trim() || 'Gulit';
    const customerLastName = last_name?.trim() || 'Customer';
    const customerEmail = email.trim();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    const chapaRequestData = {
      amount: formattedAmount,
      currency: 'ETB',
      email: customerEmail,
      first_name: customerFirstName,
      last_name: customerLastName,
      tx_ref,
      callback_url: `${baseUrl}/api/orders/chapa/callback`,
      return_url: `${frontendUrl}/order-success?order_id=${savedOrder._id}`,
      title: 'Gulit Marketplace',
      description: `Payment for order ${savedOrder._id}`,
    };

    console.log("Sending to Chapa:", JSON.stringify(chapaRequestData, null, 2));

    const response = await axios.post(
      'https://api.chapa.co/v1/transaction/initialize',
      chapaRequestData,
      {
        headers: {
          Authorization: `Bearer ${chapaSecretKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    if (response.data && response.data.status === 'success') {
      const checkoutUrl = response.data.data?.checkout_url;
      if (!checkoutUrl) {
        // Chapa init failed — delete the pending order
        await Order.findByIdAndDelete(savedOrder._id);
        return res.status(500).json({ message: 'No checkout URL received from Chapa' });
      }

      console.log('✅ Payment initialized! Order:', savedOrder._id);
      return res.status(200).json({
        success: true,
        checkout_url: checkoutUrl,
        tx_ref,
        orderId: savedOrder._id,
      });
    } else {
      // Chapa returned failure — delete the pending order
      await Order.findByIdAndDelete(savedOrder._id);
      return res.status(400).json({
        success: false,
        message: response.data?.message || 'Chapa initialization failed',
      });
    }

  } catch (error) {
    console.error('========== CHAPA ERROR ==========', error.message);

    if (error.response) {
      return res.status(error.response.status || 400).json({
        success: false,
        message: error.response.data?.message || 'Chapa payment failed',
        details: error.response.data,
      });
    }
    if (error.request) {
      return res.status(503).json({ success: false, message: 'Cannot connect to Chapa payment gateway' });
    }
    return res.status(500).json({ success: false, message: error.message || 'Internal server error' });
  }
};

module.exports = {
  verifyChapaPayment,
  initializeChapaPayment,
};