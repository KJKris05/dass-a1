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
- **web-vitals** (^2.1.4) - Performance metrics tracking

### Testing Libraries
- **@testing-library/react** (^16.3.2) - React component testing utilities
- **@testing-library/jest-dom** (^6.9.1) - Custom Jest matchers for DOM
- **@testing-library/user-event** (^13.5.0) - User interaction simulation
- **@testing-library/dom** (^10.4.1) - DOM testing utilities

### Database
- **MongoDB Atlas** - Cloud-hosted NoSQL database

### Deployment Platforms
- **Vercel** - Frontend hosting (Static site hosting)
- **Render** - Backend hosting (Node.js web service)

## How to Run Local
1.  **Backend:**
    ```bash
    cd src/backend
    npm install
    npx nodemon server.js
    ```
2.  **Frontend:**
    ```bash
    cd src/frontend
    npm install
    npm start
    ```
## Features Implemented

1.  **Tasks Selected:**
    ```bash
    'Tier A':
    i) Merchandise Payment Approval Workflow
    ii) QR Scanner and Attendance Tracking

    'Tier B':
    i) Real-time Discussion Forum
    ii) Organizer Password Reset Workflow

    'Tier C':
    i) Anonymous Feedback System
    ```
## Clarifications

1. **Trending Tasks:**
    Sorted by most number of registrations in the last 24 hours.

2. Login token expiry is 5 days.

3. **Admin Account**: Create using the `src/backend/scripts/createAdmin.js` script for local testing.

4. **Test Data**: The system includes seed scripts for creating test organizers and events in the `src/backend/scripts/` directory.