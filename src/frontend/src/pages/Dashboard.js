import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode"; 

// --- Sub-Components ---

const ParticipantView = ({ user }) => (
    <div className="card shadow p-4">
        <h3 className="text-primary">Welcome, {user.firstName || 'Participant'}!</h3>
        <p className="text-muted">You are logged in as a Student.</p>
        <hr />
        <div className="row">
            <div className="col-md-6">
                <div className="card bg-light mb-3">
                    <div className="card-body">
                        <h5>📅 Upcoming Events</h5>
                        <p>No upcoming events found.</p>
                        <button className="btn btn-outline-primary btn-sm">Browse Events</button>
                    </div>
                </div>
            </div>
            <div className="col-md-6">
                <div className="card bg-light mb-3">
                    <div className="card-body">
                        <h5>✅ Past Participation</h5>
                        <p>You haven't attended any events yet.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

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
            
            <button className="btn btn-warning w-100 mb-4" onClick={() => navigate('/create-event')}>
                + Create New Event
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
                                <small className={`badge ${event.status === 'Published' ? 'bg-success' : 'bg-secondary'}`}>
                                    {event.status}
                                </small>
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

const AdminView = () => (
    <div className="card shadow p-4 border-danger">
        <h3 className="text-danger">Admin Control Center</h3>
        <p>Manage users and approvals here.</p>
    </div>
);

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