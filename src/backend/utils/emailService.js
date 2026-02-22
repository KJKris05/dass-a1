// backend/utils/emailService.js
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
    },
});

// Generate QR code
const generateQRCode = async (ticketId) => {
    return await QRCode.toBuffer(ticketId, {
        width: 200,
        height: 200,
        margin: 1,
        errorCorrectionLevel: 'M',
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        },
        type: 'png'
    });
};

// Send ticket email with QR code
const sendTicketEmail = async (userEmail, userName, eventName, ticketId, eventDate, qrCodeBuffer) => {
    try {
        // Use provided QR code buffer (already generated)
        console.log('Sending email with pre-generated QR code for ticket:', ticketId);

        // Email HTML content - use cid: reference for embedded image
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #0d6efd; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
                    .content { background-color: #f8f9fa; padding: 30px; border: 1px solid #dee2e6; }
                    .ticket-box { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .qr-code { margin: 20px 0; }
                    .ticket-id { font-size: 12px; color: #6c757d; word-break: break-all; }
                    .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 12px; }
                    .btn { display: inline-block; padding: 10px 20px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🎉 ${process.env.EMAIL_FROM_NAME}</h1>
                        <p>Your Event Registration Confirmation</p>
                    </div>
                    <div class="content">
                        <h2>Hello ${userName}!</h2>
                        <p>Thank you for registering for <strong>${eventName}</strong>.</p>
                        <p><strong>Event Date:</strong> ${new Date(eventDate).toLocaleString()}</p>
                        
                        <div class="ticket-box">
                            <h3>Your Entry Ticket</h3>
                            <p>Please show this QR code at the venue entrance:</p>
                            <div class="qr-code">
                                <img src="cid:qrcode" alt="QR Code" width="200" height="200" style="display: block; margin: 0 auto; max-width: 200px;" />
                            </div>
                            <p class="ticket-id"><strong>Ticket ID:</strong><br/>${ticketId}</p>
                            <p style="color: #28a745; font-weight: bold;">✓ VALID FOR ENTRY</p>
                        </div>
                        
                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>Save this email for easy access to your ticket</li>
                            <li>You can also view your ticket anytime from your dashboard</li>
                            <li>Show the QR code at the venue for quick check-in</li>
                        </ul>
                    </div>
                    <div class="footer">
                        <p>This is an automated email. Please do not reply.</p>
                        <p>&copy; 2026 ${process.env.EMAIL_FROM_NAME}. All rights reserved.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Send email with embedded QR code as attachment
        const info = await transporter.sendMail({
            from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_USER}>`,
            to: userEmail,
            subject: `Your Ticket for ${eventName} - ${process.env.EMAIL_FROM_NAME}`,
            html: htmlContent,
            attachments: [
                {
                    filename: 'qrcode.png',
                    content: qrCodeBuffer,
                    cid: 'qrcode' // Same cid value as in the html img src
                }
            ]
        });

        console.log('Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = { sendTicketEmail, generateQRCode };
