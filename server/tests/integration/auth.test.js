const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const registrationService = require('../../src/modules/auth/services/registration.service');
const { userRepository } = require('../../src/modules/auth/auth.repository');
const mfaRepository = require('../../src/modules/auth/adapters/prisma-mfa.adapter');

describe('Auth Module Characterization Tests', () => {
  let app;
  const mockUsers = new Map();

  beforeEach(() => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_123';
    process.env.JWT_VERIFICATION_SECRET = process.env.JWT_VERIFICATION_SECRET || 'test_verification_secret_key_123';

    app = createTestApp();
    mockUsers.clear();

    jest.spyOn(mfaRepository, 'getMFAData').mockResolvedValue(null);

    jest.spyOn(userRepository, 'findByEmail').mockImplementation(async (email) => {
      return mockUsers.get(email) || null;
    });

    jest.spyOn(userRepository, 'create').mockImplementation(async (data) => {
      const userRecord = {
        id: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash || '$2a$10$abcdefghijklmnopqrstuvwxyz0123456789ABCDEF',
        role: data.role || 'USER',
        accountStatus: 'ACTIVE',
        emailVerified: false,
        profileComplete: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsers.set(data.email, userRecord);
      return userRecord;
    });

    jest.spyOn(userRepository, 'update').mockImplementation(async (id, data) => {
      let foundUser = null;
      for (const u of mockUsers.values()) {
        if (u.id === id) {
          foundUser = u;
          break;
        }
      }
      if (!foundUser) return null;
      Object.assign(foundUser, data);
      mockUsers.set(foundUser.email, foundUser);
      return foundUser;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user account with valid inputs and return 201 status', async () => {
      const uniqueEmail = `test.user.${Date.now()}@example.com`;

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Student',
          email: uniqueEmail,
          password: 'Password123!',
          role: 'USER',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe(uniqueEmail);
      expect(response.body.data.user.passwordHash).toBeUndefined();
    });

    it('should reject duplicate registration with 400 error status', async () => {
      const email = `duplicate.${Date.now()}@example.com`;

      // Initial registration
      await registrationService.register({
        name: 'First Register',
        email,
        password: 'Password123!',
        role: 'USER',
      });

      // Duplicate attempt
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate Register',
          email,
          password: 'Password123!',
          role: 'USER',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'fail');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should log in existing user with correct credentials and return 200 with JWT token', async () => {
      const email = `login.test.${Date.now()}@example.com`;
      const password = 'SecretPassword123!';

      // Register mock user
      await registrationService.register({
        name: 'Login User',
        email,
        password,
        role: 'USER',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body).toHaveProperty('token');
      expect(typeof response.body.token).toBe('string');
      expect(response.body.data.user.email).toBe(email);
    });

    it('should reject login attempt with wrong password returning 401 status', async () => {
      const email = `wrongpass.${Date.now()}@example.com`;

      await registrationService.register({
        name: 'User Wrong Pass',
        email,
        password: 'CorrectPassword123!',
        role: 'USER',
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'WrongPassword123!' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('status', 'fail');
    });
  });

  describe('Password Reset Lifecycle & 5-Minute Expiry Flow', () => {
    it('should generate a 5-minute active reset token upon forgot-password request', async () => {
      const email = `reset.${Date.now()}@example.com`;

      await registrationService.register({
        name: 'Reset User',
        email,
        password: 'OldPassword123!',
        role: 'USER',
      });

      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email });

      expect(forgotRes.status).toBe(200);
      expect(forgotRes.body).toHaveProperty('status', 'success');
      const userRecord = mockUsers.get(email);
      const token = userRecord.profileMetadata?.resetPasswordToken;
      expect(token).toBeTruthy();

      // Verify token on mount endpoint
      const verifyRes = await request(app)
        .get(`/api/auth/verify-reset-token?token=${token}`);

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data).toHaveProperty('valid', true);
      expect(verifyRes.body.data.email).toBe(email);
      expect(verifyRes.body.data).toHaveProperty('expiresAt');

      // Attempt reset with invalid weak password (should fail validation but preserve token)
      const invalidPassRes = await request(app)
        .post(`/api/auth/reset-password?token=${token}`)
        .send({ password: 'short' });

      expect(invalidPassRes.status).toBe(400);

      // Verify token is STILL valid and active after failed validation attempt
      const verifyAfterFail = await request(app)
        .get(`/api/auth/verify-reset-token?token=${token}`);

      expect(verifyAfterFail.status).toBe(200);
      expect(verifyAfterFail.body.data.valid).toBe(true);

      // Now reset with valid new password
      const validResetRes = await request(app)
        .post(`/api/auth/reset-password?token=${token}`)
        .send({ password: 'NewSecurePassword123!' });

      expect(validResetRes.status).toBe(200);
      expect(validResetRes.body).toHaveProperty('status', 'success');

      // Token should now be invalidated / consumed
      const verifyAfterSuccess = await request(app)
        .get(`/api/auth/verify-reset-token?token=${token}`);

      expect(verifyAfterSuccess.status).toBe(400);

      // Login with new password should succeed
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email, password: 'NewSecurePassword123!' });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body).toHaveProperty('token');
    });
  });
});
