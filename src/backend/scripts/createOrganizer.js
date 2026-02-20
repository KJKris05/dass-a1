const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/user'); // Adjust path to your User model

// Load environment variables
dotenv.config({ path: '../.env' }); // Adjust path to .env if needed (usually in root of backend)

const createOrganizer = async () => {
    try {
        // 1. Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        // 2. Define the Organizer Data
        // You can change these details to create different organizers
        const organizerData = {
            firstName: "Coding",
            lastName: "Club",
            email: "coding.club@iiit.ac.in",
            password: "securepassword123", // Will be hashed by pre-save hook
            role: "organizer",
            contactNumber: "1234567890",
            collegeName: "IIIT Hyderabad",
            organizerCategory: "Technical", // specific to organizer
            description: "The official coding club of IIIT Hyderabad.",
            website: "https://coding.iiit.ac.in"
        };

        // 3. Check if exists
        const existingUser = await User.findOne({ email: organizerData.email });
        if (existingUser) {
            console.log("User already exists with this email.");
            process.exit(0);
        }

        // 4. Create User
        const user = new User(organizerData);
        await user.save();

        console.log("Organizer created successfully!");
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);

    } catch (err) {
        console.error("Error creating organizer:", err);
    } finally {
        // 5. Close Connection
        await mongoose.connection.close();
        process.exit(0);
    }
};

createOrganizer();