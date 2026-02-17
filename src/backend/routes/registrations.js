// backend/routes/registrations.js
const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const jwt = require('jsonwebtoken');

// --- Middleware to Get User ID ---
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// @route   POST /api/registrations/:eventId
// @desc    Register for an event
// @access  Private (Participants)
router.post('/:eventId', auth, async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const userId = req.user.id;
        const { formResponses } = req.body; // Answers to custom questions

        // 1. Fetch Event Details
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ msg: 'Event not found' });

        // 2. Check Logic: Is Event Open?
        if (event.status !== 'Published' && event.status !== 'Ongoing') {
            return res.status(400).json({ msg: 'Registration is closed for this event' });
        }

        // 3. Check Logic: Deadline
        if (new Date() > new Date(event.registrationDeadline)) {
            return res.status(400).json({ msg: 'Registration deadline has passed' });
        }

        // 4. Check Logic: Duplicate Registration
        const existingReg = await Registration.findOne({ event: eventId, user: userId });
        if (existingReg) {
            return res.status(400).json({ msg: 'You are already registered for this event' });
        }

        // 5. Check Logic: Seat Limit
        // Count how many people are already registered
        const currentCount = await Registration.countDocuments({ event: eventId, status: 'Registered' });
        if (currentCount >= event.registrationLimit) {
            return res.status(400).json({ msg: 'Event is fully booked' });
        }

        // 6. Create Registration
        const newRegistration = new Registration({
            event: eventId,
            user: userId,
            formResponses: formResponses || [] // Optional if no questions
        });

        await newRegistration.save();

        res.json({ msg: 'Registration successful', ticketId: newRegistration.ticketId });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/registrations/my-events
// @desc    Get all events the logged-in user registered for
// @access  Private
router.get('/my-events', auth, async (req, res) => {
    try {
        const registrations = await Registration.find({ user: req.user.id })
            .populate('event', 'name startDate status eventType'); // Get event details
        res.json(registrations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;