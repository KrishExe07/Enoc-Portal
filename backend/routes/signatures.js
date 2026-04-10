/**
 * SIGNATURE ROUTES
 * Handle e-signature management
 */

const express = require('express');
const router = express.Router();
const { authenticate, authorize, authenticateFacultyAdmin, authorizeFacultyAdmin } = require('../middleware/auth');
const { Signature } = require('../models');

/**
 * @route   POST /api/signatures
 * @desc    Create/upload signature
 * @access  Private (Faculty/Admin)
 */
router.post('/', authenticateFacultyAdmin, authorizeFacultyAdmin('faculty', 'admin'), async (req, res) => {
    try {
        const { signatureType, signatureData, designation } = req.body;

        if (!signatureType || !signatureData || !designation) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Deactivate old signatures
        await Signature.update(
            { isActive: false },
            { where: { userId: req.user.id } }
        );

        // Create new signature
        const signature = await Signature.create({
            userId: req.user.id,
            userName: req.user.name,
            designation,
            signatureType,
            signatureData,
            isActive: true
        });

        res.status(201).json({
            success: true,
            message: 'Signature saved successfully',
            signature
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to save signature',
            error: error.message
        });
    }
});

/**
 * @route   GET /api/signatures/my-signature
 * @desc    Get user's active signature
 * @access  Private (Faculty/Admin)
 */
router.get('/my-signature', authenticateFacultyAdmin, authorizeFacultyAdmin('faculty', 'admin'), async (req, res) => {
    try {
        const signature = await Signature.findOne({
            where: {
                userId: req.user.id,
                isActive: true
            }
        });

        res.json({
            success: true,
            signature
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch signature',
            error: error.message
        });
    }
});

module.exports = router;
