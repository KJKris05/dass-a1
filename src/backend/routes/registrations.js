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
            return res.status(400).json({ msg: 'You are already registered/purchased for this event' });
        }

        // --- MERCHANDISE LOGIC ---
        if (event.eventType === 'Merchandise') {
             // Find selected variant from answers
             // Frontend sends: [{ questionLabel: 'Variant', answer: 'Size L' }]
             const variantName = formResponses && formResponses.find(r => r.questionLabel === 'Variant')?.answer;
             
             if (!variantName) {
                 return res.status(400).json({ msg: 'Please select a variant' });
             }

             // Find the variant object in the event
             const variantIndex = event.merchandiseVariants.findIndex(v => v.name === variantName);
             if (variantIndex === -1) {
                 return res.status(400).json({ msg: 'Variant not found' });
             }

             if (event.merchandiseVariants[variantIndex].stock <= 0) {
                 return res.status(400).json({ msg: 'Sorry, this item is out of stock' });
             }

             // Decrement Stock
             event.merchandiseVariants[variantIndex].stock -= 1;
             await event.save();

        } else {
            // --- NORMAL EVENT LOGIC ---
            // Validate required form fields
            if (event.formFields && event.formFields.length > 0) {
                const requiredFields = event.formFields.filter(f => f.required);
                
                for (const field of requiredFields) {
                    const response = formResponses && formResponses.find(r => r.questionLabel === field.label);
                    
                    if (!response || !response.answer || response.answer.toString().trim() === '') {
                        return res.status(400).json({ 
                            msg: `Required field missing: ${field.label}` 
                        });
                    }
                }
            }
            
            // 5. Check Logic: Seat Limit
            const currentCount = await Registration.countDocuments({ event: eventId, status: 'Registered' });
            if (currentCount >= event.registrationLimit) {
                return res.status(400).json({ msg: 'Event is fully booked' });
            }
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

// @route   POST /api/registrations/validate
// @desc    Validate a ticket (Organizer Only)
// @access  Private
router.post('/validate', auth, async (req, res) => {
    try {
        const { ticketId } = req.body;

        // 1. Find the registration
        const registration = await Registration.findOne({ ticketId }).populate('event');
        
        if (!registration) {
            return res.status(404).json({ msg: 'Invalid Ticket ID' });
        }

        // 2. Check Authorization: Is the requester the organizer of this event?
        // Note: req.user.id is string, event.organizer is ObjectId
        if (registration.event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access Denied: You are not the organizer of this event.' });
        }

        // 3. Check Protocol: Duplicate Scans
        if (registration.status === 'Attended') {
            return res.status(400).json({ msg: 'ALREADY USED: Ticket has already been scanned.' });
        }

        // 4. Mark as Attended
        registration.status = 'Attended';
        // We can add a timestamp field if we update the schema, or just rely on updatedAt
        // For strict timestamping requirement:
        // registration.attendedAt = new Date(); 
        await registration.save();

        res.json({ 
            msg: 'Ticket Validated Successfully', 
            attendee: registration.user, // detailed user info would require populate
            event: registration.event.name
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;