import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const EventDetail = () => {
    const { id } = useParams(); // Get ID from URL
    const navigate = useNavigate();
    
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- State for Registration ---
    const [formResponses, setFormResponses] = useState({}); // Stores answers to custom Qs

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/events/all`);
                // Note: Ideally we should have a 'get by ID' API, but filtering 'all' works for now
                const foundEvent = res.data.find(e => e._id === id);
                if (foundEvent) {
                    setEvent(foundEvent);
                } else {
                    setError('Event not found');
                }
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load event');
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id]);

    // --- Handle Custom Form Input (Normal Events) ---
    const handleInputChange = (label, value) => {
        setFormResponses({
            ...formResponses,
            [label]: value
        });
    };

    // --- Submit Registration (Normal Events) ---
    const onRegister = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) return navigate('/login');

            // Convert our simple object { "Question": "Answer" } to the array format backend expects
            const formattedResponses = Object.keys(formResponses).map(key => ({
                questionLabel: key,
                answer: formResponses[key]
            }));

            await axios.post(`http://localhost:5000/api/registrations/${id}`, 
                { formResponses: formattedResponses }, 
                { headers: { 'x-auth-token': token } }
            );

            alert('Registration Successful! Ticket generated.');
            navigate('/dashboard');

        } catch (err) {
            alert(err.response?.data?.msg || 'Registration failed');
        }
    };

    // --- Buy Merchandise (Merch Events) ---
    // Note: For now, this just registers them. In a real app, this would open a Payment Gateway.
    const onBuyItem = async (variantName) => {
        if(window.confirm(`Confirm purchase of ${variantName}?`)) {
             try {
                const token = localStorage.getItem('token');
                if (!token) return navigate('/login');
                
                // We treat buying an item as a "registration" for that event
                await axios.post(`http://localhost:5000/api/registrations/${id}`, 
                    { formResponses: [{ questionLabel: 'Variant', answer: variantName }] }, 
                    { headers: { 'x-auth-token': token } }
                );

                alert('Order Placed Successfully!');
                navigate('/dashboard');
            } catch (err) {
                alert(err.response?.data?.msg || 'Purchase failed');
            }
        }
    }

    if (loading) return <div className="text-center mt-5">Loading...</div>;
    if (error) return <div className="alert alert-danger text-center mt-5">{error}</div>;

    return (
        <div className="container mt-5 mb-5">
            <div className="row">
                {/* --- Left Column: Event Details --- */}
                <div className="col-md-8">
                    <div className="card shadow-sm mb-4">
                        {/* Header Image Placeholder */}
                        <div className="bg-light text-center py-5">
                            <h1 className="display-4">🎉</h1>
                        </div>
                        <div className="card-body">
                            <span className={`badge mb-2 ${event.eventType === 'Normal' ? 'bg-primary' : 'bg-warning text-dark'}`}>
                                {event.eventType}
                            </span>
                            <h1 className="card-title">{event.name}</h1>
                            <p className="text-muted">
                                Hosted by: {event.organizer.firstName} {event.organizer.lastName} 
                                ({event.organizer.organizerCategory})
                            </p>
                            
                            <hr />
                            <h5>About this Event</h5>
                            <p className="card-text" style={{ whiteSpace: 'pre-line' }}>{event.description}</p>
                            
                            {/* Tags */}
                            {event.tags && event.tags.map((tag, i) => (
                                <span key={i} className="badge bg-secondary me-1">#{tag}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- Right Column: Action Box --- */}
                <div className="col-md-4">
                    <div className="card shadow border-0">
                        <div className="card-header bg-dark text-white">
                            Event Details
                        </div>
                        <div className="card-body">
                            <ul className="list-group list-group-flush mb-3">
                                <li className="list-group-item">
                                    <strong>📅 Start:</strong> <br/>
                                    {new Date(event.startDate).toLocaleString()}
                                </li>
                                <li className="list-group-item">
                                    <strong>🏁 End:</strong> <br/>
                                    {new Date(event.endDate).toLocaleString()}
                                </li>
                                <li className="list-group-item">
                                    <strong>💰 Price:</strong> {event.price === 0 ? 'FREE' : `₹${event.price}`}
                                </li>
                                <li className="list-group-item">
                                    <strong>📍 Eligibility:</strong> {event.eligibility}
                                </li>
                            </ul>

                            {/* --- ACTION LOGIC --- */}
                            
                            {/* A. MERCHANDISE LOGIC */}
                            {event.eventType === 'Merchandise' ? (
                                <div>
                                    <h5>Select Item:</h5>
                                    {event.merchandiseVariants.map((variant, idx) => (
                                        <div key={idx} className="d-flex justify-content-between align-items-center border p-2 mb-2 rounded">
                                            <div>
                                                <strong>{variant.name}</strong><br/>
                                                <small>₹{variant.price}</small>
                                            </div>
                                            <button 
                                                className="btn btn-sm btn-success"
                                                disabled={variant.stock <= 0}
                                                onClick={() => onBuyItem(variant.name)}
                                            >
                                                {variant.stock > 0 ? 'Buy' : 'Sold Out'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                /* B. NORMAL EVENT LOGIC */
                                <div>
                                    {/* Custom Questions Form */}
                                    {event.formFields && event.formFields.length > 0 && (
                                        <div className="mb-3 bg-light p-2 rounded">
                                            <h6>Additional Details Required:</h6>
                                            {event.formFields.map((field, idx) => (
                                                <div key={idx} className="mb-2">
                                                    <label className="form-label small">{field.label}</label>
                                                    
                                                    {field.fieldType === 'dropdown' ? (
                                                        <select className="form-select form-select-sm" 
                                                            onChange={(e) => handleInputChange(field.label, e.target.value)}>
                                                            <option value="">Select...</option>
                                                            {field.options.map((opt, i) => (
                                                                <option key={i} value={opt}>{opt}</option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <input 
                                                            type={field.fieldType} 
                                                            className="form-control form-control-sm"
                                                            onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                        />
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button 
                                        className="btn btn-primary w-100 btn-lg" 
                                        onClick={onRegister}
                                    >
                                        Confirm Registration
                                    </button>
                                </div>
                            )}

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventDetail;