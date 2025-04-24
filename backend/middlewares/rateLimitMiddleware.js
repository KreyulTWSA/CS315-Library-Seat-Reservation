const rateLimit = require('express-rate-limit');

// Create a rate limit rule for login routes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  
  max: 5,                    // Allow only 5 requests per 15 minutes
  message: 'Too many login attempts from this IP, please try again later.',
  headers: true,              
});

module.exports = { loginLimiter };