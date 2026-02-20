import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"; 

// --- Sub-Components ---

const ParticipantView = ({ user }) => {
    const navigate = useNavigate(); // Define navigate
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRegistrations = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5000/api/registrations/my-events', {
                    headers: { 'x-auth-token': token }
                });
                setRegistrations(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching registrations", err);
                setLoading(false);
            }
        };
        fetchRegistrations();
    }, []);

    // Helper to categorize events
    const upcoming = registrations.filter(r => new Date(r.event.startDate) > new Date());
    const past = registrations.filter(r => new Date(r.event.startDate) <= new Date());

    return (
        <div className="card shadow p-4">
            <h3 className="text-primary">Welcome, {user.firstName || 'Participant'}!</h3>
            <p className="text-muted">You are logged in as a Student.</p>
            <hr />
            <div className="row">
                <div className="col-md-6">
                    <div className="card bg-light mb-3">
                        <div className="card-body">
                            <h5>📅 Upcoming Events</h5>
                            {loading ? <p>Loading...</p> : upcoming.length === 0 ? (
                                <>
                                    <p>No upcoming events found.</p>
                                    <a href="/events" className="btn btn-outline-primary btn-sm">Browse Events</a>
                                </>
                            ) : (
                                <ul className="list-group">
                                    {upcoming.map(reg => (
                                        <li key={reg._id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{reg.event.name}</strong><br/>
                                                <small>{new Date(reg.event.startDate).toLocaleDateString()}</small>
                                            </div>
                                            <div>
                                                <span className="badge bg-primary me-2">{reg.status}</span>
                                                <button 
                                                    className="btn btn-sm btn-outline-dark"
                                                    onClick={() => navigate('/ticket', { state: { registration: reg } })}
                                                >
                                                    View Ticket
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="card bg-light mb-3">
                        <div className="card-body">
                            <h5>✅ Past Participation</h5>
                            {loading ? <p>Loading...</p> : past.length === 0 ? (
                                <p>You haven't attended any events yet.</p>
                            ) : (
                                <ul className="list-group">
                                    {past.map(reg => (
                                        <li key={reg._id} className="list-group-item">
                                            {reg.event.name} <span className="text-muted">({new Date(reg.event.startDate).toLocaleDateString()})</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const OrganizerView = ({ user }) => {
    // FIX: navigate must be defined INSIDE this component to work
    const navigate = useNavigate(); 
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyEvents = async () => {
            try {
                const token = localStorage.getItem('token');
                // Ensure axios is imported at the top
                const res = await axios.get('http://localhost:5000/api/events/my-events', {
                    headers: { 'x-auth-token': token }
                });
                setEvents(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching events", err);
                setLoading(false);
            }
        };

        fetchMyEvents();
    }, []);

    return (
        <div className="card shadow p-4 border-warning">
            <h3 className="text-warning">Organizer Dashboard</h3>
            <p className="text-muted">Welcome back, {user.organizerCategory || 'Organizer'}.</p>
            <hr />
            
            <button className="btn btn-warning w-100 mb-2" onClick={() => navigate('/create-event')}>
                + Create New Eventb
            </button>
            <button className="btn btn-dark w-100 mb-4" onClick={() => navigate('/scan')}>
                📷 Scan Tickets
            </button>

            <h5>Your Events</h5>
            {loading ? (
                <p>Loading...</p>
            ) : events.length === 0 ? (
                <div className="alert alert-info">You haven't created any events yet.</div>
            ) : (
                <div className="list-group">
                    {events.map(event => (
                        <div key={event._id} className="list-group-item list-group-item-action flex-column align-items-start">
                            <div className="d-flex w-100 justify-content-between">
                                <h5 className="mb-1">{event.name}</h5>
                                <div>
                                    <small className={`badge ${event.status === 'Published' ? 'bg-success' : 'bg-secondary'} me-2`}>
                                        {event.status}
                                    </small>
                                    <button 
                                        className="btn btn-sm btn-outline-primary me-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/event/${event._id}/edit`);
                                        }}
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-outline-info me-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/event/${event._id}/attendees`);
                                        }}
                                    >
                                        Attendees
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={async (e) => {
                                            e.stopPropagation(); // Prevent navigation if any
                                            if(window.confirm('Are you sure you want to delete this event?')) {
                                                try {
                                                    const token = localStorage.getItem('token');
                                                    await axios.delete(`http://localhost:5000/api/events/${event._id}`, {
                                                        headers: { 'x-auth-token': token }
                                                    });
                                                    // Refresh list locally
                                                    setEvents(events.filter(e => e._id !== event._id));
                                                } catch (err) {
                                                    alert('Error deleting event');
                                                }
                                            }
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                            <p className="mb-1">{event.description.substring(0, 100)}...</p>
                            <small>Date: {new Date(event.startDate).toLocaleDateString()}</small>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const AdminView = () => {
    const navigate = useNavigate();

    return (
        <div className="card shadow p-4 border-danger">
            <h3 className="text-danger">Admin Control Center</h3>
            <p>Welcome to the admin dashboard.</p>
            <hr />
            
            <div className="row">
                <div className="col-md-6 mb-3">
                    <button className="btn btn-danger btn-lg w-100" onClick={() => navigate('/admin/organizers')}>
                        Manage Organizers
                    </button>
                    <p className="text-muted mt-2 text-center">Add, view, or remove event organizers and clubs.</p>
                </div>
            </div>
        </div>
    );
};

// --- Main Dashboard Component ---
const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    useEffect(() => {
        // 1. Get Token
        const token = localStorage.getItem('token');
        
        if (!token) {
            navigate('/login'); 
            return;
        }

        try {
            // 2. Decode Token
            const decoded = jwtDecode(token);
            setUser(decoded.user); 
        } catch (error) {
            console.error("Invalid Token");
            localStorage.removeItem('token');
            navigate('/login');
        }
    }, [navigate]);

    if (!user) return <div className="text-center mt-5">Loading...</div>;

    return (
        <div className="container mt-4">
            {user.role === 'participant' && <ParticipantView user={user} />}
            {user.role === 'organizer' && <OrganizerView user={user} />}
            {user.role === 'admin' && <AdminView />}
        </div>
    );
};

export default Dashboard;