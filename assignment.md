Assignment 1: Felicity Event Management System 

Course: Design & Analysis of Software Systems Deadline: 19th Feb 2026 Submission: Single ZIP file 

Part 1: Core System Implementation [70 Marks] 
1. Introduction

The Club Council manages a large number of events, clubs, and participants, often resulting in chaos due to midnight Google Forms and spreadsheets. This leads to confusion regarding registration status and payments. You are appointed to save the fest by designing a centralized platform that allows clubs to conduct events smoothly and participants to register, track, and attend them without relying on disjointed tools.
2. Technology Stack

The system must be implemented using the MERN stack:

    MongoDB: Database 

    Express.js: Backend framework implementing REST APIs 

    React: React or React-based framework for Frontend 

    Node.js: Runtime 

3. User Roles

Each user can have exactly one role. Role switching is strictly prohibited.

    3.1 Participant:

        IIIT Student 

        Non-IIIT Participant 

    3.2 Organizer: Clubs / Councils / Fest Teams 

    3.3 Admin: System-level administrator 

4. Authentication & Security [8 Marks] 

4.1 Registration & Login [3 Marks] 

    4.1.1 Participant Registration:

        IIIT Participants: Must register using IIIT-issued email ID only (email domain validation mandatory).

        Non-IIIT Participants: Must register using email and password.

    4.1.2 Organizer Authentication:

        No self-registration. Accounts are provisioned by the Admin.

        Organizers login using credentials provided by the Admin.

        Password resets must be requested and handled by the Admin.

    4.1.3 Admin Account Provisioning:

        Admin is the first user in the system.

        Credentials are provisioned by the backend only (no UI registration).

        Admin has exclusive privileges to create/remove clubs/organizers.

4.2 Security Requirements [3 Marks] 

    Passwords must be hashed using bcrypt (no plaintext storage).

    JWT-based authentication is mandatory for all protected routes.

    All frontend pages (except login/signup) must be protected with role-based access control.

4.3 Session Management [2 Marks] 

    Login must redirect the user to their respective Dashboard.

    Sessions must persist across browser restarts unless explicitly logged out.

    Logout must clear all authentication tokens.

5. User Onboarding & Preferences [3 Marks] 

After signup, participants (only) may select or skip the following preferences:

    Areas of Interest (multiple selection allowed).

    Clubs / Organizers to Follow.

Notes:

    Preferences can be set during onboarding or skipped and configured later.

    Preferences must be stored in the database and editable from the Profile page.

    Preferences must influence event ordering and recommendations.

6. User Data Models [2 Marks] 

You must add additional attributes as required and justify them in the report.

    6.1 Participant Details: First Name, Last Name, Email (unique) .

    6.2 Organizer Details: Organizer Name, Category, College/Org Name, Contact Number, Password (hashed), Description, Contact Email .

7. Event Types [2 Marks] 

    7.1 Normal Event (Individual): Single participant registration. Examples: workshops, talks, competitions.

    7.2 Merchandise Event (Individual): Used for selling merchandise (T-shirts, hoodies, kits). Individual purchase only.

8. Event Attributes [2 Marks] 

Each event must store at least:

    Event Name, Description, Type, Eligibility .

    Registration Deadline, Start Date, End Date .

    Registration Limit.

Additional Requirements by Type:

    Normal: Custom registration form (dynamic form builder), Registration Fee, Organizer ID, Event Tags .

    Merchandise: Item details (size, color, variants), stock quantity, configurable purchase limit per participant.

9. Participant Features & Navigation [22 Marks] 

    9.1 Navigation Menu [1 Mark]: Dashboard, Browse Events, Clubs/Organizers, Profile, Logout.

    9.2 My Events Dashboard [6 Marks]:

        Upcoming Events: Displays registered upcoming events with name, type, organizer, and schedule.

        Participation History: Categorized tabs (Normal, Merchandise, Completed, Cancelled/Rejected).

        Event Records: Includes name, type, organizer, status, team name, and clickable ticket ID.

    9.3 Browse Events Page [5 Marks]:

        Search: Partial & Fuzzy matching on Event/Organizer names.

        Features: Trending (Top 5 in 24h).

        Filters: Event Type, Eligibility, Date Range (works with search), Followed Clubs, All events.

    9.4 Event Details Page [2 Marks]:

        Complete details, type indication, registration/purchase button with validation.

        Blocking: Block if deadline passed or limit/stock exhausted.

    9.5 Event Registration Workflows [5 Marks]:

        Normal Event: Ticket sent via email and accessible in History upon submission.

        Merchandise: Purchase implies registration; stock decremented; QR ticket generated; confirmation email sent; out-of-stock blocked.

        Tickets & QR: Includes event/participant details, QR code, and unique Ticket ID.

    9.6 Profile Page [2 Marks]:

        Editable: Name, Contact Number, College/Org Name, Interests, Followed Clubs.

        Non-Editable: Email, Participant Type.

        Security: Password reset/change mechanism.

    9.7 Clubs/Organizers Listing Page [1 Mark]: List of approved organizers with Follow/Unfollow action.

    9.8 Organizer Detail Page (Participant View) [1 Mark]: Displays organizer info and Upcoming/Past events.

10. Organizer Features & Navigation [18 Marks] 

    10.1 Navigation Menu [1 Mark]: Dashboard, Create Event, Profile, Logout, Ongoing Events.

    10.2 Organizer Dashboard [3 Marks]:

        Events Carousel: Cards showing Name, Type, Status (Draft/Published/Ongoing/Closed) with links to manage them.

        Event Analytics: Stats on registrations, sales, revenue, and attendance for completed events.

    10.3 Event Detail Page (Organizer View) [4 Marks]:

        Overview, Analytics (Registrations, Sales, Attendance, Revenue).

        Participants List: Searchable/Filterable list with export to CSV.

    10.4 Event Creation & Editing [4 Marks]:

        Flow: Create (Draft) → Define Fields → Publish.

        Editing Rules:

            Draft: Free edits.

            Published: Can update description, extend deadline, increase limit, close registrations.

            Ongoing/Completed: No edits except status change.

        Form Builder: Custom forms (text, dropdown, file, etc.) with required/flexible options. Locked after first registration .

    10.5 Organizer Profile Page [4 Marks]:

        Editable details (Login email non-editable).

        Discord Webhook: Auto-post new events to Discord.

11. Admin Features & Navigation [6 Marks] 

    11.1 Navigation Menu [1 Mark]: Dashboard, Manage Clubs/Organizers, Password Reset Requests, Logout.

    11.2 Club/Organizer Management [5 Marks]:

        Add: Create accounts; system auto-generates credentials; new accounts can login immediately.

        Remove: View list; remove/disable accounts (prevents login); archive/delete options.

12. Deployment [5 Marks] 

    Frontend: Deploy to static hosting (e.g., Vercel, Netlify).

    Backend: Deploy to managed Node hosting (e.g., Render, Railway, Fly, Heroku).

    Database: MongoDB Atlas.

    Submission: Include deployment.txt with URLs.

Part 2: Advanced Features [30 Marks] 

Instructions: Clearly mention in your README.md which features you have implemented along with justification.

13.1 Tier A: Core Advanced Features (Choose 2) [8 Marks] 

    Hackathon Team Registration: Team leader creates team, invites members via code/link. Registration complete only when fully formed. Includes team dashboard and auto-ticket generation .

    Merchandise Payment Approval Workflow: Users upload payment proof. Orders enter "Pending Approval". Organizers approve/reject based on proof. Approval generates ticket and decrements stock .

    QR Scanner & Attendance Tracking: Built-in scanner for organizers to validate tickets. Features: Timestamped attendance, duplicate rejection, live dashboard, CSV export, and manual override with audit logging .

13.2 Tier B: Real-time & Communication (Choose 2) [6 Marks] 

    Real-Time Discussion Forum: Forum on Event Details page for participant interaction. Organizers can moderate. Includes notifications, threading, and reactions .

    Organizer Password Reset Workflow: Organizers request reset; Admin views details and approves/rejects. System auto-generates new password upon approval. Includes status tracking .

    Team Chat: Real-time chat for hackathon teams (Requires Tier A Feature 1). Includes message history, online status, typing indicators, notifications, and file sharing .

13.3 Tier C: Integration & Enhancement (Choose 1) [2 Marks] 

    Anonymous Feedback System: Participants submit star rating (1-5) and comments. Organizers view aggregated stats and can export data .

    Add to Calendar Integration: Export events to external calendars (Google, Outlook, .ics files). Supports timezone handling and batch export .

    Bot Protection: CAPTCHA verification (reCAPTCHA/hCaptcha) on login/register. Includes rate limiting, IP blocking, and security monitoring dashboard .

Deliverables 

Submit a single ZIP file with the following structure :

<roll_no>/
|-- backend/
|-- frontend/
|-- README.md
|-- deployment.txt

Submission of a corrupt ZIP file will result in 0 marks.

Instructions & Policies 

    Plagiarism Policy: All submissions checked via software. Copying results in 0 marks.

    Evaluation: You must explain your code during evaluation. Inability to explain results in 0 marks .