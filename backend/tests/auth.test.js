/**
 * AUTH ROUTE TESTS
 * Tests for POST /api/auth/login and POST /api/auth/verify
 *
 * These tests validate INPUT VALIDATION logic only.
 * They do NOT test Google OAuth (requires real token) or DB (requires real MySQL).
 * That kind of test is called "integration testing" and needs a test DB.
 */

require('../tests/setup');

const request = require('supertest');
const app = require('../server');

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/login — Input Validation Tests
// ═══════════════════════════════════════════════════════════════
describe('POST /api/auth/login', () => {

    it('should return 400 if email is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ password: 'test123', role: 'faculty' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/required/i);
    });

    it('should return 400 if password is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@charusat.ac.in', role: 'faculty' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/required/i);
    });

    it('should return 400 if role is missing', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@charusat.ac.in', password: 'test123' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/required/i);
    });

    it('should return 400 if role is "student" (students must use Google)', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: '24it068@charusat.edu.in', password: 'test123', role: 'student' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/google/i);
    });

    it('should return 400 if email domain is not .ac.in for faculty', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'teacher@gmail.com', password: 'test123', role: 'faculty' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/\.ac\.in/i);
    });

    it('should return 400 if role is invalid', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'user@charusat.ac.in', password: 'test123', role: 'superuser' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
    });

    it('should return 401 for valid format but wrong credentials (DB lookup fail)', async () => {
        // Valid input format — will fail at DB lookup (DB not connected in test env)
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'faculty@charusat.ac.in',
                password: 'wrongpassword',
                role: 'faculty'
            });

        // Either 401 (user not found) or 500 (DB not connected) — both are acceptable
        expect([401, 500]).toContain(res.statusCode);
        expect(res.body.success).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/google — Input Validation Tests
// ═══════════════════════════════════════════════════════════════
describe('POST /api/auth/google', () => {

    it('should return 400 if credential is missing', async () => {
        const res = await request(app)
            .post('/api/auth/google')
            .send({ role: 'student' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/missing/i);
    });

    it('should return 400 if role is missing', async () => {
        const res = await request(app)
            .post('/api/auth/google')
            .send({ credential: 'fake-google-token' });

        expect(res.statusCode).toBe(400);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/missing/i);
    });

    it('should return 4xx or 5xx for invalid Google token', async () => {
        const res = await request(app)
            .post('/api/auth/google')
            .send({ credential: 'totally-invalid-token', role: 'student' });

        // Will fail at Google token verification — 401 or 500
        expect(res.statusCode).toBeGreaterThanOrEqual(400);
        expect(res.body.success).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/verify — Token Verification Tests
// ═══════════════════════════════════════════════════════════════
describe('POST /api/auth/verify', () => {

    it('should return 401 if no token provided', async () => {
        const res = await request(app)
            .post('/api/auth/verify');

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/no token/i);
    });

    it('should return 401 for invalid/malformed token', async () => {
        const res = await request(app)
            .post('/api/auth/verify')
            .set('Authorization', 'Bearer this-is-not-a-real-jwt');

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
    });

    it('should return 401 for a fake but valid-format JWT with wrong secret', async () => {
        // A JWT signed with a DIFFERENT secret than our JWT_SECRET
        const jwt = require('jsonwebtoken');
        const fakeToken = jwt.sign(
            { id: 999, email: 'fake@charusat.ac.in', role: 'admin' },
            'wrong-secret-key'
        );

        const res = await request(app)
            .post('/api/auth/verify')
            .set('Authorization', `Bearer ${fakeToken}`);

        expect(res.statusCode).toBe(401);
        expect(res.body.success).toBe(false);
    });
});

// ═══════════════════════════════════════════════════════════════
// POST /api/auth/logout
// ═══════════════════════════════════════════════════════════════
describe('POST /api/auth/logout', () => {
    it('should return 200 with success message', async () => {
        const res = await request(app).post('/api/auth/logout');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/logged out/i);
    });
});
