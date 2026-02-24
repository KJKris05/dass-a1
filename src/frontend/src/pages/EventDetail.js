import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// Discussion Forum Component
const DiscussionForum = ({ eventId, isOrganizer, currentUser }) => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMessage, setNewMessage] = useState('');
    const [messageType, setMessageType] = useState('message');
    const [expandedReplies, setExpandedReplies] = useState({});
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState('');
    const [editingMessage, setEditingMessage] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [showReactionPicker, setShowReactionPicker] = useState(null);
    const replyInputRef = React.useRef(null);

    const loadMessages = useCallback(async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/forum/${eventId}`, {
                headers: { 'x-auth-token': token }
            });
            setMessages(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error loading messages:', err);
            setLoading(false);
        }
    }, [eventId]);

    useEffect(() => {
        loadMessages();
        
        // Auto-refresh every 10 seconds if enabled
        let interval;
        if (autoRefresh) {
            interval = setInterval(loadMessages, 10000);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [eventId, autoRefresh, loadMessages]);

    const loadReplies = async (messageId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/forum/${eventId}/replies/${messageId}`, {
                headers: { 'x-auth-token': token }
            });
            setExpandedReplies(prev => ({
                ...prev,
                [messageId]: res.data
            }));
        } catch (err) {
            console.error('Error loading replies:', err);
        }
    };

    const handlePostMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/forum/${eventId}`, {
                content: newMessage,
                messageType: isOrganizer ? messageType : 'message'
            }, {
                headers: { 'x-auth-token': token }
            });
            
            setNewMessage('');
            setMessageType('message');
            loadMessages();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to post message');
        }
    };

    const handlePostReply = async (parentId) => {
        if (!replyContent.trim()) return;

        try {
            const token = localStorage.getItem('token');
            await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/forum/${eventId}`, {
                content: replyContent,
                parentMessage: parentId
            }, {
                headers: { 'x-auth-token': token }
            });
            
            setReplyContent('');
            setReplyingTo(null);
            // Just reload replies for this message instead of all messages
            loadReplies(parentId);
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to post reply');
        }
    };

    const handleEditMessage = async (messageId) => {
        if (!editContent.trim()) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/forum/${eventId}/${messageId}`, {
                content: editContent
            }, {
                headers: { 'x-auth-token': token }
            });
            
            setEditingMessage(null);
            setEditContent('');
            loadMessages();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to edit message');
        }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm('Are you sure you want to delete this message?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/forum/${eventId}/${messageId}`, {
                headers: { 'x-auth-token': token }
            });
            loadMessages();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to delete message');
        }
    };

    const handlePinMessage = async (messageId) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/forum/${eventId}/${messageId}/pin`, {}, {
                headers: { 'x-auth-token': token }
            });
            loadMessages();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to pin message');
        }
    };

    const handleReaction = async (messageId, emoji) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/forum/${eventId}/${messageId}/react`, {
                emoji
            }, {
                headers: { 'x-auth-token': token }
            });
            
            // Update the reactions locally without causing full re-render
            setMessages(prevMessages => {
                const newMessages = [...prevMessages];
                const messageIndex = newMessages.findIndex(msg => msg._id === messageId);
                if (messageIndex !== -1) {
                    newMessages[messageIndex] = {
                        ...newMessages[messageIndex],
                        reactions: res.data
                    };
                }
                return newMessages;
            });
            
            // Close the reaction picker
            setShowReactionPicker(null);
        } catch (err) {
            console.error('Failed to react:', err);
        }
    };

    const toggleReplies = (messageId) => {
        if (expandedReplies[messageId]) {
            const { [messageId]: removed, ...rest } = expandedReplies;
            setExpandedReplies(rest);
        } else {
            loadReplies(messageId);
        }
    };

    const getMessageBadgeClass = (type) => {
        switch (type) {
            case 'announcement': return 'bg-danger';
            case 'question': return 'bg-warning';
            default: return 'bg-secondary';
        }
    };

    const formatTime = (date) => {
        const now = new Date();
        const msgDate = new Date(date);
        const diff = Math.floor((now - msgDate) / 1000);

        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return msgDate.toLocaleDateString();
    };

    const MessageItem = ({ message, isReply = false }) => {
        const isAuthor = currentUser && message.author._id === currentUser.id;
        const reactions = message.reactions || [];
        const reactionCounts = reactions.reduce((acc, r) => {
            acc[r.emoji] = (acc[r.emoji] || 0) + 1;
            return acc;
        }, {});

        return (
            <div className={`mb-3 ${isReply ? 'ms-4' : ''}`}>
                <div className={`card ${message.isPinned ? 'border-warning' : ''}`}>
                    <div className="card-body pb-2">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <strong className="text-primary">
                                    {message.author.firstName} {message.author.lastName}
                                </strong>
                                {message.author.role === 'organizer' && (
                                    <span className="badge bg-success ms-2">Organizer</span>
                                )}
                                {message.messageType !== 'message' && (
                                    <span className={`badge ${getMessageBadgeClass(message.messageType)} ms-2`}>
                                        {message.messageType}
                                    </span>
                                )}
                                {message.isPinned && (
                                    <span className="ms-2">📌</span>
                                )}
                                <small className="text-muted ms-2">{formatTime(message.createdAt)}</small>
                                {message.isEdited && (
                                    <small className="text-muted ms-1">(edited)</small>
                                )}
                            </div>
                            <div className="dropdown">
                                <button className="btn btn-sm btn-link text-muted" data-bs-toggle="dropdown">
                                    ⋮
                                </button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                    {isAuthor && (
                                        <>
                                            <li>
                                                <button 
                                                    className="dropdown-item"
                                                    onClick={() => {
                                                        setEditingMessage(message._id);
                                                        setEditContent(message.content);
                                                    }}
                                                >
                                                    ✏️ Edit
                                                </button>
                                            </li>
                                        </>
                                    )}
                                    {(isAuthor || isOrganizer) && (
                                        <li>
                                            <button 
                                                className="dropdown-item text-danger"
                                                onClick={() => handleDeleteMessage(message._id)}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </li>
                                    )}
                                    {isOrganizer && !isReply && (
                                        <li>
                                            <button 
                                                className="dropdown-item"
                                                onClick={() => handlePinMessage(message._id)}
                                            >
                                                📌 {message.isPinned ? 'Unpin' : 'Pin'}
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>

                        {editingMessage === message._id ? (
                            <div>
                                <textarea
                                    className="form-control mb-2"
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    rows="2"
                                />
                                <button 
                                    className="btn btn-sm btn-primary me-2"
                                    onClick={() => handleEditMessage(message._id)}
                                >
                                    Save
                                </button>
                                <button 
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => {
                                        setEditingMessage(null);
                                        setEditContent('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        ) : (
                            <p className="mb-2" style={{ whiteSpace: 'pre-line' }}>{message.content}</p>
                        )}

                        {/* Reactions */}
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            {Object.entries(reactionCounts).map(([emoji, count]) => (
                                <button
                                    key={emoji}
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => handleReaction(message._id, emoji)}
                                    title={`${count} reactions`}
                                >
                                    {emoji} {count}
                                </button>
                            ))}
                            <div className="position-relative">
                                <button 
                                    className="btn btn-sm btn-link text-muted"
                                    onClick={() => setShowReactionPicker(showReactionPicker === message._id ? null : message._id)}
                                    title="Add reaction"
                                >
                                    😊+
                                </button>
                                {showReactionPicker === message._id && (
                                    <div 
                                        className="position-absolute bg-white border rounded shadow-sm p-2 d-flex gap-1"
                                        style={{ zIndex: 1000, bottom: '100%', left: 0 }}
                                    >
                                        {['👍', '❤️', '😂', '🎉', '🤔', '👏'].map(emoji => (
                                            <button
                                                key={emoji}
                                                className="btn btn-sm btn-light"
                                                onClick={() => {
                                                    handleReaction(message._id, emoji);
                                                    setShowReactionPicker(null);
                                                }}
                                                style={{ fontSize: '1.2rem', padding: '0.25rem 0.5rem' }}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            
                            {!isReply && (
                                <>
                                    <button 
                                        className="btn btn-sm btn-link text-primary"
                                        onClick={() => setReplyingTo(message._id)}
                                    >
                                        💬 Reply
                                    </button>
                                    {message.replyCount > 0 && (
                                        <button 
                                            className="btn btn-sm btn-link"
                                            onClick={() => toggleReplies(message._id)}
                                        >
                                            {expandedReplies[message._id] ? '▲' : '▼'} {message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Reply form */}
                {replyingTo === message._id && (
                    <div className="ms-4 mt-2" key={`reply-form-${message._id}`}>
                        <div className="input-group">
                            <input
                                ref={replyInputRef}
                                type="text"
                                className="form-control"
                                placeholder="Write a reply..."
                                value={replyContent}
                                onChange={(e) => {
                                    e.persist();
                                    setReplyContent(e.target.value);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && replyContent.trim()) {
                                        e.preventDefault();
                                        handlePostReply(message._id);
                                    }
                                }}
                                autoFocus
                            />
                            <button 
                                className="btn btn-primary"
                                onClick={() => handlePostReply(message._id)}
                                disabled={!replyContent.trim()}
                            >
                                Send
                            </button>
                            <button 
                                className="btn btn-secondary"
                                onClick={() => {
                                    setReplyingTo(null);
                                    setReplyContent('');
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                {/* Replies */}
                {expandedReplies[message._id] && (
                    <div className="mt-2">
                        {expandedReplies[message._id].map(reply => (
                            <MessageItem key={reply._id} message={reply} isReply={true} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) return <p>Loading forum...</p>;

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Engage with other participants</h6>
                <div className="form-check form-switch">
                    <input 
                        className="form-check-input" 
                        type="checkbox" 
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                    <label className="form-check-label small">Auto-refresh</label>
                </div>
            </div>

            {/* New Message Form */}
            <form onSubmit={handlePostMessage} className="mb-4">
                <div className="mb-2">
                    {isOrganizer && (
                        <div className="btn-group mb-2" role="group">
                            <input 
                                type="radio" 
                                className="btn-check" 
                                name="messageType" 
                                id="typeMessage" 
                                value="message"
                                checked={messageType === 'message'}
                                onChange={(e) => setMessageType(e.target.value)}
                            />
                            <label className="btn btn-outline-secondary btn-sm" htmlFor="typeMessage">Message</label>

                            <input 
                                type="radio" 
                                className="btn-check" 
                                name="messageType" 
                                id="typeAnnouncement" 
                                value="announcement"
                                checked={messageType === 'announcement'}
                                onChange={(e) => setMessageType(e.target.value)}
                            />
                            <label className="btn btn-outline-danger btn-sm" htmlFor="typeAnnouncement">Announcement</label>

                            <input 
                                type="radio" 
                                className="btn-check" 
                                name="messageType" 
                                id="typeQuestion" 
                                value="question"
                                checked={messageType === 'question'}
                                onChange={(e) => setMessageType(e.target.value)}
                            />
                            <label className="btn btn-outline-warning btn-sm" htmlFor="typeQuestion">Question</label>
                        </div>
                    )}
                    <textarea
                        className="form-control"
                        rows="3"
                        placeholder={isOrganizer ? "Post a message, announcement, or question..." : "Ask a question or share your thoughts..."}
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                </div>
                <button type="submit" className="btn btn-primary" disabled={!newMessage.trim()}>
                    📤 Post
                </button>
            </form>

            {/* Messages List */}
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {messages.length === 0 ? (
                    <div className="text-center text-muted py-4">
                        <p>No messages yet. Be the first to start the conversation!</p>
                    </div>
                ) : (
                    messages.map(message => (
                        <MessageItem key={message._id} message={message} />
                    ))
                )}
            </div>
        </div>
    );
};

const EventDetail = () => {
    const { id } = useParams(); // Get ID from URL
    const navigate = useNavigate();
    
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentUser, setCurrentUser] = useState(null);

    // --- State for Registration ---
    const [formResponses, setFormResponses] = useState({}); // Stores answers to custom Qs

    // --- State for Discussion Forum ---
    const [showForum, setShowForum] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [isOrganizer, setIsOrganizer] = useState(false);

    // Get current user on mount
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setCurrentUser(decoded.user);
            } catch (err) {
                console.error('Invalid token');
            }
        }
    }, []);

    // Fetch event and check access
    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const token = localStorage.getItem('token');
                
                // Fetch event
                const res = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/${id}`);
                setEvent(res.data);
                
                // Check if user has forum access
                if (token && currentUser) {
                    const isOrg = res.data.organizer._id === currentUser.id;
                    setIsOrganizer(isOrg);
                    
                    // Check if user is registered
                    try {
                        const regRes = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/registrations/my-events`, {
                            headers: { 'x-auth-token': token }
                        });
                        const isRegistered = regRes.data.some(r => 
                            r.event && r.event._id === id && 
                            ['Registered', 'Approved', 'Attended'].includes(r.status)
                        );
                        setHasAccess(isOrg || isRegistered);
                    } catch (err) {
                        setHasAccess(isOrg);
                    }
                }
                
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError('Failed to load event');
                setLoading(false);
            }
        };
        fetchEvent();
    }, [id, currentUser]);

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

            const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/registrations/${id}`, 
                { formResponses: formattedResponses }, 
                { headers: { 'x-auth-token': token } }
            );

            // Show success message with email status
            let message = 'Registration Successful! Ticket generated.';
            if (response.data.emailSent) {
                message += `\n\n📧 A ticket with QR code has been sent to ${response.data.userEmail}`;
            } else {
                message += '\n\n⚠️ Email could not be sent, but you can view your ticket in the dashboard.';
            }
            
            alert(message);
            navigate('/dashboard');

        } catch (err) {
            alert(err.response?.data?.msg || 'Registration failed');
        }
    };

    // --- Buy Merchandise (Merch Events) ---
    const onBuyItem = async (variantName) => {
        if(window.confirm(`Confirm purchase of ${variantName}?`)) {
             try {
                const token = localStorage.getItem('token');
                if (!token) return navigate('/login');
                
                // We treat buying an item as a "registration" for that event
                const response = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/registrations/${id}`, 
                    { formResponses: [{ questionLabel: 'Variant', answer: variantName }] }, 
                    { headers: { 'x-auth-token': token } }
                );

                // For merchandise, prompt to upload payment proof
                if (response.data.isMerchandise) {
                    const paymentProof = prompt('Please enter your payment proof link (Google Drive/Image URL):');
                    
                    if (paymentProof) {
                        await axios.put(
                            `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/registrations/${response.data.registrationId}/payment-proof`,
                            { paymentProof },
                            { headers: { 'x-auth-token': token } }
                        );
                        alert('Order placed! Payment proof uploaded. Awaiting organizer approval.\n\nYou will receive your ticket via email once approved.');
                    } else {
                        alert('Order placed! Please upload payment proof from your dashboard to complete the purchase.');
                    }
                } else {
                    // Show success message for normal events
                    let message = 'Order Placed Successfully!';
                    if (response.data.emailSent) {
                        message += `\n\n📧 A ticket with QR code has been sent to ${response.data.userEmail}`;
                    } else {
                        message += '\n\n⚠️ Email could not be sent, but you can view your ticket in the dashboard.';
                    }
                    alert(message);
                }
                
                navigate('/dashboard');
            } catch (err) {
                alert(err.response?.data?.msg || 'Purchase failed');
            }
        }
    };

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
                                Hosted by: {event.organizer ? `${event.organizer.firstName} ${event.organizer.lastName || ''} (${event.organizer.organizerCategory || 'Organizer'})` : 'Unknown Organizer'}
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

                    {/* Discussion Forum Section */}
                    {hasAccess && (
                        <div className="card shadow-sm mb-4">
                            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">💬 Discussion Forum</h5>
                                <button 
                                    className="btn btn-sm btn-light"
                                    onClick={() => setShowForum(!showForum)}
                                >
                                    {showForum ? 'Hide' : 'Show'} Forum
                                </button>
                            </div>
                            {showForum && (
                                <div className="card-body">
                                    <DiscussionForum 
                                        eventId={id} 
                                        isOrganizer={isOrganizer}
                                        currentUser={currentUser}
                                    />
                                </div>
                            )}
                        </div>
                    )}
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
                                    <strong>💰 Price:</strong> {event.registrationFee === 0 ? 'FREE' : `₹${event.registrationFee}`}
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
                                                    ) : field.fieldType === 'file' ? (
                                                        <input 
                                                            type="text" 
                                                            className="form-control form-control-sm"
                                                            placeholder="Enter Google Drive link or file URL"
                                                            onChange={(e) => handleInputChange(field.label, e.target.value)}
                                                        />
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