import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const EventAnalytics = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);

    const fetchAnalytics = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/${id}/analytics`, {
                headers: { 'x-auth-token': token }
            });
            setAnalytics(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Failed to load analytics');
            navigate('/dashboard');
        }
    };

    if (loading) {
        return <div className="text-center mt-5"><h3>Loading Analytics...</h3></div>;
    }

    const { summary, registrationTrend, paymentBreakdown, statusBreakdown, recentRegistrations, eventName, eventType } = analytics;

    return (
        <div className="container mt-4 mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>📊 Event Analytics</h2>
                    <h5 className="text-muted">{eventName}</h5>
                    <span className="badge bg-info">{eventType}</span>
                </div>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </button>
            </div>

            {/* Summary Cards */}
            <div className="row mb-4">
                <div className="col-md-3 mb-3">
                    <div className="card text-center shadow-sm">
                        <div className="card-body">
                            <h6 className="text-muted">Total Registrations</h6>
                            <h2 className="text-primary">{summary.totalRegistrations}</h2>
                            <small className="text-muted">
                                {summary.spotsRemaining} spots remaining
                            </small>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-3">
                    <div className="card text-center shadow-sm">
                        <div className="card-body">
                            <h6 className="text-muted">
                                {eventType === 'Merchandise' ? 'Completed Sales' : 'Confirmed'}
                            </h6>
                            <h2 className="text-success">{summary.completedSales}</h2>
                            {eventType === 'Merchandise' && (
                                <small className="text-warning">
                                    {summary.pendingApprovals} pending approval
                                </small>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-3">
                    <div className="card text-center shadow-sm">
                        <div className="card-body">
                            <h6 className="text-muted">Attendance</h6>
                            <h2 className="text-info">{summary.attendedCount}</h2>
                            <small className="text-muted">
                                {summary.attendanceRate} attendance rate
                            </small>
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-3">
                    <div className="card text-center shadow-sm">
                        <div className="card-body">
                            <h6 className="text-muted">Total Revenue</h6>
                            <h2 className="text-success">₹{summary.totalRevenue}</h2>
                            <small className="text-muted">
                                from {summary.completedSales} {eventType === 'Merchandise' ? 'sales' : 'registrations'}
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="row mb-4">
                {/* Registration Trend */}
                <div className="col-md-6 mb-3">
                    <div className="card shadow-sm">
                        <div className="card-header bg-primary text-white">
                            <h5 className="mb-0">📈 Registration Trend</h5>
                        </div>
                        <div className="card-body">
                            {registrationTrend.length > 0 ? (
                                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                    {registrationTrend.map((item, index) => (
                                        <div key={index} className="d-flex justify-content-between mb-2">
                                            <span>{new Date(item.date).toLocaleDateString()}</span>
                                            <span className="badge bg-primary">{item.count} registrations</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted">No registrations yet</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Status Breakdown */}
                <div className="col-md-6 mb-3">
                    <div className="card shadow-sm">
                        <div className="card-header bg-info text-white">
                            <h5 className="mb-0">📊 Status Breakdown</h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-2">
                                <div className="d-flex justify-content-between">
                                    <span>✓ Registered</span>
                                    <strong>{statusBreakdown.registered}</strong>
                                </div>
                                <div className="progress" style={{ height: '8px' }}>
                                    <div 
                                        className="progress-bar bg-primary" 
                                        style={{ width: `${(statusBreakdown.registered / summary.totalRegistrations * 100) || 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="mb-2">
                                <div className="d-flex justify-content-between">
                                    <span>👤 Attended</span>
                                    <strong>{statusBreakdown.attended}</strong>
                                </div>
                                <div className="progress" style={{ height: '8px' }}>
                                    <div 
                                        className="progress-bar bg-success" 
                                        style={{ width: `${(statusBreakdown.attended / summary.totalRegistrations * 100) || 0}%` }}
                                    ></div>
                                </div>
                            </div>

                            {eventType === 'Merchandise' && (
                                <>
                                    <div className="mb-2">
                                        <div className="d-flex justify-content-between">
                                            <span>⏳ Pending</span>
                                            <strong>{statusBreakdown.pending}</strong>
                                        </div>
                                        <div className="progress" style={{ height: '8px' }}>
                                            <div 
                                                className="progress-bar bg-warning" 
                                                style={{ width: `${(statusBreakdown.pending / summary.totalRegistrations * 100) || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <div className="d-flex justify-content-between">
                                            <span>✓ Approved</span>
                                            <strong>{statusBreakdown.approved}</strong>
                                        </div>
                                        <div className="progress" style={{ height: '8px' }}>
                                            <div 
                                                className="progress-bar bg-info" 
                                                style={{ width: `${(statusBreakdown.approved / summary.totalRegistrations * 100) || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    <div className="mb-2">
                                        <div className="d-flex justify-content-between">
                                            <span>✗ Rejected</span>
                                            <strong>{statusBreakdown.rejected}</strong>
                                        </div>
                                        <div className="progress" style={{ height: '8px' }}>
                                            <div 
                                                className="progress-bar bg-danger" 
                                                style={{ width: `${(statusBreakdown.rejected / summary.totalRegistrations * 100) || 0}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </>
                            )}

                            <div className="mb-2">
                                <div className="d-flex justify-content-between">
                                    <span>✗ Cancelled</span>
                                    <strong>{statusBreakdown.cancelled}</strong>
                                </div>
                                <div className="progress" style={{ height: '8px' }}>
                                    <div 
                                        className="progress-bar bg-secondary" 
                                        style={{ width: `${(statusBreakdown.cancelled / summary.totalRegistrations * 100) || 0}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Breakdown */}
            <div className="row mb-4">
                <div className="col-md-12">
                    <div className="card shadow-sm">
                        <div className="card-header bg-success text-white">
                            <h5 className="mb-0">💰 Payment Status</h5>
                        </div>
                        <div className="card-body">
                            <div className="row text-center">
                                <div className="col-md-3">
                                    <h4 className="text-success">{paymentBreakdown.completed}</h4>
                                    <p className="text-muted">Completed</p>
                                </div>
                                <div className="col-md-3">
                                    <h4 className="text-warning">{paymentBreakdown.awaitingApproval}</h4>
                                    <p className="text-muted">Awaiting Approval</p>
                                </div>
                                <div className="col-md-3">
                                    <h4 className="text-info">{paymentBreakdown.pending}</h4>
                                    <p className="text-muted">Pending</p>
                                </div>
                                <div className="col-md-3">
                                    <h4 className="text-danger">{paymentBreakdown.failed}</h4>
                                    <p className="text-muted">Failed</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Registrations */}
            <div className="card shadow-sm">
                <div className="card-header bg-dark text-white">
                    <h5 className="mb-0">🕒 Recent Registrations (Last 10)</h5>
                </div>
                <div className="card-body">
                    {recentRegistrations.length > 0 ? (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Payment</th>
                                        <th>Registered At</th>
                                        <th>Attended At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentRegistrations.map((reg, index) => (
                                        <tr key={index}>
                                            <td>{reg.userName}</td>
                                            <td>{reg.email}</td>
                                            <td>
                                                <span className={`badge ${
                                                    reg.status === 'Attended' ? 'bg-success' :
                                                    reg.status === 'Approved' ? 'bg-info' :
                                                    reg.status === 'Pending' ? 'bg-warning' :
                                                    reg.status === 'Cancelled' ? 'bg-secondary' :
                                                    reg.status === 'Rejected' ? 'bg-danger' :
                                                    'bg-primary'
                                                }`}>
                                                    {reg.status}
                                                </span>
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    reg.paymentStatus === 'Completed' ? 'bg-success' :
                                                    reg.paymentStatus === 'AwaitingApproval' ? 'bg-warning' :
                                                    reg.paymentStatus === 'Failed' ? 'bg-danger' :
                                                    'bg-info'
                                                }`}>
                                                    {reg.paymentStatus}
                                                </span>
                                            </td>
                                            <td>{new Date(reg.registeredAt).toLocaleString()}</td>
                                            <td>{reg.attendedAt ? new Date(reg.attendedAt).toLocaleString() : '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className="text-muted text-center">No registrations yet</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EventAnalytics;
