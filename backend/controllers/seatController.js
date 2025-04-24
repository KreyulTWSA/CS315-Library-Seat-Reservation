const pool = require('../config/db');

// Returns the entire seat layout with row, column, and status
exports.getSeatLayout = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT seat_id, seat_row, seat_col, seat_status 
       FROM Seats 
       ORDER BY seat_row, seat_col`
    );

    const layout = {};

    for (const seat of result.rows) {
      const row = seat.seat_row;
      if (!layout[row]) layout[row] = [];

      layout[row].push({
        seat_id: seat.seat_id,
        col: seat.seat_col,
        status: seat.seat_status,
      });
    }

    res.status(200).json(layout);
  } catch (err) {
    console.error('Error fetching seat layout:', err);
    res.status(500).json({ error: 'Failed to fetch seat layout' });
  }
};
