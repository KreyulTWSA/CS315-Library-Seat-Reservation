const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');

// Load environment variables from .env file
dotenv.config();

// Import route modules
const authRoutes = require('./routes/authRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const seatRoutes = require('./routes/seatRoutes');
const groupRoutes = require('./routes/groupRoutes');
const userRoutes = require('./routes/userRoutes');

// Import the database pool for graceful shutdown
const pool = require('./config/db');

// Import scheduled job for handling expired reservations
const { handleExpiries } = require('./jobs/expiryManager');

// Initialize Express app
const app = express();

// Define CORS configuration
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS || '*',  
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// Apply CORS middleware globally to the app
app.use(cors(corsOptions));

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Schedule a job to run every minute to handle expired reservations
cron.schedule('* * * * *', handleExpiries);

// Run job to end sessions at library closing time
require('./jobs/dayEndManager');

// Library hours setup and update tasks
const { insertNxt10Days, dailyUpdate } = require('./jobs/libHrsManager');
insertNxt10Days(); // Preload next 10 days of library hours
dailyUpdate();

// Mount all route handlers
app.use('/auth', authRoutes);
app.use('/reservation', reservationRoutes);
app.use('/admin', adminRoutes);
app.use('/seats', seatRoutes);
app.use('/group', groupRoutes);
app.use('/user', userRoutes);

// Fallback for undefined routes
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler for uncaught errors
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

// Gracefully close the database connection when the app exits
process.on('exit', () => {
  console.log('Closing database connection...');
  pool.end();  
});

// Handling uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  pool.end();  
  process.exit(1);  
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
