const express = require('express');
const router = express.Router();
const {
  getSellerProducts,
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
} = require('../controllers/sellerProductController');
const { protectSeller } = require('../middleware/authMiddleware');

// Base route: /api/sellers/products

// GET to fetch products, POST to create a new one
router.route('/')
  .get(protectSeller, getSellerProducts)
  .post(protectSeller, createSellerProduct);

// PUT to update, DELETE to remove specific product by ID
router.route('/:id')
  .put(protectSeller, updateSellerProduct)
  .delete(protectSeller, deleteSellerProduct);

module.exports = router;