/**
 * NOC REQUEST ROUTES
 * Handle NOC request CRUD operations and approval workflow
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize, authenticateFacultyAdmin, authorizeFacultyAdmin } = require('../middleware/auth');
const { NOCRequest, Company, User, Signature } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');

// Validation middleware generator
const validate = validations => {
    return async (req, res, next) => {
        for (let validation of validations) {
            const result = await validation.run(req);
            if (result.errors.length) break;
        }
        const errors = validationResult(req);
        if (errors.isEmpty()) {
            return next();
        }
        res.status(400).json({ 
            success: false, 
            message: 'Validation failed: ' + errors.array()[0].msg, 
            errors: errors.array() 
        });
    };
};

/**
 * Helper: Send notification email (silent — never throws).
 */
async function sendNotificationEmail({ to, subject, html }) {
    try {
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD ||
            process.env.EMAIL_USER === 'your-email@gmail.com') {
            console.log('[Email] Skipped — EMAIL_USER/PASSWORD not configured.');
            return;
        }
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
        });
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to, subject, html
        });
        console.log('[Email] Sent to:', to);
    } catch (err) {
        console.warn('[Email] Failed (non-fatal):', err.message);
    }
}

/**
 * @route   POST /api/noc/submit
 * @desc    Submit new NOC request
 * @access  Private (Student)
 */
router.post('/submit', authenticate, authorize('student'), validate([
    body('semester').isInt({ min: 1, max: 8 }).withMessage('Semester must be an integer between 1 and 8').toInt(),
    body('mobile').isMobilePhone('en-IN').withMessage('Mobile number must be valid').trim().escape(),
    body('companyId').isInt().withMessage('Valid company ID is required').toInt(),
    body('startDate').isISO8601().toDate().withMessage('Start date must be valid'),
    body('endDate').isISO8601().toDate().withMessage('End date must be valid')
        .custom((endDate, { req }) => {
            const startDate = new Date(req.body.startDate);
            if (endDate <= startDate) {
                throw new Error('End date must be after start date');
            }
            return true;
        })
]), async (req, res) => {
    try {
        const { semester, mobile, companyId, startDate, endDate } = req.body;

        // Check if company exists
        console.log('🔍 Checking if company exists:', companyId);
        const company = await Company.findByPk(companyId);
        if (!company) {
            console.error('❌ Company not found:', companyId);
            return res.status(400).json({
                success: false,
                message: 'Company not found. Please select a valid company.'
            });
        }
        console.log('✅ Company found:', company.name);

        // Note: Allow unapproved companies (they will be pending until company is approved)

        // Check for duplicate NOC
        console.log('🔍 Checking for duplicate NOC requests for studentId:', req.user.id, 'companyId:', companyId);
        const existing = await NOCRequest.findOne({
            where: {
                studentId: req.user.id,
                companyId,
                status: { [Op.notIn]: ['rejected'] }
            },
            include: [{ model: Company, as: 'company' }]
        });

        if (existing) {
            console.warn('⚠️  Duplicate NOC found: id=', existing.id, 'status=', existing.status);
            return res.status(409).json({
                success: false,
                code: 'DUPLICATE_NOC',
                message: `You already have a ${existing.status} NOC request for this company.`,
                existingNOC: {
                    id: existing.id,
                    nocId: existing.nocId,
                    status: existing.status,
                    companyName: existing.company?.name || 'Unknown Company',
                    submittedAt: existing.submittedAt || existing.createdAt
                }
            });
        }
        console.log('✅ No duplicate NOC found');

        // Create NOC request
        console.log('💾 Creating NOC request in database...');

        // Derive enrollment number is now auto-computed from email via VIRTUAL field in model
        // No need to store it separately

        const nocRequest = await NOCRequest.create({
            studentId: req.user.id,
            studentName: req.user.name,
            studentEmail: req.user.email,
            semester: parseInt(semester),
            mobile,
            companyId: parseInt(companyId),
            startDate,
            endDate,
            status: 'submitted'
        });

        console.log('✅ NOC request saved to DB:', {
            id: nocRequest.id,
            nocId: nocRequest.nocId,
            studentId: req.user.id,
            studentName: req.user.name,
            studentEmail: req.user.email,
            enrollmentNo: nocRequest.enrollmentNo, // computed by virtual getter
            companyId,
            status: nocRequest.status
        });

        console.log('✅ NOC Request Created Successfully:', {
            id: nocRequest.id,
            nocId: nocRequest.nocId,
            studentId: nocRequest.studentId,
            companyId: nocRequest.companyId,
            status: nocRequest.status
        });

        res.status(201).json({
            success: true,
            message: 'NOC request submitted successfully',
            nocRequest
        });

    } catch (error) {
        console.error('💥 NOC Submission Error:', error.message);
        console.error('Error Details:', {
            name: error.name,
            message: error.message,
            stack: error.stack
        });

        // Handle specific database errors
        if (error.name === 'SequelizeForeignKeyConstraintError') {
            console.error('❌ Foreign Key Constraint Error');
            return res.status(400).json({
                success: false,
                message: 'Invalid student or company ID. Please refresh and try again.'
            });
        }

        if (error.name === 'SequelizeValidationError') {
            console.error('❌ Validation Error:', error.errors);
            return res.status(400).json({
                success: false,
                message: 'Validation failed: ' + error.errors.map(e => e.message).join(', ')
            });
        }

        if (error.name === 'SequelizeUniqueConstraintError') {
            console.error('❌ Unique Constraint Error');
            return res.status(400).json({
                success: false,
                message: 'Duplicate NOC request detected'
            });
        }

        // Generic error
        res.status(500).json({
            success: false,
            message: 'Failed to submit NOC request. Please try again.',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/noc/my-requests
 * @desc    Get student's NOC requests
 * @access  Private (Student)
 */
router.get('/my-requests', authenticate, authorize('student'), async (req, res) => {
    try {
        const requests = await NOCRequest.findAll({
            where: { studentId: req.user.id },
            include: [
                { model: Company, as: 'company' },
                { model: User, as: 'reviewer', attributes: ['name', 'designation'] },
                { model: Signature, as: 'signature' }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {
        console.error('Get requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch NOC requests',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/noc/pending
 * @desc    Get pending NOC requests for review
 * @access  Private (Faculty/Admin)
 */
router.get('/pending', authenticateFacultyAdmin, authorizeFacultyAdmin('faculty', 'admin'), async (req, res) => {
    try {
        const { status } = req.query;

        const where = status ? { status } : { status: { [Op.in]: ['submitted', 'under_review'] } };

        console.log('[Faculty] Loading NOCs with filter:', JSON.stringify(where));

        const requests = await NOCRequest.findAll({
            where,
            include: [
                { model: User, as: 'student', attributes: ['name', 'email', 'semester', 'studentId'] },
                { model: Company, as: 'company' }
            ],
            order: [['created_at', 'ASC']]
        });

        console.log(`[Faculty] Found ${requests.length} NOC(s) with status filter:`, JSON.stringify(where));

        res.json({
            success: true,
            count: requests.length,
            requests
        });

    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending requests',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/noc/:id/approve
 * @desc    Approve NOC request
 * @access  Private (Faculty ONLY — Admin is BLOCKED)
 */
router.put('/:id/approve', authenticateFacultyAdmin, authorizeFacultyAdmin('faculty'), validate([
    body('approvalComments').optional({ checkFalsy: true }).trim().escape().isLength({ max: 500 }).withMessage('Comments must not exceed 500 characters')
]), async (req, res) => {
    try {
        // Extra role guard — admin must never approve
        if (req.user && req.user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Administrators cannot approve NOC requests. Only Faculty members have approval authority.'
            });
        }

        const { approvalComments } = req.body;
        const nocRequest = await NOCRequest.findByPk(req.params.id, {
            include: [{ model: Company, as: 'company' }]
        });

        if (!nocRequest) {
            return res.status(404).json({ success: false, message: 'NOC request not found' });
        }

        if (nocRequest.status !== 'submitted' && nocRequest.status !== 'under_review') {
            return res.status(400).json({ success: false, message: 'NOC request cannot be approved in current status' });
        }

        const now = new Date();
        nocRequest.status = 'approved';
        nocRequest.reviewedBy = req.user.id || null;
        nocRequest.reviewedByName = req.user.name;
        nocRequest.reviewedAt = now;
        nocRequest.approvalComments = approvalComments || '';
        await nocRequest.save();

        console.log(`✅ NOC ${nocRequest.id} approved by Faculty: ${req.user.name}`);

        // Send approval email to student (non-blocking)
        const companyName = nocRequest.company ? nocRequest.company.name : 'the company';
        sendNotificationEmail({
            to: nocRequest.studentEmail,
            subject: `✅ Your NOC Request Has Been Approved — ${nocRequest.nocId}`,
            html: `
                <h2 style="color:#16a34a;">NOC Request Approved</h2>
                <p>Dear ${nocRequest.studentName},</p>
                <p>Your NOC request (<strong>${nocRequest.nocId}</strong>) for internship at <strong>${companyName}</strong> has been <strong>approved</strong> by ${req.user.name}.</p>
                ${approvalComments ? `<p><strong>Faculty Comments:</strong> ${approvalComments}</p>` : ''}
                <p>You can now <strong>log in to the portal and download your PDF certificate</strong>.</p>
                <br><p>Best regards,<br>${req.user.name}<br>${req.user.designation || 'Faculty'}<br>CHARUSAT University</p>
            `
        });

        res.json({ success: true, message: 'NOC request approved successfully', nocRequest });

    } catch (error) {
        console.error('Approve NOC error:', error);
        res.status(500).json({ success: false, message: 'Failed to approve NOC request', error: error.message });
    }
});

/**
 * @route   PUT /api/noc/:id/reject
 * @desc    Reject NOC request
 * @access  Private (Faculty ONLY — Admin is BLOCKED)
 */
router.put('/:id/reject', authenticateFacultyAdmin, authorizeFacultyAdmin('faculty'), validate([
    body('rejectionReason').notEmpty().withMessage('Rejection reason is required').trim().escape().isLength({ min: 5, max: 800 }).withMessage('Rejection reason needs to be between 5 and 800 characters')
]), async (req, res) => {
    try {
        // Extra role guard
        if (req.user && req.user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Administrators cannot reject NOC requests. Only Faculty members have rejection authority.'
            });
        }

        const { rejectionReason } = req.body;

        const nocRequest = await NOCRequest.findByPk(req.params.id, {
            include: [{ model: Company, as: 'company' }]
        });
        if (!nocRequest) {
            return res.status(404).json({ success: false, message: 'NOC request not found' });
        }

        const now = new Date();
        nocRequest.status = 'rejected';
        nocRequest.reviewedBy = req.user.id || null;
        nocRequest.reviewedByName = req.user.name;
        nocRequest.rejectionReason = rejectionReason;
        nocRequest.rejectedAt = now;
        nocRequest.reviewedAt = now;
        await nocRequest.save();

        console.log(`❌ NOC ${nocRequest.id} rejected by Faculty: ${req.user.name}`);

        // Send rejection email to student (non-blocking)
        const companyName = nocRequest.company ? nocRequest.company.name : 'the company';
        sendNotificationEmail({
            to: nocRequest.studentEmail,
            subject: `❌ Your NOC Request Has Been Rejected — ${nocRequest.nocId}`,
            html: `
                <h2 style="color:#dc2626;">NOC Request Rejected</h2>
                <p>Dear ${nocRequest.studentName},</p>
                <p>Your NOC request (<strong>${nocRequest.nocId}</strong>) for internship at <strong>${companyName}</strong> has been <strong>rejected</strong> by ${req.user.name}.</p>
                <p><strong>Reason:</strong> ${rejectionReason}</p>
                <p>Please login to the portal to view details or submit a new request.</p>
                <br><p>Best regards,<br>${req.user.name}<br>${req.user.designation || 'Faculty'}<br>CHARUSAT University</p>
            `
        });

        res.json({ success: true, message: 'NOC request rejected', nocRequest });

    } catch (error) {
        console.error('Reject NOC error:', error);
        res.status(500).json({ success: false, message: 'Failed to reject NOC request', error: error.message });
    }
});

/**
 * @route   PUT /api/noc/:id/sign
 * @desc    Sign NOC request with e-signature
 * @access  Private (Faculty ONLY — Admin is BLOCKED)
 */
router.put('/:id/sign', authenticateFacultyAdmin, authorizeFacultyAdmin('faculty'), async (req, res) => {
    try {
        // Extra role guard
        if (req.user && req.user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Forbidden: Administrators cannot sign NOC requests. Only Faculty members can apply e-signatures.'
            });
        }

        const { signatureId } = req.body;
        if (!signatureId) {
            return res.status(400).json({ success: false, message: 'Signature ID is required' });
        }

        const nocRequest = await NOCRequest.findByPk(req.params.id);
        if (!nocRequest) {
            return res.status(404).json({ success: false, message: 'NOC request not found' });
        }

        if (nocRequest.status !== 'approved') {
            return res.status(400).json({ success: false, message: 'NOC must be approved before signing' });
        }

        const signature = await Signature.findOne({
            where: { id: signatureId, userId: req.user.id, isActive: true }
        });

        if (!signature) {
            return res.status(404).json({ success: false, message: 'Signature not found or inactive' });
        }

        nocRequest.status = 'signed';
        nocRequest.signatureId = signatureId;
        nocRequest.signedAt = new Date();
        await nocRequest.save();

        console.log(`📝 NOC ${nocRequest.id} signed by Faculty: ${req.user.name}`);

        res.json({ success: true, message: 'NOC signed successfully', nocRequest });

    } catch (error) {
        console.error('Sign NOC error:', error);
        res.status(500).json({ success: false, message: 'Failed to sign NOC', error: error.message });
    }
});

/**
 * @route   GET /api/noc/all
 * @desc    Get ALL NOC requests (Admin management view)
 * @access  Private (Admin ONLY)
 */
router.get('/all', authenticateFacultyAdmin, authorizeFacultyAdmin('admin'), async (req, res) => {
    try {
        const { status } = req.query;
        const where = status ? { status } : {};

        const requests = await NOCRequest.findAll({
            where,
            include: [
                { model: User, as: 'student', attributes: ['name', 'email', 'semester'] },
                { model: Company, as: 'company' },
                { model: User, as: 'reviewer', attributes: ['name', 'designation'] }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({ success: true, count: requests.length, requests });

    } catch (error) {
        console.error('Get all NOCs error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch NOC requests', error: error.message });
    }
});

/**
 * @route   GET /api/noc/stats
 * @desc    Get NOC dashboard counts
 * @access  Private (Faculty/Admin)
 */
router.get('/stats', authenticateFacultyAdmin, authorizeFacultyAdmin('faculty', 'admin'), async (req, res) => {
    try {
        const [pending, approved, rejected, total] = await Promise.all([
            NOCRequest.count({ where: { status: { [Op.in]: ['submitted', 'under_review'] } } }),
            NOCRequest.count({ where: { status: 'approved' } }),
            NOCRequest.count({ where: { status: 'rejected' } }),
            NOCRequest.count()
        ]);

        const { Company } = require('../models');
        const pendingCompanies = await Company.count({ where: { approved: false } });

        res.json({
            success: true,
            stats: { pending, approved, rejected, total, pendingCompanies }
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats', error: error.message });
    }
});

/**
 * @route   GET /api/noc/:id/download-pdf
 * @desc    Get approved NOC data for PDF generation (blocked if not approved)
 * @access  Private (Student — own request, or Faculty/Admin)
 */
router.get('/:id/download-pdf', authenticate, async (req, res) => {
    try {
        const nocRequest = await NOCRequest.findByPk(req.params.id, {
            include: [
                { model: User, as: 'student', attributes: ['name', 'email', 'department', 'semester'] },
                { model: Company, as: 'company' },
                { model: User, as: 'reviewer', attributes: ['name', 'designation'] }
            ]
        });

        if (!nocRequest) {
            return res.status(404).json({ success: false, message: 'NOC request not found' });
        }

        // Students can only access their own NOC
        if (req.user.role === 'student' && nocRequest.studentId !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        // Block PDF if not approved (or signed)
        if (nocRequest.status !== 'approved' && nocRequest.status !== 'signed') {
            return res.status(403).json({
                success: false,
                message: `PDF is only available after faculty approval. Current status: ${nocRequest.status}`,
                status: nocRequest.status
            });
        }

        // Return full NOC data for frontend PDF generation
        res.json({
            success: true,
            nocRequest,
            pdfAllowed: true,
            approvedBy: nocRequest.reviewedByName || 'Faculty',
            approvedAt: nocRequest.reviewedAt
        });
    } catch (error) {
        console.error('Download PDF error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch NOC for PDF', error: error.message });
    }
});

router.delete('/:id', authenticateFacultyAdmin, authorizeFacultyAdmin('faculty', 'admin'), async (req, res) => {
    try {
        const nocRequest = await NOCRequest.findByPk(req.params.id);
        if (!nocRequest) {
            return res.status(404).json({ success: false, message: 'NOC request not found' });
        }

        // Faculty can only delete approved internship requests.
        // Admin can delete any request status.
        if (req.user.role === 'faculty' && nocRequest.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'Faculty can delete only approved internship requests.'
            });
        }

        await nocRequest.destroy();
        console.log(`🗑 NOC ${req.params.id} deleted by ${req.user.role}: ${req.user.name}`);

        res.json({ success: true, message: 'NOC request deleted successfully' });

    } catch (error) {
        console.error('Delete NOC error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete NOC request', error: error.message });
    }
});

/**
 * @route   GET /api/noc/:id
 * @desc    Get single NOC request details
 * @access  Private
 */
router.get('/:id', authenticateFacultyAdmin, async (req, res) => {
    try {
        const nocRequest = await NOCRequest.findByPk(req.params.id, {
            include: [
                { model: User, as: 'student', attributes: ['name', 'email', 'semester'] },
                { model: Company, as: 'company' },
                { model: User, as: 'reviewer', attributes: ['name', 'designation'] },
                { model: Signature, as: 'signature' }
            ]
        });

        if (!nocRequest) {
            return res.status(404).json({
                success: false,
                message: 'NOC request not found'
            });
        }

        // Check authorization
        if (req.user.role === 'student' && nocRequest.studentId !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        res.json({
            success: true,
            nocRequest
        });

    } catch (error) {
        console.error('Get NOC error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch NOC request',
            error: error.message
        });
    }
});

module.exports = router;
