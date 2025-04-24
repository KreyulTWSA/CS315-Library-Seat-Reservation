const jwt = require('jsonwebtoken');
const SUPER_ADMIN_EMAIL = 'admin_lib@iitk.ac.in'; 

// helper function to verify JWT token
function verifyToken(req) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        console.log('No token found');
        throw { status: 401, message: 'No token provided' };
    }
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
        console.error('Token verification error:', err);
        throw { status: 401, message: 'Invalid token' };
    }
}

// middleware to check if the user is an admin
function isAdmin(req, res, next) {
    try {
        const decoded = verifyToken(req);
        if (decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Admins only' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
    }
}

// middleware to check if the user is a student
function isStudent(req, res, next) {
    try {
        const decoded = verifyToken(req);
        if (decoded.role !== 'student') {
            return res.status(403).json({ message: 'Access denied: Students only' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
    }
}

// middleware to authenticate user based on the token
function authenticate(req, res, next) {
    try {
        const decoded = verifyToken(req);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
    }
}

// middleware to check if the user is a super admin
function isSuperAdmin(req, res, next) {
    try {
        const decoded = verifyToken(req);
        if (decoded.email !== SUPER_ADMIN_EMAIL || decoded.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied: Super admin only' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
    }
}

module.exports = { 
    isAdmin, 
    isStudent, 
    isSuperAdmin,
    authenticate 
};
