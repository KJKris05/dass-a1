import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

const FeedbackDashboard = () => {
    const { id } = useParams(); // Changed from eventId to id to match route
    const navigate = useNavigate();
    
    const [event, setEvent] = useState(null);
    const [stats, setStats] = useState({
        totalFeedback: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        percentageDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        categoryAverages: {},
        recentFeedbackCount: 0
    });
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [ratingFilter, setRatingFilter] = useState('all');

    const fetchData = useCallback(async () => {
        setLoading(true); // Reset loading state when refetching
        try {
            const token = localStorage.getItem('token');
            
            // Fetch event details
            const eventRes = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/${id}`);
            setEvent(eventRes.data);

            // Fetch statistics
            const statsRes = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/feedback/${id}/stats`, {
                headers: { 'x-auth-token': token }
            });
            // Ensure stats has all required fields with defaults
            setStats({
                totalFeedback: statsRes.data.totalFeedback || 0,
                averageRating: statsRes.data.averageRating || 0,
                ratingDistribution: statsRes.data.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                percentageDistribution: statsRes.data.percentageDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
                categoryAverages: statsRes.data.categoryAverages || {},
                recentFeedbackCount: statsRes.data.recentFeedbackCount || 0
            });

            // Fetch all feedback
            const filterParam = ratingFilter !== 'all' ? `?rating=${ratingFilter}` : '';
            const feedbackRes = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/feedback/${id}/all${filterParam}`, {
                headers: { 'x-auth-token': token }
            });
            setFeedback(feedbackRes.data);

            setLoading(false);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.msg || 'Error loading feedback');
            navigate('/dashboard');
        }
    }, [id, ratingFilter, navigate]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleExport = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/feedback/${id}/export`, {
                headers: { 'x-auth-token': token },
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${event.name}_feedback.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error(err);
            alert('Failed to export feedback');
        }
    };

    const renderStars = (rating) => {
        return (
            <span>
                {[1, 2, 3, 4, 5].map(star => (
                    <span
                        key={star}
                        style={{
                            color: star <= rating ? '#ffc107' : '#dee2e6',
                            fontSize: '1.2rem'
                        }}
                    >
                        ★
                    </span>
                ))}
            </span>
        );
    };

    if (loading || !event) return <div className="text-center mt-5">Loading...</div>;

    return (
        <div className="container mt-5 mb-5">
            <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/dashboard')}>
                ← Back to Dashboard
            </button>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2>Feedback Dashboard</h2>
                    <p className="text-muted mb-0">{event.name}</p>
                </div>
                <button className="btn btn-success" onClick={handleExport}>
                    📥 Export CSV
                </button>
            </div>

            {/* Statistics Cards */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card text-center shadow-sm">
                        <div className="card-body">
                            <h3 className="text-primary mb-0">{stats.totalFeedback}</h3>
                            <p className="text-muted mb-0">Total Responses</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-center shadow-sm">
                        <div className="card-body">
                            <h3 className="text-warning mb-0">
                                {renderStars(Math.round(stats.averageRating))}
                            </h3>
                            <p className="text-muted mb-0">
                                {stats.averageRating.toFixed(2)} Average Rating
                            </p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-center shadow-sm">
                        <div className="card-body">
                            <h3 className="text-success mb-0">
                                {stats.ratingDistribution[5] + stats.ratingDistribution[4]}
                            </h3>
                            <p className="text-muted mb-0">Positive Reviews (4-5★)</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card text-center shadow-sm">
                        <div className="card-body">
                            <h3 className="text-info mb-0">{stats.recentFeedbackCount}</h3>
                            <p className="text-muted mb-0">Last 24 Hours</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Rating Distribution */}
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Rating Distribution</h5>
                </div>
                <div className="card-body">
                    {[5, 4, 3, 2, 1].map(rating => (
                        <div key={rating} className="mb-3">
                            <div className="d-flex align-items-center">
                                <span style={{ width: '50px' }}>{rating} ★</span>
                                <div className="progress flex-grow-1 mx-3" style={{ height: '25px' }}>
                                    <div
                                        className={`progress-bar ${
                                            rating >= 4 ? 'bg-success' :
                                            rating === 3 ? 'bg-warning' :
                                            'bg-danger'
                                        }`}
                                        style={{ width: `${stats.percentageDistribution[rating]}%` }}
                                    >
                                        {stats.percentageDistribution[rating]}%
                                    </div>
                                </div>
                                <span style={{ width: '80px', textAlign: 'right' }}>
                                    {stats.ratingDistribution[rating]} reviews
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Category Averages */}
            {Object.keys(stats.categoryAverages).length > 0 && (
                <div className="card shadow-sm mb-4">
                    <div className="card-header bg-info text-white">
                        <h5 className="mb-0">Category Breakdown</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            {Object.entries(stats.categoryAverages).map(([category, avg]) => (
                                <div key={category} className="col-md-3 mb-3">
                                    <h6 className="text-capitalize">{category}</h6>
                                    <div className="d-flex align-items-center">
                                        {renderStars(Math.round(parseFloat(avg)))}
                                        <span className="ms-2">{avg}/5</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Feedback List with Filter */}
            <div className="card shadow-sm">
                <div className="card-header bg-secondary text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">All Feedback</h5>
                    <select
                        className="form-select form-select-sm"
                        style={{ width: 'auto' }}
                        value={ratingFilter}
                        onChange={(e) => setRatingFilter(e.target.value)}
                    >
                        <option value="all">All Ratings</option>
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                        <option value="2">2 Stars</option>
                        <option value="1">1 Star</option>
                    </select>
                </div>
                <div className="card-body">
                    {feedback.length === 0 ? (
                        <p className="text-center text-muted py-4">
                            {ratingFilter !== 'all' 
                                ? `No feedback with ${ratingFilter} star rating` 
                                : 'No feedback submitted yet'}
                        </p>
                    ) : (
                        <div>
                            {feedback.map((item, index) => (
                                <div key={item._id} className="border-bottom pb-3 mb-3">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                        <div>
                                            {renderStars(item.rating)}
                                            <small className="text-muted ms-3">
                                                {new Date(item.createdAt).toLocaleDateString()} at{' '}
                                                {new Date(item.createdAt).toLocaleTimeString()}
                                            </small>
                                        </div>
                                        <span className="badge bg-secondary">Anonymous</span>
                                    </div>
                                    
                                    {item.comment && (
                                        <p className="mb-2" style={{ whiteSpace: 'pre-line' }}>
                                            {item.comment}
                                        </p>
                                    )}

                                    {item.categories && (
                                        <div className="small text-muted">
                                            {item.categories.organization > 0 && (
                                                <span className="me-3">
                                                    Organization: {item.categories.organization}★
                                                </span>
                                            )}
                                            {item.categories.content > 0 && (
                                                <span className="me-3">
                                                    Content: {item.categories.content}★
                                                </span>
                                            )}
                                            {item.categories.venue > 0 && (
                                                <span className="me-3">
                                                    Venue: {item.categories.venue}★
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackDashboard;
