const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/user'); 
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config({ path: '../.env' }); 

const createAdmin = async () => {
    try {
        // 1. Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const adminEmail = "kris.jain@research.iiit.ac.in";
        const adminPassword = "12345678";

        // 2. Check if admin exists
        let admin = await User.findOne({ email: adminEmail });
        if (admin) {
            console.log("Admin already exists.");
            process.exit(0);
        }

        // 3. Create Admin User
        admin = new User({
            firstName: "System",
            lastName: "Admin",
            email: adminEmail,
            password: adminPassword, // Will be hashed by pre-save hook
            role: "admin",
            contactNumber: "0000000000", // Some dummy value if required
            // Admin doesn't need collegeName or participantType usually, but schema might require collegeName?
            // User schema has collegeName default 'IIIT Hyderabad', so it's fine.
        });

        await admin.save();

        console.log("Admin account created successfully!");
        console.log(`Email: ${adminEmail}`);
        console.log(`Password: ${adminPassword}`);

    } catch (err) {
        console.error("Error creating admin:", err);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

createAdmin();