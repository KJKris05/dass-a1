import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AdminOrganizers = () => {
    const navigate = useNavigate();
    const [organizers, setOrganizers] = useState([]);
    
    // Auth Check
    useEffect(() => {
        const checkAdmin = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return navigate('/login');
                const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
                    headers: { 'x-auth-token': token }
                });
                if (res.data.role !== 'admin') {
                    navigate('/dashboard');
                }
            } catch (err) {
                navigate('/login');
            }
        };
        checkAdmin();
    }, [navigate]);

    const [formData, setFormData] = useState({
        firstName: '', // Organizer Name / Club Name
        organizerCategory: '',
        description: '',
    });

    const { firstName, organizerCategory, description } = formData;

    const [showCredentials, setShowCredentials] = useState(false);
    const [generatedCredentials, setGeneratedCredentials] = useState(null);

    useEffect(() => {
        fetchOrganizers();
    }, []);

    const fetchOrganizers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/organizers`, {
                headers: { 'x-auth-token': token }
            });
            setOrganizers(res.data);
        } catch (err) {
            console.error("Error fetching organizers", err);
        }
    };

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            console.log('Submitting organizer data:', formData);
            const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/organizers`, formData, {
                headers: { 'x-auth-token': token }
            });
            console.log('Server response:', response.data);
            
            // Show generated credentials to admin
            setGeneratedCredentials(response.data.credentials);
            setShowCredentials(true);
            
            fetchOrganizers();
            setFormData({
                firstName: '', organizerCategory: '', description: ''
            });
        } catch (err) {
            console.error('Full error object:', err);
            console.error('Error response:', err.response);
            console.error('Error data:', err.response?.data);
            const errorMsg = err.response?.data?.msg || err.response?.data || err.message || 'Error adding organizer';
            alert('Error: ' + errorMsg);
        }
    };

    const closeCredentialsModal = () => {
        setShowCredentials(false);
        setGeneratedCredentials(null);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
    };

    const deleteOrganizer = async (id, action = 'disable') => {
        const confirmMsg = action === 'delete' 
            ? "Are you sure you want to PERMANENTLY DELETE this organizer? This cannot be undone!"
            : "Are you sure you want to disable this organizer? They will not be able to log in.";
            
        if(!window.confirm(confirmMsg)) return;
        
        try {
            const token = localStorage.getItem('token');
            const url = action === 'delete' 
                ? `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/organizers/${id}?action=delete`
                : `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/organizers/${id}`;
                
            await axios.delete(url, {
                headers: { 'x-auth-token': token }
            });
            alert(action === 'delete' ? 'Organizer permanently deleted' : 'Organizer disabled successfully');
            fetchOrganizers();
        } catch (err) {
            console.error(err);
            alert('Error: ' + (err.response?.data?.msg || 'Error processing request'));
        }
    };

    const enableOrganizer = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/admin/organizers/${id}/enable`, {}, {
                headers: { 'x-auth-token': token }
            });
            alert('Organizer re-enabled successfully');
            fetchOrganizers();
        } catch (err) {
            console.error(err);
            alert('Error enabling organizer');
        }
    };

    return (
        <div className="container mt-5">
            <h2>Manage Organizers</h2>
            
            {/* Credentials Modal */}
            {showCredentials && generatedCredentials && (
                <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} onClick={closeCredentialsModal}>
                    <div className="modal-dialog modal-dialog-centered" onClick={e => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header bg-success text-white">
                                <h5 className="modal-title">✅ Organizer Account Created</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={closeCredentialsModal}></button>
                            </div>
                            <div className="modal-body">
                                <div className="alert alert-warning">
                                    <strong>⚠️ Important:</strong> Save these credentials and share them with the organizer. They cannot be retrieved later.
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Login Email:</label>
                                    <div className="input-group">
                                        <input type="text" className="form-control" value={generatedCredentials.email} readOnly />
                                        <button className="btn btn-outline-secondary" onClick={() => copyToClipboard(generatedCredentials.email)}>
                                            📋 Copy
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label fw-bold">Password:</label>
                                    <div className="input-group">
                                        <input type="text" className="form-control" value={generatedCredentials.password} readOnly />
                                        <button className="btn btn-outline-secondary" onClick={() => copyToClipboard(generatedCredentials.password)}>
                                            📋 Copy
                                        </button>
                                    </div>
                                </div>
                                <div className="alert alert-info mb-0">
                                    The organizer can log in immediately with these credentials.
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-primary" onClick={closeCredentialsModal}>Done</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Organizer Form */}
            <div className="card shadow mb-4">
                <div className="card-header bg-primary text-white">Add New Organizer</div>
                <div className="card-body">
                    <form onSubmit={onSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Club/Organizer Name *</label>
                            <input type="text" className="form-control" placeholder="e.g., Robotics Club" name="firstName" value={firstName} onChange={onChange} required />
                            <small className="text-muted">Email will be auto-generated from this name</small>
                        </div>
                        <div className="mb-3">
                             <label className="form-label">Category</label>
                            <select className="form-control" name="organizerCategory" value={organizerCategory} onChange={onChange}>
                                <option value="">Select Category</option>
                                <option value="Technical">Technical</option>
                                <option value="Cultural">Cultural</option>
                                <option value="Sports">Sports</option>
                                <option value="Academic">Academic</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                        <div className="mb-3">
                            <textarea className="form-control" placeholder="Description" name="description" value={description} onChange={onChange} rows="2"></textarea>
                        </div>
                        <button type="submit" className="btn btn-primary">Create Organizer Account</button>
                    </form>
                </div>
            </div>

            {/* List Organizers */}
            <div className="card shadow">
                 <div className="card-header">Existing Organizers</div>
                 <div className="card-body">
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Category</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {organizers.map(org => (
                                <tr key={org._id} className={org.accountStatus !== 'active' ? 'table-secondary' : ''}>
                                    <td>{org.firstName}</td>
                                    <td>{org.email}</td>
                                    <td>{org.organizerCategory || 'N/A'}</td>
                                    <td>
                                        {org.accountStatus === 'active' && <span className="badge bg-success">Active</span>}
                                        {org.accountStatus === 'disabled' && <span className="badge bg-danger">Disabled</span>}
                                        {org.accountStatus === 'archived' && <span className="badge bg-secondary">Archived</span>}
                                    </td>
                                    <td>
                                        {org.accountStatus === 'active' ? (
                                            <>
                                                <button className="btn btn-warning btn-sm me-2" onClick={() => deleteOrganizer(org._id, 'disable')}>Disable</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => deleteOrganizer(org._id, 'delete')}>Delete</button>
                                            </>
                                        ) : (
                                            <>
                                                <button className="btn btn-success btn-sm me-2" onClick={() => enableOrganizer(org._id)}>Re-enable</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => deleteOrganizer(org._id, 'delete')}>Delete</button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

export default AdminOrganizers;