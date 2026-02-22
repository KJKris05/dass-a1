import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const PaymentApprovals = () => {
    const { id } = useParams(); // Event ID
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [eventName, setEventName] = useState('');
    const [filter, setFilter] = useState('all'); // all, pending, approved, rejected

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // Get Event Details
                const eventRes = await axios.get(`http://localhost:5000/api/events/${id}`);
                setEventName(eventRes.data.name);

                // Get Payment Orders
                const res = await axios.get(`http://localhost:5000/api/registrations/event/${id}/pending-payments`, {
                    headers: { 'x-auth-token': token }
                });
                setOrders(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                alert('Error fetching orders. Are you the organizer?');
                navigate('/dashboard');
            }
        };
        fetchData();
    }, [id, navigate]);

    const handleApprove = async (orderId) => {
        if (window.confirm('Approve this payment? QR code will be generated and email will be sent.')) {
            try {
                const token = localStorage.getItem('token');
                await axios.put(`http://localhost:5000/api/registrations/${orderId}/approve-payment`, 
                    {}, 
                    { headers: { 'x-auth-token': token } }
                );
                
                // Update local state
                setOrders(orders.map(o => 
                    o._id === orderId 
                        ? { ...o, status: 'Approved', paymentStatus: 'Completed' } 
                        : o
                ));
                
                alert('Payment approved! Ticket sent to customer.');
            } catch (err) {
                alert('Error approving payment: ' + (err.response?.data?.msg || 'Unknown error'));
            }
        }
    };

    const handleReject = async (orderId) => {
        if (window.confirm('Reject this payment? Customer will be notified.')) {
            try {
                const token = localStorage.getItem('token');
                await axios.put(`http://localhost:5000/api/registrations/${orderId}/reject-payment`, 
                    {}, 
                    { headers: { 'x-auth-token': token } }
                );
                
                // Update local state
                setOrders(orders.map(o => 
                    o._id === orderId 
                        ? { ...o, status: 'Rejected', paymentStatus: 'Failed' } 
                        : o
                ));
                
                alert('Payment rejected.');
            } catch (err) {
                alert('Error rejecting payment: ' + (err.response?.data?.msg || 'Unknown error'));
            }
        }
    };

    const filteredOrders = orders.filter(order => {
        if (filter === 'pending') return order.paymentStatus === 'AwaitingApproval';
        if (filter === 'approved') return order.status === 'Approved';
        if (filter === 'rejected') return order.status === 'Rejected';
        return true; // all
    });

    if (loading) return <div className="text-center mt-5">Loading...</div>;

    return (
        <div className="container mt-5">
            <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</button>
            
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Payment Approvals: {eventName}</h2>
            </div>

            {/* Filter Tabs */}
            <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                    <button className={`nav-link ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
                        All ({orders.length})
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${filter === 'pending' ? 'active' : ''}`} onClick={() => setFilter('pending')}>
                        Pending ({orders.filter(o => o.paymentStatus === 'AwaitingApproval').length})
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${filter === 'approved' ? 'active' : ''}`} onClick={() => setFilter('approved')}>
                        Approved ({orders.filter(o => o.status === 'Approved').length})
                    </button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link ${filter === 'rejected' ? 'active' : ''}`} onClick={() => setFilter('rejected')}>
                        Rejected ({orders.filter(o => o.status === 'Rejected').length})
                    </button>
                </li>
            </ul>

            {/* Orders Table */}
            <div className="card shadow">
                <div className="card-body">
                    {filteredOrders.length === 0 ? (
                        <p className="text-muted">No orders to display.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th>Customer</th>
                                        <th>Email</th>
                                        <th>Item</th>
                                        <th>Payment Proof</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredOrders.map(order => (
                                        <tr key={order._id}>
                                            <td>{order.user.firstName} {order.user.lastName}</td>
                                            <td>{order.user.email}</td>
                                            <td>
                                                {order.formResponses.find(r => r.questionLabel === 'Variant')?.answer || 'N/A'}
                                            </td>
                                            <td>
                                                {order.paymentProof ? (
                                                    <a href={order.paymentProof} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                                                        View Proof
                                                    </a>
                                                ) : (
                                                    <span className="text-muted">Not uploaded</span>
                                                )}
                                            </td>
                                            <td>
                                                <span className={`badge ${
                                                    order.paymentStatus === 'AwaitingApproval' ? 'bg-warning' :
                                                    order.status === 'Approved' ? 'bg-success' :
                                                    order.status === 'Rejected' ? 'bg-danger' : 'bg-secondary'
                                                }`}>
                                                    {order.paymentStatus === 'AwaitingApproval' ? 'Pending' : order.status}
                                                </span>
                                            </td>
                                            <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                            <td>
                                                {order.paymentStatus === 'AwaitingApproval' && (
                                                    <>
                                                        <button 
                                                            className="btn btn-sm btn-success me-2"
                                                            onClick={() => handleApprove(order._id)}
                                                        >
                                                            ✓ Approve
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-danger"
                                                            onClick={() => handleReject(order._id)}
                                                        >
                                                            ✗ Reject
                                                        </button>
                                                    </>
                                                )}
                                                {order.status === 'Approved' && (
                                                    <span className="text-success">✓ Approved</span>
                                                )}
                                                {order.status === 'Rejected' && (
                                                    <span className="text-danger">✗ Rejected</span>
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
        </div>
    );
};

export default PaymentApprovals;
