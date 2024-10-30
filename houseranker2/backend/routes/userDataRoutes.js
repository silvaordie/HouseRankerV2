// routes/userDataRoutes.js

const express = require('express');
const { getUserData, saveUserData } = require('../controllers/userDataController');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authMiddleware, getUserData); // Middleware checks for a valid token
router.post('/', authMiddleware, saveUserData); // Save user data

module.exports = router;
