const express = require('express');
const router = express.Router();
const { updateLibraryHours } = require('../controllers/libraryHrsController');
const { isAdmin } = require('../middlewares/authMiddleware');

router.patch('/library-hours', isAdmin, updateLibraryHours);

module.exports = router;