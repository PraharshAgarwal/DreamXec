const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const googleProvider = require('../../src/modules/auth/providers/google.provider');
const { userRepository } = require('../../src/modules/auth/auth.repository');

describe('OAuth Authentication Subsystem Integration Tests', () => {
  let app;
  const mockUsers = new Map();

  beforeEach(() => {
    process.env.JWT_SECRET = 'test_jwt_secret_key_123';
    process.env.CLIENT_URL = 'http://localhost:5173';
    process.env.GOOGLE_CLIENT_ID = 'test_google_client_id.apps.googleusercontent.com';
    process.env.GOOGLE_CLIENT_SECRET = 'test_google_client_secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:5000/api/auth/google/callback';

    app = createTestApp();
    mockUsers.clear();

    jest.spyOn(userRepository, 'findByEmail').mockImplementation(async (email) => {
      return mockUsers.get(email.toLowerCase()) || null;
    });

    jest.spyOn(userRepository, 'createOAuthUser').mockImplementation(async (data) => {
      const userRecord = {
        id: `user_oauth_${Date.now()}`,
        name: data.name,
        fullName: data.name,
        email: data.email.toLowerCase(),
        username: 'snow_leopard_1',
        speciesId: 'species_1',
        speciesNumber: 1,
        role: data.role || 'USER',
        accountStatus: 'ACTIVE',
        emailVerified: true,
        profileMetadata: {
          googleId: data.providerId,
          providers: { [data.providerName]: data.providerId },
          speciesIdentity: {
            commonName: 'Snow Leopard',
            speciesNumber: 1,
            badgeTitle: 'Snow Leopard #1 / 50',
          },
          avatarUrl: 'https://example.com/snow_leopard.jpg',
          emailVerified: true,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsers.set(data.email.toLowerCase(), userRecord);
      return userRecord;
    });

    jest.spyOn(userRepository, 'linkOAuthProvider').mockImplementation(async (userId, providerName, providerId) => {
      let found = null;
      for (const u of mockUsers.values()) {
        if (u.id === userId) {
          found = u;
          break;
        }
      }
      if (!found) return null;
      found.profileMetadata = found.profileMetadata || {};
      found.profileMetadata.providers = found.profileMetadata.providers || {};
      const normProvider = providerName === 'googleId' ? 'google' : providerName;
      found.profileMetadata.providers[normProvider] = providerId;
      found.profileMetadata.googleId = providerId;
      found.profileMetadata.emailVerified = true;
      mockUsers.set(found.email.toLowerCase(), found);
      return found;
    });

    jest.spyOn(userRepository, 'findById').mockImplementation(async (id) => {
      for (const u of mockUsers.values()) {
        if (u.id === id) return u;
      }
      return null;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/auth/google (OAuth Initiation)', () => {
    it('should redirect to Google OAuth authorization URL with signed state token', async () => {
      const response = await request(app).get('/api/auth/google?role=USER');

      expect(response.status).toBe(302);
      const redirectUrl = response.headers.location;
      expect(redirectUrl).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(redirectUrl).toContain('client_id=test_google_client_id.apps.googleusercontent.com');
      expect(redirectUrl).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A5000%2Fapi%2Fauth%2Fgoogle%2Fcallback');
      expect(redirectUrl).toContain('state=');
    });

    it('should reject invalid role with 400 status', async () => {
      const response = await request(app).get('/api/auth/google?role=SUPER_ADMIN');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid registration role.');
    });
  });

  describe('GET /api/auth/google/callback (OAuth Callback Resolution)', () => {
    it('should create new user with endangered species identity on first-time Google login', async () => {
      // 1. Get signed state from initiate
      const initRes = await request(app).get('/api/auth/google?role=USER');
      const url = new URL(initRes.headers.location);
      const signedState = url.searchParams.get('state');

      // 2. Mock Google token exchange and profile return
      jest.spyOn(googleProvider, 'exchangeCodeForUser').mockResolvedValue({
        provider: 'google',
        providerUserId: 'google_user_998877',
        email: 'new.innovator@dreamxec.org',
        name: 'New Innovator',
        avatarUrl: 'https://lh3.googleusercontent.com/photo.jpg',
        id: 'google_user_998877',
        emails: [{ value: 'new.innovator@dreamxec.org' }],
        displayName: 'New Innovator',
      });

      // 3. Callback
      const callbackRes = await request(app)
        .get(`/api/auth/google/callback?code=mock_google_auth_code&state=${encodeURIComponent(signedState)}`);

      expect(callbackRes.status).toBe(302);
      expect(callbackRes.headers.location).toContain('http://localhost:5173/auth/callback#token=');

      // Verify user was created in repo
      const createdUser = mockUsers.get('new.innovator@dreamxec.org');
      expect(createdUser).toBeDefined();
      expect(createdUser.fullName).toBe('New Innovator');
      expect(createdUser.username).toBe('snow_leopard_1');
      expect(createdUser.emailVerified).toBe(true);
      expect(createdUser.profileMetadata.googleId).toBe('google_user_998877');
    });

    it('should link existing email/password account when logging in with same Google email', async () => {
      // Create existing user (e.g. from password signup)
      const existingUser = {
        id: 'user_existing_123',
        fullName: 'Existing User',
        name: 'Existing User',
        email: 'existing.user@dreamxec.org',
        passwordHash: '$2a$10$hashedpassword',
        role: 'USER',
        accountStatus: 'ACTIVE',
        emailVerified: false,
        profileMetadata: { emailVerified: false },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsers.set('existing.user@dreamxec.org', existingUser);

      // Get signed state
      const initRes = await request(app).get('/api/auth/google?role=USER');
      const url = new URL(initRes.headers.location);
      const signedState = url.searchParams.get('state');

      // Mock exchange
      jest.spyOn(googleProvider, 'exchangeCodeForUser').mockResolvedValue({
        provider: 'google',
        providerUserId: 'google_user_554433',
        email: 'existing.user@dreamxec.org',
        name: 'Existing User',
        id: 'google_user_554433',
        emails: [{ value: 'existing.user@dreamxec.org' }],
        displayName: 'Existing User',
      });

      const callbackRes = await request(app)
        .get(`/api/auth/google/callback?code=mock_code&state=${encodeURIComponent(signedState)}`);

      expect(callbackRes.status).toBe(302);
      expect(callbackRes.headers.location).toContain('http://localhost:5173/auth/callback#token=');

      // Verify user was linked and verified
      const updatedUser = mockUsers.get('existing.user@dreamxec.org');
      expect(updatedUser.profileMetadata.googleId).toBe('google_user_554433');
      expect(updatedUser.profileMetadata.providers.google).toBe('google_user_554433');
      expect(updatedUser.profileMetadata.emailVerified).toBe(true);
    });

    it('should gracefully redirect to /login with error on tampered or invalid state', async () => {
      const callbackRes = await request(app)
        .get('/api/auth/google/callback?code=mock_code&state=invalid_tampered_state.invalid_signature');

      expect(callbackRes.status).toBe(302);
      expect(callbackRes.headers.location).toContain('http://localhost:5173/login?error=');
    });
  });
});
