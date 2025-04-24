const express = require('express');
const router = express.Router();
const { signup, login, createAdmin, adminLogin } = require('../controllers/authController');
const { loginLimiter } = require('../middlewares/rateLimitMiddleware');
const { isSuperAdmin } = require('../middlewares/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.post('/create-admin', isSuperAdmin, createAdmin);
router.post('/admin-login', loginLimiter, adminLogin);

module.exports = router;