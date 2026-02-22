// backend/routes/registrations.js
const express = require('express');
const router = express.Router();
const Registration = require('../models/Registration');
const Event = require('../models/Event');
const User = require('../models/user');
const jwt = require('jsonwebtoken');
const { sendTicketEmail, generateQRCode } = require('../utils/emailService');

// --- Middleware to Get User ID ---
const auth = (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) return res.status(401).json({ msg: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        res.status(401).json({ msg: 'Token is not valid' });
    }
};

// @route   POST /api/registrations/validate
// @desc    Validate a ticket by QR code or manual entry
// @access  Private (Organizer only)
// NOTE: This route MUST come before /:eventId to avoid route conflict
router.post('/validate', auth, async (req, res) => {
    try {
        const { ticketId } = req.body;

        // 1. Find the registration with populated event and user
        const registration = await Registration.findOne({ ticketId })
            .populate('event')
            .populate('user', 'firstName lastName email contactNumber');
        
        if (!registration) {
            console.log('❌ Registration not found for ticketId:', ticketId);
            return res.status(404).json({ msg: 'Invalid Ticket ID' });
        }

        // 2. Check Authorization: Is the requester the organizer of this event?
        // Note: req.user.id is string, event.organizer is ObjectId
        if (registration.event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            console.log('❌ Access denied - Not organizer');
            return res.status(403).json({ msg: 'Access Denied: You are not the organizer of this event.' });
        }

        console.log('✅ Authorization passed');

        // 3. Check Protocol: Duplicate Scans
        if (registration.status === 'Attended') {
            console.log('Already attended');
            return res.status(400).json({ 
                msg: 'ALREADY USED: Ticket has already been scanned.',
                attendedAt: registration.attendedAt
            });
        }

        // 4. Mark as Attended with timestamp
        registration.status = 'Attended';
        registration.attendedAt = new Date();
        await registration.save();

        res.json({ 
            msg: 'Ticket Validated Successfully', 
            registration,
            attendee: registration.user,
            event: registration.event.name
        });

    } catch (err) {
        console.error('❌ VALIDATION ERROR:', err);
        console.error('Error stack:', err.stack);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/registrations/:eventId
// @desc    Register for an event
// @access  Private (Participants)
router.post('/:eventId', auth, async (req, res) => {
    try {
        const eventId = req.params.eventId;
        const userId = req.user.id;
        const { formResponses } = req.body; // Answers to custom questions

        // 1. Fetch Event Details
        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ msg: 'Event not found' });

        // 2. Check Logic: Is Event Open?
        if (event.status !== 'Published' && event.status !== 'Ongoing') {
            return res.status(400).json({ msg: 'Registration is closed for this event' });
        }

        // 3. Check Logic: Deadline
        if (new Date() > new Date(event.registrationDeadline)) {
            return res.status(400).json({ msg: 'Registration deadline has passed' });
        }

        // 4. Check Logic: Duplicate Registration (based on event type)
        if (event.eventType === 'Merchandise') {
            // For merchandise: check if user already purchased this specific variant
            const variantName = formResponses && formResponses.find(r => r.questionLabel === 'Variant')?.answer;
            
            if (variantName) {
                const existingOrder = await Registration.findOne({ 
                    event: eventId, 
                    user: userId,
                    'formResponses.questionLabel': 'Variant',
                    'formResponses.answer': variantName
                });
                
                if (existingOrder) {
                    return res.status(400).json({ msg: `You have already ordered ${variantName}. Check your pending orders.` });
                }
            }
        } else {
            // For normal events: only one registration allowed per event
            const existingReg = await Registration.findOne({ event: eventId, user: userId });
            if (existingReg) {
                return res.status(400).json({ msg: 'You are already registered for this event' });
            }
        }

        // --- MERCHANDISE LOGIC ---
        if (event.eventType === 'Merchandise') {
             // Find selected variant from answers
             // Frontend sends: [{ questionLabel: 'Variant', answer: 'Size L' }]
             const variantName = formResponses && formResponses.find(r => r.questionLabel === 'Variant')?.answer;
             
             if (!variantName) {
                 return res.status(400).json({ msg: 'Please select a variant' });
             }

             // Find the variant object in the event
             const variantIndex = event.merchandiseVariants.findIndex(v => v.name === variantName);
             if (variantIndex === -1) {
                 return res.status(400).json({ msg: 'Variant not found' });
             }

             if (event.merchandiseVariants[variantIndex].stock <= 0) {
                 return res.status(400).json({ msg: 'Sorry, this item is out of stock' });
             }

             // NOTE: Stock will be decremented only after payment approval
             // For now, we don't decrement stock immediately

        } else {
            // --- NORMAL EVENT LOGIC ---
            // Validate required form fields
            if (event.formFields && event.formFields.length > 0) {
                const requiredFields = event.formFields.filter(f => f.required);
                
                for (const field of requiredFields) {
                    const response = formResponses && formResponses.find(r => r.questionLabel === field.label);
                    
                    if (!response || !response.answer || response.answer.toString().trim() === '') {
                        return res.status(400).json({ 
                            msg: `Required field missing: ${field.label}` 
                        });
                    }
                }
            }
            
            // 5. Check Logic: Seat Limit
            const currentCount = await Registration.countDocuments({ event: eventId, status: 'Registered' });
            if (currentCount >= event.registrationLimit) {
                return res.status(400).json({ msg: 'Event is fully booked' });
            }
        }

        // 6. Create Registration
        const newRegistration = new Registration({
            event: eventId,
            user: userId,
            formResponses: formResponses || [], // Optional if no questions
            // For merchandise: Set status to Pending until payment is approved
            status: event.eventType === 'Merchandise' ? 'Pending' : 'Registered',
            paymentStatus: event.eventType === 'Merchandise' ? 'AwaitingApproval' : 'Completed'
        });

        await newRegistration.save();

        // 7. Generate QR code and send email ONLY for non-merchandise events
        let qrCodeDataURL = null;
        let emailSent = false;
        
        if (event.eventType !== 'Merchandise') {
            // Generate QR code once (to be used in both email and frontend)
            const qrCodeBuffer = await generateQRCode(newRegistration.ticketId);
            qrCodeDataURL = `data:image/png;base64,${qrCodeBuffer.toString('base64')}`;
            
            // Save QR code to registration
            newRegistration.qrCode = qrCodeDataURL;
            await newRegistration.save();

            // 8. Send ticket email with the generated QR code
            try {
                const user = await User.findById(userId);
                const qrCodeBuffer = await generateQRCode(newRegistration.ticketId);
                const emailResult = await sendTicketEmail(
                    user.email,
                    user.firstName,
                    event.name,
                    newRegistration.ticketId,
                    event.startDate,
                    qrCodeBuffer // Pass the same QR code buffer
                );
                
                if (emailResult.success) {
                    console.log('Ticket email sent successfully to:', user.email);
                    emailSent = true;
                } else {
                    console.error('Failed to send ticket email:', emailResult.error);
                }
            } catch (emailError) {
                console.error('Error in email sending process:', emailError);
            }
        }

        // Return appropriate message based on event type
        const responseMsg = event.eventType === 'Merchandise' 
            ? 'Order placed! Please upload payment proof to complete your purchase.'
            : 'Registration successful';

        res.json({ 
            msg: responseMsg,
            ticketId: newRegistration.ticketId,
            qrCode: qrCodeDataURL, // Will be null for merchandise
            emailSent: emailSent,
            isMerchandise: event.eventType === 'Merchandise',
            registrationId: newRegistration._id,
            userEmail: (await User.findById(userId)).email
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/registrations/my-events
// @desc    Get all events the logged-in user registered for
// @access  Private
router.get('/my-events', auth, async (req, res) => {
    try {
        const registrations = await Registration.find({ user: req.user.id })
            .populate('event', 'name startDate endDate status eventType'); // Get event details including endDate
        
        res.json(registrations);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/registrations/:id/cancel
// @desc    Cancel a registration
// @access  Private (Participant who owns the registration)
router.put('/:id/cancel', auth, async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id).populate('event');
        
        if (!registration) {
            return res.status(404).json({ msg: 'Registration not found' });
        }
        
        // Ensure the user owns this registration
        if (registration.user.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized to cancel this registration' });
        }
        
        // Check if already cancelled
        if (registration.status === 'Cancelled') {
            return res.status(400).json({ msg: 'Registration already cancelled' });
        }
        
        // Update status to Cancelled
        registration.status = 'Cancelled';
        await registration.save();
        
        // Increment stock/limit back for the event
        const event = registration.event;
        if (event) {
            if (event.eventType === 'Merchandise') {
                // Find the specific variant and increment stock
                const variant = event.merchandiseVariants.find(v => 
                    v.name === registration.formResponses?.find(f => f.questionLabel === 'Variant')?.answer
                );
                if (variant) {
                    variant.stock += 1;
                    await event.save();
                }
            } else {
                // For normal events, increment registration limit
                event.registrationLimit += 1;
                await event.save();
            }
        }
        
        res.json({ msg: 'Registration cancelled successfully', registration });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/registrations/:id/manual-attendance
// @desc    Manual override for attendance marking (with audit log)
// @access  Private (Organizer only)
router.put('/:id/manual-attendance', auth, async (req, res) => {
    try {
        const { action, reason } = req.body; // action: 'mark' or 'unmark'
        
        if (!reason || !reason.trim()) {
            return res.status(400).json({ msg: 'Reason is required for manual override' });
        }
        
        const registration = await Registration.findById(req.params.id).populate('event');
        
        if (!registration) {
            return res.status(404).json({ msg: 'Registration not found' });
        }
        
        // Check if user is organizer of this event
        if (registration.event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Access Denied: You are not the organizer of this event' });
        }
        
        // Perform action
        if (action === 'mark') {
            registration.status = 'Attended';
            registration.attendedAt = new Date();
            
            // Add to audit log
            registration.auditLog.push({
                action: 'manual_mark',
                performedBy: req.user.id,
                reason: reason.trim(),
                timestamp: new Date()
            });
        } else if (action === 'unmark') {
            registration.status = 'Registered';
            registration.attendedAt = null;
            
            // Add to audit log
            registration.auditLog.push({
                action: 'manual_unmark',
                performedBy: req.user.id,
                reason: reason.trim(),
                timestamp: new Date()
            });
        } else {
            return res.status(400).json({ msg: 'Invalid action. Use "mark" or "unmark"' });
        }
        
        await registration.save();
        
        res.json({ 
            msg: `Attendance ${action === 'mark' ? 'marked' : 'unmarked'} successfully`,
            registration
        });
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/registrations/:id/payment-proof
// @desc    Upload payment proof for merchandise order
// @access  Private (Participant who made the order)
router.put('/:id/payment-proof', auth, async (req, res) => {
    try {
        const { paymentProof } = req.body;
        
        if (!paymentProof) {
            return res.status(400).json({ msg: 'Payment proof link is required' });
        }
        
        const registration = await Registration.findById(req.params.id);
        
        if (!registration) {
            return res.status(404).json({ msg: 'Order not found' });
        }
        
        // Check if user owns this registration
        if (registration.user.toString() !== req.user.id) {
            return res.status(403).json({ msg: 'Not authorized' });
        }
        
        // Update payment proof
        registration.paymentProof = paymentProof;
        registration.paymentStatus = 'AwaitingApproval';
        registration.status = 'Pending';
        await registration.save();
        
        res.json({ msg: 'Payment proof uploaded successfully. Awaiting organizer approval.', registration });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/registrations/event/:eventId/pending-payments
// @desc    Get all pending payment approvals for an event (Organizer only)
// @access  Private (Organizer)
router.get('/event/:eventId/pending-payments', auth, async (req, res) => {
    try {
        const event = await Event.findById(req.params.eventId);
        
        if (!event) {
            return res.status(404).json({ msg: 'Event not found' });
        }
        
        // Check if user is organizer of this event
        if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }
        
        // Get all orders for this event with payment proof
        const orders = await Registration.find({ 
            event: req.params.eventId,
            paymentStatus: { $in: ['AwaitingApproval', 'Completed', 'Failed'] }
        })
        .populate('user', 'firstName lastName email')
        .sort({ createdAt: -1 });
        
        res.json(orders);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/registrations/:id/approve-payment
// @desc    Approve merchandise payment (generates QR, sends email, decrements stock)
// @access  Private (Organizer)
router.put('/:id/approve-payment', auth, async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id)
            .populate('event')
            .populate('user');
        
        if (!registration) {
            return res.status(404).json({ msg: 'Order not found' });
        }
        
        // Check if user is organizer of this event
        if (registration.event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }
        
        // Generate QR code
        const qrCodeBuffer = await generateQRCode(registration.ticketId);
        const qrCodeDataURL = `data:image/png;base64,${qrCodeBuffer.toString('base64')}`;
        
        // Update registration
        registration.status = 'Approved';
        registration.paymentStatus = 'Completed';
        registration.qrCode = qrCodeDataURL;
        await registration.save();
        
        // Decrement stock
        const variantName = registration.formResponses.find(r => r.questionLabel === 'Variant')?.answer;
        if (variantName) {
            const event = registration.event;
            const variantIndex = event.merchandiseVariants.findIndex(v => v.name === variantName);
            if (variantIndex !== -1 && event.merchandiseVariants[variantIndex].stock > 0) {
                event.merchandiseVariants[variantIndex].stock -= 1;
                await event.save();
            }
        }
        
        // Send email with QR code
        try {
            const emailResult = await sendTicketEmail(
                registration.user.email,
                registration.user.firstName,
                registration.event.name,
                registration.ticketId,
                registration.event.startDate,
                qrCodeBuffer
            );
            console.log('Ticket email sent after payment approval:', emailResult.success);
        } catch (emailError) {
            console.error('Error sending email after approval:', emailError);
        }
        
        res.json({ msg: 'Payment approved! QR code generated and email sent.', registration });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT /api/registrations/:id/reject-payment
// @desc    Reject merchandise payment
// @access  Private (Organizer)
router.put('/:id/reject-payment', auth, async (req, res) => {
    try {
        const registration = await Registration.findById(req.params.id).populate('event');
        
        if (!registration) {
            return res.status(404).json({ msg: 'Order not found' });
        }
        
        // Check if user is organizer of this event
        if (registration.event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ msg: 'Not authorized' });
        }
        
        // Update registration
        registration.status = 'Rejected';
        registration.paymentStatus = 'Failed';
        await registration.save();
        
        res.json({ msg: 'Payment rejected.', registration });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;