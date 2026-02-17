# summary.md

## Project: Felicity Event Management System (IIIT Hyderabad)
**Stack:** MERN (MongoDB, Express.js, React.js, Node.js)

### 🚀 Overview
A full-stack web application designed to manage college events, including workshops, talks, and merchandise sales. The system handles user authentication, role-based access control (RBAC), dynamic event creation, and participant registration.

### 📂 Backend Architecture (Node/Express)
* **Authentication:**
    * `JWT` based stateless authentication.
    * `bcryptjs` for password hashing.
    * Role-based middleware (`verifyOrganizer`, `auth`) to protect routes.
* **Database Models (Mongoose):**
    * **User:** Handles 3 roles (Participant, Organizer, Admin). Automatically detects IIIT students based on email domain.
    * **Event:** flexible schema handling two distinct types:
        * *Normal:* Supports custom form builder (dynamic questions).
        * *Merchandise:* Supports inventory management (variants, stock).
    * **Registration:** Links Users to Events. Handles duplicate checks, seat limits, and stores answers to custom forms.
* **API Routes:**
    * `/api/auth`: Register (with role selection), Login.
    * `/api/events`: Create (Organizer), View All (Public), View My Created (Organizer).
    * `/api/registrations`: Register for event, Buy Merch, Get My Registrations.

### 💻 Frontend Architecture (React)
* **Routing:** `react-router-dom` v6 for navigation.
* **State Management:** `useState`, `useEffect` for local state; `jwt-decode` for user session handling.
* **Styling:** Bootstrap 5 for responsive layout.
* **Key Components:**
    * **Auth:** Login & Register pages with dynamic fields based on selected Role.
    * **Dashboard:** "Smart Dashboard" that renders different views (Participant vs Organizer) based on the token.
    * **Create Event:** A complex multi-step form supporting:
        * Date/Time splitting and recombination.
        * Dynamic addition of form questions (for Workshops).
        * Dynamic addition of inventory variants (for Merch).
    * **Event Browser:** List view with client-side searching and filtering (by Type and Name/Tags).
    * **Event Details:** Displays event info and renders the correct action (Registration Form vs Merchandise Buy Button).

### 🔧 Key Features Implemented
1.  **Dynamic Role Switching:** The UI adapts instantly between Participant and Organizer views.
2.  **Custom Form Builder:** Organizers can define "T-Shirt Size" or "GitHub ID" requirements for their specific event.
3.  **Inventory Tracking:** Merchandise events track stock levels (though decrement logic is simulated for now).
4.  **Security:** Inputs are validated, passwords hashed, and sensitive routes protected by token verification.