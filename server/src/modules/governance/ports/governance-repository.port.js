/**
 * Abstract Port defining database persistence contract for Governance operations.
 * @abstract
 */
class GovernanceRepositoryPort {
  async createApplication(userId, data) {
    throw new Error('Method GovernanceRepositoryPort.createApplication() must be implemented.');
  }

  async findApplications(userId) {
    throw new Error('Method GovernanceRepositoryPort.findApplications() must be implemented.');
  }

  async findAllMentors() {
    throw new Error('Method GovernanceRepositoryPort.findAllMentors() must be implemented.');
  }

  async createStudentVerification(data) {
    throw new Error('Method GovernanceRepositoryPort.createStudentVerification() must be implemented.');
  }

  async findStudentVerifications(where) {
    throw new Error('Method GovernanceRepositoryPort.findStudentVerifications() must be implemented.');
  }
}

module.exports = GovernanceRepositoryPort;
