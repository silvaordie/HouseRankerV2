// models/UserData.js

const mongoose = require('mongoose');

const UserDataSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    sliderValues: { type: [Number], default: [1, 1, 1, 1] },
    pointsOfInterest: { type: Array, default: [] },
    entries: { type: Array, default: [] },
}, { timestamps: true });

module.exports = mongoose.model('UserData', UserDataSchema);
