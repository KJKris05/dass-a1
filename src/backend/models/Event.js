// backend/models/Event.js
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    // --- Basic Details (Required for All) ---
    name: {
        type: String,
        required: [true, "Event name is required"],
        trim: true
    },
    description: {
        type: String,
        required: [true, "Description is required"]
    },
    eventType: {
        type: String,
        enum: ['Normal', 'Merchandise'], // [cite: 71]
        required: true
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Link to the Organizer who created it
        required: true
    },
    status: {
        type: String,
        enum: ['Draft', 'Published', 'Ongoing', 'Completed', 'Cancelled'],
        default: 'Draft' // [cite: 124]
    },

    // --- Date & Limits ---
    registrationDeadline: {
        type: Date,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    registrationLimit: {
        type: Number,
        default: 1000 // Maximum participants/items
    },
    registrationFee: {
        type: Number,
        default: 0 // 0 = Free event
    },
    eligibility: {
        type: String,
        enum: ['IIIT Only', 'Open to All'], // [cite: 81]
        default: 'Open to All'
    },

    // --- NORMAL EVENT SPECIFIC: Custom Form Builder  ---
    // Organizers can define what questions to ask participants
    formFields: [{
        label: String, // e.g., "T-Shirt Size" or "GitHub Profile"
        fieldType: {
            type: String,
            enum: ['text', 'number', 'dropdown', 'file']
        },
        options: [String], // Only for 'dropdown' (e.g., ["S", "M", "L"])
        required: {
            type: Boolean,
            default: false
        }
    }],

    // --- MERCHANDISE SPECIFIC: Inventory Management  ---
    merchandiseVariants: [{
        name: String, // e.g., "Hoodie - Black - XL"
        price: Number,
        stock: Number, // Decrements on purchase
        maxPerUser: {
            type: Number,
            default: 1
        }
    }]

}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);