/**
 * AUTHENTICATION MIDDLEWARE
 * Protect routes and verify JWT tokens
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');

// ============================================================
// DEV BYPASS FLAG — set to false to re-enable auth
// Disables JWT validation and role checks for faculty/admin
// routes ONLY. Student routes are NOT affected.
// ============================================================
const DEV_BYPASS_FACULTY_ADMIN_AUTH = false;

/**
 * Verify JWT token and attach user to request
 * Used by student routes — NOT bypassed.
 */
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No authentication token provided'
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

        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            error: error.message
        });
    }
};

/**
 * Check if user has required role
 * Used by student routes — NOT bypassed.
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authenticated'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions.'
            });
        }

        next();
    };
};

// ============================================================
// FACULTY/ADMIN BYPASS MIDDLEWARE (dev/testing only)
// When DEV_BYPASS_FACULTY_ADMIN_AUTH is true, these skip all
// JWT and role validation and inject a mock faculty user.
// When false, they behave identically to authenticate/authorize.
// ============================================================

/**
 * Authenticate middleware for faculty/admin routes.
 * Bypassed when DEV_BYPASS_FACULTY_ADMIN_AUTH is true.
 */
const authenticateFacultyAdmin = async (req, res, next) => {
    if (DEV_BYPASS_FACULTY_ADMIN_AUTH) {
        console.warn('⚠️  [DEV] Faculty/Admin auth bypassed for:', req.method, req.path);
        // Inject a mock faculty user so route handlers that read req.user still work
        req.user = {
            id: 0,
            name: 'Dev Faculty',
            email: 'dev-faculty@college.local',
            role: 'faculty',
            isActive: true,
            designation: 'Developer'
        };
        return next();
    }
    return authenticate(req, res, next);
};

/**
 * Authorize middleware for faculty/admin routes.
 * Bypassed when DEV_BYPASS_FACULTY_ADMIN_AUTH is true.
 */
const authorizeFacultyAdmin = (...roles) => {
    return (req, res, next) => {
        if (DEV_BYPASS_FACULTY_ADMIN_AUTH) {
            return next();
        }
        return authorize(...roles)(req, res, next);
    };
};

module.exports = {
    authenticate,
    authorize,
    authenticateFacultyAdmin,
    authorizeFacultyAdmin
};
