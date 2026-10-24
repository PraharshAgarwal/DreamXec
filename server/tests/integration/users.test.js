const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const userService = require('../../src/modules/users/user.service');

describe('Users & Profile Module Integration & Parity Tests', () => {
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
    it('should reject unauthenticated request to /api/users/me with 401 status', async () => {
      const response = await request(app).get('/api/users/me');
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated request to /api/profile/me with 401 status', async () => {
      const response = await request(app).get('/api/profile/me');
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated update to /api/profile/me with 401 status', async () => {
      const response = await request(app)
        .put('/api/profile/me')
        .send({ name: 'New Name' });
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated picture upload to /api/profile/picture with 401 status', async () => {
      const response = await request(app).post('/api/profile/picture');
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated admin request to /api/users with 401 status', async () => {
      const response = await request(app).get('/api/users');
      expect(response.status).toBe(401);
    });
  });

  describe('UserService Domain Functions Direct Mock Verification', () => {
    it('should fetch user profile and calculate student completion percentage correctly', async () => {
      jest.spyOn(userService.repositoryPort, 'findById').mockImplementation(async (id) => ({
        id,
        name: 'Test Student',
        email: 'student@example.com',
        role: 'USER',
        phone: '1234567890',
        college: 'IIT Bombay',
        skills: ['React', 'Node'],
      }));

      const result = await userService.getProfile('user_123', 'USER');

      expect(result.status).toBe('success');
      expect(result.data.profile.name).toBe('Test Student');
      expect(typeof result.data.completionPct).toBe('number');
      expect(result.data.completionPct).toBeGreaterThan(0);
    });

    it('should fetch donor profile and calculate donor completion percentage correctly', async () => {
      jest.spyOn(userService.repositoryPort, 'findById').mockImplementation(async (id) => ({
        id,
        name: 'Donor Corp',
        email: 'donor@corp.com',
        role: 'DONOR',
        organizationName: 'Global Corp',
      }));

      const result = await userService.getProfile('donor_123', 'DONOR');

      expect(result.status).toBe('success');
      expect(result.data.profile.organizationName).toBe('Global Corp');
      expect(typeof result.data.completionPct).toBe('number');
    });
  });
});
