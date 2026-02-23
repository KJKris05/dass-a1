import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const EditEvent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [event, setEvent] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        eventType: '',
        registrationDeadline: '',
        startDate: '',
        endDate: '',
        registrationLimit: '',
        registrationFee: '',
        eligibility: '',
        tags: '',
        status: ''
    });
    const [formFields, setFormFields] = useState([]);
    const [merchVariants, setMerchVariants] = useState([]);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/events/${id}`);
                const e = res.data;
                setEvent(e);
                
                // Format date for datetime-local input
                const formatDate = (dateString) => {
                    const date = new Date(dateString);
                    return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
                };

                setFormData({
                    name: e.name || '',
                    description: e.description || '',
                    eventType: e.eventType || '',
                    registrationDeadline: formatDate(e.registrationDeadline),
                    startDate: formatDate(e.startDate),
                    endDate: formatDate(e.endDate),
                    registrationLimit: e.registrationLimit || '',
                    registrationFee: e.registrationFee || 0,
                    eligibility: e.eligibility || '',
                    tags: e.tags ? e.tags.join(', ') : '',
                    status: e.status || ''
                });
                
                setFormFields(e.formFields || []);
                setMerchVariants(e.merchandiseVariants || []);
                setLoading(false);
            } catch (err) {
                console.error(err);
                alert('Error loading event');
                navigate('/dashboard');
            }
        };
        fetchEvent();
    }, [id, navigate]);

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

    // Form builder functions for Draft events
    const addQuestion = () => {
        setFormFields([...formFields, { label: '', fieldType: 'text', required: false, options: [] }]);
    };
    const updateQuestion = (index, field, value) => {
        const updated = [...formFields];
        updated[index][field] = value;
        setFormFields(updated);
    };
    const handleOptionChange = (qIndex, optionString) => {
        const optionsArray = optionString.split(',').map(s => s.trim());
        updateQuestion(qIndex, 'options', optionsArray);
    };
    const removeQuestion = (index) => setFormFields(formFields.filter((_, i) => i !== index));

    // Merchandise functions for Draft events
    const addVariant = () => {
        setMerchVariants([...merchVariants, { name: '', price: 0, stock: 10, maxPerUser: 1 }]);
    };
    const updateVariant = (index, field, value) => {
        const updated = [...merchVariants];
        updated[index][field] = value;
        setMerchVariants(updated);
    };
    const removeVariant = (index) => setMerchVariants(merchVariants.filter((_, i) => i !== index));

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            
            let payload = { ...formData };
            
            // For Draft events, include all fields
            if (event.status === 'Draft') {
                payload.tags = formData.tags.split(',').map(tag => tag.trim()).filter(t => t);
                payload.formFields = event.eventType === 'Normal' ? formFields : [];
                payload.merchandiseVariants = event.eventType === 'Merchandise' ? merchVariants : [];
            }
            
            await axios.put(`http://localhost:5000/api/events/${id}`, payload, {
                headers: { 'x-auth-token': token }
            });
            alert('Event Updated Successfully');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            
            // Better error handling
            if (err.response?.data?.message) {
                // Mongoose validation error
                const errorMsg = err.response.data.message;
                if (errorMsg.includes('Event validation failed')) {
                    // Parse individual field errors
                    const fieldErrors = [];
                    if (errorMsg.includes('description')) fieldErrors.push('Description');
                    if (errorMsg.includes('registrationDeadline')) fieldErrors.push('Registration Deadline');
                    if (errorMsg.includes('startDate')) fieldErrors.push('Start Date');
                    if (errorMsg.includes('endDate')) fieldErrors.push('End Date');
                    if (errorMsg.includes('name')) fieldErrors.push('Event Name');
                    
                    if (fieldErrors.length > 0) {
                        alert(`Missing required fields:\n- ${fieldErrors.join('\n- ')}`);
                    } else {
                        alert('Please fill all required fields');
                    }
                } else {
                    alert(errorMsg);
                }
            } else if (err.response?.data?.msg) {
                alert(err.response.data.msg);
            } else {
                alert('Error updating event. Please check all required fields.');
            }
        }
    };

    if (loading) return <div className="text-center mt-5">Loading...</div>;

    const isDraft = event.status === 'Draft';
    const isOngoing = event.status === 'Ongoing';

    return (
        <div className="container mt-5">
            <div className="card shadow">
                <div className="card-header bg-warning">
                    <h4>Edit Event: {event.name}</h4>
                    <small className="text-muted">Status: <strong>{event.status}</strong></small>
                </div>
                <div className="card-body">
                    {isOngoing && (
                        <div className="alert alert-info">
                            <strong>Note:</strong> This event is currently Ongoing. You can only change its status to Completed or Cancelled.
                        </div>
                    )}
                    
                    <form onSubmit={onSubmit}>
                        {/* For Ongoing events: Only show status dropdown */}
                        {isOngoing ? (
                            <div className="mb-3">
                                <label className="form-label">Event Status</label>
                                <select 
                                    className="form-select" 
                                    name="status" 
                                    value={formData.status} 
                                    onChange={onChange}
                                    required
                                >
                                    <option value="Ongoing">Ongoing</option>
                                    <option value="Completed">Completed</option>
                                    <option value="Cancelled">Cancelled</option>
                                </select>
                            </div>
                        ) : (
                            <>
                                {/* For Draft events: Show all fields */}
                                {isDraft && (
                                    <>
                                        <div className="mb-3">
                                            <label className="form-label">Event Name *</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                name="name" 
                                                value={formData.name} 
                                                onChange={onChange} 
                                                required 
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Event Type *</label>
                                            <select 
                                                className="form-select" 
                                                name="eventType" 
                                                value={formData.eventType} 
                                                onChange={onChange}
                                                disabled
                                            >
                                                <option value="Normal">Normal Event</option>
                                                <option value="Merchandise">Merchandise Event</option>
                                            </select>
                                            <small className="text-muted">Event type cannot be changed</small>
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Start Date & Time *</label>
                                            <input 
                                                type="datetime-local" 
                                                className="form-control" 
                                                name="startDate" 
                                                value={formData.startDate} 
                                                onChange={onChange} 
                                                required 
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">End Date & Time *</label>
                                            <input 
                                                type="datetime-local" 
                                                className="form-control" 
                                                name="endDate" 
                                                value={formData.endDate} 
                                                onChange={onChange} 
                                                required 
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Registration Fee *</label>
                                            <input 
                                                type="number" 
                                                className="form-control" 
                                                name="registrationFee" 
                                                value={formData.registrationFee} 
                                                onChange={onChange} 
                                                min="0"
                                                required 
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Eligibility</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                name="eligibility" 
                                                value={formData.eligibility} 
                                                onChange={onChange} 
                                                placeholder="e.g., Open to All, IIIT Students Only"
                                            />
                                        </div>

                                        <div className="mb-3">
                                            <label className="form-label">Tags (comma-separated)</label>
                                            <input 
                                                type="text" 
                                                className="form-control" 
                                                name="tags" 
                                                value={formData.tags} 
                                                onChange={onChange} 
                                                placeholder="e.g., Music, Cultural, Tech"
                                            />
                                        </div>
                                    </>
                                )}

                                {/* Common fields for Draft and Published/Completed/Cancelled */}
                                <div className="mb-3">
                                    <label className="form-label">Description *</label>
                                    <textarea 
                                        className="form-control" 
                                        name="description" 
                                        value={formData.description} 
                                        onChange={onChange} 
                                        rows="4" 
                                        required
                                    ></textarea>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Registration Deadline *</label>
                                    <input 
                                        type="datetime-local" 
                                        className="form-control" 
                                        name="registrationDeadline" 
                                        value={formData.registrationDeadline} 
                                        onChange={onChange} 
                                        required 
                                    />
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Registration Limit *</label>
                                    <input 
                                        type="number" 
                                        className="form-control" 
                                        name="registrationLimit" 
                                        value={formData.registrationLimit} 
                                        onChange={onChange} 
                                        min="1"
                                        required 
                                    />
                                </div>

                                {/* Custom Form Fields for Draft Normal Events */}
                                {isDraft && event.eventType === 'Normal' && (
                                    <div className="mb-4">
                                        <h5>Custom Registration Form</h5>
                                        {formFields.map((field, index) => (
                                            <div key={index} className="card mb-2 p-3">
                                                <div className="row">
                                                    <div className="col-md-4">
                                                        <input 
                                                            type="text" 
                                                            className="form-control mb-2" 
                                                            placeholder="Question Label"
                                                            value={field.label}
                                                            onChange={(e) => updateQuestion(index, 'label', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <select 
                                                            className="form-select mb-2"
                                                            value={field.fieldType}
                                                            onChange={(e) => updateQuestion(index, 'fieldType', e.target.value)}
                                                        >
                                                            <option value="text">Short Text</option>
                                                            <option value="number">Number</option>
                                                            <option value="dropdown">Dropdown</option>
                                                            <option value="file">File Upload</option>
                                                        </select>
                                                    </div>
                                                    <div className="col-md-3">
                                                        <div className="form-check">
                                                            <input 
                                                                type="checkbox" 
                                                                className="form-check-input"
                                                                checked={field.required}
                                                                onChange={(e) => updateQuestion(index, 'required', e.target.checked)}
                                                            />
                                                            <label className="form-check-label">Required</label>
                                                        </div>
                                                    </div>
                                                    <div className="col-md-2">
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => removeQuestion(index)}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                                {field.fieldType === 'dropdown' && (
                                                    <input 
                                                        type="text" 
                                                        className="form-control mt-2" 
                                                        placeholder="Options (comma-separated): e.g., Option1, Option2"
                                                        value={field.options.join(', ')}
                                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-secondary" onClick={addQuestion}>
                                            + Add Question
                                        </button>
                                    </div>
                                )}

                                {/* Merchandise Variants for Draft Merchandise Events */}
                                {isDraft && event.eventType === 'Merchandise' && (
                                    <div className="mb-4">
                                        <h5>Merchandise Variants</h5>
                                        {merchVariants.map((variant, index) => (
                                            <div key={index} className="card mb-2 p-3">
                                                <div className="row">
                                                    <div className="col-md-3">
                                                        <input 
                                                            type="text" 
                                                            className="form-control" 
                                                            placeholder="Variant Name (e.g., Size M)"
                                                            value={variant.name}
                                                            onChange={(e) => updateVariant(index, 'name', e.target.value)}
                                                        />
                                                    </div>
                                                    <div className="col-md-2">
                                                        <input 
                                                            type="number" 
                                                            className="form-control" 
                                                            placeholder="Price"
                                                            value={variant.price}
                                                            onChange={(e) => updateVariant(index, 'price', Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div className="col-md-2">
                                                        <input 
                                                            type="number" 
                                                            className="form-control" 
                                                            placeholder="Stock"
                                                            value={variant.stock}
                                                            onChange={(e) => updateVariant(index, 'stock', Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div className="col-md-2">
                                                        <input 
                                                            type="number" 
                                                            className="form-control" 
                                                            placeholder="Max/User"
                                                            value={variant.maxPerUser}
                                                            onChange={(e) => updateVariant(index, 'maxPerUser', Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div className="col-md-3">
                                                        <button 
                                                            type="button" 
                                                            className="btn btn-danger btn-sm"
                                                            onClick={() => removeVariant(index)}
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <button type="button" className="btn btn-secondary" onClick={addVariant}>
                                            + Add Variant
                                        </button>
                                    </div>
                                )}

                                <div className="mb-3">
                                    <label className="form-label">Event Status</label>
                                    <select 
                                        className="form-select" 
                                        name="status" 
                                        value={formData.status} 
                                        onChange={onChange}
                                    >
                                        {isDraft && <option value="Draft">Draft</option>}
                                        <option value="Published">Published</option>
                                        <option value="Ongoing">Ongoing</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </>
                        )}

                        <button type="submit" className="btn btn-primary">Update Event</button>
                        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/dashboard')}>Cancel</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditEvent;
