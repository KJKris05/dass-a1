// backend/routes/feedback.js
const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
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

// @route   POST /api/feedback/:eventId
// @desc    Submit feedback for an event (must have attended)
// @access  Private
router.post('/:eventId', auth, async (req, res) => {
    try {
        const { rating, comment, categories } = req.body;
        
        // Validate rating
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
        }

        // Check if user has attended this event
        const registration = await Registration.findOne({
            event: req.params.eventId,
            user: req.user.id,
            status: { $in: ['Attended', 'Approved'] }
        });

        if (!registration) {
            return res.status(403).json({ msg: 'You must have attended this event to submit feedback' });
        }

        // Check if feedback already exists
        const existingFeedback = await Feedback.findOne({
            registration: registration._id,
            event: req.params.eventId
        });

        if (existingFeedback) {
            return res.status(400).json({ msg: 'You have already submitted feedback for this event' });
        }

        // Create feedback
        const feedback = new Feedback({
            event: req.params.eventId,
            registration: registration._id,
            rating,
            comment: comment || '',
            categories: categories || { overall: rating },
            isAnonymous: true
        });

        await feedback.save();
        
        res.json({ 
            msg: 'Feedback submitted successfully',
            feedbackId: feedback._id 
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/feedback/:eventId/check
// @desc    Check if user has submitted feedback
// @access  Private
router.get('/:eventId/check', auth, async (req, res) => {
    try {
        const registration = await Registration.findOne({
            event: req.params.eventId,
            user: req.user.id,
            status: { $in: ['Attended', 'Approved'] }
        });

        if (!registration) {
            return res.json({ canSubmit: false, hasAttended: false });
        }

        const existingFeedback = await Feedback.findOne({
            registration: registration._id,
            event: req.params.eventId
        });

        res.json({ 
            canSubmit: !existingFeedback,
            hasAttended: true,
            hasSubmitted: !!existingFeedback
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/feedback/:eventId/stats
// @desc    Get feedback statistics for an event (organizer only)
// @access  Private
router.get('/:eventId/stats', auth, async (req, res) => {
    try {
        // Check if user is organizer
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        // Get all feedback for this event
        const allFeedback = await Feedback.find({
            event: req.params.eventId,
            isHidden: false
        });

        if (allFeedback.length === 0) {
            return res.json({
                totalFeedback: 0,
                averageRating: 0,
                ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                percentageDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                categoryAverages: {},
                recentFeedbackCount: 0
            });
        }

        // Calculate statistics
        const totalFeedback = allFeedback.length;
        const totalRating = allFeedback.reduce((sum, f) => sum + f.rating, 0);
        const averageRating = (totalRating / totalFeedback).toFixed(2);

        // Rating distribution
        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        allFeedback.forEach(f => {
            ratingDistribution[f.rating]++;
        });

        // Category averages
        const categoryAverages = {};
        const categoryFields = ['organization', 'content', 'venue', 'overall'];
        
        categoryFields.forEach(cat => {
            const ratings = allFeedback
                .filter(f => f.categories && f.categories[cat])
                .map(f => f.categories[cat]);
            
            if (ratings.length > 0) {
                const avg = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
                categoryAverages[cat] = avg.toFixed(2);
            }
        });

        // Percentage breakdown
        const percentageDistribution = {};
        Object.keys(ratingDistribution).forEach(rating => {
            percentageDistribution[rating] = ((ratingDistribution[rating] / totalFeedback) * 100).toFixed(1);
        });

        res.json({
            totalFeedback,
            averageRating: parseFloat(averageRating),
            ratingDistribution,
            percentageDistribution,
            categoryAverages,
            recentFeedbackCount: allFeedback.filter(f => {
                const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
                return f.createdAt > dayAgo;
            }).length
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/feedback/:eventId/all
// @desc    Get all feedback for an event with filters (organizer only)
// @access  Private
router.get('/:eventId/all', auth, async (req, res) => {
    try {
        // Check if user is organizer
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        // Build query
        const query = { event: req.params.eventId, isHidden: false };
        
        // Filter by rating if specified
        if (req.query.rating) {
            query.rating = parseInt(req.query.rating);
        }

        // Get feedback
        let feedback = await Feedback.find(query)
            .sort({ createdAt: -1 })
            .select('rating comment categories createdAt')
            .lean();

        res.json(feedback);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/feedback/:eventId/export
// @desc    Export feedback data as CSV (organizer only)
// @access  Private
router.get('/:eventId/export', auth, async (req, res) => {
    try {
        // Check if user is organizer
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        // Get all feedback
        const feedback = await Feedback.find({
            event: req.params.eventId,
            isHidden: false
        }).sort({ createdAt: -1 });

        // Prepare CSV data
        const csvRows = [];
        csvRows.push(['Date', 'Rating', 'Comment', 'Organization', 'Content', 'Venue', 'Overall'].join(','));

        feedback.forEach(f => {
            const row = [
                new Date(f.createdAt).toLocaleDateString(),
                f.rating,
                `"${(f.comment || '').replace(/"/g, '""')}"`, // Escape quotes in comments
                f.categories?.organization || '',
                f.categories?.content || '',
                f.categories?.venue || '',
                f.categories?.overall || f.rating
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = csvRows.join('\n');
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${event.name}_feedback.csv"`);
        res.send(csvContent);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/feedback/:eventId/:feedbackId/hide
// @desc    Hide/unhide feedback (organizer only)
// @access  Private
router.put('/:eventId/:feedbackId/hide', auth, async (req, res) => {
    try {
        // Check if user is organizer
        const event = await Event.findById(req.params.eventId);
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }

        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const feedback = await Feedback.findById(req.params.feedbackId);
        if (!feedback) {
            return res.status(404).json({ msg: 'Feedback not found' });
        }

        feedback.isHidden = !feedback.isHidden;
        feedback.hiddenBy = feedback.isHidden ? req.user.id : null;
        await feedback.save();

        res.json({ isHidden: feedback.isHidden });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
