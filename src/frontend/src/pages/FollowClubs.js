import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { triggerAuthUpdate } from '../App';

const FollowClubs = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isOnboarding = location.state?.isOnboarding || false;
    
    const [clubs, setClubs] = useState([]);
    const [filteredClubs, setFilteredClubs] = useState([]);
    const [followedClubs, setFollowedClubs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [loading, setLoading] = useState(true);

    const token = localStorage.getItem('token');

    // Check if user is logged in
    useEffect(() => {
        if (!token) {
            alert('Please log in to continue');
            navigate('/login');
        }
    }, [token, navigate]);

    useEffect(() => {
        fetchClubsAndProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        filterClubs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, categoryFilter, clubs, followedClubs]);

    const fetchClubsAndProfile = async () => {
        try {
            setLoading(true);
            
            // Fetch all clubs
            const clubsRes = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/clubs`, {
                headers: { 'x-auth-token': token }
            });
            console.log('Clubs fetched:', clubsRes.data);
            setClubs(clubsRes.data);

            // Fetch user profile to get followed clubs
            try {
                const profileRes = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
                    headers: { 'x-auth-token': token }
                });
                console.log('Profile fetched:', profileRes.data);
                setFollowedClubs(profileRes.data.followedClubs || []);
            } catch (profileErr) {
                if (profileErr.response?.status === 401) {
                    console.error('Token expired or invalid. Please log in again.');
                    alert('Your session has expired. Please log in again.');
                    localStorage.removeItem('token');
                    localStorage.removeItem('role');
                    triggerAuthUpdate();
                    navigate('/login');
                    return;
                }
                throw profileErr;
            }
            
            setLoading(false);
        } catch (err) {
            console.error('Error fetching data:', err);
            console.error('Error details:', err.response?.data || err.message);
            alert(`Failed to load clubs: ${err.response?.data?.msg || err.message}`);
            setLoading(false);
        }
    };

    const filterClubs = () => {
        let filtered = clubs;

        // Filter by category
        if (categoryFilter !== 'All') {
            filtered = filtered.filter(club => club.organizerCategory === categoryFilter);
        }

        // Filter by search term (name or category)
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(club => 
                `${club.firstName} ${club.lastName}`.toLowerCase().includes(term) ||
                club.organizerCategory.toLowerCase().includes(term)
            );
        }

        setFilteredClubs(filtered);
    };

    const toggleFollow = async (clubId) => {
        const isFollowing = followedClubs.includes(clubId);
        let updatedFollows;

        if (isFollowing) {
            updatedFollows = followedClubs.filter(id => id !== clubId);
        } else {
            updatedFollows = [...followedClubs, clubId];
        }

        try {
            await axios.put(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/profile`,
                { followedClubs: updatedFollows },
                { headers: { 'x-auth-token': token } }
            );
            setFollowedClubs(updatedFollows);
        } catch (err) {
            console.error('Error updating follows:', err);
            alert('Failed to update follows');
        }
    };

    const handleContinue = () => {
        navigate('/dashboard');
    };

    const categories = ['All', 'Technical', 'Cultural', 'Sports', 'Social', 'Academic', 'Other'];

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <p>Loading clubs...</p>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            {isOnboarding && (
                <div style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    padding: '2rem',
                    borderRadius: '10px',
                    marginBottom: '2rem',
                    textAlign: 'center'
                }}>
                    <h1 style={{ margin: '0 0 0.5rem 0' }}>Welcome! 🎉</h1>
                    <p style={{ margin: 0, fontSize: '1.1rem' }}>
                        Follow clubs and organizers you're interested in to stay updated on their events
                    </p>
                </div>
            )}

            <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem'
            }}>
                <h2 style={{ margin: 0 }}>
                    {isOnboarding ? 'Discover Clubs & Organizers' : 'Follow Clubs'}
                </h2>
                {isOnboarding && (
                    <button
                        onClick={handleContinue}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: '600'
                        }}
                    >
                        Continue to Dashboard →
                    </button>
                )}
            </div>

            {/* Stats */}
            <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <div style={{
                    background: '#f3f4f6',
                    padding: '1rem',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                        {clubs.length}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Total Clubs</div>
                </div>
                <div style={{
                    background: '#f3f4f6',
                    padding: '1rem',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                        {followedClubs.length}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>Following</div>
                </div>
            </div>

            {/* Search and Filter */}
            <div style={{ 
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '1rem',
                marginBottom: '2rem'
            }}>
                <input
                    type="text"
                    placeholder="Search clubs by name or category..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem'
                    }}
                />
                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    style={{
                        padding: '0.75rem',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '1rem',
                        minWidth: '150px'
                    }}
                >
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            {/* Clubs Grid */}
            {filteredClubs.length === 0 ? (
                <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    background: '#f9fafb',
                    borderRadius: '10px'
                }}>
                    <p style={{ fontSize: '1.2rem', color: '#6b7280' }}>
                        No clubs found matching your criteria
                    </p>
                </div>
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '1.5rem'
                }}>
                    {filteredClubs.map(club => {
                        const isFollowing = followedClubs.includes(club._id);
                        return (
                            <div
                                key={club._id}
                                style={{
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '10px',
                                    padding: '1.5rem',
                                    background: 'white',
                                    transition: 'all 0.3s',
                                    boxShadow: isFollowing ? '0 4px 12px rgba(102, 126, 234, 0.2)' : 'none'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '1rem'
                                }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 0.25rem 0' }}>
                                            {club.firstName} {club.lastName}
                                        </h3>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '0.25rem 0.75rem',
                                            background: '#f3f4f6',
                                            borderRadius: '20px',
                                            fontSize: '0.85rem',
                                            color: '#6b7280'
                                        }}>
                                            {club.organizerCategory}
                                        </span>
                                    </div>
                                </div>

                                {club.description && (
                                    <p style={{
                                        color: '#6b7280',
                                        fontSize: '0.95rem',
                                        marginBottom: '1rem'
                                    }}>
                                        {club.description}
                                    </p>
                                )}

                                {club.website && (
                                    <div style={{ marginBottom: '1rem' }}>
                                        <a
                                            href={club.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                color: '#667eea',
                                                textDecoration: 'none',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            🌐 {club.website}
                                        </a>
                                    </div>
                                )}

                                {club.email && (
                                    <div style={{
                                        color: '#6b7280',
                                        fontSize: '0.9rem',
                                        marginBottom: '1rem'
                                    }}>
                                        📧 {club.email}
                                    </div>
                                )}

                                <button
                                    onClick={() => toggleFollow(club._id)}
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        border: isFollowing ? '2px solid #667eea' : '2px solid #e5e7eb',
                                        background: isFollowing ? '#667eea' : 'white',
                                        color: isFollowing ? 'white' : '#374151',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {isFollowing ? '✓ Following' : isOnboarding ? '+ Follow' : '+ Follow'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {isOnboarding && filteredClubs.length > 0 && (
                <div style={{
                    marginTop: '2rem',
                    textAlign: 'center'
                }}>
                    <button
                        onClick={handleContinue}
                        style={{
                            padding: '1rem 2rem',
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '1.1rem',
                            fontWeight: '600'
                        }}
                    >
                        Continue to Dashboard →
                    </button>
                </div>
            )}
        </div>
    );
};

export default FollowClubs;
