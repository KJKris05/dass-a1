import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '', // Read-only
        role: '', // Read-only
        contactNumber: '',
        collegeName: '',
        interests: '', 
        password: '', 
        // Organizer specific
        organizerCategory: '',
        description: '',
        website: ''
    });

    // New State for Clubs
    const [allClubs, setAllClubs] = useState([]);
    const [followedClubs, setFollowedClubs] = useState([]); // Array of IDs

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfileAndClubs = async () => {
            try {
                const token = localStorage.getItem('token');
                if(!token) return navigate('/login');

                const config = { headers: { 'x-auth-token': token } };

                // Fetch Profile first to ensure auth works
                const profileRes = await axios.get('http://localhost:5000/api/auth/profile', config);
                const u = profileRes.data;

                // Then try to fetch clubs, if it fails, don't block the whole page
                let clubRes = { data: [] };
                try {
                    clubRes = await axios.get('http://localhost:5000/api/clubs', config);
                } catch (clubErr) {
                    console.error("Failed to fetch clubs", clubErr);
                }

                setFormData({
                    firstName: u.firstName || '',
                    lastName: u.lastName || '',
                    email: u.email || '',
                    role: u.role || '',
                    contactNumber: u.contactNumber || '',
                    collegeName: u.collegeName || '',
                    interests: u.interests ? u.interests.join(', ') : '',
                    password: '', 
                    organizerCategory: u.organizerCategory || '',
                    description: u.description || '',
                    website: u.website || ''
                });

                setFollowedClubs(u.followedClubs || []);
                setAllClubs(clubRes.data);
                
                setLoading(false);
            } catch (err) {
                console.error("Profile load failed", err);
                // navigate('/login'); // Setup safe fallback or redirect
                setLoading(false); // Stop loading so we can see error
            }
        };
        fetchProfileAndClubs();
    }, [navigate]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const payload = { ...formData };
            
            // Convert interests string back to array
            if (payload.interests) {
                 // Split by comma, trim whitespace, remove empty strings, convert to lowercase
                payload.interests = payload.interests.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
            } else {
                payload.interests = [];
            }

            // Remove password if empty (so we don't overwrite it with "")
            if (!payload.password) delete payload.password;

            // Don't include followedClubs in profile update (managed separately in Follow Clubs page)

            await axios.put('http://localhost:5000/api/auth/profile', payload, {
                headers: { 'x-auth-token': token }
            });

            alert('Profile Updated Successfully');
        } catch (err) {
            console.error(err);
            alert('Error updating profile');
        }
    };

    if (loading) return <div className="text-center mt-5">Loading...</div>;

    const { firstName, lastName, email, role, contactNumber, collegeName, interests, password, organizerCategory, description, website } = formData;

    return (
        <div className="container mt-5 mb-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow">
                        <div className="card-header bg-secondary text-white">
                            <h4>Edit Profile</h4>
                        </div>
                        <div className="card-body">
                            <form onSubmit={onSubmit}>
                                {/* Read Only Fields */}
                                <div className="mb-3 row">
                                    <label className="col-sm-3 col-form-label">Email</label>
                                    <div className="col-sm-9">
                                        <input type="text" readOnly className="form-control-plaintext" value={email} />
                                    </div>
                                </div>
                                <div className="mb-3 row">
                                    <label className="col-sm-3 col-form-label">Role</label>
                                    <div className="col-sm-9">
                                        <span className="badge bg-info text-dark">{role}</span>
                                    </div>
                                </div>

                                {/* Editable Fields */}
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">First Name</label>
                                        <input type="text" className="form-control" name="firstName" value={firstName} onChange={onChange} required />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Last Name</label>
                                        <input type="text" className="form-control" name="lastName" value={lastName} onChange={onChange} />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Contact Number</label>
                                    <input type="text" className="form-control" name="contactNumber" value={contactNumber} onChange={onChange} />
                                </div>

                                {role === 'participant' && (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label">College Name</label>
                                            <input type="text" className="form-control" name="collegeName" value={collegeName} onChange={onChange} />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Interests (comma separated)</label>
                                            <input type="text" className="form-control" name="interests" value={interests} onChange={onChange} placeholder="Coding, Music, Art" />
                                            <small className="text-muted">Add your areas of interest to get recommended events.</small>
                                        </div>
                                        
                                        <div className="mb-4">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <label className="form-label mb-0">Followed Clubs / Organizers</label>
                                                <a href="/follow-clubs" className="btn btn-sm btn-outline-primary">
                                                    Manage Follows
                                                </a>
                                            </div>
                                            <div className="card p-3" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                                {(() => {
                                                    // Filter out disabled/archived clubs and get only followed clubs
                                                    const followedClubsList = allClubs.filter(club => 
                                                        followedClubs.includes(club._id) && 
                                                        (!club.accountStatus || club.accountStatus === 'active')
                                                    );
                                                    
                                                    if (followedClubsList.length === 0) {
                                                        return (
                                                            <div className="text-center text-muted py-3">
                                                                <p className="mb-2">You're not following any clubs yet.</p>
                                                                <a href="/follow-clubs" className="btn btn-sm btn-primary">
                                                                    Browse Clubs
                                                                </a>
                                                            </div>
                                                        );
                                                    }
                                                    
                                                    return (
                                                        <ul className="list-group list-group-flush">
                                                            {followedClubsList.map(club => (
                                                                <li key={club._id} className="list-group-item px-0">
                                                                    <div className="d-flex justify-content-between align-items-center">
                                                                        <div>
                                                                            <strong>{club.firstName} {club.lastName}</strong>
                                                                            {club.organizerCategory && (
                                                                                <span className="badge bg-secondary ms-2">
                                                                                    {club.organizerCategory}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    );
                                                })()}
                                            </div>
                                        </div>

                                        <hr />
                                        <div className="mb-3">
                                            <label className="form-label text-danger">New Password (leave blank to keep current)</label>
                                            <input type="password" className="form-control border-danger" name="password" value={password} onChange={onChange} minLength="8" />
                                            <small className="text-muted">Password must be at least 8 characters long.</small>
                                        </div>
                                    </>
                                )}

                                {role === 'organizer' && (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label">Category</label>
                                            <input type="text" className="form-control" name="organizerCategory" value={organizerCategory} onChange={onChange} />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Description</label>
                                            <textarea className="form-control" name="description" value={description} onChange={onChange} rows="3"></textarea>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Website</label>
                                            <input type="text" className="form-control" name="website" value={website} onChange={onChange} />
                                        </div>

                                        <div className="alert alert-info">
                                            <strong>🔐 Password Reset:</strong> To change your password, please use the 
                                            <a href="/password-reset" className="alert-link ms-1">Password Reset Request</a> feature 
                                            from your dashboard.
                                        </div>
                                    </>
                                )}

                                <button type="submit" className="btn btn-primary w-100">Save Changes</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
