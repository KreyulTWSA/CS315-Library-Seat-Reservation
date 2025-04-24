const pool = require('../config/db');

// Fetch reservation details by reservation ID
async function getReservation(reservationId) {
    const result = await pool.query(
      'SELECT * FROM Reservations WHERE reservation_id = $1',
      [reservationId]
    );
  
    if (result.rowCount === 0) {
      return null;
    }
  
    return result.rows[0];
}

// Get seat ID from reservation ID
async function getSeat(reservationId) {
  const result = await pool.query(
    'SELECT seat_id from Reservations WHERE reservation_id = $1', 
    [reservationId]
  );

  if (result.rowCount === 0) {
    return null;
  }
  return result.rows[0].seat_id;
}

// Check if a reservation is valid (not expired and status is 'reserved')
function validReservation(reservation) {
    const isExpired = new Date(reservation.expires_at) < new Date();
    const isValidStatus = reservation.reservation_status === 'reserved';

    return isValidStatus && !isExpired;
}

// Update reservation to 'claimed' and seat to 'occupied'
async function updateStatus_claim(reservationId, seatId, admin_id) {
  try {
    await pool.query('BEGIN');  // starting transaction
    await pool.query('UPDATE Reservations SET reservation_status = $1, verified_by = $3 WHERE reservation_id = $2', ['claimed', reservationId, admin_id]);
    await pool.query('UPDATE Seats SET seat_status = $1 WHERE seat_id = $2', ['occupied', seatId]);
    await pool.query('COMMIT'); // committing transaction
  } 
  catch (err) {
    await pool.query('ROLLBACK'); // roll back on error
    console.error('Error updating reservation and seat status:', err);
    throw new Error('Failed to update reservation and seat status');
  }
}

// Book a seat and update seat status to 'booked'
async function updateStatus_book(rollNumber, seat_id) {
  try {
    await pool.query('BEGIN');
    const result = await pool.query('INSERT INTO Reservations (roll_number, seat_id) VALUES ($1, $2) RETURNING reservation_id',
      [rollNumber, seat_id]);
    await pool.query('UPDATE Seats SET seat_status = $1 WHERE seat_id = $2', ['booked', seat_id]);
    await pool.query('COMMIT');

    const reservationId = result.rows[0].reservation_id;
    return reservationId;
  }
  catch(err) {
    await pool.query('ROLLBACK');
    console.error('Error updating reservation and seat status:', err);
    throw new Error('Failed to update reservation and seat status');
  }
}

// Mark reservation as 'completed' and free up the seat
async function updateStatus_end(reservation_id, seat_id) {
  try {
    await pool.query('BEGIN');
    await pool.query('UPDATE Reservations SET reservation_status = $1 WHERE reservation_id = $2', ['completed', reservation_id]);
    await pool.query('UPDATE Seats SET seat_status = $1 WHERE seat_id = $2', ['available', seat_id]);
    await pool.query('COMMIT');
  }
  catch(err) {
    await pool.query('ROLLBACK');
    console.error('Error updating reservation and seat status:', err);
    throw new Error('Failed to update reservation and seat status');
  }
}

module.exports = {
getReservation,
validReservation,
updateStatus_claim,
updateStatus_book,
updateStatus_end,
getSeat
};