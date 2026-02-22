import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateEvent = () => {
    const navigate = useNavigate();
    
    // --- Core Event Data ---
    // Note: We removed the date fields from here to manage them separately below
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        eventType: 'Normal',
        registrationLimit: 100,
        price: 0,
        eligibility: 'Open to All',
        tags: '' 
    });

    // --- Separate State for Dates (Fixes Format & Validation Issues) ---
    const [dateData, setDateData] = useState({
        startDateDate: '', startTime: '',
        endDateDate: '', endTime: '',
        regDateDate: '', regTime: ''
    });

    const [formFields, setFormFields] = useState([]);
    const [merchVariants, setMerchVariants] = useState([]);

    const { name, description, eventType, registrationLimit, price, eligibility, tags } = formData;
    const { startDateDate, startTime, endDateDate, endTime, regDateDate, regTime } = dateData;

    const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
    
    // Handle Date/Time inputs specifically
    const onDateChange = e => setDateData({ ...dateData, [e.target.name]: e.target.value });

    // --- Form Builder Logic ---
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

    // --- Merchandise Logic ---
    const addVariant = () => {
        setMerchVariants([...merchVariants, { name: '', price: 0, stock: 10, maxPerUser: 1 }]);
    };
    const updateVariant = (index, field, value) => {
        const updated = [...merchVariants];
        updated[index][field] = value;
        setMerchVariants(updated);
    };
    const removeVariant = (index) => setMerchVariants(merchVariants.filter((_, i) => i !== index));

    // --- SUBMIT LOGIC ---
    const onSubmit = async (e, isDraft = false) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };

            // COMBINE DATE AND TIME
            // We join the 'YYYY-MM-DD' and 'HH:MM' strings with a 'T'
            // This creates a valid ISO format for the database
            const finalStartDate = new Date(`${startDateDate}T${startTime}`);
            const finalEndDate = new Date(`${endDateDate}T${endTime}`);
            const finalRegDeadline = new Date(`${regDateDate}T${regTime}`);

            // Validation: End Date check (skip for drafts)
            if (!isDraft && finalEndDate < finalStartDate) {
                alert("End Date cannot be before Start Date");
                return;
            }

            const finalPayload = {
                ...formData,
                startDate: finalStartDate,
                endDate: finalEndDate,
                registrationDeadline: finalRegDeadline,
                tags: tags.split(',').map(tag => tag.trim()),
                formFields: eventType === 'Normal' ? formFields : [],
                merchandiseVariants: eventType === 'Merchandise' ? merchVariants : [],
                status: isDraft ? 'Draft' : 'Published'
            };

            await axios.post('http://localhost:5000/api/events/create', finalPayload, config);
            
            alert(isDraft ? 'Event Saved as Draft!' : 'Event Published Successfully!');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Error: ' + (err.response?.data?.msg || 'Unknown Error'));
        }
    };

    return (
        <div className="container mt-4 mb-5">
            <div className="card shadow-lg">
                <div className="card-header bg-primary text-white">
                    <h3 className="mb-0">Create New Event</h3>
                </div>
                <div className="card-body">
                    <form onSubmit={onSubmit}>
                        
                        {/* --- Basic Details --- */}
                        <h5 className="mb-3 border-bottom pb-2">Step 1: Basic Details</h5>
                        <div className="row">
                            <div className="col-md-6 mb-3">
                                <label className="form-label">Event Name</label>
                                <input type="text" className="form-control" name="name" value={name} onChange={onChange} required />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Type</label>
                                <select className="form-select" name="eventType" value={eventType} onChange={onChange}>
                                    <option value="Normal">Normal (Workshop/Competition)</option>
                                    <option value="Merchandise">Merchandise Sales</option>
                                </select>
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Eligibility</label>
                                <select className="form-select" name="eligibility" value={eligibility} onChange={onChange}>
                                    <option value="Open to All">Open to All</option>
                                    <option value="IIIT Only">IIIT Only</option>
                                </select>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Description</label>
                            <textarea className="form-control" name="description" rows="3" value={description} onChange={onChange} required></textarea>
                        </div>

                        {/* --- NEW SPLIT DATE INPUTS --- */}
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Start Date & Time</label>
                                <div className="input-group">
                                    <input type="date" className="form-control" name="startDateDate" value={startDateDate} onChange={onDateChange} required />
                                    <input type="time" className="form-control" name="startTime" value={startTime} onChange={onDateChange} required />
                                </div>
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">End Date & Time</label>
                                <div className="input-group">
                                    <input type="date" className="form-control" name="endDateDate" value={endDateDate} onChange={onDateChange} required />
                                    <input type="time" className="form-control" name="endTime" value={endTime} onChange={onDateChange} required />
                                </div>
                            </div>
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Reg. Deadline</label>
                                <div className="input-group">
                                    <input type="date" className="form-control" name="regDateDate" value={regDateDate} onChange={onDateChange} required />
                                    <input type="time" className="form-control" name="regTime" value={regTime} onChange={onDateChange} required />
                                </div>
                            </div>
                        </div>

                        {/* --- Pricing & Limits --- */}
                        <div className="row">
                            <div className="col-md-4 mb-3">
                                <label className="form-label">Global Limit</label>
                                <input type="number" className="form-control" name="registrationLimit" value={registrationLimit} onChange={onChange} required />
                            </div>
                            {eventType !== 'Merchandise' && (
                                <div className="col-md-4 mb-3">
                                    <label className="form-label">Base Price (₹)</label>
                                    <input type="number" className="form-control" name="price" value={price} onChange={onChange} />
                                </div>
                            )}
                             <div className="col-md-4 mb-3">
                                <label className="form-label">Tags (comma separated)</label>
                                <input type="text" className="form-control" name="tags" value={tags} onChange={onChange} placeholder="coding, fun, food" />
                            </div>
                        </div>

                        {/* --- Custom Logic  --- */}
                        {eventType === 'Normal' && (
                            <div className="mt-4 p-3 bg-light rounded border">
                                <h5 className="text-primary">Step 2: Custom Registration Form</h5>
                                {formFields.map((field, idx) => (
                                    <div key={idx} className="card mb-2 p-2">
                                        <div className="row g-2 align-items-center">
                                            <div className="col-md-4">
                                                <input type="text" className="form-control form-control-sm" placeholder="Question Label" 
                                                    value={field.label} onChange={(e) => updateQuestion(idx, 'label', e.target.value)} required />
                                            </div>
                                            <div className="col-md-3">
                                                <select className="form-select form-select-sm" 
                                                    value={field.fieldType} onChange={(e) => updateQuestion(idx, 'fieldType', e.target.value)}>
                                                    <option value="text">Short Text</option>
                                                    <option value="number">Number</option>
                                                    <option value="dropdown">Dropdown</option>
                                                    <option value="file">File Upload</option>
                                                </select>
                                            </div>
                                            <div className="col-md-2">
                                                <div className="form-check">
                                                    <input className="form-check-input" type="checkbox" 
                                                        checked={field.required} onChange={(e) => updateQuestion(idx, 'required', e.target.checked)} />
                                                    <label className="form-check-label small">Required</label>
                                                </div>
                                            </div>
                                            <div className="col-md-1">
                                                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeQuestion(idx)}>X</button>
                                            </div>
                                        </div>
                                        {field.fieldType === 'dropdown' && (
                                            <div className="mt-2">
                                                <input type="text" className="form-control form-control-sm" placeholder="Options (comma separated)" 
                                                    onChange={(e) => handleOptionChange(idx, e.target.value)} />
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <button type="button" className="btn btn-outline-primary btn-sm mt-2" onClick={addQuestion}>+ Add Question</button>
                            </div>
                        )}

                        {eventType === 'Merchandise' && (
                            <div className="mt-4 p-3 bg-light rounded border border-warning">
                                <h5 className="text-warning">Step 2: Merchandise Inventory</h5>
                                {merchVariants.map((variant, idx) => (
                                    <div key={idx} className="card mb-2 p-2">
                                        <div className="row g-2">
                                            <div className="col-md-4">
                                                <input type="text" className="form-control form-control-sm" placeholder="Item Name" 
                                                    value={variant.name} onChange={(e) => updateVariant(idx, 'name', e.target.value)} required />
                                            </div>
                                            <div className="col-md-2">
                                                <input type="number" className="form-control form-control-sm" placeholder="Price" 
                                                    value={variant.price} onChange={(e) => updateVariant(idx, 'price', e.target.value)} required />
                                            </div>
                                            <div className="col-md-2">
                                                <input type="number" className="form-control form-control-sm" placeholder="Stock" 
                                                    value={variant.stock} onChange={(e) => updateVariant(idx, 'stock', e.target.value)} required />
                                            </div>
                                            <div className="col-md-2">
                                                <input type="number" className="form-control form-control-sm" placeholder="Limit" 
                                                    value={variant.maxPerUser} onChange={(e) => updateVariant(idx, 'maxPerUser', e.target.value)} />
                                            </div>
                                            <div className="col-md-1">
                                                <button type="button" className="btn btn-danger btn-sm" onClick={() => removeVariant(idx)}>X</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <button type="button" className="btn btn-outline-warning btn-sm mt-2" onClick={addVariant}>+ Add Item</button>
                            </div>
                        )}

                        <hr className="mt-4" />
                        <div className="d-flex gap-3">
                            <button 
                                type="button" 
                                className="btn btn-secondary btn-lg flex-fill"
                                onClick={(e) => onSubmit(e, true)}
                            >
                                📝 Save as Draft
                            </button>
                            <button 
                                type="submit" 
                                className="btn btn-success btn-lg flex-fill"
                            >
                                🚀 Publish Event
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateEvent;