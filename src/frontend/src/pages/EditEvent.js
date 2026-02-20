import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const EditEvent = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        description: '',
        registrationDeadline: '',
        registrationLimit: '',
        status: ''
    });

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/events/${id}`);
                const e = res.data;
                
                // Format date for datetime-local input
                const formatDate = (dateString) => {
                    const date = new Date(dateString);
                    return date.toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm
                };

                setFormData({
                    description: e.description,
                    registrationDeadline: formatDate(e.registrationDeadline),
                    registrationLimit: e.registrationLimit,
                    status: e.status
                });
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

    const onSubmit = async e => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/events/${id}`, formData, {
                headers: { 'x-auth-token': token }
            });
            alert('Event Updated Successfully');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert('Error updating event');
        }
    };

    if (loading) return <div className="text-center mt-5">Loading...</div>;

    return (
        <div className="container mt-5">
            <div className="card shadow">
                <div className="card-header bg-warning">
                    <h4>Edit Event</h4>
                </div>
                <div className="card-body">
                    <form onSubmit={onSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Description</label>
                            <textarea 
                                className="form-control" 
                                name="description" 
                                value={formData.description} 
                                onChange={onChange} 
                                rows="4" 
                                required
                            ></textarea>
                            <small className="text-muted">You can update the description to add new details.</small>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Extend Registration Deadline</label>
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
                            <label className="form-label">Increase Registration Limit</label>
                            <input 
                                type="number" 
                                className="form-control" 
                                name="registrationLimit" 
                                value={formData.registrationLimit} 
                                onChange={onChange} 
                                required 
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Event Status</label>
                            <select 
                                className="form-select" 
                                name="status" 
                                value={formData.status} 
                                onChange={onChange}
                            >
                                <option value="Published">Published (Open)</option>
                                <option value="Ongoing">Ongoing</option>
                                <option value="Completed">Completed</option>
                                <option value="Cancelled">Cancelled</option>
                            </select>
                        </div>

                        <button type="submit" className="btn btn-primary">Update Event</button>
                        <button type="button" className="btn btn-secondary ms-2" onClick={() => navigate('/dashboard')}>Cancel</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditEvent;
