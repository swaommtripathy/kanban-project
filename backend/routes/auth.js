// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public routes (No auth token needed to access these)
router.post('/register', authController.register);
router.post('/login', authController.login);

module.exports = router;