/**
 * COMPANY ROUTES
 * Handle company CRUD operations
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize, authenticateFacultyAdmin, authorizeFacultyAdmin } = require('../middleware/auth');
const { Company } = require('../models');
const { importCompaniesFromBuffer, findCompanyByName } = require('../services/companyImportService');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];

        const hasValidMime = allowedMimeTypes.includes(file.mimetype);
        const hasValidExtension = /\.(xlsx|xls)$/i.test(file.originalname || '');

        if (hasValidMime || hasValidExtension) {
            cb(null, true);
            return;
        }

        cb(new Error('Invalid file type. Please upload an .xlsx or .xls file.'));
    }
});

/**
 * @route   GET /api/companies
 * @desc    Get all approved companies
 * @access  Private
 */
router.get('/', authenticate, async (req, res) => {
    try {
        const companies = await Company.findAll({
            where: { approved: true },
            order: [['name', 'ASC']]
        });

        res.json({
            success: true,
            count: companies.length,
            companies
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch companies',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/companies/upload-list
 * @desc    Upload and import company Excel list
 * @access  Private (Admin)
 */
router.post('/upload-list', authenticateFacultyAdmin, authorizeFacultyAdmin('admin'), upload.single('companyFile'), async (req, res) => {
    try {
        if (!req.file || !req.file.buffer) {
            return res.status(400).json({
                success: false,
                message: 'No Excel file uploaded. Use form field name "companyFile".'
            });
        }

        const importResult = await importCompaniesFromBuffer(req.file.buffer);

        res.json({
            success: true,
            message: 'Company list imported successfully',
            ...importResult
        });
    } catch (error) {
        const statusCode = error.code === 'INVALID_EXCEL_COLUMNS' || error.code === 'EMPTY_WORKBOOK' || error.code === 'EMPTY_SHEET' ? 400 : 500;

        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to import company list'
        });
    }
});

/**
 * @route   POST /api/companies
 * @desc    Add new company (pending approval)
 * @access  Private (Student)
 */
router.post('/', authenticate, authorize('student'), async (req, res) => {
    try {
        const incomingName = String(req.body.name || '').trim();
        if (!incomingName) {
            return res.status(400).json({
                success: false,
                message: 'Company name is required'
            });
        }

        const existingCompany = await findCompanyByName(incomingName);
        if (existingCompany) {
            return res.json({
                success: true,
                message: 'Company already exists in database',
                company: existingCompany
            });
        }

        const fallbackEmail = `not-provided+${Date.now()}@company.local`;

        const company = await Company.create({
            name: incomingName,
            location: req.body.location || 'N/A',
            website: req.body.website || null,
            address: req.body.address || req.body.companyDetails || 'N/A',
            hrName: req.body.hrName || 'N/A',
            hrEmail: req.body.hrEmail || fallbackEmail,
            hrPhone: req.body.hrPhone || 'N/A',
            numEmployees: req.body.numEmployees || req.body.paidInternshipNotAllowed || null,
            technologies: req.body.technologies || req.body.technology || null,
            submittedBy: req.user.id,
            approved: false
        });

        res.status(201).json({
            success: true,
            message: 'Company submitted for approval',
            company
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to add company',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/companies/pending
 * @desc    Get pending companies
 * @access  Private (Admin)
 */
router.get('/pending', authenticateFacultyAdmin, authorizeFacultyAdmin('admin'), async (req, res) => {
    try {
        const companies = await Company.findAll({
            where: { approved: false },
            order: [['createdAt', 'DESC']]
        });

        res.json({
            success: true,
            count: companies.length,
            companies
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch pending companies',
            error: error.message
        });
    }
});

/**
 * @route   PUT /api/companies/:id/approve
 * @desc    Approve company
 * @access  Private (Admin)
 */
router.put('/:id/approve', authenticateFacultyAdmin, authorizeFacultyAdmin('admin'), async (req, res) => {
    try {
        const company = await Company.findByPk(req.params.id);

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        company.approved = true;
        company.approvedBy = req.user.id;
        company.approvedAt = new Date();
        await company.save();

        res.json({
            success: true,
            message: 'Company approved',
            company
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to approve company',
            error: error.message
        });
    }
});

module.exports = router;
