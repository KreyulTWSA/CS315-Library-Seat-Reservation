const pool = require('../config/db');

// Get group info 
const getGrpInfo = async (groupId, rollNumber) => {
  const res = await pool.query(
    `
    SELECT sg.*
    FROM Student_Groups sg
    JOIN Student_Group_Members sgm ON sg.group_id = sgm.group_id
    WHERE sg.group_id = $1 AND sgm.roll_number = $2
    `,
    [groupId, rollNumber]
  );
  return res.rows[0];
};

// To check if all the seats are available
const areSeatsFree = async (seatIds) => {
  const res = await pool.query(
    `SELECT seat_id FROM Seats WHERE seat_id = ANY($1) AND seat_status = 'available'`,
    [seatIds]
  );
  return res.rows;
};

// Create a new group reservation and return its ID
const createGrpRes = async (groupId) => {
  const res = await pool.query(
    `INSERT INTO Group_Reservations (group_id) VALUES ($1) RETURNING group_reservation_id`,
    [groupId]
  );
  return res.rows[0].group_reservation_id;
};

// Reserve the given seats and mark them as booked
const bookSeats = async (groupReservationId, seatIds) => {
  for (let seat of seatIds) {
    await pool.query(
      `INSERT INTO Group_Reservation_Seats (group_reservation_id, seat_id) VALUES ($1, $2)`,
      [groupReservationId, seat]
    );
    await pool.query(`UPDATE Seats SET seat_status = 'booked' WHERE seat_id = $1`, [seat]);
  }
};

// Update the status and verifier of a group reservation
const updateGrpRes = async (groupReservationId, status, adminId) => {
  await pool.query(
    `UPDATE Group_Reservations SET reservation_status = $1, verified_by = $3 WHERE group_reservation_id = $2`,
    [status, groupReservationId, adminId]
  );
};

// Mark all seats in the group reservation as occupied
const updateSeats = async (groupReservationId) => {
  await pool.query(
    `UPDATE Seats SET seat_status = 'occupied' WHERE seat_id IN (
      SELECT seat_id FROM Group_Reservation_Seats WHERE group_reservation_id = $1
    )`,
    [groupReservationId]
  );
};

// Function to check if all roll numbers exist in the Students table
const checkRollNums = async (rollNumbers) => {
  const query = `
      SELECT roll_number FROM Students WHERE roll_number = ANY($1)
  `;
  const { rows } = await pool.query(query, [rollNumbers]);
  return rows.map(row => row.roll_number);
};

// Function to add students to the Student_Group_Members table
const addToGroup = async (rollNumbers, groupId) => {
  const queries = rollNumbers.map(rollNo => {
      return pool.query(
          'INSERT INTO Student_Group_Members (roll_number, group_id) VALUES ($1, $2)',
          [rollNo, groupId]
      );
  });
  await Promise.all(queries);
};

module.exports = {
  getGrpInfo,
  areSeatsFree,
  createGrpRes,
  bookSeats,
  updateGrpRes,
  updateSeats,
  checkRollNums,
  addToGroup
};
