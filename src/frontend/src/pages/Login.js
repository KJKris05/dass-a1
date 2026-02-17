// src/pages/Login.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
    // 1. State to hold form data
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const navigate = useNavigate(); // Hook to redirect user

    const { email, password } = formData;

    // 2. Handle input changes
    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    // 3. Handle Form Submission
    const onSubmit = async e => {
        e.preventDefault();
        try {
            // "axios" sends the POST request to your backend
            // Note: We assume backend is on port 5000
            const res = await axios.post('http://localhost:5000/api/auth/login', formData);
            
            // 4. On Success: Save Token & Redirect
            console.log('Login Success:', res.data);
            localStorage.setItem('token', res.data.token); // Save "ID Card" in browser
            navigate('/dashboard'); // Go to Dashboard

        } catch (err) {
            // 5. On Error: Show message
            console.error(err.response.data);
            setError(err.response.data.msg || 'Login Failed');
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card shadow">
                        <div className="card-body">
                            <h2 className="text-center mb-4">Login</h2>
                            
                            {error && <div className="alert alert-danger">{error}</div>}
                            
                            <form onSubmit={onSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Email Address</label>
                                    <input 
                                        type="email" 
                                        className="form-control" 
                                        name="email" 
                                        value={email} 
                                        onChange={onChange} 
                                        required 
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input 
                                        type="password" 
                                        className="form-control" 
                                        name="password" 
                                        value={password} 
                                        onChange={onChange} 
                                        required 
                                        minLength="6"
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-100">Login</button>
                            </form>
                            <p className="mt-3 text-center">
                                Don't have an account? <a href="/register">Register</a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;