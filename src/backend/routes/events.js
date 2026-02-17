// backend/routes/events.js
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const jwt = require('jsonwebtoken');

// Verify Token & Check if Organizer
const verifyOrganizer = (req, res, next) => {
    // 1. Get token from header
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });

    try {
        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;

        // 3. Check Role
        if (req.user.role !== 'organizer' && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Organizers only.' });
        }
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// @route   POST /api/events/create
// @desc    Create a new event (Organizer Only)
// @access  Private
router.post('/create', verifyOrganizer, async (req, res) => {
    try {
        const { 
            name, description, eventType, registrationDeadline, 
            startDate, endDate, registrationLimit, registrationFee, 
            eligibility, formFields, merchandiseVariants 
        } = req.body;

        // Validation: Ensure End Date is after Start Date
        if (new Date(endDate) < new Date(startDate)) {
            return res.status(400).json({ msg: "End date cannot be before start date" });
        }

        const newEvent = new Event({
            organizer: req.user.id, // Comes from the token!
            name,
            description,
            eventType,
            registrationDeadline,
            startDate,
            endDate,
            registrationLimit,
            registrationFee,
            eligibility,
            formFields,
            merchandiseVariants
        });

        const event = await newEvent.save();
        res.json(event);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/events/all
// @desc    Get all published events (Public)
// @access  Public
router.get('/all', async (req, res) => {
    try {
        // Only fetch events that are 'Published'
        // .populate() replaces the 'organizer' ID with the actual User data (Name, Email)
        const events = await Event.find({ status: 'Published' })
                                  .populate('organizer', 'firstName lastName organizerCategory');
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;