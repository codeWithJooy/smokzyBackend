// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../../controller/auth/authController');

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get("/getlist",authController.getList)

module.exports = router;
