import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { triggerAuthUpdate } from '../App';

const Register = () => {
    const navigate = useNavigate();
    
    React.useEffect(() => {
        if(localStorage.getItem('token')){
            navigate('/dashboard');
        }
    }, [navigate]);

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'participant', // Default role
        contactNumber: '',
        interests: '' // New interests field
    });

    const [collegeSelection, setCollegeSelection] = useState(''); 
    const [customCollege, setCustomCollege] = useState('');
    const [error, setError] = useState('');

    const { firstName, lastName, email, password, role, contactNumber, interests } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onCollegeChange = (e) => {
        setCollegeSelection(e.target.value);
        if (e.target.value === 'IIIT Hyderabad') {
            setCustomCollege('');
        }
    };

    const onSubmit = async e => {
        e.preventDefault();
        
        const finalCollegeName = collegeSelection === 'Other' ? customCollege : collegeSelection;

        if (!finalCollegeName) {
            setError('Please specify your college name.');
            return;
        }

        if (finalCollegeName === 'IIIT Hyderabad') {
            const allowedDomains = ['students.iiit.ac.in', 'research.iiit.ac.in', 'iiit.ac.in'];
            const domain = email.split('@')[1];
            if (!allowedDomains.includes(domain)) {
                setError('For IIIT Hyderabad, please use an official IIIT email (@students.iiit.ac.in, @research.iiit.ac.in, @iiit.ac.in).');
                return;
            }
        }

        try {
            const payload = { ...formData, collegeName: finalCollegeName };
            // Convert interests string to array
            if (payload.interests) {
                payload.interests = payload.interests.split(',').map(s => s.trim().toLowerCase()).filter(s => s);
            } else {
                payload.interests = [];
            }
            const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/register`, payload);
            localStorage.setItem('token', res.data.token);
            
            // Trigger auth update to refresh navbar
            triggerAuthUpdate();
            
            // For participants, redirect to follow clubs onboarding
            // For organizers, redirect directly to dashboard
            if (role === 'participant') {
                navigate('/follow-clubs', { state: { isOnboarding: true } });
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.msg || 'Registration Failed');
        }
    };

    return (
        <div className="container mt-5 mb-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow">
                        <div className="card-body">
                            <h2 className="text-center mb-4">Create Account</h2>
                            {error && <div className="alert alert-danger">{error}</div>}
                            
                            <form onSubmit={onSubmit}>
                                {/* --- Role Selection (Restricted) --- */}
                                {/* Requirement 4.1.2: No self-registration for Organizers */}
                                <div className="mb-3 text-center">
                                    <div className="btn-group" role="group">
                                        <input 
                                            type="radio" 
                                            className="btn-check" 
                                            name="role" 
                                            id="role1" 
                                            value="participant" 
                                            checked={role === 'participant'} 
                                            onChange={onChange} 
                                            readOnly // Force participant
                                        />
                                        <label className="btn btn-primary active_role" htmlFor="role1">Participant Registration</label>
                                    </div>
                                    <p className="text-muted mt-2"><small>Organizers must be added by Admin.</small></p>
                                </div>

                                {/* --- Common Fields --- */}
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">First Name</label>
                                        <input type="text" className="form-control" name="firstName" value={firstName} onChange={onChange} required />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Last Name</label>
                                        <input type="text" className="form-control" name="lastName" value={lastName} onChange={onChange} required={role === 'participant'} />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Email Address</label>
                                    <input type="email" className="form-control" name="email" value={email} onChange={onChange} required />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Contact Number</label>
                                    <input type="text" className="form-control" name="contactNumber" value={contactNumber} onChange={onChange} required />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">College / Organization Name</label>
                                    <select 
                                        className="form-select" 
                                        value={collegeSelection} 
                                        onChange={onCollegeChange} 
                                        required
                                    >
                                        <option value="">Select College</option>
                                        <option value="IIIT Hyderabad">IIIT Hyderabad</option>
                                        <option value="Other">Other (External)</option>
                                    </select>
                                </div>

                                {collegeSelection === 'Other' && (
                                    <div className="mb-3">
                                        <label className="form-label">Enter College Name</label>
                                        <input 
                                            type="text" 
                                            className="form-control" 
                                            value={customCollege} 
                                            onChange={(e) => setCustomCollege(e.target.value)} 
                                            required 
                                        />
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label className="form-label">Interests (Comma Separated)</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        name="interests" 
                                        value={interests} 
                                        onChange={onChange} 
                                        placeholder="e.g. Coding, Music, Dance" 
                                    />
                                    <small className="text-muted">You can update these later in your profile.</small>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input type="password" className="form-control" name="password" value={password} onChange={onChange} required minLength="6" />
                                </div>

                                {/* --- Organizer Specific Fields --- */}
                                {role === 'organizer' && (
                                    <div className="alert alert-warning">
                                        Organizers cannot register themselves. Please contact the Admin.
                                    </div>
                                )}

                                <button type="submit" className="btn btn-primary w-100">Register</button>
                            </form>
                            <p className="mt-3 text-center">
                                Already have an account? <a href="/login">Login</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;