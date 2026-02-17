import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Search & Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All'); // 'All', 'Normal', 'Merchandise'

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/events/all');
                setEvents(res.data);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching events", err);
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    // --- Filter Logic ---
    const filteredEvents = events.filter(event => {
        // 1. Check Search Term (Name or Tags)
        const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              (event.tags && event.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())));
        
        // 2. Check Type
        const matchesType = filterType === 'All' || event.eventType === filterType;

        return matchesSearch && matchesType;
    });

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container mt-4 mb-5">
            <h2 className="text-center mb-4">Explore Events</h2>

            {/* --- Search & Filter Bar --- */}
            <div className="row mb-4">
                <div className="col-md-8">
                    <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Search by event name or tag..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="col-md-4">
                    <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <option value="All">All Types</option>
                        <option value="Normal">Workshops & Competitions</option>
                        <option value="Merchandise">Merchandise & Goodies</option>
                    </select>
                </div>
            </div>

            {/* --- Event Cards Grid --- */}
            <div className="row">
                {filteredEvents.length === 0 ? (
                    <div className="col-12 text-center">
                        <div className="alert alert-warning">No events found matching your criteria.</div>
                    </div>
                ) : (
                    filteredEvents.map(event => (
                        <div key={event._id} className="col-md-4 mb-4">
                            <div className="card h-100 shadow-sm border-0">
                                {/* Color Coding: Blue for Normal, Yellow for Merchandise */}
                                <div className={`card-header text-white ${event.eventType === 'Normal' ? 'bg-primary' : 'bg-warning text-dark'}`}>
                                    {event.eventType === 'Normal' ? '🎓 Event' : '🛍️ Merchandise'}
                                </div>
                                <div className="card-body d-flex flex-column">
                                    <h5 className="card-title">{event.name}</h5>
                                    <h6 className="card-subtitle mb-2 text-muted">
                                        {new Date(event.startDate).toLocaleDateString()}
                                    </h6>
                                    <p className="card-text text-truncate">{event.description}</p>
                                    
                                    <div className="mt-auto">
                                        <div className="d-flex justify-content-between align-items-center mb-2">
                                            <span className="badge bg-secondary">
                                                {event.price === 0 ? "FREE" : `₹${event.price}`}
                                            </span>
                                            <small className="text-muted">
                                                {event.registrationLimit > 0 ? `${event.registrationLimit} spots` : 'Unlimited'}
                                            </small>
                                        </div>
                                        {/* Link to Detail Page */}
                                        <Link to={`/event/${event._id}`} className="btn btn-outline-dark w-100">
                                            View Details
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default EventList;