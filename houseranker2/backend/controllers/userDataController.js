// controllers/userDataController.js

const UserData = require('../models/UserData');

// Fetch user data
const getUserData = async (req, res) => {
    try {
        const userId = req.user.id; // Get user ID from the JWT token
        const data = await UserData.findOne({ userId });
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Save user data
const saveUserData = async (req, res) => {
    try {
        const userId = req.user.id;
        const { sliderValues, pointsOfInterest, entries } = req.body;

        const userData = await UserData.findOneAndUpdate(
            { userId },
            { sliderValues, pointsOfInterest, entries },
            { new: true, upsert: true } // Create if it doesn't exist
        );

        res.json(userData);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getUserData, saveUserData };
