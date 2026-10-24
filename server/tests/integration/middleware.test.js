const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const { AuthMiddleware } = require('../../src/middleware/auth.middleware');

describe('AuthMiddleware Dependency Inversion Integration Tests', () => {
  let app;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    app = createTestApp();
  });

  it('should allow constructing AuthMiddleware with custom tokenProvider and userRepository ports', () => {
    const mockTokenProvider = {
      verifyToken: jest.fn().mockResolvedValue({ id: 'user_123' }),
    };

    const mockUserRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'user_123', role: 'USER' }),
    };

    const customMiddleware = new AuthMiddleware({
      tokenProvider: mockTokenProvider,
      userRepository: mockUserRepository,
    });

    expect(customMiddleware.protect).toBeDefined();
    expect(customMiddleware.optionalAuth).toBeDefined();
  });

  it('should successfully authenticate request using injected ports in custom instance', async () => {
    const mockUser = { id: 'usr_abc', name: 'Test User', role: 'USER', accountStatus: 'ACTIVE' };
    const mockTokenProvider = {
      verifyToken: jest.fn().mockResolvedValue({ id: 'usr_abc' }),
    };
    const mockUserRepository = {
      findById: jest.fn().mockResolvedValue(mockUser),
    };

    const middlewareInstance = new AuthMiddleware({
      tokenProvider: mockTokenProvider,
      userRepository: mockUserRepository,
    });

    const req = {
      headers: { authorization: 'Bearer mock_valid_jwt' },
    };
    const res = {};
    const next = jest.fn();

    await middlewareInstance.protect(req, res, next);

    expect(mockTokenProvider.verifyToken).toHaveBeenCalledWith('mock_valid_jwt', expect.any(String));
    expect(mockUserRepository.findById).toHaveBeenCalledWith('usr_abc');
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('usr_abc');
    expect(next).toHaveBeenCalledWith();
  });

  it('should handle unauthenticated request cleanly', async () => {
    const response = await request(app).get('/api/users/me');
    expect(response.status).toBe(401);
  });
});
