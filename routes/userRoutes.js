const express = require('express');
const router = express.Router();
const User = require('../models/User');

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
        return res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err });
    }
});

module.exports = router;

