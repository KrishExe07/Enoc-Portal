const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middleware/auth');
const { NOCRequest } = require('../models');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// File filter (PDF, JPG, PNG)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF, JPEG and PNG are allowed.'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

/**
 * POST /api/uploads/document/:nocId
 * Upload a document for a specific NOC request
 */
router.post('/document/:nocId', authenticate, upload.single('document'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        const nocId = req.params.nocId;
        
        // Ensure the NOC request belongs to the user
        const nocRequest = await NOCRequest.findOne({
            where: { id: nocId, studentId: req.user.id }
        });

        if (!nocRequest) {
            // Delete the uploaded file since we reject the request
            fs.unlinkSync(req.file.path);
            return res.status(404).json({ success: false, message: 'NOC Request not found or unauthorized' });
        }

        // Logic here to attach document. For now, since model lacks a generic document path list, 
        // we can store it in a generic field or update logic. 
        // We will just return the file path for frontend use.
        const fileUrl = `/uploads/${req.file.filename}`;

        res.json({
            success: true,
            message: 'Document uploaded successfully',
            data: {
                fileName: req.file.originalname,
                url: fileUrl,
                size: req.file.size
            }
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, message: error.message || 'File upload failed' });
    }
});

module.exports = router;
