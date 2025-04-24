const { validHHMM } = require('../utils/timeUtils');
const { editLibHrs } = require('../utils/libraryUtils');

// Update library hours (admin only)
exports.updateLibraryHours = async (req, res) => {
  try {
    const { openingTime, closingTime, open_24_7, startDate, endDate } = req.body;
    
    // Ensure startDate is provided
    if (!startDate) {
      return res.status(400).json({ error: 'startDate is required' });
    }

    const from = new Date(startDate);
    const to = new Date(endDate || startDate);  // Default to same day if endDate not given
    
    // Validate opening and closing times if not 24/7
    if (!open_24_7) {
      if (!validHHMM(openingTime) || !validHHMM(closingTime)) {
        return res.status(400).json({ error: 'Invalid time format (expected HH:MM)' });
      }
    }
    
    // Update library hours in database
    await editLibHrs(
      open_24_7 ? '00:00' : openingTime,
      open_24_7 ? '23:59' : closingTime,
      open_24_7,
      from,
      to
    );

    res.status(200).json({
      message: `Library hours updated ${open_24_7 ? '(24/7)' : ''} from ${startDate} to ${endDate || startDate}`
    });

  } catch (err) {
    console.error('Error updating library hours:', err);
    res.status(500).json({ error: 'Failed to update library hours' });
  }
};
