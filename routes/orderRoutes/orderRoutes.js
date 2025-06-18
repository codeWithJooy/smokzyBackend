const express = require('express');
const router = express.Router();
const orderController = require('../../controller/order/orderController');

// Route ordering matters in Express - specific routes should come before dynamic ones

// Get Order Counts (specific route comes first)
router.get('/count', orderController.getOrderStatusCounts);

// Create a new order
router.post('/', orderController.createOrder);

// Get all orders
router.get('/', orderController.getAllOrders);

// Get order by ID (dynamic route comes last)
router.get('/:id', orderController.getOrder);

// Update order status
router.put('/:id/status', orderController.updateOrderStatus);

module.exports = router;