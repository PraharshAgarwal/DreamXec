const request = require('supertest');
const createTestApp = require('../helpers/testApp');
const platformService = require('../../src/modules/platform/platform.service');

describe('Platform Subsystem Integration & Parity Tests', () => {
  let app;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    app = createTestApp();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/colleges', () => {
    it('should return 200 and list of colleges', async () => {
      jest.spyOn(platformService.repositoryPort, 'findAllColleges').mockImplementation(async () => [
        { id: 'col_1', name: 'Indian Institute of Technology', state: 'Delhi' },
      ]);

      const response = await request(app).get('/api/colleges');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
      expect(response.body.data).toHaveProperty('colleges');
      expect(Array.isArray(response.body.data.colleges)).toBe(true);
      expect(response.body.data.colleges[0].name).toBe('Indian Institute of Technology');
    });
  });

  describe('POST /api/newsletter/subscribe', () => {
    it('should subscribe email to newsletter', async () => {
      jest.spyOn(platformService.repositoryPort, 'subscribeNewsletter').mockImplementation(async () => ({
        id: 'news_1',
        email: 'subscriber@example.com',
      }));

      const response = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'subscriber@example.com' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'success');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/newsletter/subscribe')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /sitemap.xml', () => {
    it('should return sitemap xml content', async () => {
      jest.spyOn(platformService.repositoryPort, 'findSitemapEntries').mockImplementation(async () => [
        { loc: 'https://dreamxec.com/projects/solar', lastmod: new Date().toISOString() },
      ]);

      const response = await request(app).get('/sitemap.xml');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('xml');
      expect(response.text).toContain('xml');
    });
  });

  describe('GET /robots.txt', () => {
    it('should return robots.txt plain text', async () => {
      const response = await request(app).get('/robots.txt');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.text).toContain('User-agent');
    });
  });

  describe('Unauthenticated Access Control', () => {
    it('should reject unauthenticated upload with 401 error', async () => {
      const response = await request(app).post('/api/upload');
      expect(response.status).toBe(401);
    });
  });
});
