const express = require('express');
const jwt = require('jsonwebtoken'); // Import jwt for generating tokens
const router = express.Router();
const User = require('../models/User');

// Use a secure JWT secret key (the one you generated)
const JWT_SECRET = process.env.JWT_SECRET;

// User registration endpoint
router.post('/register', async (req, res) => {
    const { username, inviteCode } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        // Create new user
        const newUser = new User({ username });

        // If an invite code is provided, find the referrer
        if (inviteCode) {
            const referrer = await User.findOne({ inviteCode });

            if (referrer) {
                // Check if this user has already been referred
                if (!referrer.referredUsers.includes(username)) {
                    referrer.referredUsers.push(username);
                    referrer.referralsCount++;

                    // Award points for the first 5 referrals
                    if (referrer.referralsCount <= 5) {
                        referrer.score += 100;  // 100 points per referral
                    }
                    // If the referrer has exactly 5 referrals, award a bonus of 25,000 points
                    if (referrer.referralsCount === 5) {
                        referrer.score += 25000;  // Award bonus of 25,000 points
                    }

                    // Save the referrer updates
                    await referrer.save();
                }
            }
        }

        // Save the new user to the database
        await newUser.save();

        // Generate a JWT token for the user
        const token = jwt.sign({ username: newUser.username }, JWT_SECRET, { expiresIn: '365d' }); // Token valid for 1 year

        // Send the token back to the client with a success message
        return res.status(201).json({ message: 'User registered successfully', token });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err });
    }
});

module.exports = router;
