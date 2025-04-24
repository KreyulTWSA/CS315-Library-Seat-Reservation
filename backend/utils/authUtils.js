const pool = require('../config/db');
const bcrypt = require('bcrypt');

// Hash a password
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

// Compare passwords
async function comparePasswords(plain, hash) {
  return await bcrypt.compare(plain, hash);
}

// Create a new user (general)
async function createUser(email, naam, hashedPassword, role = 'student') {
  const result = await pool.query(
    'INSERT INTO Users (email, naam, hashpassword, user_role) VALUES ($1, $2, $3, $4) RETURNING user_id',
    [email, naam, hashedPassword, role]
  );
  return result.rows[0].user_id;
}

// Fetch user by email
async function getUserByEmail(email) {
  const result = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
  return result.rows[0];
}

// Check if a user exists by email
async function userExists(email) {
  const result = await pool.query('SELECT 1 FROM Users WHERE email = $1', [email]);
  return result.rowCount > 0;
}

// Create student profile
async function createStudent(userId, roll_number) {
  await pool.query('INSERT INTO Students (user_id, roll_number) VALUES ($1, $2)', [userId, roll_number]);
}

// Create admin profile
async function createAdminProfile(userId) {
  await pool.query('INSERT INTO Admins (user_id) VALUES ($1)', [userId]);
}

module.exports = {
  hashPassword,
  comparePasswords,
  createUser,
  getUserByEmail,
  userExists,
  createStudent,
  createAdminProfile,
};
