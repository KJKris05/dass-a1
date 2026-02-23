// backend/models/Feedback.js
const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
        index: true
    },
    registration: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Registration',
        required: true
    },
    // Anonymous - we don't store direct user reference for privacy
    // But we link to registration to prevent duplicate feedback
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    isAnonymous: {
        type: Boolean,
        default: true
    },
    // Optional: Categories for feedback
    categories: {
        organization: Number, // 1-5
        content: Number,      // 1-5
        venue: Number,        // 1-5
        overall: Number       // 1-5 (same as rating)
    },
    // For moderation
    isHidden: {
        type: Boolean,
        default: false
    },
    hiddenBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

// Index to prevent duplicate feedback from same registration
feedbackSchema.index({ registration: 1, event: 1 }, { unique: true });

// Index for efficient queries
feedbackSchema.index({ event: 1, rating: 1 });
feedbackSchema.index({ event: 1, createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
