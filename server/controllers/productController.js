const Product = require('../models/productModel');
const Order = require('../models/orderModel');

const CATEGORY_ALIASES = {
  all: '',
  electronics: 'Electronics',
  clothes: 'Clothing',
  clothing: 'Clothing',
  fashion: 'Clothing',
  'home utility': 'Home & Kitchen',
  'home & kitchen': 'Home & Kitchen',
  'home and kitchen': 'Home & Kitchen',
  books: 'Books',
  beauty: 'Beauty',
  agriculture: 'Other',
  handicrafts: 'Other',
  other: 'Other',
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeCategory = (value) => {
  const normalizedValue = String(value || '').trim().toLowerCase();
  return CATEGORY_ALIASES[normalizedValue] || String(value || '').trim();
};

// @desc    Fetch all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try{
    // 1. Check if the frontend sent a search word
    const keyword = req.query.keyword 
        ? { name: { $regex: req.query.keyword, $options: 'i' } } // 'i' means case-insensitive
        : {};

    // 2. Check if the frontend sent a category filter
    const selectedCategory = normalizeCategory(req.query.category);
    const selectedSubcategory = normalizeCategory(req.query.subcategory);
    const category = selectedCategory
            ? { category: { $regex: `^${escapeRegex(selectedCategory)}$`, $options: 'i' } }
            : {};
    const subcategory = selectedSubcategory
            ? { subcategory: { $regex: `^${escapeRegex(selectedSubcategory)}$`, $options: 'i' } }
            : {};

    // 3. Find products that match the keyword AND/OR category, and only show available stock to buyers
    const products = await Product.find({ ...keyword, ...category, ...subcategory, countInStock: { $gt: 0 } });
    
    res.json(products);
  }
  catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};
// @desc    Fetch single product
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ message: 'Product not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Seller
const createProduct = async (req, res) => {
    try {
        // 1. Get data from the request body
        const { name, price, description, image, brand, category, countInStock } = req.body;

        // 2. Create the product
        const product = new Product({
            name,
            price,
            user: req.user._id,   // 👈 The User ID (Standard)
            seller: req.user._id, // 👈 THE MAGIC: Link to the logged-in Seller
            image,
            brand,
            category,
            countInStock,
            numReviews: 0,
            description,
        });

        // 3. Save to database
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
        
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Product creation failed' });
    }
};

const createProductReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      // 1. Check if already reviewed
      const alreadyReviewed = product.reviews.find(
        (r) => r.user.toString() === req.user._id.toString()
      );

      if (alreadyReviewed) {
        // 👇 Changed to return .json()
        return res.status(400).json({ message: 'You have already reviewed this product' });
      }

      // 2. Check if bought and delivered
      const hasBoughtAndDelivered = await Order.findOne({
        user: req.user._id,
        isDelivered: true,
        'orderItems.product': product._id,
      });

      if (!hasBoughtAndDelivered) {
        // 👇 Changed to return .json()
        return res.status(400).json({ message: 'You can only review products after they have been delivered to you.' });
      }

      // 3. Create review
      const review = {
        name: req.user.name,
        rating: Number(rating),
        comment,
        user: req.user._id,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: 'Review added successfully' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
    getProducts,
    getProductById,
    createProduct,
    createProductReview,
};
