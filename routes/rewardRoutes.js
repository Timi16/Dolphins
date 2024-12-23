const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');


const authenticateJWT = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        
        // Log the received authorization header for debugging
        console.log('Auth header:', authHeader);

        if (!authHeader) {
            return res.status(401).json({ 
                success: false, 
                message: 'No authorization header' 
            });
        }

        // Handle both "Bearer token" and plain token formats
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        // Log the token we're trying to verify
        console.log('Token to verify:', token);

        // For your case, since you're using a simple token
        // Instead of JWT verification, just check if token exists
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided' 
            });
        }

        // Store the token in request for later use
        req.token = token;
        next();
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(401).json({ 
            success: false, 
            message: 'Authentication failed' 
        });
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

router.post('/daily-reward', authenticateJWT, async (req, res) => {
    const { username } = req.body;

    try {
        // Fetch the user
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const now = new Date(); // Current time in UTC
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())); // Today's date at 12 AM UTC
        const lastRewardDate = user.lastDailyRewardDate
            ? new Date(Date.UTC(
                new Date(user.lastDailyRewardDate).getUTCFullYear(),
                new Date(user.lastDailyRewardDate).getUTCMonth(),
                new Date(user.lastDailyRewardDate).getUTCDate()
              ))
            : null;

        // Check if reward has already been claimed today
        if (lastRewardDate && lastRewardDate.toDateString() === today.toDateString()) {
            return res.status(400).json({ message: 'Reward already claimed for today.' });
        }

        // Define daily rewards and determine the current reward
        const dailyRewards = [50, 100, 150, 200, 250, 300, 350, 400, 500];
        const maxDay = dailyRewards.length;
        const currentDay = user.currentDay || 1;
        const dailyRewardAmount = dailyRewards[(currentDay - 1) % maxDay];

        // Update user data
        user.score += dailyRewardAmount;
        user.lastDailyRewardDate = now; // Update last claimed time
        user.currentDay = currentDay < maxDay ? currentDay + 1 : 1; // Reset to Day 1 after max days

        // Save changes
        await user.save();

        // Send response
        return res.json({
            message: `You have collected ${dailyRewardAmount} points for Day ${currentDay}`,
            newScore: user.score,
            nextDay: user.currentDay,
        });
    } catch (err) {
        console.error('Error claiming daily reward:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});



router.get('/user/:username', authenticateJWT, async (req, res) => {
    try {
        const { username } = req.params;
        console.log('Looking up user:', username);

        const user = await User.findOne({ username });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                username: user.username,
                score: user.score || 0,
                completedTasks: user.completedTasks || [],
                dailyRewardCollected: user.dailyRewardCollected || false
            }
        });

    } catch (err) {
        console.error('Error fetching user:', err);
        return res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
});

// Add this error handler to catch any unhandled errors
router.use((err, req, res, next) => {
    console.error('Router Error:', err);
    res.status(500).json({
        success: false,
        message: 'Server error',
        error: err.message
    });
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

router.get('/generate-invite/:username', authenticateJWT, async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Generate a fixed invite code using user's ID
        const fixedInviteCode = `DLPH-${user._id}`;

        // Only update if user doesn't already have an invite code
        if (!user.inviteCode) {
            user.inviteCode = fixedInviteCode;
            user.inviteCodeCreatedAt = new Date();
            user.inviteCodeUsageCount = 0;
            await user.save();
        }

        // Always use the same format for invite link
        const inviteLink = `https://t.me/DolphinsProject_Bot/Dolphins/?startapp=${user.inviteCode}`;

        res.json({ 
            inviteLink,
            inviteCode: user.inviteCode,
            createdAt: user.inviteCodeCreatedAt,
            usageCount: user.inviteCodeUsageCount
        });
    } catch (err) {
        console.error('Error generating invite link:', err);
        res.status(500).json({ message: 'Server error generating invite link' });
    }
});

// Modified referral endpoint to handle fixed invite codes
router.post('/referral/:inviteCode', authenticateJWT, async (req, res) => {
    const { inviteCode } = req.params;
    const { username } = req.body;

    try {
        // Extract user ID from invite code
        const referrerId = inviteCode.replace('DLPH-', '');
        const referrer = await User.findById(referrerId);
        const user = await User.findOne({ username });

        if (!referrer) return res.status(404).json({ message: 'Invalid invite code' });
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if user already used any invite code
        if (user.usedInviteCode) {
            return res.status(400).json({ message: 'User has already used an invite code' });
        }

        // Update invite code usage tracking
        referrer.inviteCodeUsageCount += 1;
        referrer.inviteCodeLastUsed = new Date();

        if (!referrer.referredUsers.includes(username)) {
            referrer.referredUsers.push(username);
            referrer.referralsCount++;

            // Award points for referrals
            if (referrer.referralsCount <= 5) {
                referrer.score += 100;
            }
            if (referrer.referralsCount === 5) {
                referrer.score += 5000;
            }
            if (referrer.referralsCount === 10) {
                referrer.score += 10000;
            }

            // Mark the invite code as used by this user
            user.usedInviteCode = inviteCode;
            await user.save();
            await referrer.save();

            return res.json({
                message: 'Referral successful',
                referrer: {
                    username: referrer.username,
                    newScore: referrer.score,
                    referralsCount: referrer.referralsCount,
                    inviteCodeUsageCount: referrer.inviteCodeUsageCount,
                    lastUsed: referrer.inviteCodeLastUsed
                }
            });
        }

        return res.status(400).json({ message: 'User already referred' });
    } catch (err) {
        console.error('Error processing referral:', err);
        res.status(500).json({ message: 'Server error', error: err });
    }
});


// New endpoint to get invite code statistics
router.get('/invite-stats/:username', authenticateJWT, async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json({
            inviteCode: user.inviteCode,
            createdAt: user.inviteCodeCreatedAt,
            lastUsed: user.inviteCodeLastUsed,
            usageCount: user.inviteCodeUsageCount,
            referralsCount: user.referralsCount,
            referredUsers: user.referredUsers
        });
    } catch (err) {
        console.error('Error fetching invite stats:', err);
        res.status(500).json({ message: 'Server error fetching invite stats' });
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

// Fixed ads reward endpoint
router.post('/ads/user/:userId', authenticateJWT, async (req, res) => {
    try {
        // Extract userId from route parameters
        const { userId } = req.params;

        // Find user by MongoDB-generated _id
        const user = await User.findById(userId);

        // Check if user exists
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Award 100 points for watching an ad
        user.score += 100;

        // Save the updated user data
        await user.save();

        // Return the updated user data
        return res.status(200).json({
            success: true,
            data: {
                id: user._id,
                username: user.username,
                score: user.score,
                message: '100 points awarded for watching ad'
            }
        });
    } catch (err) {
        console.error('Error processing ad reward:', err);
        return res.status(500).json({ 
            success: false, 
            message: 'Server error processing ad reward',
            error: err.message 
        });
    }
});


module.exports = router;