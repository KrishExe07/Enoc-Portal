/**
 * AUTHENTICATION ROUTES
 * Google OAuth verification and user authentication
 * Email/password login for Faculty & Admin
 */

const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

// ═══════════════════════════════════════════════════════════════════════════════
// CRITICAL: Google Client ID Configuration
// ═══════════════════════════════════════════════════════════════════════════════
// This Client ID is loaded from GOOGLE_CLIENT_ID in .env
// It MUST MATCH the clientId in js/google-auth.js
//
// To verify:
// 1. Check backend/.env → GOOGLE_CLIENT_ID=...
// 2. Check js/google-auth.js → clientId: '...'
// 3. They must be EXACTLY the same
//
// If they don't match, you'll get "Invalid token signature" or audience errors.
// ═══════════════════════════════════════════════════════════════════════════════
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/**
 * @route   POST /api/auth/login
 * @desc    Email/password login for Faculty & Admin
 * @access  Public
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // Basic input validation
        if (!email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and role are required'
            });
        }

        // Only faculty and admin can use email/password login
        if (!['faculty', 'admin'].includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Email/password login is only available for Faculty and Admin. Students should use Google Sign-In.'
            });
        }

        // Validate email domain (.ac.in for faculty/admin)
        const emailLower = email.trim().toLowerCase();
        if (!emailLower.endsWith('.ac.in')) {
            return res.status(400).json({
                success: false,
                message: 'Please use an institutional .ac.in email address.'
            });
        }

        // Find user in database
        const user = await User.findOne({
            where: {
                email: emailLower,
                role: role,
                loginProvider: 'local'
            }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact administrator.'
            });
        }

        // Compare password with bcrypt hash
        if (!user.passwordHash) {
            return res.status(401).json({
                success: false,
                message: 'No password set for this account. Please contact administrator.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        console.log(`✅ ${role} login successful: ${emailLower}`);

        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                profilePicture: user.profilePicture,
                domainType: user.domainType,
                department: user.department,
                designation: user.designation
            }
        });

    } catch (error) {
        console.error('❌ Login error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route   POST /api/auth/google
 * @desc    Verify Google token and authenticate user
 * @access  Public
 */
router.post('/google', async (req, res) => {
    try {
        const { credential, role } = req.body;

        console.log('🔐 Backend: Google auth request received');
        console.log('📧 Role requested:', role);

        if (!credential || !role) {
            return res.status(400).json({
                success: false,
                message: 'Missing credential or role'
            });
        }

        // Verify that GOOGLE_CLIENT_ID is configured
        if (!process.env.GOOGLE_CLIENT_ID) {
            console.error('❌ GOOGLE_CLIENT_ID is not set in .env file!');
            return res.status(500).json({
                success: false,
                message: 'Server configuration error: Google Client ID not configured. Please contact administrator.'
            });
        }

        // ✅ STEP 2: Backend verification with CLIENT_ID check
        console.log('🔍 Verifying token...');
        console.log('  Backend CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);

        const ticket = await client.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture, email_verified } = payload;

        console.log('✅ Token verified successfully!');
        console.log('👤 User info:', { email, name, aud: payload.aud });

        // Extract domain type
        const domainType = extractDomainType(email);
        console.log('🔍 Domain extraction:', { email, domainType });

        // Validate full CHARUSAT email domain (primary check)
        const isValidCHARUSAT = isValidCHARUSATEmail(email, role);
        
        // Validate domain type (secondary check - for logging)
        const isValidDomainType = validateDomain(domainType, role);
        
        console.log('✅ Domain validation:', { 
            email, 
            domainType, 
            role, 
            isValidCHARUSAT,
            isValidDomainType
        });
        
        // Only require CHARUSAT domain check to pass (more specific and secure)
        if (!isValidCHARUSAT) {
            const expectedDomain = role === 'student' 
                ? '@charusat.edu.in (or subdomain like @it.charusat.edu.in)'
                : '@charusat.ac.in (or subdomain like @ce.charusat.ac.in)';
            
            return res.status(403).json({
                success: false,
                message: `Invalid email domain for ${role}. Please use a CHARUSAT ${role} email ending with ${expectedDomain}`,
                email,
                domainType,
                expectedDomain
            });
        }

        // Find or create user (skip if DB not available)
        let user = null;
        try {
            user = await User.findOne({ where: { googleId } });

            if (user) {
                // Update existing user
                user.lastLogin = new Date();
                user.profilePicture = picture;
                // Also update enrollmentNo if it changed or wasn't set
                if (role === 'student') {
                    const enrollmentNo = extractEnrollmentNo(email);
                    if (enrollmentNo && !user.studentId) {
                        user.studentId = enrollmentNo;
                    }
                }
                await user.save();
            } else {
                // Create new user
                const enrollmentNo = role === 'student' ? extractEnrollmentNo(email) : null;
                user = await User.create({
                    googleId,
                    email,
                    name,
                    role,
                    profilePicture: picture,
                    emailVerified: email_verified,
                    loginProvider: 'google',
                    domainType,
                    studentId: enrollmentNo,  // store full ID like "24IT068"
                    lastLogin: new Date()
                });
            }
        } catch (dbError) {
            console.warn('⚠️ Database operation failed, creating temporary user session');
            // Create temporary user object when DB is not available
            user = {
                id: Date.now(),
                googleId,
                email,
                name,
                role,
                profilePicture: picture,
                domainType,
                emailVerified: email_verified
            };
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        res.json({
            success: true,
            message: 'Authentication successful',
            token,
            user: {
                id: user.id,
                googleId: user.googleId,
                email: user.email,
                name: user.name,
                role: user.role,
                profilePicture: user.profilePicture,
                domainType: user.domainType,
                // Return the enrollment number so frontend can display it directly
                studentId: user.studentId || null
            }
        });

    } catch (error) {
        console.error('❌ Google auth error:', error.message);
        console.error('Full error:', error);

        // Enhanced error messages
        let errorMessage = 'Authentication failed';
        let errorDetails = error.message;
        let statusCode = 500;

        if (error.message.includes('Token used too late')) {
            errorMessage = 'Token expired. Please try signing in again.';
            statusCode = 401;
        } else if (error.message.includes('Invalid token signature')) {
            errorMessage = '⚠️ INVALID TOKEN SIGNATURE!\n\n' +
                'This usually means the Google Client ID mismatch between frontend and backend.\n\n' +
                'Please verify:\n' +
                '1. backend/.env → GOOGLE_CLIENT_ID\n' +
                '2. js/google-auth.js → clientId\n\n' +
                'They must be EXACTLY the same!';
            statusCode = 401;
            console.error('🚨 CRITICAL: Check that GOOGLE_CLIENT_ID in .env matches clientId in js/google-auth.js');
            console.error(`   Backend CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID}`);
        } else if (error.message.includes('audience')) {
            errorMessage = '⚠️ CLIENT_ID MISMATCH!\n\n' +
                'The Google Client ID in the frontend does not match the backend.\n\n' +
                'Please verify:\n' +
                '1. backend/.env → GOOGLE_CLIENT_ID=' + (process.env.GOOGLE_CLIENT_ID || 'NOT SET') + '\n' +
                '2. js/google-auth.js → clientId (check browser console)\n\n' +
                'They must be EXACTLY the same!';
            statusCode = 401;
            console.error('🚨 CRITICAL: Audience mismatch - frontend and backend CLIENT_IDs do not match');
            console.error(`   Backend expects: ${process.env.GOOGLE_CLIENT_ID}`);
        } else if (error.message.toLowerCase().includes('network') || 
                   error.message.toLowerCase().includes('connection')) {
            errorMessage = 'Network error while verifying token. Please try again.';
            statusCode = 503;
        }

        res.status(statusCode).json({
            success: false,
            message: errorMessage,
            error: errorDetails
        });
    }
});

/**
 * @route   POST /api/auth/verify
 * @desc    Verify JWT token
 * @access  Private
 */
router.post('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.id);

        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token or user inactive'
            });
        }

        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                profilePicture: user.profilePicture
            }
        });

    } catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token',
            error: error.message
        });
    }
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', (req, res) => {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Extract full enrollment number from student email local-part.
 * Examples:
 *   24it068@charusat.edu.in  → "24IT068"
 *   22CS015@it.charusat.edu.in → "22CS015"
 * Returns null for non-matching emails.
 */
function extractEnrollmentNo(email) {
    if (!email) return null;
    const match = email.trim().match(/^([0-9]{2}[A-Za-z]+[0-9]{3})@(?:[A-Za-z0-9-]+\.)*charusat\.edu\.in$/i);
    return match ? match[1].toUpperCase() : null;
}

/**
 * Extract domain type from email
 * For multi-level domains like charusat.edu.in, extract 'edu'
 * For charusat.ac.in, extract 'ac'
 */
function extractDomainType(email) {
    const parts = email.split('@');
    if (parts.length !== 2) return '';

    const domain = parts[1].toLowerCase();
    const domainParts = domain.split('.');

    // For multi-level domains (e.g., charusat.edu.in)
    // Get second-to-last part if it's edu/ac/org/co, otherwise last part
    if (domainParts.length >= 3) {
        const secondLast = domainParts[domainParts.length - 2];
        // Check if second-to-last is an institution type
        if (['edu', 'ac', 'org', 'co', 'gov'].includes(secondLast)) {
            return secondLast;
        }
    }

    // Default: return last part (TLD)
    return domainParts[domainParts.length - 1];
}

/**
 * Validate email domain against role
 * Accepts @charusat.edu.in (students) and @charusat.ac.in (faculty/admin)
 * Also accepts subdomains like @it.charusat.edu.in or @ce.charusat.ac.in
 */
function validateDomain(domainType, role) {
    if (role === 'student') {
        return domainType === (process.env.STUDENT_DOMAIN || 'edu');
    } else if (role === 'faculty' || role === 'admin') {
        return domainType === (process.env.FACULTY_DOMAIN || 'ac');
    }
    return false;
}

/**
 * Validate full email domain for CHARUSAT
 * @param {string} email - Email address
 * @param {string} role - User role (student, faculty, admin)
 * @returns {boolean} Is valid CHARUSAT email
 */
function isValidCHARUSATEmail(email, role) {
    const parts = email.split('@');
    if (parts.length !== 2) return false;

    const domain = parts[1].toLowerCase();
    
    // For students: must end with charusat.edu.in (allows subdomains)
    if (role === 'student') {
        return domain.endsWith('charusat.edu.in');
    }
    
    // For faculty/admin: must end with charusat.ac.in (allows subdomains)
    if (role === 'faculty' || role === 'admin') {
        return domain.endsWith('charusat.ac.in');
    }
    
    return false;
}

module.exports = router;
