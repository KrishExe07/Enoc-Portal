/**
 * MAIN SERVER FILE — eNOC Portal Backend
 * Express + MySQL + Google OAuth
 *
 * Always run via:  node server.js  (from inside /backend)
 * Or use:          start-portal.bat  (from project root)
 */

'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const os = require('os');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// ── Startup environment validation ──────────────────────────────
const REQUIRED_ENV = ['JWT_SECRET', 'GOOGLE_CLIENT_ID'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length) {
    console.error('❌ Missing required environment variables:', missing.join(', '));
    console.error('   → Copy backend/.env.example to backend/.env and fill in the values.');
    process.exit(1);
}

const { testConnection, syncDatabase } = require('./config/database');
const { importCompaniesFromFile } = require('./services/companyImportService');

const app = express();

// ── CORS ─────────────────────────────────────────────────────────
// Accepts requests from:
//   • http://localhost:8080   (frontend-server.js)
//   • http://127.0.0.1:8080
//   • http://localhost:5500   (VS Code Live Server)
//   • http://127.0.0.1:5500
//   • http://localhost:3000   (React dev server)
//   • file://                 (direct file open — origin is null)
//   • Any other localhost port

const ALLOWED_ORIGINS = [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:4200',
    process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin: curl, Postman, mobile apps, file://
        if (!origin) return callback(null, true);

        const allowed =
            ALLOWED_ORIGINS.includes(origin) ||
            /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

        if (allowed) {
            callback(null, true);
        } else {
            console.warn(`⚠️  CORS blocked: ${origin}`);
            // In development, allow anyway; in production, block
            if (process.env.NODE_ENV === 'production') {
                callback(new Error(`CORS policy: origin ${origin} not allowed`));
            } else {
                callback(null, true); // dev: allow all
            }
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// ── Security headers (relaxed for dev) ───────────────────────────
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false, // disable for dev; enable in prod
}));

// ── Body parsers ─────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Request logging ───────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate limiting ─────────────────────────────────────────────────
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 min
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later.' }
});
app.use('/api/', limiter);

// ── Database ──────────────────────────────────────────────────────
(async () => {
    const dbOk = await testConnection();
    if (dbOk) {
        await syncDatabase(false);

        const configuredExcelPath = process.env.COMPANY_LIST_EXCEL_PATH;
        // Check project data/ directory first, then user Downloads
        const projectDataPath = path.join(__dirname, '..', 'data', 'company-list-reference.xlsx');
        const downloadsPath = path.join(os.homedir(), 'Downloads', 'Company List for reference (1).xlsx');
        const excelPathToUse = configuredExcelPath || (fs.existsSync(projectDataPath) ? projectDataPath : downloadsPath);

        if (fs.existsSync(excelPathToUse)) {
            try {
                const result = await importCompaniesFromFile(excelPathToUse);
                console.log(`✅ Company list imported from Excel (${excelPathToUse})`);
                console.log(`   Inserted: ${result.inserted}, Updated: ${result.updated}, Skipped: ${result.skipped}`);
            } catch (importError) {
                console.error('❌ Company list import failed:', importError.message);
            }
        } else {
            console.log(`ℹ️ No startup company Excel found at: ${excelPathToUse}`);
            console.log('   Upload from Admin Dashboard → Manage Companies → Upload Company List');
        }
    } else {
        console.warn('⚠️  Server starting WITHOUT database — data will not persist.');
        console.warn('   → Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in backend/.env');
        console.warn('   → Make sure MySQL is running on port', process.env.DB_PORT || 3306);
    }
})();

// ── Routes ────────────────────────────────────────────────────────

// Health check — always responds, even without DB
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'OK',
        message: 'eNOC Portal API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'check /api/health/db for DB status'
    });
});

// Detailed health (DB status)
app.get('/api/health/db', async (req, res) => {
    const { testConnection } = require('./config/database');
    const ok = await testConnection();
    res.status(ok ? 200 : 503).json({
        success: ok,
        database: ok ? 'connected' : 'disconnected',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/companies', require('./routes/companies'));
app.use('/api/noc', require('./routes/noc'));
app.use('/api/signatures', require('./routes/signatures'));
app.use('/api/email', require('./routes/email'));
app.use('/api/uploads', require('./routes/uploads'));

// Serve static uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// ── 404 handler ───────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        availableRoutes: [
            'GET  /api/health',
            'POST /api/auth/google',
            'POST /api/auth/login',
            'GET  /api/companies',
            'POST /api/noc/submit',
            'GET  /api/noc/pending',
        ]
    });
});

// ── Global error handler ──────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('💥 Unhandled error:', err.message);
    if (process.env.NODE_ENV === 'development') console.error(err.stack);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ── Start server ──────────────────────────────────────────────────
// Only start listening when run directly (not when imported by tests)
const PORT = parseInt(process.env.PORT, 10) || 5000;

if (require.main === module) {

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log('');
    console.log('  ╔══════════════════════════════════════════╗');
    console.log(`  ║  🚀 eNOC Backend running on port ${PORT}   ║`);
    console.log('  ╠══════════════════════════════════════════╣');
    console.log(`  ║  Health : http://localhost:${PORT}/api/health ║`);
    console.log(`  ║  Env    : ${(process.env.NODE_ENV || 'development').padEnd(32)}║`);
    console.log('  ╚══════════════════════════════════════════╝');
    console.log('');    console.log('  ✅ Backend API ready to accept requests');
    console.log('  💡 Google Client ID:', process.env.GOOGLE_CLIENT_ID ? 'Configured ✅' : 'NOT SET ❌');
    console.log('');
});

// ── Port conflict error handler ───────────────────────────────
server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error('');
        console.error('  ╔══════════════════════════════════════════════════════╗');
        console.error(`  ║  ❌ ERROR: Port ${PORT} is already in use!              ║`);
        console.error('  ╠══════════════════════════════════════════════════════╣');
        console.error('  ║  Another application is using this port.            ║');
        console.error('  ║                                                      ║');
        console.error('  ║  SOLUTIONS:                                          ║');
        console.error('  ║  1. Stop the other application                       ║');
        console.error('  ║  2. Change PORT in backend/.env (e.g., PORT=5001)   ║');
        console.error('  ║     Then update js/config.js API_BASE_URL           ║');
        console.error('  ║                                                      ║');
        console.error('  ║  To find what\'s using the port (Windows):           ║');
        console.error(`  ║    netstat -ano | findstr :${PORT}                      ║`);
        console.error('  ║    taskkill /PID <PID> /F                            ║');
        console.error('  ╚══════════════════════════════════════════════════════╝');
        console.error('');
        process.exit(1);
    } else if (error.code === 'EACCES') {
        console.error('');
        console.error('  ❌ ERROR: Permission denied for port ' + PORT);
        console.error('  💡 Try using a port > 1024 or run with administrator privileges');
        console.error('');
        process.exit(1);
    } else {
        console.error('  ❌ Server error:', error.message);
        process.exit(1);
    }
});

// ── Graceful shutdown ─────────────────────────────────────────────
process.on('SIGTERM', () => {
    console.log('SIGTERM received — shutting down gracefully');
    server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
    console.log('\nSIGINT received — shutting down');
    server.close(() => process.exit(0));
});

} // end require.main === module

process.on('unhandledRejection', (reason) => {
    console.error('❌ Unhandled Promise Rejection:', reason);
    // Don't exit — log and continue
});

process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err.message);
    console.error(err.stack);
    // Exit only for truly fatal errors
    process.exit(1);
});

module.exports = app;
