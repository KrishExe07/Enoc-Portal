/**
 * TEST SETUP
 * Sets required environment variables BEFORE server.js is loaded.
 * This prevents server.js from calling process.exit(1) due to missing env vars.
 */

// Set test environment
process.env.NODE_ENV = 'test';

// Required env vars (mock values — no real DB connection in unit tests)
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-only-32chars';
process.env.JWT_EXPIRE = '1d';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id.apps.googleusercontent.com';

// DB — point to a non-existent host so Sequelize skips without crashing
process.env.DB_HOST = '127.0.0.1';
process.env.DB_PORT = '3307'; // wrong port intentionally
process.env.DB_NAME = 'test_db';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';

// Email (not used in tests)
process.env.EMAIL_SERVICE = 'gmail';
process.env.EMAIL_USER = 'test@test.com';
process.env.EMAIL_PASSWORD = 'testpassword';
process.env.EMAIL_FROM = 'Test <test@test.com>';

// Frontend URL
process.env.FRONTEND_URL = 'http://localhost:8080';

// Silence console noise during tests
global.console.log = jest.fn();
global.console.warn = jest.fn();
// Keep errors visible
// global.console.error = jest.fn();
