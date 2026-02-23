// backend/routes/events.js
const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const jwt = require('jsonwebtoken');

// Helper function to update event statuses based on dates
const updateEventStatuses = async (events) => {
    try {
        const eventsArray = Array.isArray(events) ? events : [events];
        
        for (let event of eventsArray) {
            if (event && typeof event.updateStatusBasedOnDates === 'function') {
                const oldStatus = event.status;
                event.updateStatusBasedOnDates();
                // Only save if status actually changed
                if (oldStatus !== event.status) {
                    await event.save();
                }
            }
        }
        
        return events;
    } catch (error) {
        console.error('Error updating event statuses:', error);
        // Return events even if update fails
        return events;
    }
};

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

// @route   GET /api/events/all
// @desc    Get all public events (Published, Ongoing, Completed)
// @access  Public
router.get('/all', async (req, res) => {
    try {
        // Logic: Show events that are Published OR Ongoing OR Completed
        // Hide: Drafts and Cancelled events
        const events = await Event.find({ 
            status: { $in: ['Published', 'Ongoing', 'Completed'] } 
        })
        .populate('organizer', 'firstName lastName organizerCategory')
        .sort({ startDate: 1 }); // Sort by nearest date first

        // Filter out events with deleted organizers
        const validEvents = events.filter(event => event.organizer !== null);

        res.json(validEvents);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/events/trending
// @desc    Get top 5 trending events based on registrations in last 24 hours
// @access  Public
router.get('/trending', async (req, res) => {
    try {
        // Calculate timestamp for 24 hours ago
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        // Aggregate registrations from last 24 hours grouped by event
        const trendingData = await Registration.aggregate([
            {
                // Filter registrations from last 24 hours
                $match: {
                    createdAt: { $gte: twentyFourHoursAgo },
                    status: { $nin: ['Cancelled', 'Rejected'] } // Exclude cancelled/rejected
                }
            },
            {
                // Group by event and count registrations
                $group: {
                    _id: '$event',
                    registrationCount: { $sum: 1 }
                }
            },
            {
                // Sort by count descending
                $sort: { registrationCount: -1 }
            },
            {
                // Limit to top 5
                $limit: 5
            }
        ]);
        
        // Get full event details for trending events
        const eventIds = trendingData.map(item => item._id);
        const events = await Event.find({ 
            _id: { $in: eventIds },
            status: { $in: ['Published', 'Ongoing', 'Completed'] }
        })
        .populate('organizer', 'firstName lastName organizerCategory');
        
        // Map events with their trending scores
        const trendingEvents = trendingData.map(item => {
            const event = events.find(e => e._id.toString() === item._id.toString());
            if (event && event.organizer) {
                return {
                    ...event.toObject(),
                    trendingScore: item.registrationCount
                };
            }
            return null;
        }).filter(e => e !== null);
        
        res.json(trendingEvents);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/events/my-events
// @desc    Get all events created by the logged-in organizer
// @access  Private (Organizer Only)
router.get('/my-events', verifyOrganizer, async (req, res) => {
    try {
        const events = await Event.find({ organizer: req.user.id })
            .sort({ createdAt: -1 }); // Newest first
        
        res.json(events);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});




router.put('/:id', verifyOrganizer, async (req, res) => {
    try {
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check user
        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        const { 
            name, description, eventType, registrationDeadline, 
            startDate, endDate, registrationLimit, registrationFee, 
            eligibility, formFields, merchandiseVariants, tags,
            status
        } = req.body;

        // Edit restrictions based on event status
        if (event.status === 'Ongoing') {
            // For Ongoing events, only allow status changes to Completed or Cancelled
            if (status && (status === 'Completed' || status === 'Cancelled')) {
                event.status = status;
                await event.save();
                return res.json(event);
            } else {
                return res.status(400).json({ 
                    msg: 'Ongoing events can only be marked as Completed or Cancelled' 
                });
            }
        }

        // For Draft events: Allow full editing (all fields)
        // For Published/Completed/Cancelled: Allow limited editing (current behavior)
        const eventFields = {};
        
        // If event is Draft, allow editing all fields
        if (event.status === 'Draft') {
            if (name) eventFields.name = name;
            if (description) eventFields.description = description;
            if (eventType) eventFields.eventType = eventType;
            if (registrationDeadline) eventFields.registrationDeadline = registrationDeadline;
            if (startDate) eventFields.startDate = startDate;
            if (endDate) eventFields.endDate = endDate;
            if (registrationLimit) eventFields.registrationLimit = registrationLimit;
            if (registrationFee !== undefined) eventFields.registrationFee = registrationFee;
            if (eligibility) eventFields.eligibility = eligibility;
            if (formFields) eventFields.formFields = formFields;
            if (merchandiseVariants) eventFields.merchandiseVariants = merchandiseVariants;
            if (tags) eventFields.tags = tags;
            if (status) eventFields.status = status;
        } else {
            // For Published/Completed/Cancelled: Limited editing (existing behavior)
            if (description) eventFields.description = description;
            if (registrationDeadline) eventFields.registrationDeadline = registrationDeadline;
            if (registrationLimit) eventFields.registrationLimit = registrationLimit;
            if (status) eventFields.status = status;
        }

        event = await Event.findByIdAndUpdate(
            req.params.id,
            { $set: eventFields },
            { new: true }
        );

        res.json(event);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/events/:id
// @desc    Delete an event (Organizer Only)
// @access  Private
router.delete('/:id', verifyOrganizer, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check user
        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Delete all registrations for this event (cascade delete)
        const Registration = require('../models/Registration');
        const deletedRegistrations = await Registration.deleteMany({ event: req.params.id });

        // Delete the event
        await event.deleteOne();

        res.json({ 
            msg: 'Event removed',
            deletedRegistrations: deletedRegistrations.deletedCount
        });
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
             return res.status(404).json({ msg: 'Event not found' });
        }
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/events/:id/attendees
// @desc    Get all attendees for a specific event (Organizer Only)
// @access  Private
router.get('/:id/attendees', verifyOrganizer, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check user is the organizer (or admin)
        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'User not authorized' });
        }

        // Find registrations for this event
        const attendees = await Registration.find({ event: req.params.id })
            .populate('user', 'firstName lastName email contactNumber participantType collegeName');
        
        res.json(attendees);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/events/create
// @desc    Create a new event (Organizer Only)
// @access  Private
router.post('/create', verifyOrganizer, async (req, res) => {
    try {
        const { 
            name, description, eventType, registrationDeadline, 
            startDate, endDate, registrationLimit, registrationFee, 
            eligibility, formFields, merchandiseVariants, tags,
            status
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
            merchandiseVariants,
            tags,
            status: status || 'Published'
        });

        const event = await newEvent.save();
        res.json(event);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/events/:id/analytics
// @desc    Get analytics for a specific event (registrations, attendance, revenue)
// @access  Private (Organizer only)
router.get('/:id/analytics', verifyOrganizer, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        // Check if user is the organizer or admin
        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized to view analytics' });
        }

        // Get all registrations for this event
        const registrations = await Registration.find({ event: req.params.id })
            .populate('user', 'firstName lastName email');

        // Calculate analytics
        const totalRegistrations = registrations.length;
        
        // Attendance count (status === 'Attended')
        const attendedCount = registrations.filter(r => r.status === 'Attended').length;
        
        // For Normal events: count completed payments
        // For Merchandise: count approved/completed purchases
        let completedSales = 0;
        let pendingApprovals = 0;
        let rejectedSales = 0;
        
        if (event.eventType === 'Merchandise') {
            completedSales = registrations.filter(r => 
                r.status === 'Approved' && r.paymentStatus === 'Completed'
            ).length;
            pendingApprovals = registrations.filter(r => 
                r.status === 'Pending' && r.paymentStatus === 'AwaitingApproval'
            ).length;
            rejectedSales = registrations.filter(r => r.status === 'Rejected').length;
        } else {
            completedSales = registrations.filter(r => 
                r.paymentStatus === 'Completed' && r.status !== 'Cancelled'
            ).length;
        }

        // Calculate revenue
        let totalRevenue = 0;
        
        if (event.eventType === 'Merchandise') {
            // For merchandise, sum up variant prices for approved purchases
            // Each registration represents one item purchase
            registrations.forEach(reg => {
                if (reg.status === 'Approved' && reg.paymentStatus === 'Completed') {
                    // Find the variant from formResponses (variant selection is stored as 'Variant')
                    const variantResponse = reg.formResponses?.find(r => r.questionLabel === 'Variant');
                    if (variantResponse) {
                        const variantName = variantResponse.answer;
                        const variant = event.merchandiseVariants?.find(v => v.name === variantName);
                        if (variant) {
                            totalRevenue += variant.price;
                        }
                    }
                }
            });
        } else {
            // For normal events, multiply registration fee by completed registrations
            totalRevenue = event.registrationFee * completedSales;
        }

        // Attendance rate
        const attendanceRate = totalRegistrations > 0 
            ? ((attendedCount / totalRegistrations) * 100).toFixed(1)
            : 0;

        // Registration trend (group by date)
        const registrationsByDate = {};
        registrations.forEach(reg => {
            const date = new Date(reg.createdAt).toISOString().split('T')[0];
            registrationsByDate[date] = (registrationsByDate[date] || 0) + 1;
        });

        // Convert to array for chart
        const registrationTrend = Object.entries(registrationsByDate)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => new Date(a.date) - new Date(b.date));

        // Payment status breakdown
        const paymentBreakdown = {
            completed: registrations.filter(r => r.paymentStatus === 'Completed').length,
            pending: registrations.filter(r => r.paymentStatus === 'Pending').length,
            awaitingApproval: registrations.filter(r => r.paymentStatus === 'AwaitingApproval').length,
            failed: registrations.filter(r => r.paymentStatus === 'Failed').length
        };

        // Status breakdown
        const statusBreakdown = {
            registered: registrations.filter(r => r.status === 'Registered').length,
            attended: attendedCount,
            cancelled: registrations.filter(r => r.status === 'Cancelled').length,
            pending: registrations.filter(r => r.status === 'Pending').length,
            approved: registrations.filter(r => r.status === 'Approved').length,
            rejected: registrations.filter(r => r.status === 'Rejected').length
        };

        res.json({
            eventName: event.name,
            eventType: event.eventType,
            eventStatus: event.status,
            summary: {
                totalRegistrations,
                completedSales,
                pendingApprovals,
                rejectedSales,
                attendedCount,
                attendanceRate: `${attendanceRate}%`,
                totalRevenue: totalRevenue.toFixed(2),
                registrationLimit: event.registrationLimit,
                spotsRemaining: event.registrationLimit - totalRegistrations
            },
            registrationTrend,
            paymentBreakdown,
            statusBreakdown,
            recentRegistrations: registrations.slice(-10).reverse().map(r => ({
                userName: `${r.user.firstName} ${r.user.lastName}`,
                email: r.user.email,
                status: r.status,
                paymentStatus: r.paymentStatus,
                registeredAt: r.createdAt,
                attendedAt: r.attendedAt
            }))
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const event = await Event.findById(req.params.id).populate('organizer', 'firstName lastName organizerCategory');
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }
        
        res.json(event);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/events/:id/publish
// @desc    Publish a draft event (change status from Draft to Published)
// @access  Private (Organizer only)
router.put('/:id/publish', verifyOrganizer, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }
        
        // Check if user is the organizer
        if (event.organizer.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'User not authorized' });
        }
        
        // Update status to Published
        event.status = 'Published';
        await event.save();
        
        res.json({ msg: 'Event published successfully', event });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;