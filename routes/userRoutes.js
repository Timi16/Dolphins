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

        // Create new user with generated userId
        const newUser = new User({ username });

        // If an invite code is provided, find and update referrer
        if (inviteCode) {
            const referrer = await User.findOne({ inviteCode });
            if (referrer) {
                if (!referrer.referredUsers.includes(username)) {
                    referrer.referredUsers.push(username);
                    referrer.referralsCount++;

                    if (referrer.referralsCount <= 5) referrer.score += 100;
                    if (referrer.referralsCount === 5) referrer.score += 25000;
                    await referrer.save();
                }
            }
        }

        // Save the new user to the database
        await newUser.save();

        // Generate a JWT token including the userId
        const token = jwt.sign({ userId: newUser.userId, username: newUser.username }, JWT_SECRET, { expiresIn: '365d' });

        // Send the userId and token back to the client
        return res.status(201).json({
            message: 'User registered successfully',
            token,
            userId: newUser.userId,
        });
    } catch (err) {
        return res.status(500).json({ message: 'Server error', error: err });
    }
});


module.exports = router;
