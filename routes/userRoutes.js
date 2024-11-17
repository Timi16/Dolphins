const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');

// Use a secure JWT secret key
const JWT_SECRET = process.env.JWT_SECRET;

// User registration endpoint
router.post('/register', async (req, res) => {
    const { username, inviteCode } = req.body;

    if (!username) {
        return res.status(400).json({ message: 'Username is required' });
    }

    try {
        // Trim and sanitize username
        const sanitizedUsername = username.trim().toLowerCase();

        // Check for existing username
        const existingUser = await User.findOne({ username: sanitizedUsername });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create a new user
        const newUser = new User({ 
            username: sanitizedUsername
        });

        // Handle referral if invite code exists
        if (inviteCode) {
            const referrer = await User.findOne({ inviteCode });
            if (referrer) {
                // Avoid self-referral
                if (referrer.username !== sanitizedUsername) {
                    // Check if user hasn't been referred before
                    if (!referrer.referredUsers.includes(sanitizedUsername)) {
                        referrer.referredUsers.push(sanitizedUsername);
                        referrer.referralsCount += 1;

                        // Award referral bonuses
                        if (referrer.referralsCount <= 5) {
                            referrer.score += 100;
                        }
                        if (referrer.referralsCount === 5) {
                            referrer.score += 5000;
                        }
                        if (referrer.referralsCount === 10) {
                            referrer.score += 10000;
                        }

                        await referrer.save();
                    }
                }
            }
        }

        // Save the new user
        await newUser.save();

        // Generate JWT token
        const token = jwt.sign(
            { username: newUser.username }, 
            JWT_SECRET, 
            { expiresIn: '365d' }
        );

        return res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                score: newUser.score,
                inviteCode: newUser.inviteCode
            }
        });

    } catch (err) {
        console.error('Registration error:', err);
        return res.status(500).json({ 
            message: 'Server error',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

module.exports = router;