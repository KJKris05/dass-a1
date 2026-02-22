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
        enum: ['Registered', 'Pending', 'Cancelled', 'Attended', 'Rejected', 'Approved'],
        default: 'Registered'
    },
    // For Paid Events / Merchandise
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed', 'AwaitingApproval'],
        default: 'Completed' // Default to Completed for free events
    },
    // Payment proof for merchandise (image link/URL)
    paymentProof: {
        type: String // URL or drive link to payment screenshot
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
    },
    // Store QR code as base64 data URL (generated once, used everywhere)
    qrCode: {
        type: String
    },
    // Timestamp when attendance was marked
    attendedAt: {
        type: Date
    },
    // Audit log for manual overrides
    auditLog: [{
        action: String, // 'manual_mark', 'manual_unmark'
        performedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reason: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
}, { timestamps: true });

// Note: Removed unique index on {event, user} to allow multiple merchandise purchases
// Duplicate prevention is now handled in the registration route logic

module.exports = mongoose.model('Registration', registrationSchema);