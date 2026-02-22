// frontend/src/pages/ManagePasswordResets.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ManagePasswordResets = () => {
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('All');
    const [processing, setProcessing] = useState(null);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [generatedPasswordInfo, setGeneratedPasswordInfo] = useState(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/password-reset/all', {
                headers: { 'x-auth-token': token }
            });
            setRequests(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Failed to fetch requests');
            setLoading(false);
        }
    };

    const handleApprove = async (requestId) => {
        const comment = prompt('Enter admin comment (optional):');
        if (comment === null) return; // User cancelled

        try {
            setProcessing(requestId);
            const token = localStorage.getItem('token');
            const res = await axios.put(
                `http://localhost:5000/api/password-reset/${requestId}/approve`,
                { adminComment: comment },
                { headers: { 'x-auth-token': token } }
            );

            // Show password modal with generated password
            setGeneratedPasswordInfo(res.data);
            setShowPasswordModal(true);

            fetchRequests(); // Refresh list
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to approve request');
        } finally {
            setProcessing(null);
        }
    };

    const handleReject = async (requestId) => {
        const comment = prompt('Enter reason for rejection (required):');
        if (!comment || !comment.trim()) {
            alert('Rejection reason is required');
            return;
        }

        try {
            setProcessing(requestId);
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/password-reset/${requestId}/reject`,
                { adminComment: comment },
                { headers: { 'x-auth-token': token } }
            );

            alert('Request rejected successfully');
            fetchRequests(); // Refresh list
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to reject request');
        } finally {
            setProcessing(null);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert('Copied to clipboard!');
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

    const filteredRequests = filterStatus === 'All' 
        ? requests 
        : requests.filter(r => r.status === filterStatus);

    return (
        <div className="container mt-4">
            <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/dashboard')}>
                ← Back to Dashboard
            </button>

            <div className="card shadow">
                <div className="card-body">
                    <h3 className="text-danger mb-4">🔐 Password Reset Requests Management</h3>

                    {/* Filter Tabs */}
                    <ul className="nav nav-tabs mb-4">
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${filterStatus === 'All' ? 'active' : ''}`}
                                onClick={() => setFilterStatus('All')}
                            >
                                All ({requests.length})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${filterStatus === 'Pending' ? 'active' : ''}`}
                                onClick={() => setFilterStatus('Pending')}
                            >
                                Pending ({requests.filter(r => r.status === 'Pending').length})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${filterStatus === 'Approved' ? 'active' : ''}`}
                                onClick={() => setFilterStatus('Approved')}
                            >
                                Approved ({requests.filter(r => r.status === 'Approved').length})
                            </button>
                        </li>
                        <li className="nav-item">
                            <button 
                                className={`nav-link ${filterStatus === 'Rejected' ? 'active' : ''}`}
                                onClick={() => setFilterStatus('Rejected')}
                            >
                                Rejected ({requests.filter(r => r.status === 'Rejected').length})
                            </button>
                        </li>
                    </ul>

                    {loading ? (
                        <p>Loading...</p>
                    ) : filteredRequests.length === 0 ? (
                        <div className="alert alert-info">No requests found.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Organizer</th>
                                        <th>Email</th>
                                        <th>Club Name</th>
                                        <th>Reason</th>
                                        <th>Status</th>
                                        <th>Admin Comment</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRequests.map(request => (
                                        <tr key={request._id}>
                                            <td>
                                                <small>{new Date(request.createdAt).toLocaleDateString()}</small>
                                                <br/>
                                                <small className="text-muted">
                                                    {new Date(request.createdAt).toLocaleTimeString()}
                                                </small>
                                            </td>
                                            <td>
                                                <strong>
                                                    {request.organizer?.firstName} {request.organizer?.lastName}
                                                </strong>
                                            </td>
                                            <td>{request.organizer?.email}</td>
                                            <td>{request.clubName}</td>
                                            <td>
                                                <small>{request.reason}</small>
                                            </td>
                                            <td>
                                                <span className={`badge ${getStatusBadge(request.status)}`}>
                                                    {request.status}
                                                </span>
                                                {request.status === 'Approved' && request.approvedAt && (
                                                    <div>
                                                        <small className="text-muted">
                                                            {new Date(request.approvedAt).toLocaleDateString()}
                                                        </small>
                                                    </div>
                                                )}
                                            </td>
                                            <td>
                                                <small>{request.adminComment || '-'}</small>
                                            </td>
                                            <td>
                                                {request.status === 'Pending' ? (
                                                    <div className="btn-group" role="group">
                                                        <button 
                                                            className="btn btn-sm btn-success"
                                                            onClick={() => handleApprove(request._id)}
                                                            disabled={processing === request._id}
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleReject(request._id)}
                                                            disabled={processing === request._id}
                                                        >
                                                            ✗ Reject
                                                        </button>
                                                    </div>
                                                ) : request.status === 'Approved' && request.newPassword ? (
                                                    <button 
                                                        className="btn btn-sm btn-info"
                                                        onClick={() => {
                                                            setGeneratedPasswordInfo({
                                                                newPassword: request.newPassword,
                                                                organizerEmail: request.organizer?.email,
                                                                organizerName: `${request.organizer?.firstName} ${request.organizer?.lastName}`,
                                                                clubName: request.clubName
                                                            });
                                                            setShowPasswordModal(true);
                                                        }}
                                                    >
                                                        🔑 View Password
                                                    </button>
                                                ) : (
                                                    <span className="text-muted">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Password Modal */}
            {showPasswordModal && generatedPasswordInfo && (
                <div 
                    className="modal show d-block" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                    onClick={() => setShowPasswordModal(false)}
                >
                    <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-content">
                            <div className="modal-header bg-success text-white">
                                <h5 className="modal-title">✅ Password Reset Approved</h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => setShowPasswordModal(false)}
                                />
                            </div>
                            <div className="modal-body">

                                <div className="mb-3">
                                    <label className="form-label"><strong>Organizer:</strong></label>
                                    <p>{generatedPasswordInfo.organizerName} </p>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label"><strong>Email:</strong></label>
                                    <p>{generatedPasswordInfo.organizerEmail}</p>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label"><strong>New Password:</strong></label>
                                    <div className="input-group">
                                        <input 
                                            type="text" 
                                            className="form-control bg-light font-monospace fs-5"
                                            value={generatedPasswordInfo.newPassword}
                                            readOnly
                                        />
                                        <button 
                                            className="btn btn-outline-secondary"
                                            onClick={() => copyToClipboard(generatedPasswordInfo.newPassword)}
                                        >
                                            📋 Copy
                                        </button>
                                    </div>
                                </div>

                                <div className="alert alert-info">
                                    <small>
                                        Share this password to the organizer via a secure channel for login. This password can also be viewed in the request history of the organizer.
                                    </small>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => setShowPasswordModal(false)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ManagePasswordResets;
