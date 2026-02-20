// src/backend/routes/admin.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const adminAuth = require('../middleware/admin'); // Import admin middleware
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Helper function to generate credentials
function generateCredentials(clubName) {
    // Generate email: clubname@felicity.iiit.ac.in (sanitize club name)
    const sanitized = clubName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `${sanitized}@felicity.iiit.ac.in`;
    
    // Generate random password: 12 characters alphanumeric
    const password = crypto.randomBytes(6).toString('hex'); // 12 char hex string
    
    return { email, password };
}

// @route   GET /api/admin/organizers
// @desc    Get all organizers
// @access  Admin only
router.get('/organizers', adminAuth, async (req, res) => {
    try {
        const organizers = await User.find({ role: 'organizer' }).select('-password');
        res.json(organizers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/admin/organizers
// @desc    Add a new organizer (auto-generate credentials)
// @access  Admin only
router.post('/organizers', adminAuth, async (req, res) => {
    const { firstName, organizerCategory, description } = req.body;

    console.log('=== CREATE ORGANIZER REQUEST ===');
    console.log('Request body:', req.body);

    if (!firstName) {
        return res.status(400).json({ msg: 'Club/Organizer name is required' });
    }
    
    try {
        // Auto-generate email and password
        const { email, password } = generateCredentials(firstName);
        
        console.log('Generated credentials for:', firstName);
        console.log('Generated email:', email);

        // Check if email already exists
        let user = await User.findOne({ email });
        if (user) {
            console.log('User already exists with email:', email);
            return res.status(400).json({ msg: 'An organizer with this name already exists. Try a different name.' });
        }

        console.log('Creating new organizer user...');
        user = new User({
            firstName,
            email,
            password, // Will be hashed by pre-save hook
            role: 'organizer',
            organizerCategory: organizerCategory || 'Other',
            description: description || '',
            accountStatus: 'active'
        });

        console.log('User object created, attempting to save...');
        await user.save();
        console.log('User saved successfully:', user._id);
        
        // Return the credentials to admin (password before hashing)
        res.json({
            success: true,
            organizer: {
                id: user._id,
                firstName: user.firstName,
                email: user.email,
                category: user.organizerCategory,
                description: user.description
            },
            credentials: {
                email: email,
                password: password // Send plain password to admin
            }
        });

    } catch (err) {
        console.error("=== ERROR SAVING ORGANIZER ===");
        console.error("Error name:", err.name);
        console.error("Error message:", err.message);
        console.error("Full error:", err);

        if (err.name === 'ValidationError') {
            console.error("Validation errors:", err.errors);
            const firstError = Object.values(err.errors)[0]?.message || 'Validation failed';
            return res.status(400).json({ msg: firstError });
        }

        if (err.code === 11000) {
            console.error("Duplicate key error");
            return res.status(400).json({ msg: 'An organizer with this name already exists' });
        }

        res.status(500).json({ msg: 'Server Error: ' + err.message });
    }
});

// @route   DELETE /api/admin/organizers/:id
// @desc    Remove/disable an organizer (blocks login)
// @access  Admin only
router.delete('/organizers/:id', adminAuth, async (req, res) => {
    try {
        const { action } = req.query; // ?action=disable or ?action=delete
        
        if (action === 'delete') {
            const Event = require('../models/Event');
            const Registration = require('../models/Registration');
            
            // Find all events created by this organizer
            const organizerEvents = await Event.find({ organizer: req.params.id });
            const eventIds = organizerEvents.map(e => e._id);
            
            // Delete all registrations for those events
            await Registration.deleteMany({ event: { $in: eventIds } });
            
            // Delete all events by this organizer
            await Event.deleteMany({ organizer: req.params.id });
            
            // Permanent deletion of organizer
            await User.findByIdAndDelete(req.params.id);
            
            res.json({ 
                msg: 'Organizer permanently deleted',
                deletedEvents: eventIds.length,
                deletedRegistrations: await Registration.countDocuments()
            });
        } else {
            // Default: Disable account (blocks login)
            const user = await User.findByIdAndUpdate(
                req.params.id,
                { accountStatus: 'disabled' },
                { new: true }
            );
            if (!user) {
                return res.status(404).json({ msg: 'Organizer not found' });
            }
            res.json({ msg: 'Organizer account disabled (login blocked)', user });
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/admin/organizers/:id/enable
// @desc    Re-enable a disabled organizer
// @access  Admin only
router.put('/organizers/:id/enable', adminAuth, async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { accountStatus: 'active' },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ msg: 'Organizer not found' });
        }
        res.json({ msg: 'Organizer account re-enabled', user });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;