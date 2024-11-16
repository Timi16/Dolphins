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
        // Check for existing username
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        // Create a new user
        const newUser = new User({ username });

        if (inviteCode) {
            const referrer = await User.findOne({ inviteCode });
            if (referrer) {
                referrer.referredUsers = referrer.referredUsers || [];
                if (!referrer.referredUsers.includes(username)) {
                    referrer.referredUsers.push(username);
                    referrer.referralsCount += 1;

                    if (referrer.referralsCount <= 5) referrer.score += 100;
                    if (referrer.referralsCount === 5) referrer.score += 5000;
                    if (referrer.referralsCount === 10) referrer.score += 10000;

                    await referrer.save();
                }
            }
        }

        await newUser.save();

        const token = jwt.sign({ userId: newUser._id, username: newUser.username }, JWT_SECRET, { expiresIn: '365d' });

        return res.status(201).json({
            message: 'User registered successfully',
            token,
            userId: newUser._id,
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Server error' });
    }
});



module.exports = router;
