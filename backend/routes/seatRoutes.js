const express = require('express');
const router = express.Router();
const { getSeatLayout } = require('../controllers/seatController');

router.get('/layout', getSeatLayout);

module.exports = router;