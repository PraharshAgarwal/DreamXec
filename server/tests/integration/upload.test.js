const request = require('supertest');
const jwt = require('jsonwebtoken');
const createTestApp = require('../helpers/testApp');
const platformService = require('../../src/modules/platform/platform.service');

describe('File Upload Controller & Integration Tests', () => {
  let app;
  let authToken;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    app = createTestApp();

    const secret = process.env.JWT_SECRET || 'test-secret';
    authToken = jwt.sign({ id: 'user_test_upload', role: 'USER' }, secret, { expiresIn: '1h' });

    // Mock UserRepository for protect middleware
    const defaultUserRepositoryAdapter = require('../../src/modules/users/adapters/prisma-user-repository.adapter');
    jest.spyOn(defaultUserRepositoryAdapter, 'findById').mockResolvedValue({
      id: 'user_test_upload',
      email: 'test@example.com',
      role: 'USER',
      fullName: 'Test User',
      accountStatus: 'ACTIVE',
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/upload/presign', () => {
    it('should gracefully return status: disabled and data: null when AWS S3 is not configured', async () => {
      jest.spyOn(platformService, 'generatePresignedUploadUrl').mockResolvedValue(null);

      const response = await request(app)
        .post('/api/upload/presign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ filename: 'test-document.pdf', contentType: 'application/pdf', folder: 'campaigns' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'disabled');
      expect(response.body).toHaveProperty('enabled', false);
      expect(response.body.data).toBeNull();
    });

    it('should return 400 if filename is missing', async () => {
      const response = await request(app)
        .post('/api/upload/presign')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ folder: 'campaigns' });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });

  describe('POST /api/upload/signature', () => {
    it('should return status: disabled and data: null when Cloudinary is unconfigured or dvqeeun29 is used', async () => {
      const response = await request(app)
        .post('/api/upload/signature')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ folder: 'campaigns' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'disabled');
      expect(response.body).toHaveProperty('enabled', false);
      expect(response.body.data).toBeNull();
    });
  });

  describe('POST /api/upload', () => {
    it('should successfully upload a file and return 200 without throwing 500 reference errors', async () => {
      jest.spyOn(platformService, 'uploadFile').mockResolvedValue({
        url: '/uploads/campaigns/test-image.png',
      });

      const buffer = Buffer.from('fake image content');
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('folder', 'campaigns')
        .attach('file', buffer, 'test-image.png');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('url', '/uploads/campaigns/test-image.png');
      expect(response.body.data).toHaveProperty('secureUrl', '/uploads/campaigns/test-image.png');
      expect(response.body.data).toHaveProperty('originalFilename', 'test-image.png');
    });

    it('should return 400 when no file is attached', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('folder', 'campaigns');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 'error');
    });
  });
});
