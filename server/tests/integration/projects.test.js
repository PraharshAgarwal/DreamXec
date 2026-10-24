const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const projectService = require('../../src/modules/projects/project.service');

describe('Projects Subsystem Integration & Parity Tests', () => {
  let app;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest.spyOn(projectService.cachePort, 'get').mockResolvedValue(null);
    jest.spyOn(projectService.cachePort, 'set').mockResolvedValue(true);
    app = createTestApp();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/user-projects/public', () => {
    it('should return 200 and list of public projects', async () => {
      jest.spyOn(projectService.repositoryPort, 'findPublicProjects').mockImplementation(async () => ({
        rawProjects: [
          {
            id: 'proj_1',
            title: 'Solar Powered Drone',
            slug: 'solar-powered-drone',
            description: 'Autonomous aerial vehicle',
            stage: 'PROTOTYPE',
            members: [{ user: { id: 'user_1', name: 'Alice' }, role: 'PI' }],
          },
        ],
        limit: 20,
        nextCursor: null,
        hasNextPage: false,
      }));

      const response = await request(app).get('/api/user-projects/public');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('userProjects');
      expect(Array.isArray(response.body.data.userProjects)).toBe(true);
      expect(response.body.data.userProjects[0].title).toBe('Solar Powered Drone');
    });
  });

  describe('GET /api/user-projects/:id', () => {
    it('should return 200 and project details when project exists', async () => {
      jest.spyOn(projectService.repositoryPort, 'findByIdOrSlug').mockImplementation(async (id) => ({
        id,
        title: 'Quantum Processor',
        slug: 'quantum-processor',
        description: 'Superconducting qubit simulation',
        stage: 'DISCOVERY',
        members: [{ user: { id: 'user_2', name: 'Bob' }, role: 'PI' }],
      }));

      const response = await request(app).get('/api/user-projects/proj_99');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data.userProject.title).toBe('Quantum Processor');
    });

    it('should return 404 status when project does not exist', async () => {
      jest.spyOn(projectService.repositoryPort, 'findByIdOrSlug').mockImplementation(async () => null);

      const response = await request(app).get('/api/user-projects/non_existent_proj');

      expect(response.status).toBe(404);
    });
  });

  describe('Unauthenticated Access Control', () => {
    it('should reject unauthenticated project creation with 401 error', async () => {
      const response = await request(app)
        .post('/api/user-projects')
        .send({ title: 'New Robot', description: 'Robotics project' });

      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated project deletion with 401 error', async () => {
      const response = await request(app).delete('/api/user-projects/proj_123');
      expect(response.status).toBe(401);
    });

    it('should reject unauthenticated my-projects query with 401 error', async () => {
      const response = await request(app).get('/api/user-projects/my');
      expect(response.status).toBe(401);
    });
  });
});
