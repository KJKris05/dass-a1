// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const User = require('../models/user.js'); // Import your User model
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
            collegeName,
            interests // Added interests
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
            collegeName,
            interests // Added interests
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

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
    try {
        // get email and password from request body
        const {email, password} = req.body;

        // validate both fields are provided
        if(!email || !password){
            return res.status(400).json({msg: 'Please enter both email and password'});
        }

        // check for user
        const user = await User.findOne({email}).select('+password'); // added select password explicitly since we set select: false
        
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // Check if account is disabled or archived
        if (user.accountStatus === 'disabled') {
            return res.status(403).json({ msg: 'Your account has been disabled. Contact admin.' });
        }
        if (user.accountStatus === 'archived') {
            return res.status(403).json({ msg: 'Your account has been archived. Contact admin.' });
        }

        // check password using the method defined in User.js
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        // return a JWT token payload
        const payload = {
            user : {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5d' },
            (err, token) => {
                if (err) throw err;
                res.json({token}); // send token back to frontend
            }
        );
    }
    catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', async (req, res) => {
    // Middleware to verify token manually inside since we didn't export 'auth' middleware widely
    // Ideally we should move middleware to a separate file, but for now:
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;

        const {
            firstName, lastName, contactNumber, collegeName, interests, password,
            organizerCategory, description, website, followedClubs
        } = req.body;

        try {
            // Find user by ID
            let user = await User.findById(req.user.id);
    
            if (!user) {
                return res.status(404).json({ msg: 'User not found' });
            }

            // Update fields if provided
            if (firstName) user.firstName = firstName;
            if (lastName) user.lastName = lastName;
            if (contactNumber) user.contactNumber = contactNumber;
            if (collegeName) user.collegeName = collegeName;
            if (interests) user.interests = interests;
            if (followedClubs) user.followedClubs = followedClubs;
            if (organizerCategory) user.organizerCategory = organizerCategory;
            if (description) user.description = description;
            if (website) user.website = website;

            // Password Reset (Simple version)
            if (password) {
                // The pre-save hook will hash this!
                user.password = password; 
            }

            await user.save();
            res.json(user);

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', async (req, res) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;