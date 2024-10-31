const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401); // Unauthorized
    }
};
// Update score when a task is completed
router.post('/complete-task',authenticateJWT, async (req, res) => {
    const { username, task, amount } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (!user.completedTasks.includes(task)) {
            user.score += amount;
            user.completedTasks.push(task);
            await user.save();

            return res.json({ message: `Task "${task}" completed`, newScore: user.score });
        } else {
            return res.status(400).json({ message: 'Task already completed' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get daily reward
router.post('/daily-reward',authenticateJWT, async (req, res) => {
    const { username } = req.body;
    const dailyRewardAmount = 500;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const today = new Date().setHours(0, 0, 0, 0); // Reset to midnight
        const lastRewardDate = user.lastDailyRewardDate ? user.lastDailyRewardDate.setHours(0, 0, 0, 0) : null;

        if (lastRewardDate === today) {
            return res.status(400).json({ message: 'Daily reward already collected' });
        }

        user.score += dailyRewardAmount;
        user.lastDailyRewardDate = new Date(); // Store current date
        user.dailyRewardCollected = true;
        await user.save();

        return res.json({ message: `You have collected ${dailyRewardAmount} DOGS`, newScore: user.score });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Generate invite link
router.get('/generate-invite/:username',authenticateJWT, async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Generate a unique invite code using a combination of username and timestamp
        const timestamp = Date.now();
        const inviteCode = `${username.toUpperCase()}-${timestamp.toString(36)}`;

        // Save invite code to user
        user.inviteCode = inviteCode;
        await user.save();

        // Construct the invite link directly to work.html
        const inviteLink = `${req.protocol}://${req.get('host')}/index.html?inviteCode=${inviteCode}`;

        res.json({ inviteLink });
    } catch (err) {
        console.error('Error generating invite link:', err);
        res.status(500).json({ message: 'Server error generating invite link' });
    }
});

// Get user score and tasks
router.get('/user/:username', authenticateJWT, async (req, res) => {
    const { username } = req.params;

    if (!username) {
        return res.status(400).json({ message: 'Bad Request', details: 'Username is required' });
    }

    try {
        const user = await TelegramUser.findOne({ username });

        if (!user) {
            return res.status(404).json({ message: 'Not Found', details: 'User not found' });
        }

        return res.json({
            username: user.username,
            score: user.score,
            completedTasks: user.completedTasks,
            dailyRewardCollected: user.dailyRewardCollected,
        });
    } catch (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({ message: 'Internal Server Error', details: err.message });
    }
});


// Get leaderboard data
router.get('/leaderboard',authenticateJWT, async (req, res) => {
    try {
        const leaderboard = await User.find().sort({ score: -1 }).limit(10);
        const leaderboardData = leaderboard.map((user, index) => ({
            username: user.username,
            score: user.score,
            rank: index + 1
        }));

        res.json(leaderboardData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching leaderboard data' });
    }
});

// Get total number of users
router.get('/holdersCount',authenticateJWT, async (req, res) => {
    try {
        const count = await User.countDocuments();
        res.json({ holdersCount: count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error fetching holders count' });
    }
});

// Modify the existing referral route
router.post('/referral/:inviteCode',authenticateJWT, async (req, res) => {
    const { inviteCode } = req.params;
    const { username } = req.body;

    try {
        const referrer = await User.findOne({ inviteCode });
        const user = await User.findOne({ username });

        if (!referrer) return res.status(404).json({ message: 'Referrer not found' });
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (referrer.referredUsers.includes(username)) {
            return res.status(400).json({ message: 'User already referred' });
        }

        referrer.referredUsers.push(username);
        referrer.referralsCount++;

        // Award points for the first 5 referrals
        if (referrer.referralsCount <= 5) {
            referrer.score += 100; // 100 points per referral
            await referrer.save();

            return res.json({
                message: 'Referral successful. You have earned 100 points!',
                newScore: referrer.score,
                referralsCount: referrer.referralsCount
            });
        }

        if (referrer.referralsCount === 5) {
            referrer.score += 25000; // Award bonus of 25,000 points
            await referrer.save();

            return res.json({
                message: 'Congratulations! You have referred 5 users and earned a bonus of 25,000 points!',
                newScore: referrer.score,
                referralsCount: referrer.referralsCount
            });
        }

        res.status(400).json({ message: 'Referral limit reached' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error', error: err });
    }
});

// Get the list and count of referred users
router.get('/referrals/:username',authenticateJWT, async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const referredUsers = user.referredUsers || [];
        const referralsCount = referredUsers.length;

        return res.json({
            username: user.username,
            referralsCount,
            referredUsers,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update game score
router.post('/update-game-score',authenticateJWT, async (req, res) => {
    const { username, gameScore } = req.body;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Add the game score to the existing score
        user.score += gameScore;
        await user.save();

        return res.json({ 
            message: 'Score updated successfully', 
            newScore: user.score 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});


module.exports = router;
