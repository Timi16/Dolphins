const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    inviteCode: {
        type: String
    },
    inviteCodeUsageCount: { 
        type: Number, 
        default: 0 
    },
    inviteCodeLastUsed: Date,
    inviteCodeCreatedAt: Date,
    score: {
        type: Number,
        default: 0
    },
    referredUsers: {
        type: [String],
        default: []
    },
    referralsCount: {
        type: Number,
        default: 0
    },
    // Added fields for rewards system
    lastDailyRewardDate: {
        type: Date,
        default: null
    },
    currentDay: {
        type: Number,
        default: 1
    },
    completedTasks: {
        type: [String],
        default: []
    },
    dailyRewardCollected: {
        type: Boolean,
        default: false
    }
});

// Pre-save hook to set initial score for new users
userSchema.pre('save', function(next) {
    if (this.isNew) {
        this.score = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
    }
    next();
});

// Create the model
const User = mongoose.model('User', userSchema);

// Export the model AFTER it's created
module.exports = User;
