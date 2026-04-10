/**
 * EMAIL SERVICE
 * Centralized service for sending emails
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter using environment variables
const createTransporter = () => {
    return nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

/**
 * Send an email
 * @param {Object} options - { to, subject, html, text, attachments }
 */
const sendEmail = async (options) => {
    const transporter = createTransporter();

    const mailOptions = {
        from: process.env.EMAIL_FROM || '"eNOC Portal" <noreply@charusat.edu.in>',
        to: options.to,
        cc: options.cc,
        subject: options.subject,
        html: options.html,
        text: options.text || '',
        attachments: options.attachments || []
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error.message);
        throw error;
    }
};

/**
 * Test the email configuration
 */
const testConnection = async () => {
    const transporter = createTransporter();
    try {
        await transporter.verify();
        console.log('✅ Email service is ready to send messages');
        return true;
    } catch (error) {
        console.error('❌ Email service configuration error:', error.message);
        return false;
    }
};

module.exports = {
    sendEmail,
    testConnection
};
