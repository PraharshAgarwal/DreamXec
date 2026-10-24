const prismaRepositoryAdapter = require('./adapters/prisma-admin-repository.adapter');
const mapper = require('./admin.mapper');

class AdminService {
  constructor({ repositoryPort = prismaRepositoryAdapter } = {}) {
    this.repositoryPort = repositoryPort;
  }

  async getDashboardStats(filters = {}) {
    const rawStats = await this.repositoryPort.getDashboardStats(filters);
    return mapper.toDashboardStatsDto(rawStats);
  }

  async getAllProjects(filters = {}) {
    return this.repositoryPort.findAllProjects(filters);
  }

  async getAllUsers(filters = {}) {
    return this.repositoryPort.findAllUsers(filters);
  }

  async getAllDonors(filters = {}) {
    return this.repositoryPort.findAllDonors(filters);
  }

  async getAllClubs() {
    return this.repositoryPort.findAllClubs();
  }

  async getAllDonations() {
    return this.repositoryPort.findAllDonations();
  }

  async getAuditLogs() {
    const logs = await this.repositoryPort.findAuditLogs();
    return logs.map((l) => mapper.toAuditLogDto(l));
  }

  async getWithdrawals() {
    return this.repositoryPort.findWithdrawals();
  }
}

module.exports = new AdminService();
module.exports.AdminService = AdminService;
