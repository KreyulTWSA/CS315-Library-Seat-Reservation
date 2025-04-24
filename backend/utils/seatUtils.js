const pool = require('../config/db');

// Check if the seat is available
async function isSeatFree(seat_id) {
  const result = await pool.query('SELECT * FROM Seats WHERE seat_id = $1', [seat_id]);
  
  if (result.rowCount === 0 || result.rows[0].seat_status !== 'available') {
    return false; 
  }
  return true; 
}

module.exports = {
  isSeatFree,
};
