// User.js
const mongoose = require('mongoose');
const TelegramSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    score: { type: Number },
    completedTasks: { type: [String], default: [] },
    dailyRewardCollected: { type: Boolean, default: false },
    inviteCode: {
        type: String,
        unique: true,
    },
    lastDailyRewardDate: { type: Date, default: null },
    referralsCount: { type: Number, default: 0 },
    referredUsers: { type: [String], default: [] },
});

// Pre-save hook remains the same
TelegramSchema.pre('save', function(next) {
    if (this.isNew) {
        this.score = Math.floor(Math.random() * (3000 - 1000 + 1)) + 1000;
    }
    next();
});

const TelegramModel = mongoose.model('Telegram', TelegramSchema);

module.exports = TelegramModel;