const express = require('express');
const router = express.Router();
const { bookGroupReservation, claimGroupReservation } = require('../controllers/groupReservationController');
const { isStudent, isAdmin } = require('../middlewares/authMiddleware');

router.post('/book', isStudent, bookGroupReservation);
router.post('/claim/:id', isAdmin, claimGroupReservation);

module.exports = router;