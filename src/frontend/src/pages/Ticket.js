import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';

const Ticket = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { registration } = location.state || {}; // Pass data via navigation state

    if (!registration) {
        return <div className="text-center mt-5">No ticket data found. <button onClick={() => navigate('/dashboard')}>Go Back</button></div>;
    }

    const { event, ticketId, status } = registration;

    return (
        <div className="container mt-5 text-center">
            <button className="btn btn-outline-secondary mb-4" onClick={() => navigate('/dashboard')}>&larr; Back to Dashboard</button>
            
            <div className="card shadow-lg mx-auto" style={{ maxWidth: '400px' }}>
                <div className="card-header bg-primary text-white">
                    <h4>{event.name}</h4>
                    <p className="mb-0">{new Date(event.startDate).toLocaleDateString()}</p>
                </div>
                <div className="card-body">
                    <h5 className="card-title text-muted mb-4">Official Entry Ticket</h5>
                    
                    <div className="mb-4">
                        <QRCodeCanvas value={ticketId} size={200} />
                    </div>

                    <p><strong>Ticket ID:</strong> <br/><small className="text-muted">{ticketId}</small></p>
                    
                    <span className={`badge ${status === 'Attended' ? 'bg-secondary' : 'bg-success'} fs-6`}>
                        {status === 'Attended' ? 'USED / ATTENDED' : 'VALID FOR ENTRY'}
                    </span>
                    
                    <hr />
                    <p className="small text-muted">Show this QR code at the venue entrance.</p>
                </div>
            </div>
        </div>
    );
};

export default Ticket;
