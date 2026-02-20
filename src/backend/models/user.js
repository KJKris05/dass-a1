// backend/models/user.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // for password hashing

const userSchema = new mongoose.Schema({
    // Common Fields
    firstName : {
        type: String, // Organizer's Name or Clun Name 
        required: true,
        trim: true
    },
    // lastName only for non-organizers
    lastName : {
        type: String,
        trim: true
    },
    email : {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        lowercase: true,
        trim: true,
        // Layer 1: Validate email address
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            "Please fill a valid email address"
        ],
    },
    password : {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters long"],
        select: false
        // to be stored in hashed format
    },
    role : {
        type: String,
        enum: ['admin', 'organizer', 'participant'],
        default: 'participant'
    },
    accountStatus: {
        type: String,
        enum: ['active', 'disabled', 'archived'],
        default: 'active'
    },
    contactNumber: {
        type: String,
        required: function() { return this.role === 'participant'; } 
    },
    // Participant-specific fields
    // to be populated only if role is participant
    participantType : {
        type: String,
        enum: ['IIIT', 'External']
        // to be detected by pre-save hook based on email domain
    },
    interests: [{
        type: String // Area of Interest [cite: 49]
    }],
    followedClubs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // References the Organizer's User ID [cite: 51]
    }],
    collegeName: {
        type: String,
        default: 'IIIT Hyderabad' // Default for IIIT students, editable for others
    },
    // organizer-specific fields
    // to be populated only if role is organizer
    organizerCategory: {
        type: String,

    },
    description: {
        type: String,
    }, 
    website: {
        type: String
    }
}, { timestamps: true });

// Middleware

userSchema.pre('save', async function() {
    console.log("Pre-save hook triggered for user:", this.email);
    
    // Participant Type Automation
    if (this.role === 'participant') {
        const iiitDomains = ['@students.iiit.ac.in', 'students.iiit.ac.in', '@research.iiit.ac.in', 'research.iiit.ac.in', '@iiit.ac.in', 'iiit.ac.in'];
        const isIIIT = iiitDomains.some(domain => this.email.endsWith(domain));
        
        if (isIIIT) {
            this.participantType = 'IIIT';
            this.collegeName = 'IIIT Hyderabad';
        } else {
            this.participantType = 'External';
        }
    } else {
        this.participantType = undefined;
    }

    // Password Hashing - Only if password is modified
    if (!this.isModified('password')) return;
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } catch (err) {
        throw new Error(err);
    }
});

// Compare Password for Login
userSchema.methods.comparePassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);