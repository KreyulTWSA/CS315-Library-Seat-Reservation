const pool = require('../config/db');

// Function to update expired reservations
async function handleExpiries() {
  const query1 = `
    UPDATE Seats
    SET seat_status = 'available'
    WHERE seat_id IN (
      SELECT seat_id
      FROM Reservations
      WHERE expires_at < NOW() AND reservation_status = 'reserved'
    );
  `;

    const query2 = `
    UPDATE Reservations
    SET reservation_status = 'unclaimed'
    WHERE expires_at < NOW() AND reservation_status = 'reserved';
    `;
  try {
    await pool.query(query1);
    await pool.query(query2);
    console.log('Expired reservations and seats updated successfully.');
  } catch (error) {
    console.error('Error updating expired reservations:', error);
  }
}

module.exports = { handleExpiries };