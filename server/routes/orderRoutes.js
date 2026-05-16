const express = require('express');
const router = express.Router();
const {
  addOrderItems,
  getOrderById,
  getMyOrders,
  updateOrderToPaid,
  updateOrderToDelivered,
  requestOrderRefund,
  verifyChapaPayment,
  cancelPendingOrder,
} = require('../controllers/orderController');

const { protect } = require('../middleware/authMiddleware');
const { initializeChapaPayment } = require('../controllers/paymentController');

// All order routes are protected (You must be logged in to buy)
router.route('/').post(protect, addOrderItems);
router.route('/myorders').get(protect, getMyOrders);

// Static routes MUST come before /:id to avoid being swallowed by the param matcher
router.post('/chapa/init', protect, initializeChapaPayment);

router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/chapa/verify').post(protect, verifyChapaPayment);
router.route('/:id/deliver').put(protect, updateOrderToDelivered);
router.route('/:id/refund').put(protect, requestOrderRefund);
router.route('/:id/cancel').delete(protect, cancelPendingOrder);

module.exports = router;
