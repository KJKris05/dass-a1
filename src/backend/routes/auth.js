// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Import your User model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// @route   POST /api/auth/register
// @desc    Register a new user (Participant, Organizer, or Admin)
// @access  Public
router.post('/register', async (req, res) => {
    try {
        // matches the fields defined in user.js model
        const { 
            firstName, 
            lastName, 
            email, 
            password, 
            role, 
            contactNumber,
            organizerCategory,
            description
        } = req.body;

        // check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        // create a new user instance
        user = new User({
            firstName,
            lastName,
            email,
            password, // Passing plain text here; User.js pre-save hook handles hashing!
            role,
            contactNumber,
            organizerCategory,
            description
        });

        // save to database
        // This triggers the pre('save') hook in User.js automatically
        await user.save();

        // create a JWT Token payload
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        // Sign the token
        jwt.sign(
            payload,
                    process.env.JWT_SECRET, // Added in .env file!
            { expiresIn: '5d' },    // Token valid for 5 days
            (err, token) => {
                if (err) throw err;
                // Send the token back to the frontend
                res.json({ token });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;