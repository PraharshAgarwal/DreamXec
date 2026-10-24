/**
 * Abstract Port defining database persistence contract for Clubs.
 * @abstract
 */
class ClubRepositoryPort {
  async findPublicClubs({ search, page = 1, limit = 10 } = {}) {
    throw new Error('Method ClubRepositoryPort.findPublicClubs() must be implemented.');
  }

  async findById(id) {
    throw new Error('Method ClubRepositoryPort.findById() must be implemented.');
  }

  async createReferral(referralData) {
    throw new Error('Method ClubRepositoryPort.createReferral() must be implemented.');
  }

  async addMembers(clubId, membersList) {
    throw new Error('Method ClubRepositoryPort.addMembers() must be implemented.');
  }

  async findVerifications(query) {
    throw new Error('Method ClubRepositoryPort.findVerifications() must be implemented.');
  }

  async findVerificationById(id) {
    throw new Error('Method ClubRepositoryPort.findVerificationById() must be implemented.');
  }

  async approveVerificationTransaction(id) {
    throw new Error('Method ClubRepositoryPort.approveVerificationTransaction() must be implemented.');
  }

  async rejectVerification(id, data) {
    throw new Error('Method ClubRepositoryPort.rejectVerification() must be implemented.');
  }

  async findReferralRequests(query) {
    throw new Error('Method ClubRepositoryPort.findReferralRequests() must be implemented.');
  }

  async findReferralRequestById(id) {
    throw new Error('Method ClubRepositoryPort.findReferralRequestById() must be implemented.');
  }

  async updateReferralRequest(id, data) {
    throw new Error('Method ClubRepositoryPort.updateReferralRequest() must be implemented.');
  }
}

module.exports = ClubRepositoryPort;
