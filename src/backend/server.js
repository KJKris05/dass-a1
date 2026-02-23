// backend/server.js

// Import necessary libraries
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// loading env variables from .env file
dotenv.config();

// creating an express app
const app = express();
const PORT = process.env.PORT || 5000;

// middleware
app.use(cors());            // allows frontend to talk to backend
app.use(express.json());    // allows parsing of JSON bodies

// connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected to MongoDB.");
    })
    .catch((err) => {
        console.error("Error connecting to MongoDB:", err);
    });

// Routes
app.get('/', (req, res) => {    // req is the request object, res is the response object
    res.send('Feliciy Event Management App is running!');
})

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

const eventRoutes = require('./routes/events');
app.use('/api/events', eventRoutes);

const registrationRoutes = require('./routes/registrations');
app.use('/api/registrations', registrationRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

const passwordResetRoutes = require('./routes/passwordReset');
app.use('/api/password-reset', passwordResetRoutes);

const clubsRoutes = require('./routes/clubs');
app.use('/api/clubs', clubsRoutes);

const forumRoutes = require('./routes/forum');
app.use('/api/forum', forumRoutes);

const feedbackRoutes = require('./routes/feedback');
app.use('/api/feedback', feedbackRoutes);

// start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
})