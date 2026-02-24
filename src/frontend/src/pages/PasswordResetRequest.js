// frontend/src/pages/PasswordResetRequest.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const PasswordResetRequest = () => {
    const navigate = useNavigate();
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [myRequests, setMyRequests] = useState([]);
    const [fetchingRequests, setFetchingRequests] = useState(true);

    useEffect(() => {
        fetchMyRequests();
    }, []);

    const fetchMyRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/password-reset/my-requests`, {
                headers: { 'x-auth-token': token }
            });
            setMyRequests(res.data);
            setFetchingRequests(false);
        } catch (err) {
            console.error(err);
            setFetchingRequests(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!reason.trim()) {
            alert('Please provide a reason for password reset');
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await axios.post(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/password-reset/request`,
                { reason },
                { headers: { 'x-auth-token': token } }
            );

            alert(res.data.msg);
            setReason('');
            fetchMyRequests(); // Refresh the list
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to submit request');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch(status) {
            case 'Pending':
                return 'bg-warning';
            case 'Approved':
                return 'bg-success';
            case 'Rejected':
                return 'bg-danger';
            default:
                return 'bg-secondary';
        }
    };

    return (
        <div className="container mt-4">
            <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/dashboard')}>
                ← Back to Dashboard
            </button>

            <div className="row">
                <div className="col-md-6">
                    <div className="card shadow">
                        <div className="card-body">
                            <h3 className="text-primary mb-4">🔐 Password Reset Request</h3>
                            
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">
                                        <strong>Reason for Password Reset</strong>
                                        <span className="text-danger">*</span>
                                    </label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        placeholder="Please explain why you need a password reset (e.g., forgot password, security concerns, etc.)"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        required
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    className="btn btn-primary w-100"
                                    disabled={loading}
                                >
                                    {loading ? 'Submitting...' : 'Submit Request'}
                                </button>
                            </form>

                            <div className="alert alert-info mt-3">
                                <small>
                                    <strong>Note:</strong> Your request will be reviewed by an admin. 
                                    Once approved, you will receive a new password.
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="card shadow">
                        <div className="card-body">
                            <h4 className="text-secondary mb-3">📋 My Request History</h4>

                            {fetchingRequests ? (
                                <p>Loading...</p>
                            ) : myRequests.length === 0 ? (
                                <p className="text-muted">No requests yet.</p>
                            ) : (
                                <div className="list-group">
                                    {myRequests.map(request => (
                                        <div key={request._id} className="list-group-item">
                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                <span className={`badge ${getStatusBadge(request.status)}`}>
                                                    {request.status}
                                                </span>
                                                <small className="text-muted">
                                                    {new Date(request.createdAt).toLocaleDateString()}
                                                </small>
                                            </div>
                                            
                                            <p className="mb-1"><strong>Reason:</strong> {request.reason}</p>
                                            
                                            {request.adminComment && (
                                                <div className="alert alert-light mt-2 mb-0">
                                                    <small>
                                                        <strong>Admin Comment:</strong> {request.adminComment}
                                                    </small>
                                                </div>
                                            )}

                                            {request.status === 'Approved' && request.newPassword && (
                                                <div className="alert alert-success mt-2 mb-0">
                                                    <small>
                                                        <strong>New Password:</strong> 
                                                        <code className="ms-2">{request.newPassword}</code>
                                                        <br/>
                                                        <em>Please save this and change it after logging in.</em>
                                                    </small>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PasswordResetRequest;
