# assignment-1-dass

## Implemented Features

### Core Part 1 (70 Marks)
1.  **Authentication:** JWT-based login/signup for Participants. Admin-controlled Organizer creation.
2.  **Event Management:**
    *   Organizers can create **Normal Events** with custom forms.
    *   Organizers can create **Merchandise Events** with stock tracking.
    *   Edit/Delete events capabilities.
3.  **Participant Features:**
    *   Browse & Filter events.
    *   One-click registration / Custom form submission.
    *   Merchandise purchasing (variant selection & stock update).
    *   **Smart Dashboard:** View Upcoming/Past events & generated Tickets.
    *   **Profile Management:** Edit details & change password.
4.  **Admin Features:**
    *   Create Organizer accounts securely.

### Part 2: Advanced Features (Tier A - QR Scanner)
*   **Ticket Generation:** Every registration generates a unique QR Code on the "My Ticket" page.
*   **In-App Scanner:** Organizers can scan QR codes using their device camera via the dashboard.
*   **Validation:** The system validates the ticket against the database, checks for duplicates (if already scanned), and marks attendance in real-time.
*   **Attendance Tracking:** Organizers can view attendees and export the list to CSV.

### Part 2: Advanced Features (Tier A - Merchandise Logic)
*   **Stock Management:** Purchasing an item decrements stock.
*   **Out-of-Stock Protection:** Users cannot buy items with 0 stock.

## Tech Stack
*   **Frontend:** React.js, Bootstrap 5, html5-qrcode, qrcode.react
*   **Backend:** Node.js, Express, MongoDB (Mongoose)

## How to Run Local
1.  **Backend:**
    ```bash
    cd src/backend
    npm install
    # Create .env with MONGO_URI and JWT_SECRET
    node server.js
    ```
2.  **Frontend:**
    ```bash
    cd src/frontend
    npm install
    npm start
    ```