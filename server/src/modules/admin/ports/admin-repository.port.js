/**
 * Abstract Port defining database persistence contract for Admin operations.
 * @abstract
 */
class AdminRepositoryPort {
  async getDashboardStats() {
    throw new Error('Method AdminRepositoryPort.getDashboardStats() must be implemented.');
  }

  async findAllProjects() {
    throw new Error('Method AdminRepositoryPort.findAllProjects() must be implemented.');
  }

  async findAllUsers() {
    throw new Error('Method AdminRepositoryPort.findAllUsers() must be implemented.');
  }

  async findAllDonors() {
    throw new Error('Method AdminRepositoryPort.findAllDonors() must be implemented.');
  }

  async findAllClubs() {
    throw new Error('Method AdminRepositoryPort.findAllClubs() must be implemented.');
  }

  async findAllDonations() {
    throw new Error('Method AdminRepositoryPort.findAllDonations() must be implemented.');
  }

  async findAuditLogs() {
    throw new Error('Method AdminRepositoryPort.findAuditLogs() must be implemented.');
  }

  async findWithdrawals() {
    throw new Error('Method AdminRepositoryPort.findWithdrawals() must be implemented.');
  }
}

module.exports = AdminRepositoryPort;
