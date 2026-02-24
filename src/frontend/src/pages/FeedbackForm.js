import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const FeedbackForm = () => {
    const { eventId } = useParams();
    const navigate = useNavigate();
    
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [canSubmit, setCanSubmit] = useState(false);
    const [hasSubmitted, setHasSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [categories, setCategories] = useState({
        organization: 0,
        content: 0,
        venue: 0
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/login');
                    return;
                }

                // Fetch event details
                const eventRes = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/${eventId}`);
                setEvent(eventRes.data);

                // Check if user can submit feedback
                const checkRes = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/feedback/${eventId}/check`, {
                    headers: { 'x-auth-token': token }
                });

                setCanSubmit(checkRes.data.canSubmit);
                setHasSubmitted(checkRes.data.hasSubmitted);
                setLoading(false);
            } catch (err) {
                console.error(err);
                alert('Error loading feedback form');
                navigate('/dashboard');
            }
        };

        fetchData();
    }, [eventId, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (rating === 0) {
            alert('Please select a rating');
            return;
        }

        try {
            setSubmitting(true);
            const token = localStorage.getItem('token');

            await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/feedback/${eventId}`, {
                rating,
                comment,
                categories: {
                    ...categories,
                    overall: rating
                }
            }, {
                headers: { 'x-auth-token': token }
            });

            alert('Thank you! Your feedback has been submitted anonymously.');
            navigate('/dashboard');
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Failed to submit feedback');
            setSubmitting(false);
        }
    };

    const renderStars = (value, setValue, hoverValue, setHoverValue) => {
        return (
            <div className="d-flex gap-2 align-items-center">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        className="btn btn-link p-0"
                        style={{ fontSize: '2rem', textDecoration: 'none' }}
                        onClick={() => setValue(star)}
                        onMouseEnter={() => setHoverValue && setHoverValue(star)}
                        onMouseLeave={() => setHoverValue && setHoverValue(0)}
                    >
                        <span style={{ color: star <= (hoverValue || value) ? '#ffc107' : '#dee2e6' }}>
                            ★
                        </span>
                    </button>
                ))}
                <span className="ms-2 text-muted">
                    {value > 0 && (
                        <span>
                            {value}/5 - {
                                value === 5 ? 'Excellent' :
                                value === 4 ? 'Good' :
                                value === 3 ? 'Average' :
                                value === 2 ? 'Below Average' :
                                'Poor'
                            }
                        </span>
                    )}
                </span>
            </div>
        );
    };

    if (loading) return <div className="text-center mt-5">Loading...</div>;

    if (hasSubmitted) {
        return (
            <div className="container mt-5">
                <div className="card shadow-sm">
                    <div className="card-body text-center py-5">
                        <h2 className="text-success mb-3">✓ Feedback Already Submitted</h2>
                        <p className="text-muted">You have already submitted feedback for this event.</p>
                        <button className="btn btn-primary mt-3" onClick={() => navigate('/dashboard')}>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!canSubmit) {
        return (
            <div className="container mt-5">
                <div className="card shadow-sm">
                    <div className="card-body text-center py-5">
                        <h2 className="text-warning mb-3">⚠️ Cannot Submit Feedback</h2>
                        <p className="text-muted">You must have attended this event to submit feedback.</p>
                        <button className="btn btn-primary mt-3" onClick={() => navigate('/dashboard')}>
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mt-5 mb-5">
            <div className="row justify-content-center">
                <div className="col-md-8">
                    <div className="card shadow">
                        <div className="card-header bg-primary text-white">
                            <h4 className="mb-0">📝 Event Feedback</h4>
                        </div>
                        <div className="card-body">
                            <div className="alert alert-info">
                                <strong>🔒 Anonymous Feedback</strong>
                                <p className="mb-0 small">Your feedback is completely anonymous. The organizer will not know who submitted it.</p>
                            </div>

                            <h5 className="mb-3">{event.name}</h5>

                            <form onSubmit={handleSubmit}>
                                {/* Overall Rating */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold">
                                        Overall Rating <span className="text-danger">*</span>
                                    </label>
                                    {renderStars(rating, setRating, hoverRating, setHoverRating)}
                                </div>

                                {/* Category Ratings */}
                                <div className="mb-4">
                                    <h6 className="mb-3">Rate Specific Aspects (Optional)</h6>
                                    
                                    <div className="mb-3">
                                        <label className="form-label">Organization & Management</label>
                                        {renderStars(
                                            categories.organization,
                                            (val) => setCategories({ ...categories, organization: val }),
                                            null,
                                            null
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Content & Quality</label>
                                        {renderStars(
                                            categories.content,
                                            (val) => setCategories({ ...categories, content: val }),
                                            null,
                                            null
                                        )}
                                    </div>

                                    <div className="mb-3">
                                        <label className="form-label">Venue & Facilities</label>
                                        {renderStars(
                                            categories.venue,
                                            (val) => setCategories({ ...categories, venue: val }),
                                            null,
                                            null
                                        )}
                                    </div>
                                </div>

                                {/* Comments */}
                                <div className="mb-4">
                                    <label className="form-label fw-bold">Comments (Optional)</label>
                                    <textarea
                                        className="form-control"
                                        rows="5"
                                        maxLength="1000"
                                        placeholder="Share your experience, suggestions, or any feedback..."
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                    />
                                    <small className="text-muted">{comment.length}/1000 characters</small>
                                </div>

                                {/* Submit Buttons */}
                                <div className="d-flex justify-content-between">
                                    <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => navigate('/dashboard')}
                                        disabled={submitting}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="btn btn-primary"
                                        disabled={rating === 0 || submitting}
                                    >
                                        {submitting ? 'Submitting...' : 'Submit Feedback'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackForm;
