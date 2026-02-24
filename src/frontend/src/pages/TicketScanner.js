import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import axios from 'axios';
import { useNavigate, useParams } from 'react-router-dom';

const TicketScanner = () => {
    const navigate = useNavigate();
    const { eventId } = useParams();
    const [event, setEvent] = useState(null);
    const [attendees, setAttendees] = useState([]);
    const [scanResult, setScanResult] = useState(null);
    const [lastScanned, setLastScanned] = useState('');
    const [manualTicketId, setManualTicketId] = useState('');
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [scannerActive, setScannerActive] = useState(false);
    const [loading, setLoading] = useState(true);
    const scannerRef = useRef(null);

    useEffect(() => {
        if (eventId) {
            fetchEventAndAttendees();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventId]);

    const fetchEventAndAttendees = async () => {
        try {
            const token = localStorage.getItem('token');
            
            // Fetch event details
            const eventRes = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/${eventId}`, {
                headers: { 'x-auth-token': token }
            });
            setEvent(eventRes.data);

            // Fetch attendees
            const attendeesRes = await axios.get(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/events/${eventId}/attendees`, {
                headers: { 'x-auth-token': token }
            });
            setAttendees(attendeesRes.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            alert('Failed to load event data');
            setLoading(false);
        }
    };

    const startScanner = () => {
        setScannerActive(true);
        setScanResult(null);

        // Use setTimeout to ensure DOM element is rendered
        setTimeout(() => {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            scanner.render(onScanSuccess, onScanFailure);
            scannerRef.current = scanner;
        }, 100);
    };

    const stopScanner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear().catch(err => console.error(err));
            scannerRef.current = null;
        }
        setScannerActive(false);
    };

    const onScanSuccess = (decodedText) => {
        // Prevent duplicate scans
        if (decodedText !== lastScanned) {
            setLastScanned(decodedText);
            validateTicket(decodedText);
        }
    };

    const onScanFailure = (error) => {
        // Silent fail - scanner continuously tries
    };

    const validateTicket = async (ticketId) => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.post(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/registrations/validate`, 
                { ticketId }, 
                { headers: { 'x-auth-token': token } }
            );
            setScanResult({
                success: true,
                message: res.data.msg,
                registration: res.data.registration,
                attendee: res.data.attendee
            });
            
            // Refresh attendees list
            await fetchEventAndAttendees();
            
            // Auto-clear after 3 seconds
            setTimeout(() => {
                setScanResult(null);
                setLastScanned('');
            }, 3000);
        } catch (err) {
            console.error(err);
            const errorMsg = err.response?.data?.msg || 'Validation Failed';
            setScanResult({
                success: false,
                message: errorMsg,
                attendedAt: err.response?.data?.attendedAt
            });
            
            // Auto-clear error after 3 seconds
            setTimeout(() => {
                setScanResult(null);
                setLastScanned('');
            }, 3000);
        }
    };

    const handleManualEntry = async (e) => {
        e.preventDefault();
        if (!manualTicketId.trim()) {
            alert('Please enter a ticket ID');
            return;
        }
        await validateTicket(manualTicketId.trim());
        setManualTicketId('');
    };

    const handleManualOverride = async (registrationId, action) => {
        const actionText = action === 'mark' ? 'marking as attended' : 'unmarking attendance';
        const reason = prompt(`Enter reason for ${actionText}:`);
        if (!reason || !reason.trim()) return;

        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/registrations/${registrationId}/manual-attendance`,
                { action, reason: reason.trim() },
                { headers: { 'x-auth-token': token } }
            );
            alert('Attendance updated successfully');
            await fetchEventAndAttendees();
        } catch (err) {
            alert(err.response?.data?.msg || 'Failed to update attendance');
        }
    };

    const exportCSV = () => {
        // Prepare CSV data
        const headers = ['Name', 'Email', 'Contact', 'Status', 'Attended At', 'Ticket ID'];
        const rows = attendees.map(att => [
            `${att.user?.firstName || ''} ${att.user?.lastName || ''}`,
            att.user?.email || '',
            att.user?.contactNumber || '',
            att.status,
            att.attendedAt ? new Date(att.attendedAt).toLocaleString() : 'Not attended',
            att.ticketId || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // Download
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-${event?.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    if (loading) return <div className="text-center mt-5"><div className="spinner-border"></div></div>;

    const scannedCount = attendees.filter(a => a.status === 'Attended').length;
    const totalCount = attendees.length;
    const percentage = totalCount > 0 ? Math.round((scannedCount / totalCount) * 100) : 0;

    return (
        <div className="container mt-4 mb-5">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>📱 QR Scanner - {event?.name}</h2>
                <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                    ← Back to Dashboard
                </button>
            </div>

            {/* Live Statistics Dashboard */}
            <div className="row mb-4">
                <div className="col-md-3">
                    <div className="card bg-primary text-white shadow">
                        <div className="card-body text-center">
                            <h2 className="display-4">{totalCount}</h2>
                            <p className="mb-0">Total Registered</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-success text-white shadow">
                        <div className="card-body text-center">
                            <h2 className="display-4">{scannedCount}</h2>
                            <p className="mb-0">Scanned / Attended</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-warning text-dark shadow">
                        <div className="card-body text-center">
                            <h2 className="display-4">{totalCount - scannedCount}</h2>
                            <p className="mb-0">Not Yet Scanned</p>
                        </div>
                    </div>
                </div>
                <div className="col-md-3">
                    <div className="card bg-info text-white shadow">
                        <div className="card-body text-center">
                            <h2 className="display-4">{percentage}%</h2>
                            <p className="mb-0">Attendance Rate</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* QR Scanner Section */}
            <div className="card shadow mb-4">
                <div className="card-header bg-dark text-white">
                    <h5 className="mb-0">🎥 Scan QR Codes</h5>
                </div>
                <div className="card-body">
                    {!scannerActive ? (
                        <div className="text-center">
                            <button className="btn btn-primary btn-lg me-2 mb-2" onClick={startScanner}>
                                📷 Start Camera Scanner
                            </button>
                            <button 
                                className="btn btn-outline-secondary btn-lg mb-2"
                                onClick={() => setShowManualEntry(!showManualEntry)}
                            >
                                ⌨️ {showManualEntry ? 'Hide' : 'Show'} Manual Entry
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div id="reader" style={{ width: '100%' }}></div>
                            <div className="text-center mt-3">
                                <button className="btn btn-danger" onClick={stopScanner}>
                                    ⏹️ Stop Scanner
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Manual Entry Form */}
                    {showManualEntry && !scannerActive && (
                        <div className="mt-3">
                            <form onSubmit={handleManualEntry} className="row g-2">
                                <div className="col-auto flex-grow-1">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter Ticket ID manually"
                                        value={manualTicketId}
                                        onChange={(e) => setManualTicketId(e.target.value)}
                                    />
                                </div>
                                <div className="col-auto">
                                    <button type="submit" className="btn btn-primary">
                                        ✓ Validate
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Scan Result Display */}
                    {scanResult && (
                        <div className={`alert ${scanResult.success ? 'alert-success' : 'alert-danger'} mt-3 mb-0`}>
                            <h4>{scanResult.success ? '✅ Valid Ticket!' : '❌ Invalid/Already Used'}</h4>
                            <p className="mb-1"><strong>{scanResult.message}</strong></p>
                            {scanResult.attendee && (
                                <div className="mt-2">
                                    <p className="mb-0"><strong>Name:</strong> {scanResult.attendee.firstName} {scanResult.attendee.lastName}</p>
                                    <p className="mb-0"><strong>Email:</strong> {scanResult.attendee.email}</p>
                                </div>
                            )}
                            {scanResult.attendedAt && (
                                <p className="mb-0 mt-2">
                                    <strong>Previously scanned at:</strong> {new Date(scanResult.attendedAt).toLocaleString()}
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Attendees List & Dashboard */}
            <div className="card shadow">
                <div className="card-header bg-info text-white d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">📋 Live Attendance Dashboard</h5>
                    <button className="btn btn-light btn-sm" onClick={exportCSV}>
                        📥 Export CSV Report
                    </button>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead className="table-light">
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Contact</th>
                                    <th>Status</th>
                                    <th>Attended At</th>
                                    <th>Manual Override</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendees.map((att, index) => (
                                    <tr 
                                        key={att._id} 
                                        className={att.status === 'Attended' ? 'table-success' : ''}
                                    >
                                        <td>{index + 1}</td>
                                        <td>
                                            <strong>
                                                {att.user?.firstName || 'N/A'} {att.user?.lastName || ''}
                                            </strong>
                                        </td>
                                        <td>{att.user?.email || 'N/A'}</td>
                                        <td>{att.user?.contactNumber || 'N/A'}</td>
                                        <td>
                                            <span className={`badge ${
                                                att.status === 'Attended' ? 'bg-success' : 'bg-warning text-dark'
                                            }`}>
                                                {att.status === 'Attended' ? '✓ Scanned' : 'Not Scanned'}
                                            </span>
                                        </td>
                                        <td>
                                            {att.attendedAt 
                                                ? new Date(att.attendedAt).toLocaleString()
                                                : '-'
                                            }
                                        </td>
                                        <td>
                                            {att.status === 'Attended' ? (
                                                <button 
                                                    className="btn btn-sm btn-warning"
                                                    onClick={() => handleManualOverride(att._id, 'unmark')}
                                                    title="Unmark attendance (requires reason)"
                                                >
                                                    ↺ Unmark
                                                </button>
                                            ) : (
                                                <button 
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleManualOverride(att._id, 'mark')}
                                                    title="Mark as attended manually (requires reason)"
                                                >
                                                    ✓ Mark Present
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {attendees.length === 0 && (
                            <div className="text-center text-muted py-4">
                                No registrations found for this event.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketScanner;