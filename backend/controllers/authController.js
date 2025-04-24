const bcrypt = require('bcrypt');
const pool = require('../config/db');
const jwt = require('jsonwebtoken');

// Helper Function: Hash the password with bcrypt
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Helper Function: Compare plain password with hashed password
async function comparePasswords(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
  
// Generate JWT token for authentication
function generateToken(userId, role, email, roll_number = null) {
  const payload = { userId, role, email, roll_number };
  const secretKey = process.env.JWT_SECRET; 
  return jwt.sign(payload, secretKey, { expiresIn: '1h' }); 
}

// Register a new student
exports.signup = async (req, res) => {
  try {
    const { naam, email, password, roll_number } = req.body;

    if (!naam || !email || !password || !roll_number) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
    if (existingUser.rowCount > 0) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await hashPassword(password);

    // Insert user into Users table
    const userResult = await pool.query(
      'INSERT INTO Users (email, naam, hashpassword, user_role) VALUES ($1, $2, $3, $4) RETURNING user_id',
      [email, naam, hashedPassword, 'student']
    );

    const userId = userResult.rows[0].user_id;

    // Create student record
    await pool.query(
      'INSERT INTO Students (user_id, roll_number) VALUES ($1, $2)',
      [userId, roll_number]
    );

    res.status(201).json({ message: 'Student registered successfully' });
  } catch (err) {
    console.error('Error during signup:', err);
    res.status(500).json({ error: 'Failed to register student' });
  }
};

// Student Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const userResult = await pool.query('SELECT * FROM Users WHERE email = $1', [email]);
    if (userResult.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // Validating password
    const isPasswordValid = await comparePasswords(password, user.hashpassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Get student roll number
    let rollNumber = null;
    if (user.user_role === 'student') {
      const student = await pool.query(
        'SELECT roll_number FROM Students WHERE user_id = $1',
        [user.user_id]
      );
      rollNumber = student.rows[0]?.roll_number || null;
    }
    
    // Generate JWT token
    const token = generateToken(user.user_id, user.user_role, user.email, rollNumber);

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        userId: user.user_id,
        username: user.username,
        email: user.email,
        naam: user.naam,
        role: user.user_role,
        roll_number: rollNumber
      }
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// Register a new admin (restricted to super admin/dev)
exports.createAdmin = async (req, res) => {
  const { email, naam, password } = req.body;

  if (!email || !naam || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert into Users table with admin role
    const result = await pool.query(
      `INSERT INTO Users (email, naam, hashpassword, user_role)
       VALUES ($1, $2, $3,'admin') RETURNING user_id`,
      [email, naam, hashedPassword]
    );

    const userID = result.rows[0].user_id;
    // Insert into Admins table
    await pool.query(
      `INSERT INTO Admins (user_id)
       VALUES ($1)`,
      [userID]
    );
    
    res.status(201).json({ message: 'Admin created' });
  } catch (err) {
    console.error('Error creating admin:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


// Admin login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists and is admin
    const userResult = await pool.query('SELECT * FROM Users WHERE email = $1 AND user_role = $2', [email, 'admin']);
    if (userResult.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password for admin' });
    }

    const user = userResult.rows[0];
    
    // Validate Password
    const isPasswordValid = await bcrypt.compare(password, user.hashpassword);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password for admin' });
    }
    
    // Generate JWT token
    const token = generateToken(user.user_id, user.user_role, user.email);

    res.status(200).json({
      message: 'Admin login successful',
      token,
      user: {
        userId: user.user_id,
        email: user.email,
        naam: user.naam,
        role: user.user_role
      }
    });
  } catch (err) {
    console.error('Error during admin login:', err);
    res.status(500).json({ error: 'Failed to login' });
  }
};
