// backend/routes/forum.js
const express = require('express');
const router = express.Router();
const ForumMessage = require('../models/ForumMessage');
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

// Helper function to check if user is registered or is organizer
const checkAccess = async (userId, eventId) => {
    const event = await Event.findById(eventId);
    if (!event) return { hasAccess: false, isOrganizer: false };
    
    const isOrganizer = event.organizer.toString() === userId.toString();
    const registration = await Registration.findOne({ 
        event: eventId, 
        user: userId,
        status: { $in: ['Registered', 'Approved', 'Attended'] }
    });
    
    return {
        hasAccess: isOrganizer || !!registration,
        isOrganizer
    };
};

// @route   GET /api/forum/:eventId
// @desc    Get all messages for an event
// @access  Private (registered users + organizer)
router.get('/:eventId', auth, async (req, res) => {
    try {
        const { hasAccess } = await checkAccess(req.user.id, req.params.eventId);
        if (!hasAccess) {
            return res.status(403).json({ msg: 'Access denied. You must be registered for this event.' });
        }

        const messages = await ForumMessage.find({
            event: req.params.eventId,
            isDeleted: false,
            parentMessage: null // Only get top-level messages
        })
        .populate('author', 'firstName lastName email role')
        .populate({
            path: 'reactions.user',
            select: 'firstName lastName'
        })
        .sort({ isPinned: -1, createdAt: -1 })
        .lean();

        // Get reply counts for each message
        const messagesWithReplies = await Promise.all(messages.map(async (msg) => {
            const replyCount = await ForumMessage.countDocuments({
                parentMessage: msg._id,
                isDeleted: false
            });
            return { ...msg, replyCount };
        }));

        res.json(messagesWithReplies);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/forum/:eventId/replies/:messageId
// @desc    Get replies for a specific message
// @access  Private
router.get('/:eventId/replies/:messageId', auth, async (req, res) => {
    try {
        const { hasAccess } = await checkAccess(req.user.id, req.params.eventId);
        if (!hasAccess) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const replies = await ForumMessage.find({
            parentMessage: req.params.messageId,
            isDeleted: false
        })
        .populate('author', 'firstName lastName email role')
        .populate({
            path: 'reactions.user',
            select: 'firstName lastName'
        })
        .sort({ createdAt: 1 });

        res.json(replies);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/forum/:eventId
// @desc    Create a new message
// @access  Private
router.post('/:eventId', auth, async (req, res) => {
    try {
        const { hasAccess, isOrganizer } = await checkAccess(req.user.id, req.params.eventId);
        if (!hasAccess) {
            return res.status(403).json({ msg: 'Access denied. You must be registered for this event.' });
        }

        const { content, messageType, parentMessage } = req.body;

        if (!content || content.trim().length === 0) {
            return res.status(400).json({ msg: 'Message content is required' });
        }

        // Only organizers can post announcements
        if (messageType === 'announcement' && !isOrganizer) {
            return res.status(403).json({ msg: 'Only organizers can post announcements' });
        }

        const newMessage = new ForumMessage({
            event: req.params.eventId,
            author: req.user.id,
            content: content.trim(),
            messageType: messageType || 'message',
            parentMessage: parentMessage || null
        });

        await newMessage.save();
        await newMessage.populate('author', 'firstName lastName email role');

        res.json(newMessage);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/forum/:eventId/:messageId
// @desc    Edit a message
// @access  Private (author only)
router.put('/:eventId/:messageId', auth, async (req, res) => {
    try {
        const message = await ForumMessage.findById(req.params.messageId);
        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        // Only author can edit
        if (message.author.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        const { content } = req.body;
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ msg: 'Message content is required' });
        }

        message.content = content.trim();
        message.isEdited = true;
        message.editedAt = Date.now();

        await message.save();
        await message.populate('author', 'firstName lastName email role');

        res.json(message);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   DELETE /api/forum/:eventId/:messageId
// @desc    Delete a message (soft delete)
// @access  Private (author or organizer)
router.delete('/:eventId/:messageId', auth, async (req, res) => {
    try {
        const { isOrganizer } = await checkAccess(req.user.id, req.params.eventId);
        const message = await ForumMessage.findById(req.params.messageId);
        
        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        // Author or organizer can delete
        const isAuthor = message.author.toString() === req.user.id;
        if (!isAuthor && !isOrganizer) {
            return res.status(403).json({ msg: 'Not authorized' });
        }

        message.isDeleted = true;
        message.deletedBy = req.user.id;
        message.deletedAt = Date.now();

        await message.save();
        res.json({ msg: 'Message deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   PUT /api/forum/:eventId/:messageId/pin
// @desc    Pin/unpin a message
// @access  Private (organizer only)
router.put('/:eventId/:messageId/pin', auth, async (req, res) => {
    try {
        const { isOrganizer } = await checkAccess(req.user.id, req.params.eventId);
        if (!isOrganizer) {
            return res.status(403).json({ msg: 'Only organizers can pin messages' });
        }

        const message = await ForumMessage.findById(req.params.messageId);
        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        message.isPinned = !message.isPinned;
        await message.save();

        res.json({ isPinned: message.isPinned });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   POST /api/forum/:eventId/:messageId/react
// @desc    Add/remove reaction to a message
// @access  Private
router.post('/:eventId/:messageId/react', auth, async (req, res) => {
    try {
        const { hasAccess } = await checkAccess(req.user.id, req.params.eventId);
        if (!hasAccess) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        const { emoji } = req.body;
        if (!emoji) {
            return res.status(400).json({ msg: 'Emoji is required' });
        }

        const message = await ForumMessage.findById(req.params.messageId);
        if (!message) {
            return res.status(404).json({ msg: 'Message not found' });
        }

        // Check if user already reacted with this emoji
        const existingReaction = message.reactions.find(
            r => r.user.toString() === req.user.id && r.emoji === emoji
        );

        if (existingReaction) {
            // Remove reaction
            message.reactions = message.reactions.filter(
                r => !(r.user.toString() === req.user.id && r.emoji === emoji)
            );
        } else {
            // Add reaction
            message.reactions.push({
                user: req.user.id,
                emoji
            });
        }

        await message.save();
        await message.populate('reactions.user', 'firstName lastName');

        res.json(message.reactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

// @route   GET /api/forum/:eventId/unread-count
// @desc    Get unread message count for user
// @access  Private
router.get('/:eventId/unread-count', auth, async (req, res) => {
    try {
        const { hasAccess } = await checkAccess(req.user.id, req.params.eventId);
        if (!hasAccess) {
            return res.status(403).json({ msg: 'Access denied' });
        }

        // Get user's last visit time (you might want to store this in a separate collection)
        // For now, we'll just return the count of messages from last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        
        const count = await ForumMessage.countDocuments({
            event: req.params.eventId,
            isDeleted: false,
            createdAt: { $gt: oneDayAgo },
            author: { $ne: req.user.id }
        });

        res.json({ count });
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Server error' });
    }
});

module.exports = router;
