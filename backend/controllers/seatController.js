const { getSeatData } = require('../utils/seatUtils');

// Returns the entire seat layout with row, column, and status
exports.getSeatLayout = async (req, res) => {
  try {
    const seatRows = await getSeatData();

    const layout = {};

    for (const seat of seatRows) {
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
