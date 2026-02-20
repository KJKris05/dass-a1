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

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // 1. Get Event Details (for name)
                const eventRes = await axios.get(`http://localhost:5000/api/events/${id}`);
                setEventName(eventRes.data.name);

                // 2. Get Attendees
                const res = await axios.get(`http://localhost:5000/api/events/${id}/attendees`, {
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
        // CSV Export with form responses
        const headers = ["Ticket ID", "Name", "Email", "Status", "Contact", "Type"];
        
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

    if (loading) return <div className="text-center mt-5">Loading...</div>;

    return (
        <div className="container mt-5">
            <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</button>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Attendees for: {eventName}</h2>
                <button className="btn btn-success" onClick={downloadCSV}>Example Export CSV</button>
            </div>

            <div className="card shadow">
                <div className="card-body">
                    {attendees.length === 0 ? (
                        <p>No registrations yet.</p>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover">
                                <thead className="table-light">
                                    <tr>
                                        <th>Ticket ID</th>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {attendees.map((item, index) => (
                                        <React.Fragment key={item._id}>
                                            <tr>
                                                <td><small>{item.ticketId}</small></td>
                                                <td>{item.user.firstName} {item.user.lastName}</td>
                                                <td>{item.user.email}</td>
                                                <td>
                                                    <span className={`badge ${item.status === 'Registered' ? 'bg-success' : 'bg-warning'}`}>
                                                        {item.status}
                                                    </span>
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
