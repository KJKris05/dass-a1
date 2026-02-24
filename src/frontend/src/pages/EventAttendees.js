import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const EventAttendees = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [attendees, setAttendees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [eventName, setEventName] = useState('');
    const [expandedRow, setExpandedRow] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [paymentFilter, setPaymentFilter] = useState('all');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // 1. Get Event Details (for name)
                const eventRes = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/${id}`);
                setEventName(eventRes.data.name);

                // 2. Get Attendees
                const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/${id}/attendees`, {
                    headers: { 'x-auth-token': token }
                });
                setAttendees(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                alert('Error fetching attendees. Are you the organizer?');
                navigate('/dashboard');
            }
        };
        fetchData();
    }, [id, navigate]);

    const downloadCSV = () => {
        // CSV Export with form responses and payment info
        const headers = ["Ticket ID", "Name", "Email", "Status", "Payment Status", "Contact", "Type"];
        
        // Add form response headers if any attendee has responses
        const formQuestions = attendees.length > 0 && attendees[0].formResponses 
            ? attendees[0].formResponses.map(r => r.questionLabel) 
            : [];
        
        const allHeaders = [...headers, ...formQuestions];
        
        const rows = attendees.map(a => {
            const basicInfo = [
                a.ticketId, 
                `${a.user.firstName} ${a.user.lastName}`, 
                a.user.email, 
                a.status,
                a.paymentStatus || 'N/A',
                a.user.contactNumber || 'N/A',
                a.user.participantType || 'N/A'
            ];
            
            // Add form response values
            const responseValues = a.formResponses 
                ? a.formResponses.map(r => r.answer || 'N/A')
                : [];
            
            return [...basicInfo, ...responseValues];
        });

        let csvContent = "data:text/csv;charset=utf-8," 
            + allHeaders.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${eventName}_attendees.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const toggleRow = (index) => {
        setExpandedRow(expandedRow === index ? null : index);
    };

    // Filter and search functionality
    const filteredAttendees = attendees.filter(attendee => {
        // Search filter
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            attendee.user.firstName.toLowerCase().includes(searchLower) ||
            attendee.user.lastName.toLowerCase().includes(searchLower) ||
            attendee.user.email.toLowerCase().includes(searchLower) ||
            attendee.ticketId.toLowerCase().includes(searchLower);
        
        // Status filter
        const matchesStatus = statusFilter === 'all' || attendee.status === statusFilter;
        
        // Payment filter
        const matchesPayment = paymentFilter === 'all' || attendee.paymentStatus === paymentFilter;
        
        return matchesSearch && matchesStatus && matchesPayment;
    });

    if (loading) return <div className="text-center mt-5">Loading...</div>;

    return (
        <div className="container mt-5">
            <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</button>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Attendees for: {eventName}</h2>
                <button className="btn btn-success" onClick={downloadCSV}>📥 Export CSV</button>
            </div>

            {/* Search and Filter Section */}
            <div className="card shadow mb-4">
                <div className="card-body">
                    <div className="row g-3">
                        <div className="col-md-4">
                            <label className="form-label fw-bold">🔍 Search</label>
                            <input 
                                type="text"
                                className="form-control"
                                placeholder="Search by name, email, or ticket ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold">📋 Registration Status</label>
                            <select 
                                className="form-select"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="all">All Statuses</option>
                                <option value="Registered">Registered</option>
                                <option value="Pending">Pending</option>
                                <option value="Approved">Approved</option>
                                <option value="Attended">Attended</option>
                                <option value="Rejected">Rejected</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>
                        <div className="col-md-4">
                            <label className="form-label fw-bold">💳 Payment Status</label>
                            <select 
                                className="form-select"
                                value={paymentFilter}
                                onChange={(e) => setPaymentFilter(e.target.value)}
                            >
                                <option value="all">All Payment Statuses</option>
                                <option value="Completed">Completed</option>
                                <option value="Pending">Pending</option>
                                <option value="Failed">Failed</option>
                            </select>
                        </div>
                    </div>
                    <div className="mt-3">
                        <small className="text-muted">
                            Showing {filteredAttendees.length} of {attendees.length} attendees
                        </small>
                    </div>
                </div>
            </div>

            <div className="card shadow">
                <div className="card-body">
                    {filteredAttendees.length === 0 ? (
                        <p className="text-center text-muted py-4">
                            {attendees.length === 0 ? 'No registrations yet.' : 'No attendees match your search criteria.'}
                        </p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th>Ticket ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Payment</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredAttendees.map((item, index) => (
                                        <React.Fragment key={item._id}>
                                            <tr>
                                                <td><small>{item.ticketId}</small></td>
                                                <td>{item.user.firstName} {item.user.lastName}</td>
                                                <td>{item.user.email}</td>
                                                <td>
                                                    <span className={`badge ${
                                                        item.status === 'Registered' || item.status === 'Approved' || item.status === 'Attended' ? 'bg-success' : 
                                                        item.status === 'Pending' ? 'bg-warning' :
                                                        item.status === 'Rejected' || item.status === 'Cancelled' ? 'bg-danger' :
                                                        'bg-secondary'
                                                    }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <span className={`badge ${
                                                        item.paymentStatus === 'Completed' ? 'bg-success' :
                                                        item.paymentStatus === 'Pending' ? 'bg-warning' :
                                                        item.paymentStatus === 'Failed' ? 'bg-danger' :
                                                        'bg-secondary'
                                                    }`}>
                                                        {item.paymentStatus || 'N/A'}
                                                    </span>
                                                    {item.paymentProof && (
                                                        <a 
                                                            href={item.paymentProof} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="ms-2"
                                                            title="View payment proof"
                                                        >
                                                            🔗
                                                        </a>
                                                    )}
                                                </td>
                                                <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    {item.formResponses && item.formResponses.length > 0 && (
                                                        <button 
                                                            className="btn btn-sm btn-outline-primary"
                                                            onClick={() => toggleRow(index)}
                                                        >
                                                            {expandedRow === index ? '▲ Hide' : '▼ View'} Form
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            {expandedRow === index && item.formResponses && item.formResponses.length > 0 && (
                                                <tr>
                                                    <td colSpan="6" className="bg-light">
                                                        <div className="p-3">
                                                            <h6 className="mb-3">📋 Form Responses:</h6>
                                                            <div className="row">
                                                                {item.formResponses.map((response, idx) => (
                                                                    <div key={idx} className="col-md-6 mb-2">
                                                                        <strong>{response.questionLabel}:</strong>
                                                                        <br />
                                                                        <span className="text-muted">
                                                                            {response.answer || 'No answer provided'}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
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

export default EventAttendees;
