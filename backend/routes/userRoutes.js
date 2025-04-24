const express = require('express');
const router = express.Router();
const { isStudent } = require('../middlewares/authMiddleware');
const { createGroup } = require('../controllers/userController');

router.post('/group/create', isStudent, createGroup);

module.exports = router;