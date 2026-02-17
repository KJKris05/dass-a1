import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'participant', // Default role
        contactNumber: '',
        organizerCategory: '', // Only for Organizers
        description: ''        // Only for Organizers
    });

    const [error, setError] = useState('');

    const { firstName, lastName, email, password, role, contactNumber, organizerCategory, description } = formData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            // Send data to Backend
            const res = await axios.post('http://localhost:5000/api/auth/register', formData);
            
            // On success, save token and redirect
            localStorage.setItem('token', res.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response.data.msg || 'Registration Failed');
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
                                {/* --- Role Selection --- */}
                                <div className="mb-3 text-center">
                                    <div className="btn-group" role="group">
                                        <input type="radio" className="btn-check" name="role" id="role1" value="participant" checked={role === 'participant'} onChange={onChange} />
                                        <label className="btn btn-outline-primary" htmlFor="role1">Participant</label>

                                        <input type="radio" className="btn-check" name="role" id="role2" value="organizer" checked={role === 'organizer'} onChange={onChange} />
                                        <label className="btn btn-outline-warning" htmlFor="role2">Organizer</label>
                                    </div>
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
                                    {role === 'participant' && <small className="text-muted">Use @students.iiit.ac.in for IIIT benefits.</small>}
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input type="password" className="form-control" name="password" value={password} onChange={onChange} required minLength="6" />
                                </div>

                                {/* --- Organizer Specific Fields --- */}
                                {role === 'organizer' && (
                                    <div className="bg-light p-3 mb-3 rounded border border-warning">
                                        <h5 className="text-warning">Organizer Details</h5>
                                        <div className="mb-3">
                                            <label className="form-label">Category</label>
                                            <select className="form-select" name="organizerCategory" value={organizerCategory} onChange={onChange} required>
                                                <option value="">Select Category...</option>
                                                <option value="Technical">Technical</option>
                                                <option value="Cultural">Cultural</option>
                                                <option value="Sports">Sports</option>
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Contact Number</label>
                                            <input type="text" className="form-control" name="contactNumber" value={contactNumber} onChange={onChange} required />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Description</label>
                                            <textarea className="form-control" name="description" value={description} onChange={onChange} rows="2"></textarea>
                                        </div>
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