// User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true,
        trim: true
    },
    score: { 
        type: Number,
        default: 0
    },
    completedTasks: { 
        type: [String], 
        default: [] 
    },
    dailyRewardCollected: { 
        type: Boolean, 
        default: false 
    },
    inviteCode: {
        type: String,
        unique: true,
        sparse: true  // Allows null/undefined values to not count for uniqueness
    },
    lastDailyRewardDate: { 
        type: Date, 
        default: null 
    },
    referralsCount: { 
        type: Number, 
        default: 0 
    },
    referredUsers: { 
        type: [String], 
        default: [] 
    }
});

// Pre-save hook to set initial score for new users
UserSchema.pre('save', function(next) {
    if (this.isNew) {
        this.score = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
        // Generate unique invite code if not set
    }
    next();
});

const User = mongoose.model('User', UserSchema);

module.exports = User;