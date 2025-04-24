const pool = require('../config/db');
const { toHHMM, validHHMM } = require('./timeUtils');

// Helper Function: To subtract a given number of minutes from a time string formatted as "HH:MM"
function subtractMinutes(time, minus) {
  
  const [hours, minutes] = time.split(':').map(Number);

  let totalMinutes = hours * 60 + minutes;
  totalMinutes -= minus;

  const newHours = Math.floor(totalMinutes / 60);
  const newMinutes = totalMinutes % 60;

  const formattedTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
  return formattedTime;
}

// Check if the library is open 24x7 for today
async function isOpen24x7() {
  const today = new Date().toISOString().slice(0, 10); // 'YYYY-MM-DD'

  const result = await pool.query(
    `SELECT open_24_7 FROM library_hours WHERE date = $1`,
    [today]
  );

  return result.rows[0]?.open_24_7 === true;
}

// Retrieve the closing time for today
async function getClosingTime() {
  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10);

  const result = await pool.query(
    `SELECT closing_time FROM library_hours WHERE date = $1`,
    [dateStr]
  );

  if (!result.rows.length) throw new Error('No library hours set for today');

  const [hours, minutes] = result.rows[0].closing_time.split(':').map(Number);
  const closingDate = new Date(today);
  closingDate.setHours(hours, minutes, 0, 0);

  return closingDate;
}

// Perform the library closing operations: free claimed seats and complete reservations
async function closeLibrary() {
  try {
    const open24x7 = await isOpen24x7();
    if (open24x7) return;

    const query1 = `
      UPDATE Seats
      SET seat_status = 'available'
      WHERE seat_id IN (
        SELECT seat_id FROM Reservations WHERE reservation_status = 'claimed'
      );
    `;

    const query2 = `
      UPDATE Reservations
      SET reservation_status = 'completed'
      WHERE reservation_status = 'claimed';
    `;

    await pool.query(query1);
    await pool.query(query2);
    console.log('Library closed: Reservations completed and seats freed.');
  } catch (error) {
    console.error('Error during library close process:', error);
  }
}

// Fetch today's library hours from the database
async function fetchLibHrs() {
  try {
    const res = await pool.query('SELECT * FROM library_hours WHERE date = CURRENT_DATE');
    if (res.rows.length === 0) {
      throw new Error('No library hours found for today');
    }
    return res.rows[0];
  } catch (err) {
    console.error('Error fetching library hours:', err);
    throw new Error('Failed to retrieve library hours');
  }
}

// Validate and format today's library hours
async function getLibHrs() {
  const hours = await fetchLibHrs();

  const formattedHours = {
    ...hours,
    opening_time: hours.opening_time.slice(0, 5),
    closing_time: hours.closing_time.slice(0, 5)
  };
  
  if (!validHHMM(formattedHours.opening_time) || !validHHMM(formattedHours.closing_time)) {
    throw new Error('Invalid time format (expected HH:MM)');
  }

  return formattedHours;
}

// Check if the current time falls within library open hours
async function isLibOpen() {
  try {
    const hours = await getLibHrs();
    const now = new Date();
    const nowTime = toHHMM(now);

    if (hours.open_24_7) return true;
    
    return nowTime >= hours.opening_time && nowTime <= hours.closing_time;
  } catch (err) {
    console.error('Error checking library hours:', err);
    throw new Error('Failed to check library hours');
  }
}

// Check if the current time is within 15 minutes of library closing time
async function abtToClose() {
  try {
    const hours = await getLibHrs();
    if (hours.open_24_7) return false;
    const now = new Date();
    const nowTime = toHHMM(now);

    const fifteenMinutesBeforeClosing = subtractMinutes(hours.closing_time, 15);
    return nowTime >= fifteenMinutesBeforeClosing && nowTime <= hours.closing_time;
  } 
  catch (err) {
    console.error('Error checking closing time:', err);
    throw new Error('Failed to check if approaching closing time');
  }
}

// Edit or insert library hours in the database for a date range
async function editLibHrs(openingTime, closingTime, open_24_7, startDate, endDate) {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start) || isNaN(end) || start > end) {
      throw new Error('Invalid date range');
    }

    for (
      let date = new Date(start);
      date <= end;
      date.setDate(date.getDate() + 1)
    ) {
      const dateStr = date.toISOString().split('T')[0];

      const result = await pool.query('SELECT 1 FROM library_hours WHERE date = $1', [dateStr]);

      if (result.rowCount > 0) {
        await pool.query(
          // Update library hours if record already exists
          'UPDATE library_hours SET opening_time = $1, closing_time = $2, open_24_7 = $3 WHERE date = $4',
          [openingTime, closingTime, open_24_7, dateStr]
        );
        console.log(`Updated library hours for ${dateStr}`);
      } else {
        await pool.query(
          // Insert new record if none exists
          'INSERT INTO library_hours (date, opening_time, closing_time, open_24_7) VALUES ($1, $2, $3, $4)',
          [dateStr, openingTime, closingTime, open_24_7]
        );
        console.log(`Inserted library hours for ${dateStr}`);
      }
    }

    console.log('Library hours updated successfully for range.');
  } catch (err) {
    console.error('Error updating library hours:', err);
    throw new Error('Failed to update library hours for range');
  }
}

module.exports = {
  isLibOpen,
  abtToClose,
  editLibHrs,
  isOpen24x7,
  getClosingTime,
  closeLibrary
};
