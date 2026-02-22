const express = require('express');
const router = express.Router();
// Use the full path or ensure it's correct. 
// Standard in this project is require('../models/user.js')
const User = require('../models/user.js'); 

// @route   GET /api/clubs
// @desc    Get all organizers (clubs)
// @access  Public (or Private)
router.get('/', async (req, res) => {
    try {
        // find all users with role 'organizer' and active status
        const clubs = await User.find({ 
            role: 'organizer',
            accountStatus: 'active' 
        }).select('firstName lastName organizerCategory description website email accountStatus');
        
        res.json(clubs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error: ' + err.message);
    }
});

module.exports = router;