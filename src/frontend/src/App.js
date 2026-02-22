import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import CreateEvent from './pages/CreateEvent';
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import EventAttendees from './pages/EventAttendees';
import EditEvent from './pages/EditEvent';
import Ticket from './pages/Ticket'; // New Import
import Profile from './pages/Profile'; 
import AdminOrganizers from './pages/AdminOrganizers'; // Import Admin Page
import PaymentApprovals from './pages/PaymentApprovals'; // Import Payment Approvals
import TicketScanner from './pages/TicketScanner'; // Import QR Scanner
import PasswordResetRequest from './pages/PasswordResetRequest'; // Import Password Reset Request
import ManagePasswordResets from './pages/ManagePasswordResets'; // Import Admin Password Reset Management
import FollowClubs from './pages/FollowClubs'; // Import Follow Clubs

import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';

// Create a custom event for auth changes
const AUTH_CHANGE_EVENT = 'authChange';

// Helper function to trigger auth update
export const triggerAuthUpdate = () => {
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
};

const Navbar = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const navigate = useNavigate();

  // Listen for auth changes
  useEffect(() => {
    const handleAuthChange = () => {
      setToken(localStorage.getItem('token'));
      setRole(localStorage.getItem('role'));
    };

    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    
    // Also check localStorage periodically (fallback)
    const interval = setInterval(() => {
      const currentToken = localStorage.getItem('token');
      const currentRole = localStorage.getItem('role');
      if (currentToken !== token || currentRole !== role) {
        setToken(currentToken);
        setRole(currentRole);
      }
    }, 500);

    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
      clearInterval(interval);
    };
  }, [token, role]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    setToken(null);
    setRole(null);
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div className="container">
        <Link className="navbar-brand" to="/">Felicity IIIT</Link>
        <div className="collapse navbar-collapse">
          <ul className="navbar-nav ms-auto">
            {!token ? (
              <>
                <li className="nav-item"><Link className="nav-link" to="/login">Login</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/register">Register</Link></li>
              </>
            ) : (
              <>
                <li className="nav-item"><Link className="nav-link" to="/dashboard">Dashboard</Link></li>
                <li className="nav-item"><Link className="nav-link" to="/events">Browse Events</Link></li>
                {role === 'participant' && <li className="nav-item"><Link className="nav-link" to="/follow-clubs">Follow Clubs</Link></li>}
                <li className="nav-item"><Link className="nav-link" to="/profile">Profile</Link></li>
                {role === 'admin' && <li className="nav-item"><Link className="nav-link" to="/admin/organizers">Admin</Link></li>}
                <li className="nav-item"><button className="btn btn-link nav-link" onClick={handleLogout} style={{textDecoration: 'none'}}>Logout</button></li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
};

const Home = () => <div className="container text-center"><h1>Welcome to Felicity</h1></div>;

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-event" element={<CreateEvent />} />
        <Route path="/events" element={<EventList />} />
        <Route path="/event/:id" element={<EventDetail />} />
        <Route path="/event/:id/attendees" element={<EventAttendees />} />
        <Route path="/event/:id/payments" element={<PaymentApprovals />} />
        <Route path="/event/:id/edit" element={<EditEvent />} /> 
        <Route path="/ticket" element={<Ticket />} /> {/* Used here */}
        <Route path="/scan/:eventId" element={<TicketScanner />} /> {/* QR Scanner */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/follow-clubs" element={<FollowClubs />} /> {/* Follow Clubs Page */}
        <Route path="/admin/organizers" element={<AdminOrganizers />} /> {/* Admin Route */}
        <Route path="/password-reset" element={<PasswordResetRequest />} /> {/* Organizer Password Reset Request */}
        <Route path="/admin/password-resets" element={<ManagePasswordResets />} /> {/* Admin Password Reset Management */}
      </Routes>
    </Router>
  );
}

export default App;