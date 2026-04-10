/**
 * EMAIL ROUTES
 * Handle email sending for NOC delivery
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { NOCRequest, EmailLog, Company } = require('../models');
const nodemailer = require('nodemailer');

/**
 * @route   POST /api/email/send-noc/:nocId
 * @desc    Send signed NOC via email
 * @access  Private (Faculty/Admin)
 */
router.post('/send-noc/:nocId', authenticate, authorize('faculty', 'admin'), async (req, res) => {
    try {
        const nocRequest = await NOCRequest.findByPk(req.params.nocId, {
            include: [{ model: Company, as: 'company' }]
        });

        if (!nocRequest) {
            return res.status(404).json({
                success: false,
                message: 'NOC request not found'
            });
        }

        if (nocRequest.status !== 'signed') {
            return res.status(400).json({
                success: false,
                message: 'NOC must be signed before sending'
            });
        }

        // Create email transporter
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const recipients = [
            nocRequest.studentEmail,
            nocRequest.company.hrEmail
        ];

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: recipients,
            cc: req.user.email,
            subject: `Signed NOC – Internship Approval for ${nocRequest.studentName}`,
            html: `
                <h2>No Objection Certificate</h2>
                <p>Dear ${nocRequest.studentName},</p>
                <p>Your NOC request for internship at <strong>${nocRequest.company.name}</strong> has been approved and signed.</p>
                <p>Please find the signed NOC certificate attached.</p>
                <br>
                <p>Best regards,<br>${req.user.name}<br>${req.user.designation || 'Faculty'}</p>
            `
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // Log email
        await EmailLog.create({
            nocRequestId: nocRequest.id,
            sentTo: recipients,
            cc: [req.user.email],
            subject: mailOptions.subject,
            body: mailOptions.html,
            status: 'sent',
            sentAt: new Date()
        });

        // Update NOC request
        nocRequest.emailSent = true;
        nocRequest.emailSentAt = new Date();
        await nocRequest.save();

        res.json({
            success: true,
            message: 'Email sent successfully'
        });

    } catch (error) {
        console.error('Email send error:', error);

        // Log failed email
        await EmailLog.create({
            nocRequestId: req.params.nocId,
            sentTo: [],
            status: 'failed',
            errorMessage: error.message
        });

        res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: error.message
        });
    }
});

module.exports = router;
