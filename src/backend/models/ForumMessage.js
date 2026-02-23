// backend/models/ForumMessage.js
const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    emoji: {
        type: String,
        required: true
    }
}, { timestamps: true });

const forumMessageSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    messageType: {
        type: String,
        enum: ['message', 'announcement', 'question'],
        default: 'message'
    },
    // Threading support
    parentMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ForumMessage',
        default: null
    },
    // Moderation
    isPinned: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deletedAt: {
        type: Date
    },
    // Reactions
    reactions: [reactionSchema],
    // Edit history
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    }
}, { timestamps: true });

// Index for faster queries
forumMessageSchema.index({ event: 1, createdAt: -1 });
forumMessageSchema.index({ event: 1, parentMessage: 1 });

module.exports = mongoose.model('ForumMessage', forumMessageSchema);
