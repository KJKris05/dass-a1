// backend/routes/passwordReset.js
const express = require('express');
const router = express.Router();
const PasswordResetRequest = require('../models/PasswordResetRequest');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
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

// @route   POST /api/password-reset/request
// @desc    Organizer requests password reset
// @access  Private (Organizer only)
router.post('/request', auth, async (req, res) => {
    try {
        const { reason } = req.body;

        if (!reason || !reason.trim()) {
            return res.status(400).json({ msg: 'Reason is required' });
        }

        // Check if user is an organizer
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'organizer') {
            return res.status(403).json({ msg: 'Access denied. Only organizers can request password reset.' });
        }

        // Check if there's already a pending request
        const existingRequest = await PasswordResetRequest.findOne({
            organizer: req.user.id,
            status: 'Pending'
        });

        if (existingRequest) {
            return res.status(400).json({ msg: 'You already have a pending password reset request.' });
        }

        // Create new request
        const resetRequest = new PasswordResetRequest({
            organizer: req.user.id,
            clubName: user.organizerCategory || 'Unknown Club',
            reason: reason.trim()
        });

        await resetRequest.save();

        res.json({ 
            msg: 'Password reset request submitted successfully. Admin will review your request.',
            request: resetRequest
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/password-reset/my-requests
// @desc    Get all password reset requests for logged-in organizer
// @access  Private (Organizer only)
router.get('/my-requests', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'organizer') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const requests = await PasswordResetRequest.find({ organizer: req.user.id })
            .populate('approvedBy', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/password-reset/all
// @desc    Get all password reset requests (Admin only)
// @access  Private (Admin only)
router.get('/all', auth, async (req, res) => {
    try {
        // Check if user is admin
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        const requests = await PasswordResetRequest.find()
            .populate('organizer', 'firstName lastName email organizerCategory')
            .populate('approvedBy', 'firstName lastName')
            .sort({ createdAt: -1 });

        res.json(requests);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/password-reset/:id/approve
// @desc    Approve password reset request and generate new password
// @access  Private (Admin only)
router.put('/:id/approve', auth, async (req, res) => {
    try {
        const { adminComment } = req.body;

        // Check if user is admin
        const admin = await User.findById(req.user.id);
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        const resetRequest = await PasswordResetRequest.findById(req.params.id)
            .populate('organizer');

        if (!resetRequest) {
            return res.status(404).json({ msg: 'Reset request not found' });
        }

        if (resetRequest.status !== 'Pending') {
            return res.status(400).json({ msg: 'This request has already been processed.' });
        }

        // Generate new random password (12 characters: 8 lowercase + 4 uppercase)
        const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

        console.log('🔐 Generated new password for:', resetRequest.organizer.email);
        console.log('🔐 Password length:', newPassword.length);

        // Update the organizer's password (let the pre-save hook handle hashing)
        const organizer = await User.findById(resetRequest.organizer._id).select('+password');
        if (!organizer) {
            return res.status(404).json({ msg: 'Organizer not found' });
        }
        
        organizer.password = newPassword; // Store plain password, pre-save hook will hash it
        await organizer.save();
        
        console.log('✅ Password updated successfully for:', organizer.email);

        // Update reset request
        resetRequest.status = 'Approved';
        resetRequest.adminComment = adminComment || 'Request approved';
        resetRequest.newPassword = newPassword; // Store plain password temporarily for admin to view
        resetRequest.approvedBy = req.user.id;
        resetRequest.approvedAt = new Date();
        await resetRequest.save();

        res.json({ 
            msg: 'Password reset approved successfully',
            newPassword: newPassword,
            organizerEmail: organizer.email,
            organizerName: `${organizer.firstName} ${organizer.lastName}`,
            clubName: resetRequest.clubName
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/password-reset/:id/reject
// @desc    Reject password reset request
// @access  Private (Admin only)
router.put('/:id/reject', auth, async (req, res) => {
    try {
        const { adminComment } = req.body;

        if (!adminComment || !adminComment.trim()) {
            return res.status(400).json({ msg: 'Please provide a reason for rejection' });
        }

        // Check if user is admin
        const admin = await User.findById(req.user.id);
        if (!admin || admin.role !== 'admin') {
            return res.status(403).json({ msg: 'Access denied. Admin only.' });
        }

        const resetRequest = await PasswordResetRequest.findById(req.params.id);

        if (!resetRequest) {
            return res.status(404).json({ msg: 'Reset request not found' });
        }

        if (resetRequest.status !== 'Pending') {
            return res.status(400).json({ msg: 'This request has already been processed.' });
        }

        // Update reset request
        resetRequest.status = 'Rejected';
        resetRequest.adminComment = adminComment.trim();
        resetRequest.rejectedAt = new Date();
        await resetRequest.save();

        res.json({ 
            msg: 'Password reset request rejected',
            request: resetRequest
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
