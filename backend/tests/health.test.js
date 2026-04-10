/**
 * HEALTH ENDPOINT TESTS
 * Tests the /api/health route — no DB or auth needed
 */

require('../tests/setup');

const request = require('supertest');
const app = require('../server');

describe('GET /api/health', () => {
    it('should return 200 with success status', async () => {
        const res = await request(app).get('/api/health');

        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.status).toBe('OK');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('environment');
    });

    it('should return the correct message', async () => {
        const res = await request(app).get('/api/health');
        expect(res.body.message).toBe('eNOC Portal API is running');
    });

    it('should return environment as test', async () => {
        const res = await request(app).get('/api/health');
        expect(res.body.environment).toBe('test');
    });
});

describe('GET /api/unknown-route', () => {
    it('should return 404 for unknown routes', async () => {
        const res = await request(app).get('/api/this-does-not-exist');

        expect(res.statusCode).toBe(404);
        expect(res.body.success).toBe(false);
        expect(res.body).toHaveProperty('message');
    });
});
