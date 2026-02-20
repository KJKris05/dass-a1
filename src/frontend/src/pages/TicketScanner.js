import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TicketScanner = () => {
    const navigate = useNavigate();
    const [scanResult, setScanResult] = useState(null);
    const [error, setError] = useState(null);
    const [lastScanned, setLastScanned] = useState('');

    useEffect(() => {
        // Initialize scanner
        const scanner = new Html5QrcodeScanner(
            "reader", 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );

        scanner.render(onScanSuccess, onScanFailure);

        function onScanSuccess(decodedText, decodedResult) {
            // Prevent spamming requests for the same code
            if (decodedText !== lastScanned) {
                setLastScanned(decodedText);
                validateTicket(decodedText);
            }
        }

        function onScanFailure(error) {
            // handle scan failure, usually better to ignore and keep scanning.
            // console.warn(`Code scan error = ${error}`);
        }

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner. ", error);
            });
        };
    }, [lastScanned]);

    const validateTicket = async (ticketId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post('http://localhost:5000/api/registrations/validate', 
                { ticketId }, 
                { headers: { 'x-auth-token': token } }
            );
            setScanResult(res.data);
            setError(null);
            // alert('Success: ' + res.data.event);
        } catch (err) {
            console.error(err);
            setScanResult(null);
            setError(err.response?.data?.msg || 'Validation Failed');
        }
    };

    return (
        <div className="container mt-5">
             <button className="btn btn-outline-secondary mb-3" onClick={() => navigate('/dashboard')}>&larr; Exit Scanner</button>
             <h2 className="text-center mb-4">Ticket Scanner</h2>
             
             <div className="row justify-content-center">
                <div className="col-md-6">
                    <div id="reader" width="600px"></div>
                </div>
             </div>

             <div className="mt-4 text-center">
                {scanResult && (
                    <div className="alert alert-success">
                        <h4>✅ Valid Ticket!</h4>
                        <p><strong>Attendee:</strong> {scanResult.attendee.firstName} {scanResult.attendee.lastName}</p>
                        <p><strong>Event:</strong> {scanResult.event}</p>
                    </div>
                )}
                {error && (
                    <div className="alert alert-danger">
                        <h4>❌ Error</h4>
                        <p>{error}</p>
                    </div>
                )}
             </div>
        </div>
    );
};

export default TicketScanner;