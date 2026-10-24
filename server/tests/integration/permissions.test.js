const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const tokenService = require('../../src/modules/auth/services/token.service');

describe('Permission & Authorization Rejection Characterization Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  it('should reject unauthenticated request to /api/auth/me with 401 status and error status', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message', 'Not logged in');
  });

  it('should reject invalid or expired JWT token with 401 status', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid.token.string');

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('status', 'error');
    expect(response.body).toHaveProperty('message', 'Invalid or expired token');
  });
});
