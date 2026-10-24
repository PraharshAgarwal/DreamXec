const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const adminService = require('../../src/modules/admin/admin.service');

describe('Admin Subsystem Integration & Parity Tests', () => {
  let app;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    app = createTestApp();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Unauthenticated Access Control', () => {
    it('should reject unauthenticated request to /api/admin/stats with 401 error', async () => {
      const response = await request(app).get('/api/admin/stats');
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated request to /api/admin/projects with 401 error', async () => {
      const response = await request(app).get('/api/admin/projects');
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated request to /api/admin/users with 401 error', async () => {
      const response = await request(app).get('/api/admin/users');
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated request to /api/admin/donations with 401 error', async () => {
      const response = await request(app).get('/api/admin/donations');
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated request to /api/admin/audit-logs with 401 error', async () => {
      const response = await request(app).get('/api/admin/audit-logs');
      expect(response.status).toBe(401);
    });
  });
});
