# assignment-1-dass

## Deployment URLs
- **Frontend**: https://dass-a1-kjkris05s-projects.vercel.app
- **Backend**: https://dass-a1-uj7n.onrender.com

## Technologies & Libraries Used

### Backend
- **express** (^5.2.1) - Web application framework for Node.js
- **mongoose** (^9.1.6) - MongoDB object modeling tool
- **bcryptjs** (^3.0.3) - Password hashing library
- **jsonwebtoken** (^9.0.3) - JWT token generation and verification
- **cors** (^2.8.6) - Cross-Origin Resource Sharing middleware
- **dotenv** (^17.2.4) - Environment variable management
- **nodemailer** (^6.9.7) - Email sending service
- **qrcode** (^1.5.3) - QR code generation for tickets
- **nodemon** (^3.1.11) - Development server with auto-restart

### Frontend
- **react** (^19.2.4) - JavaScript library for building user interfaces
- **react-dom** (^19.2.4) - React package for working with the DOM
- **react-router-dom** (^7.13.0) - Client-side routing for React
- **axios** (^1.13.5) - HTTP client for API requests
- **bootstrap** (^5.3.8) - CSS framework for responsive design
- **jwt-decode** (^4.0.0) - JWT token decoding
- **html5-qrcode** (^2.3.8) - QR code scanner for attendance tracking
- **qrcode.react** (^4.2.0) - QR code rendering component
- **react-scripts** (5.0.1) - Create React App build scripts

### Database
- **MongoDB Atlas** - Cloud-hosted NoSQL database

### Deployment Platforms
- **Vercel** - Frontend hosting (Static site hosting)
- **Render** - Backend hosting (Node.js web service)

## How to Run Local

### Backend Setup
1. Create `.env` file in `src/backend/` directory with the following keys:
   ```env
   MONGO_URI
   JWT_SECRET
   PORT=5000
   FRONTEND_URL
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER
   EMAIL_PASSWORD
   EMAIL_FROM_NAME
   ```

2. Install dependencies and start server:
   ```bash
   cd src/backend
   npm install
   npx nodemon server.js
   ```

### Frontend Setup
1. Create `.env` file in `src/frontend/` directory:
   ```env
   REACT_APP_API_URL
   ```

2. Install dependencies and start development server:
   ```bash
   cd src/frontend
   npm install
   npm start
   ```

### Optional: Create Admin Account
```bash
cd src/backend
node scripts/createAdmin.js
```
## Features Implemented

1.  **Tasks Selected:**
    ```bash
    'Tier A':
    i) Merchandise Payment Approval Workflow - Due to the existence of merch events, it is necessary to approve someone only if they have paid. 

    ii) QR Scanner and Attendance Tracking - So as to keep track of the number of people who have attended, a smoother process for organisers to keep track of who have attended and better analytics for each event.

    'Tier B':
    i) Real-time Discussion Forum - To allow participants and organisers to discuss the details, and for organisers to post announcements instead of depending on mail.

    ii) Organizer Password Reset Workflow - Self-explanatory, if an organiser wants to change password for security reasons, they should have the option.

    'Tier C':
    i) Anonymous Feedback System - To help organisers better understand the participants view, and so that they can host better events in the future. Kept anonymous so that everyone can give their opinion freely. 
    ```

## Clarifications

1. **Trending Tasks:**
    Sorted by most number of registrations in the last 24 hours.

2. Login token expiry is 5 days.

3. **Admin Account**: Create using the `src/backend/scripts/createAdmin.js` script for local testing.

4. **Test Data**: The system includes seed scripts for creating test organizers and events in the `src/backend/scripts/` directory.