const pool = require('../config/db');

// Check if the seat is available
async function isSeatFree(seat_id) {
  const result = await pool.query('SELECT * FROM Seats WHERE seat_id = $1', [seat_id]);
  
  if (result.rowCount === 0 || result.rows[0].seat_status !== 'available') {
    return false; 
  }
  return true; 
}

async function getSeatData() {
  const result = await pool.query(
    `SELECT seat_id, seat_row, seat_col, seat_status 
     FROM Seats 
     ORDER BY seat_row, seat_col`
  );

  return result.rows;
};

module.exports = {
  isSeatFree,
  getSeatData
};
