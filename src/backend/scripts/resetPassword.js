// Script to manually reset a user's password
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const readline = require('readline');

// Load environment variables
dotenv.config();

// Import User model
const User = require('../models/user');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function resetPassword() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Get user email
        const email = await question('Enter the email of the user whose password you want to reset: ');
        
        // Find user
        const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
        
        if (!user) {
            console.log('❌ User not found with email:', email);
            process.exit(1);
        }

        console.log('\n📋 User found:');
        console.log('   Name:', user.firstName, user.lastName || '');
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);
        console.log('   Club:', user.organizerCategory || 'N/A');
        
        // Get new password
        const newPassword = await question('\nEnter new password (min 8 characters): ');
        
        if (newPassword.length < 8) {
            console.log('❌ Password must be at least 8 characters long');
            process.exit(1);
        }

        // Confirm
        const confirm = await question(`\n⚠️  Are you sure you want to reset the password for ${user.email}? (yes/no): `);
        
        if (confirm.toLowerCase() !== 'yes') {
            console.log('❌ Operation cancelled');
            process.exit(0);
        }

        // Update password (pre-save hook will hash it)
        user.password = newPassword;
        await user.save();

        console.log('\n✅ Password reset successfully!');
        console.log('📧 Email:', user.email);
        console.log('🔑 New Password:', newPassword);
        console.log('\n💡 You can now login with the new password.');

        process.exit(0);

    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

resetPassword();
