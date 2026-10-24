const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const clubService = require('../../src/modules/clubs/club.service');

describe('Club Module Integration & Parity Tests', () => {
  let app;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    app = createTestApp();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/clubs/public', () => {
    it('should return 200 and list of public clubs', async () => {
      jest.spyOn(clubService.repositoryPort, 'findPublicClubs').mockImplementation(async () => ({
        clubs: [
          {
            id: 'club_1',
            name: 'Robotics Club',
            college: 'IIT Bombay',
            slug: 'robotics-club-iit-bombay',
            verified: true,
          },
        ],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      }));

      const response = await request(app).get('/api/clubs/public');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('clubs');
      expect(Array.isArray(response.body.clubs)).toBe(true);
      expect(response.body.clubs[0].name).toBe('Robotics Club');
    });
  });

  describe('GET /api/clubs/:id', () => {
    it('should return 200 and club details when club exists', async () => {
      jest.spyOn(clubService.repositoryPort, 'findById').mockImplementation(async (id) => ({
        id,
        name: 'AI Club',
        college: 'BITS Pilani',
        slug: 'ai-club',
        verified: true,
      }));

      const response = await request(app).get('/api/clubs/club_99');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.name).toBe('AI Club');
    });

    it('should return 404 status when club does not exist', async () => {
      jest.spyOn(clubService.repositoryPort, 'findById').mockImplementation(async () => null);

      const response = await request(app).get('/api/clubs/non_existent_club');

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/clubs/refer-club', () => {
    it('should create club referral and return 201 status', async () => {
      jest.spyOn(clubService.repositoryPort, 'createReferral').mockImplementation(async (data) => ({
        id: 'referral_123',
        ...data,
        status: 'PENDING',
        createdAt: new Date(),
      }));
      jest.spyOn(clubService.notificationPort, 'sendReferralNotification').mockImplementation(async () => true);

      const response = await request(app)
        .post('/api/clubs/refer-club')
        .send({
          clubName: 'Design Club',
          collegeName: 'NID Ahmedabad',
          referrerName: 'Alex',
          referrerEmail: 'alex@example.com',
          presidentName: 'Sam',
          presidentEmail: 'sam@example.com',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('status', 'success');
    });
  });

  describe('POST /api/clubs/:id/upload-members', () => {
    it('should reject unauthenticated request with 401 error', async () => {
      const response = await request(app)
        .post('/api/clubs/club_123/upload-members');

      expect(response.status).toBe(401);
    });
  });

  describe('PATCH /api/clubs/:id/profile', () => {
    it('should reject unauthenticated request with 401 error', async () => {
      const response = await request(app)
        .patch('/api/clubs/nitkkr-robotics-club/profile')
        .send({ motto: 'New motto test' });

      expect(response.status).toBe(401);
    });

    it('should call updateClubProfile and return updated club when authenticated', async () => {
      const jwt = require('jsonwebtoken');
      const userRepository = require('../../src/modules/users/adapters/prisma-user-repository.adapter');
      const mockUserId = '11111111-1111-1111-1111-111111111111';

      jest.spyOn(userRepository, 'findById').mockResolvedValue({
        id: mockUserId,
        role: 'STUDENT_PRESIDENT',
        accountStatus: 'ACTIVE',
        email: 'pres@nitkkr.ac.in',
      });

      const token = jwt.sign(
        { id: mockUserId, role: 'STUDENT_PRESIDENT', email: 'pres@nitkkr.ac.in' },
        process.env.JWT_SECRET || 'test_jwt_secret',
        { expiresIn: '1h' }
      );

      jest.spyOn(clubService, 'updateClubProfile').mockImplementation(async (clubId, userId, data) => ({
        id: clubId,
        name: 'NITKKR Robotics Club',
        motto: data.motto,
        technicalStacks: data.technicalStacks || [],
      }));

      const response = await request(app)
        .patch('/api/clubs/nitkkr-robotics-club/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({
          motto: 'Updated autonomous rover research motto',
          technicalStacks: [{ name: 'ROS2 Humble', description: 'Real-time robotics', tag: 'Framework' }],
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.motto).toBe('Updated autonomous rover research motto');
    });
  });
});
