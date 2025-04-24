const express = require('express');
const router = express.Router();
const {
  claimReservation,
  bookReservation,
  endReservation,
  deleteReservation,
  myReservations,
} = require('../controllers/reservationController');

const { isStudent, isAdmin, authenticate } = require('../middlewares/authMiddleware');

router.post('/book/:seat_id', isStudent, bookReservation);
router.patch('/claim/:id', isAdmin, claimReservation);
router.patch('/end/:id', isStudent, endReservation);   
router.delete('/delete/:id', isStudent, deleteReservation);
router.get('/my/:roll_number', authenticate, myReservations);

module.exports = router;