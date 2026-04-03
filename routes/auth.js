const express = require('express');
const { login, getMe } = require('../controllers/authController');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
// @desc    Authenticate admin user and get JWT token
// @access  Public
router.post('/login', login);

// GET /api/auth/me
// @desc    Get current admin info
// @access  Private
router.get('/me', auth, getMe);

module.exports = router;
