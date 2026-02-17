// backend/models/Registration.js
const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Registered', 'Pending', 'Cancelled', 'Attended', 'Rejected'],
        default: 'Registered'
    },
    // For Paid Events / Merchandise
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Completed' // Default to Completed for free events
    },
    // For Normal Events: Answers to the custom form questions
    formResponses: [{
        questionLabel: String,
        answer: mongoose.Schema.Types.Mixed // Can be String, Number, etc.
    }],
    // Unique Ticket ID (Useful for QR Codes later)
    ticketId: {
        type: String,
        unique: true,
        required: true,
        default: () => new mongoose.Types.ObjectId().toString() // Auto-generate simple ID
    }
}, { timestamps: true });

// Ensure a user cannot register for the same event twice!
registrationSchema.index({ event: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Registration', registrationSchema);