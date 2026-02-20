import React from 'react';
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

import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation(); // Hook to get current location
  const token = localStorage.getItem('token'); 

  // Simple check for role (Note: A real app would decode token or use context)
  // Since we are using localStorage token string, we can't easily check role without decoding
  // But for simple showing/hiding link, we can check a localStorage 'role' if we stored it
  // Or just rely on server side protection.
  // For better UX, let's store role in localStorage on login.
  // Assuming login saves role now? (Need to check login page)
  const role = localStorage.getItem('role');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    window.location.href = '/login'; 
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
        <Route path="/event/:id/edit" element={<EditEvent />} /> 
        <Route path="/ticket" element={<Ticket />} /> {/* Used here */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/admin/organizers" element={<AdminOrganizers />} /> {/* Admin Route */}
      </Routes>
    </Router>
  );
}

export default App;