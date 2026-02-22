import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [trendingEvents, setTrendingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [followedClubs, setFollowedClubs] = useState([]);
    
    // Search & Filter States
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All'); // 'All', 'Normal', 'Merchandise'
    const [filterEligibility, setFilterEligibility] = useState('All'); // 'All', 'Open to All', 'IIIT Only', 'External Only'
    const [filterDateFrom, setFilterDateFrom] = useState('');
    const [filterDateTo, setFilterDateTo] = useState('');
    const [showFollowedOnly, setShowFollowedOnly] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch events and trending events in parallel
                const [eventsRes, trendingRes] = await Promise.all([
                    axios.get('http://localhost:5000/api/events/all'),
                    axios.get('http://localhost:5000/api/events/trending')
                ]);
                
                setEvents(eventsRes.data);
                setTrendingEvents(trendingRes.data);
                
                // Get current user info for followed clubs
                const token = localStorage.getItem('token');
                if (token) {
                    const decoded = jwtDecode(token);
                    setCurrentUser(decoded.user);
                    
                    // Fetch user details to get followed clubs
                    const userRes = await axios.get('http://localhost:5000/api/auth/profile', {
                        headers: { 'x-auth-token': token }
                    });
                    setFollowedClubs(userRes.data.followedClubs || []);
                }
                
                setLoading(false);
            } catch (err) {
                console.error("Error fetching data", err);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // --- Simple Fuzzy Search Algorithm ---
    // Calculates similarity score between two strings (0-1, higher is better)
    const fuzzyScore = (str, query) => {
        str = str.toLowerCase();
        query = query.toLowerCase();
        
        // Exact match
        if (str === query) return 1.0;
        
        // Contains exact substring
        if (str.includes(query)) return 0.9;
        
        // Calculate character match ratio
        let matches = 0;
        let queryIndex = 0;
        
        for (let i = 0; i < str.length && queryIndex < query.length; i++) {
            if (str[i] === query[queryIndex]) {
                matches++;
                queryIndex++;
            }
        }
        
        // All query characters found in order
        if (queryIndex === query.length) {
            return 0.5 + (matches / str.length) * 0.4;
        }
        
        // Calculate simple character overlap
        const queryChars = new Set(query);
        const strChars = new Set(str);
        let overlap = 0;
        queryChars.forEach(char => {
            if (strChars.has(char)) overlap++;
        });
        
        return (overlap / query.length) * 0.3;
    };

    // --- Filter Logic with Fuzzy Matching ---
    const filteredEvents = events
        .map(event => {
            // Calculate fuzzy score for name
            const nameScore = searchTerm ? fuzzyScore(event.name, searchTerm) : 1;
            
            // Calculate fuzzy score for tags
            let tagScore = 0;
            if (event.tags && event.tags.length > 0 && searchTerm) {
                tagScore = Math.max(...event.tags.map(tag => fuzzyScore(tag, searchTerm)));
            }
            
            // Use the best score
            const score = Math.max(nameScore, tagScore);
            
            return { ...event, searchScore: score };
        })
        .filter(event => {
            // 1. Search filter (fuzzy matching)
            const matchesSearch = !searchTerm || event.searchScore >= 0.3;
            
            // 2. Event Type filter
            const matchesType = filterType === 'All' || event.eventType === filterType;
            
            // 3. Eligibility filter
            let matchesEligibility = true;
            if (filterEligibility !== 'All') {
                matchesEligibility = event.eligibility === filterEligibility;
            }
            
            // 4. Date Range filter
            let matchesDateRange = true;
            if (filterDateFrom || filterDateTo) {
                const eventDate = new Date(event.startDate);
                if (filterDateFrom && new Date(filterDateFrom) > eventDate) {
                    matchesDateRange = false;
                }
                if (filterDateTo && new Date(filterDateTo) < eventDate) {
                    matchesDateRange = false;
                }
            }
            
            // 5. Followed Clubs filter
            let matchesFollowed = true;
            if (showFollowedOnly && currentUser) {
                matchesFollowed = followedClubs.includes(event.organizer?._id || event.organizer);
            }

            return matchesSearch && matchesType && matchesEligibility && matchesDateRange && matchesFollowed;
        })
        .sort((a, b) => b.searchScore - a.searchScore); // Sort by relevance

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;

    return (
        <div className="container mt-4 mb-5">
            <h2 className="text-center mb-4">Explore Events</h2>

            {/* --- Trending Section --- */}
            {trendingEvents.length > 0 && (
                <div className="card shadow-sm mb-4 border-danger">
                    <div className="card-header bg-danger text-white">
                        <h5 className="mb-0">🔥 Trending Now - Most Registered in Last 24 Hours</h5>
                    </div>
                    <div className="card-body">
                        <div className="row g-2">
                            {trendingEvents.map((event, index) => (
                                <div key={event._id} className="col" style={{ flex: '0 0 20%', maxWidth: '20%' }}>
                                    <div className="card h-100 border-warning shadow-sm">
                                        <div className="card-body p-2">
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <span className="badge bg-danger">#{index + 1}</span>
                                                <span className="badge bg-warning text-dark" title="New registrations in last 24h">
                                                    🔥 {event.trendingScore}
                                                </span>
                                            </div>
                                            <h6 className="card-title small text-truncate" title={event.name}>
                                                {event.name}
                                            </h6>
                                            <p className="card-text small text-muted mb-2" style={{ fontSize: '0.75rem' }}>
                                                by {event.organizer?.firstName || 'Unknown'}
                                            </p>
                                            <Link to={`/event/${event._id}`} className="btn btn-sm btn-outline-danger w-100" style={{ fontSize: '0.75rem', padding: '0.25rem' }}>
                                                View Event
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- Search Bar --- */}
            <div className="row mb-3">
                <div className="col-12">
                    <input 
                        type="text" 
                        className="form-control form-control-lg" 
                        placeholder="🔍 Search by event name or tag..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* --- Filter Options --- */}
            <div className="card shadow-sm mb-4">
                <div className="card-body">
                    <h5 className="card-title mb-3">🎯 Filters</h5>
                    <div className="row g-3">
                        {/* Event Type */}
                        <div className="col-md-3">
                            <label className="form-label fw-bold">Event Type</label>
                            <select className="form-select" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                                <option value="All">All Types</option>
                                <option value="Normal">Events & Workshops</option>
                                <option value="Merchandise">Merchandise</option>
                            </select>
                        </div>

                        {/* Eligibility */}
                        <div className="col-md-3">
                            <label className="form-label fw-bold">Eligibility</label>
                            <select className="form-select" value={filterEligibility} onChange={(e) => setFilterEligibility(e.target.value)}>
                                <option value="All">All</option>
                                <option value="Open to All">Open to All</option>
                                <option value="IIIT Only">IIIT Only</option>
                            </select>
                        </div>

                        {/* Date From */}
                        <div className="col-md-3">
                            <label className="form-label fw-bold">From Date</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                value={filterDateFrom}
                                onChange={(e) => setFilterDateFrom(e.target.value)}
                            />
                        </div>

                        {/* Date To */}
                        <div className="col-md-3">
                            <label className="form-label fw-bold">To Date</label>
                            <input 
                                type="date" 
                                className="form-control" 
                                value={filterDateTo}
                                onChange={(e) => setFilterDateTo(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Followed Clubs Toggle */}
                    {currentUser && (
                        <div className="row mt-3">
                            <div className="col-12">
                                <div className="form-check form-switch">
                                    <input 
                                        className="form-check-input" 
                                        type="checkbox" 
                                        id="followedClubsToggle"
                                        checked={showFollowedOnly}
                                        onChange={(e) => setShowFollowedOnly(e.target.checked)}
                                    />
                                    <label className="form-check-label fw-bold" htmlFor="followedClubsToggle">
                                        ⭐ Show only events from followed clubs
                                    </label>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Clear Filters Button */}
                    <div className="row mt-3">
                        <div className="col-12">
                            <button 
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => {
                                    setSearchTerm('');
                                    setFilterType('All');
                                    setFilterEligibility('All');
                                    setFilterDateFrom('');
                                    setFilterDateTo('');
                                    setShowFollowedOnly(false);
                                }}
                            >
                                🔄 Clear All Filters
                            </button>
                            <span className="ms-3 text-muted">
                                Showing {filteredEvents.length} of {events.length} events
                            </span>
                        </div>
                    </div>
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
                                                {event.registrationFee === 0 ? "FREE" : `₹${event.registrationFee}`}
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