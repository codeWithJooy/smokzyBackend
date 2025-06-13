const express = require('express');
const router = express.Router();
const orderController = require('../../controller/order/orderController');

// Create a new order
router.post('/', orderController.createOrder);

// Get order by ID
router.get('/:id', orderController.getOrder);

// Update order status
router.put('/:id/status', orderController.updateOrderStatus);

// Get all orders
router.get('/', orderController.getAllOrders);

module.exports = router;