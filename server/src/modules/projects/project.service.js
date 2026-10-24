const prismaRepositoryAdapter = require('./adapters/prisma-project-repository.adapter');
const redisCacheAdapter = require('./adapters/redis-project-cache.adapter');
const mapper = require('./project.mapper');
const { ProjectNotFoundError, UnauthorizedProjectActionError } = require('./project.errors');
const { publishEvent } = require('../../config/eventPublisher');
const EVENTS = require('../../config/events');
const { getClientUrl } = require('../../utils/urlConfig');

const PUBLIC_PROJECTS_TTL = 60;
const PROJECT_DETAIL_TTL = 120;

class ProjectService {
  constructor({
    repositoryPort = prismaRepositoryAdapter,
    cachePort = redisCacheAdapter,
  } = {}) {
    this.repositoryPort = repositoryPort;
    this.cachePort = cachePort;
  }

  async createUserProject({ title, description, user }) {
    const project = await this.repositoryPort.createProject(user.id, {
      title,
      description,
    });

    try {
      const clientUrl = getClientUrl();
      await publishEvent(EVENTS.CAMPAIGN_CREATED, {
        email: user.email,
        name: user.name,
        campaignTitle: project.title,
        campaignUrl: `${clientUrl}/projects/${project.id}`,
      });
    } catch (err) {
      console.error('[ProjectService] Error publishing CAMPAIGN_CREATED event:', err.message);
    }

    return project;
  }

  async updateUserProject({ id, title, description, stage, user }) {
    const existingProject = await this.repositoryPort.findByIdOrSlug(id);
    if (!existingProject) {
      throw new ProjectNotFoundError();
    }

    const isPI = Array.isArray(existingProject.members) &&
      existingProject.members.some((m) => m.userId === user.id && m.role === 'PI');

    if (!isPI && user.role !== 'ADMIN') {
      throw new UnauthorizedProjectActionError();
    }

    const updated = await this.repositoryPort.updateProject(id, {
      title,
      description,
      stage,
    });

    await this.cachePort.del(`project:${id}`);
    if (existingProject.slug) {
      await this.cachePort.del(`project:slug:${existingProject.slug}`);
    }

    return updated;
  }

  async deleteUserProject({ id, user }) {
    const existingProject = await this.repositoryPort.findByIdOrSlug(id);
    if (!existingProject) {
      throw new ProjectNotFoundError();
    }

    const isPI = Array.isArray(existingProject.members) &&
      existingProject.members.some((m) => m.userId === user.id && m.role === 'PI');

    if (!isPI && user.role !== 'ADMIN') {
      throw new UnauthorizedProjectActionError();
    }

    await this.repositoryPort.deleteProject(id);

    await this.cachePort.del(`project:${id}`);
    if (existingProject.slug) {
      await this.cachePort.del(`project:slug:${existingProject.slug}`);
    }
  }

  async getUserProject(identifier) {
    const isObjectId = identifier.length === 24;
    const cacheKey = isObjectId ? `project:${identifier}` : `project:slug:${identifier}`;

    const cached = await this.cachePort.get(cacheKey);
    if (cached) {
      return cached;
    }

    const project = await this.repositoryPort.findByIdOrSlug(identifier);
    if (!project) {
      throw new ProjectNotFoundError();
    }

    await Promise.all([
      this.cachePort.set(`project:${project.id}`, project, PROJECT_DETAIL_TTL),
      project.slug ? this.cachePort.set(`project:slug:${project.slug}`, project, PROJECT_DETAIL_TTL) : Promise.resolve(),
    ]);

    return project;
  }

  async getPublicUserProjects({ limit, cursor }) {
    const cacheKey = `public:projects:cursor:${cursor || 'start'}:limit:${limit || 20}`;
    const cached = await this.cachePort.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.repositoryPort.findPublicProjects({ limit, cursor });
    const payload = mapper.toPublicProjectsListDto(
      result.rawProjects || [],
      result.limit,
      result.nextCursor,
      result.hasNextPage
    );

    await this.cachePort.set(cacheKey, payload, PUBLIC_PROJECTS_TTL);
    return payload;
  }

  async getMyUserProjects(userId) {
    return this.repositoryPort.findUserProjects(userId);
  }

  async getStudentAnalytics(userId) {
    const projects = await this.repositoryPort.findUserProjects(userId);
    return {
      total: projects.length,
      discovery: projects.filter((p) => p.stage === 'DISCOVERY').length,
      feasibility: projects.filter((p) => p.stage === 'FEASIBILITY').length,
      prototype: projects.filter((p) => p.stage === 'PROTOTYPE').length,
      pilot: projects.filter((p) => p.stage === 'PILOT').length,
      commercialization: projects.filter((p) => p.stage === 'COMMERCIALIZATION').length,
    };
  }

  async getDonorProjects() {
    return this.repositoryPort.findDonorProjects();
  }
}

module.exports = new ProjectService();
module.exports.ProjectService = ProjectService;
