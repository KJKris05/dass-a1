# requirements.md

## Functional Requirements Status

### 1. User Authentication & Profiles
- [x] **User Registration:** Allow users to sign up as Participant, Organizer, or Admin.
- [x] **Login System:** Secure login with JWT token issuance.
- [x] **Role Detection:** Auto-detect IIIT IIIT vs External students based on email domain.
- [x] **Profile Data:** Store specific fields for Organizers (Category, Description) vs Participants.
- [ ] **Edit Profile:** Allow users to update their details/password.
- [ ] **Forgot Password:** Email-based password reset flow.

### 2. Event Management (Organizer)
- [x] **Create Normal Event:** Create workshops/talks with basic details (Name, Desc, Dates).
- [x] **Create Merchandise Event:** Create sales events with prices and stock limits.
- [x] **Form Builder:** Ability to add custom questions (Text, Dropdown, File) to an event registration.
- [x] **Merchandise Variants:** Ability to add sizes/colors with specific stock counts.
- [x] **Publishing Workflow:** Draft vs Published status (Currently auto-publishes).
- [x] **My Events Dashboard:** View list of events created by the logged-in organizer.
- [ ] **Edit/Delete Event:** Ability to modify an event after creation.
- [ ] **View Attendees:** See a list of users who registered for a specific event.

### 3. Event Discovery (Participant)
- [x] **Browse Events:** Publicly accessible list of all active events.
- [x] **Search:** Search events by name or tags.
- [x] **Filter:** Filter events by Type (Normal/Merch) or Eligibility.
- [x] **Event Details:** Dedicated page showing full description, schedule, and pricing.

### 4. Registration & Transactions
- [x] **One-Click Registration:** For simple events without custom forms.
- [x] **Custom Form Submission:** Participants must answer organizer questions to register.
- [x] **Merchandise Purchase:** specific logic to select a variant (e.g., Size L) and "buy".
- [x] **Validation:**
    - [x] Check Registration Deadline.
    - [x] Check Seat Limits/Stock.
    - [x] Check Duplicate Registration.
    - [x] Check End Date vs Start Date validity.
- [ ] **Payment Integration:** Integration with a real Payment Gateway (Razorpay/Stripe).
- [ ] **Team Registration:** Logic for registering a team (Leader + Members) for competitions.

### 5. Dashboards & Analytics
- [x] **Organizer Dashboard:** View created events.
- [ ] **Organizer Analytics:** Charts showing registration trends over time.
- [ ] **Participant Dashboard:** View "My Registrations" (Backend route exists, Frontend UI is static).
- [ ] **Admin Dashboard:** Approve/Reject Organizer accounts or Flag inappropriate events.

### 6. Miscellaneous / Tier A Features
- [x] **Email Notifications:** (Basic confirmation simulated)
- [x] **QR Code Generation:** Each ticket has a unique QR based on ticketId.
- [x] **In-App Scanner:** Organizers can scan QR codes to validate entry.
- [x] **Attendance Tracking:** System marks attendees as "Attended" and prevents duplicate scans.
- [x] **Stock Management:** Merchandise events handle stock decrement/validation.
