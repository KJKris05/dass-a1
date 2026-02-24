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
                const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/registrations/my-events`, {
                    headers: { 'x-auth-token': token }
                });
                // Filter out registrations with null events (deleted events)
                const validRegistrations = res.data.filter(r => r.event !== null);
                setRegistrations(validRegistrations);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching registrations", err);
                setLoading(false);
            }
        };
        fetchRegistrations();
    }, []);

    // Helper to categorize events
    const now = new Date();
    
    const upcoming = registrations.filter(r => {
        if (!r.event || !r.event.startDate) return false;
        return new Date(r.event.startDate) > now;
    });
    
    const ongoing = registrations.filter(r => {
        if (!r.event || !r.event.startDate || !r.event.endDate) return false;
        const startDate = new Date(r.event.startDate);
        const endDate = new Date(r.event.endDate);
        return startDate <= now && endDate >= now;
    });
    
    const past = registrations.filter(r => {
        if (!r.event) return false;
        // Use endDate if available, otherwise use startDate
        if (r.event.endDate) {
            const endDate = new Date(r.event.endDate);
            return endDate < now;
        } else if (r.event.startDate) {
            const startDate = new Date(r.event.startDate);
            return startDate < now;
        }
        return false;
    });

    return (
        <div className="card shadow p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                    <h3 className="text-primary mb-0">Welcome, {user.firstName || 'Participant'}!</h3>
                    <p className="text-muted mb-0">You are logged in as a Student.</p>
                </div>
                <button 
                    className="btn btn-outline-primary"
                    onClick={() => navigate('/follow-clubs')}
                >
                    📌 Follow Clubs
                </button>
            </div>
            <hr />
            <div className="row">
                <div className="col-md-4">
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
                <div className="col-md-4">
                    <div className="card bg-warning bg-opacity-10 mb-3">
                        <div className="card-body">
                            <h5>🔴 Ongoing Events</h5>
                            {loading ? <p>Loading...</p> : ongoing.length === 0 ? (
                                <p>No ongoing events.</p>
                            ) : (
                                <ul className="list-group">
                                    {ongoing.map(reg => (
                                        <li key={reg._id} className="list-group-item d-flex justify-content-between align-items-center">
                                            <div>
                                                <strong>{reg.event.name}</strong><br/>
                                                <small>{new Date(reg.event.startDate).toLocaleDateString()} - {new Date(reg.event.endDate).toLocaleDateString()}</small>
                                            </div>
                                            <div>
                                                <span className="badge bg-success me-2">LIVE</span>
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
                <div className="col-md-4">
                    <div className="card bg-light mb-3">
                        <div className="card-body">
                            <h5>✅ Past Participation</h5>
                            {loading ? <p>Loading...</p> : past.length === 0 ? (
                                <p>You haven't attended any events yet.</p>
                            ) : (
                                <ul className="list-group">
                                    {past.map(reg => {
                                        const displayDate = reg.event.endDate 
                                            ? new Date(reg.event.endDate).toLocaleDateString() 
                                            : new Date(reg.event.startDate).toLocaleDateString();
                                        return (
                                            <li key={reg._id} className="list-group-item">
                                                {reg.event.name} <span className="text-muted">({displayDate})</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Participation History Section */}
            <hr className="my-4" />
            <ParticipationHistory registrations={registrations} loading={loading} />
        </div>
    );
};

const ParticipationHistory = ({ registrations, loading }) => {
    const [activeTab, setActiveTab] = useState('all');
    const [cancelling, setCancelling] = useState(null);
    const navigate = useNavigate();

    const handleCancel = async (regId) => {
        if (!window.confirm('Are you sure you want to cancel this registration?')) {
            return;
        }
        
        try {
            setCancelling(regId);
            const token = localStorage.getItem('token');
            await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/registrations/${regId}/cancel`, {}, {
                headers: { 'x-auth-token': token }
            });
            alert('Registration cancelled successfully');
            window.location.reload(); // Refresh to show updated status
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Failed to cancel registration');
        } finally {
            setCancelling(null);
        }
    };

    // Filter registrations by tab
    const filterByTab = (tab) => {
        switch(tab) {
            case 'normal':
                return registrations.filter(r => r.event && r.event.eventType === 'Normal' && r.status !== 'Cancelled');
            case 'merchandise':
                return registrations.filter(r => r.event && r.event.eventType === 'Merchandise' && r.status !== 'Cancelled');
            case 'completed':
                return registrations.filter(r => r.status === 'Attended' || r.status === 'Approved');
            case 'cancelled':
                return registrations.filter(r => r.status === 'Cancelled');
            default: // 'all'
                return registrations.filter(r => r.event);
        }
    };

    const filteredRegs = filterByTab(activeTab);

    return (
        <div className="card shadow p-4">
            <h4 className="text-primary mb-3">📋 Participation History</h4>
            
            {/* Tabs */}
            <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'all' ? 'active' : ''}`}
                        onClick={() => setActiveTab('all')}
                    >
                        All
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'normal' ? 'active' : ''}`}
                        onClick={() => setActiveTab('normal')}
                    >
                        Normal Events
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'merchandise' ? 'active' : ''}`}
                        onClick={() => setActiveTab('merchandise')}
                    >
                        Merchandise
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'completed' ? 'active' : ''}`}
                        onClick={() => setActiveTab('completed')}
                    >
                        Completed
                    </button>
                </li>
                <li className="nav-item">
                    <button 
                        className={`nav-link ${activeTab === 'cancelled' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cancelled')}
                    >
                        Cancelled
                    </button>
                </li>
            </ul>

            {/* Content */}
            {loading ? (
                <p>Loading...</p>
            ) : filteredRegs.length === 0 ? (
                <p className="text-muted">No registrations found in this category.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th>Event Name</th>
                                <th>Type</th>
                                <th>Date</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredRegs.map(reg => {
                                const canCancel = reg.status !== 'Cancelled' && 
                                                 reg.status !== 'Attended' && 
                                                 reg.status !== 'Approved' &&
                                                 reg.event && 
                                                 new Date(reg.event.startDate) > new Date();
                                
                                return (
                                    <tr key={reg._id}>
                                        <td><strong>{reg.event.name}</strong></td>
                                        <td>
                                            <span className={`badge ${reg.event.eventType === 'Normal' ? 'bg-info' : 'bg-warning'}`}>
                                                {reg.event.eventType}
                                            </span>
                                        </td>
                                        <td>{new Date(reg.event.startDate).toLocaleDateString()}</td>
                                        <td>
                                            <span className={`badge ${
                                                reg.status === 'Cancelled' ? 'bg-danger' :
                                                reg.status === 'Attended' || reg.status === 'Approved' ? 'bg-success' :
                                                reg.status === 'Pending' ? 'bg-warning' :
                                                'bg-primary'
                                            }`}>
                                                {reg.status}
                                            </span>
                                        </td>
                                        <td>
                                            {canCancel && (
                                                <button 
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleCancel(reg._id)}
                                                    disabled={cancelling === reg._id}
                                                >
                                                    {cancelling === reg._id ? 'Cancelling...' : 'Cancel'}
                                                </button>
                                            )}
                                            {reg.status !== 'Cancelled' && reg.status !== 'Pending' && (
                                                <button 
                                                    className="btn btn-sm btn-outline-primary ms-2"
                                                    onClick={() => navigate('/ticket', { state: { registration: reg } })}
                                                >
                                                    View Ticket
                                                </button>
                                            )}
                                            {(reg.status === 'Attended' || reg.status === 'Approved') && (
                                                <button 
                                                    className="btn btn-sm btn-outline-success ms-2"
                                                    onClick={() => navigate(`/event/${reg.event._id}/submit-feedback`)}
                                                >
                                                    📝 Feedback
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

const OrganizerView = ({ user }) => {
    const navigate = useNavigate(); 
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyEvents = async () => {
            try {
                const token = localStorage.getItem('token');
                // Ensure axios is imported at the top
                const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/my-events`, {
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
            
            <div className="row mb-4">
                <div className="col-md-8">
                    <button className="btn btn-warning w-100" onClick={() => navigate('/create-event')}>
                        + Create New Event
                    </button>
                </div>
                <div className="col-md-4">
                    <button 
                        className="btn btn-outline-warning w-100" 
                        onClick={() => navigate('/password-reset')}
                        title="Request password reset from admin"
                    >
                        🔐 Reset Password
                    </button>
                </div>
            </div>

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
                                    <small className={`badge ${
                                        event.status === 'Published' ? 'bg-success' : 
                                        event.status === 'Draft' ? 'bg-secondary' : 'bg-info'
                                    } me-2`}>
                                        {event.status}
                                    </small>
                                    {event.status === 'Draft' && (
                                        <button 
                                            className="btn btn-sm btn-success me-2"
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                if(window.confirm('Publish this event now?')) {
                                                    try {
                                                        const token = localStorage.getItem('token');
                                                        await axios.put(
                                                            `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/${event._id}/publish`, 
                                                            {}, 
                                                            { headers: { 'x-auth-token': token } }
                                                        );
                                                        // Update local state
                                                        setEvents(events.map(e => 
                                                            e._id === event._id ? { ...e, status: 'Published' } : e
                                                        ));
                                                        alert('Event published successfully!');
                                                    } catch (err) {
                                                        alert('Error publishing event: ' + (err.response?.data?.msg || 'Unknown error'));
                                                    }
                                                }
                                            }}
                                        >
                                            🚀 Publish
                                        </button>
                                    )}
                                    <button 
                                        className="btn btn-sm btn-outline-primary me-2"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/event/${event._id}/edit`);
                                        }}
                                    >
                                        Edit
                                    </button>
                                    {event.status !== 'Draft' && (
                                        <>
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
                                                className="btn btn-sm btn-outline-success me-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/event/${event._id}/analytics`);
                                                }}
                                                title="View Event Analytics"
                                            >
                                                📊 Analytics
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline-info me-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/event/${event._id}/feedback`);
                                                }}
                                                title="View Feedback"
                                            >
                                                ⭐ Feedback
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline-dark me-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/scan/${event._id}`);
                                                }}
                                                title="QR Scanner & Attendance Tracking"
                                            >
                                                📱 Scan QR
                                            </button>
                                            {event.eventType === 'Merchandise' && (
                                                <button 
                                                    className="btn btn-sm btn-outline-warning me-2"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/event/${event._id}/payments`);
                                                    }}
                                                >
                                                    💳 Payments
                                                </button>
                                            )}
                                        </>
                                    )}
                                    <button 
                                        className="btn btn-sm btn-outline-danger"
                                        onClick={async (e) => {
                                            e.stopPropagation(); // Prevent navigation if any
                                            if(window.confirm('Are you sure you want to delete this event?')) {
                                                try {
                                                    const token = localStorage.getItem('token');
                                                    await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/${event._id}`, {
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
                <div className="col-md-6 mb-3">
                    <button className="btn btn-danger btn-lg w-100" onClick={() => navigate('/admin/password-resets')}>
                        Password Reset Requests
                    </button>
                    <p className="text-muted mt-2 text-center">Review and manage organizer password reset requests.</p>
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