const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const interactionService = require('../../src/modules/interactions/interaction.service');

describe('Interactions Subsystem Integration & Parity Tests', () => {
  let app;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    app = createTestApp();
    jest.spyOn(interactionService, 'buildCampaignContext').mockResolvedValue({
      ownerUserIds: new Set(),
      teamUserIds: new Set(),
      donorUserIds: new Set(),
    });
    interactionService.prisma = {
      campaign: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      campaignMember: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      donation: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/campaigns/:campaignId/comments', () => {
    it('should return 200 and comments list for campaign', async () => {
      jest.spyOn(interactionService.repositoryPort, 'findCommentsByCampaignId').mockImplementation(async () => [
        {
          id: 'comm_1',
          content: 'Great initiative!',
          createdAt: new Date().toISOString(),
          user: { id: 'user_1', name: 'Alice', profilePicture: null },
        },
      ]);

      const response = await request(app).get('/api/campaigns/11111111-1111-1111-1111-111111111111/comments');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('comments');
      expect(Array.isArray(response.body.data.comments)).toBe(true);
      expect(response.body.data.comments[0].content).toBe('Great initiative!');
    });
  });

  describe('Unauthenticated Access Control', () => {
    it('should reject unauthenticated comment creation with 401 error', async () => {
      const response = await request(app)
        .post('/api/campaigns/proj_123/comments')
        .send({ content: 'Awesome project!' });

      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated comment deletion with 401 error', async () => {
      const response = await request(app).delete('/api/comments/comm_123');
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated wishlist toggling with 401 error', async () => {
      const response = await request(app)
        .post('/api/wishlist/toggle')
        .send({ campaignId: 'proj_123' });

      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated my wishlist query with 401 error', async () => {
      const response = await request(app).get('/api/wishlist/my');
      expect(response.status).toBe(401);
    });
  });
});
