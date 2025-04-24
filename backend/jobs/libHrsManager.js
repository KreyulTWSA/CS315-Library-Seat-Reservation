const cron = require('node-cron');
const pool = require('../config/db');

// Insert for upcoming 10 days of library hours
const insertNxt10Days = async () => {
  const today = new Date();

  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const isoDate = date.toISOString().split('T')[0];
    const day = date.getDay();

    const opening_time = '08:00';
    const closing_time = (day === 0) ? '17:30' : '23:59'; // Sunday has different closing time
    
    // Insert library hours for the day
    await pool.query(`
      INSERT INTO library_hours (date, opening_time, closing_time)
      VALUES ($1, $2, $3)
      ON CONFLICT (date) DO NOTHING
    `, [isoDate, opening_time, closing_time]);
  }

  console.log('[Library Hours] Initialized for next 10 days');
};

// Daily cron job to insert library hours for the upcoming 10th day, and delete the entry for yesterday
// Runs at midnight (00:00)
const dailyUpdate = () => {
  cron.schedule('0 0 * * *', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    const isoDate = futureDate.toISOString().split('T')[0];
    const day = futureDate.getDay();

    const opening_time = '08:00';
    const closing_time = (day === 0) ? '17:30' : '23:59';
    
    // Insert library hours for the future date
    await pool.query(`
      INSERT INTO library_hours (date, opening_time, closing_time)
      VALUES ($1, $2, $3)
      ON CONFLICT (date) DO NOTHING
    `, [isoDate, opening_time, closing_time]);

    console.log(`[Library Hours] Added for ${isoDate}`);

    // Delete the entry for yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const isoYesterday = yesterday.toISOString().split('T')[0];

    await pool.query(`
      DELETE FROM library_hours
      WHERE date = $1
    `, [isoYesterday]);

    console.log(`[Library Hours] Deleted entry for ${isoYesterday}`);
  });
};

module.exports = {
  insertNxt10Days,
  dailyUpdate
};
