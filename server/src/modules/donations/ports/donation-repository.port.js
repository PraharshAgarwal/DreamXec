/**
 * Port (Interface) for Donation & Payment Data Access operations.
 * Adheres to Dependency Inversion Principle (DIP) and Interface Segregation Principle (ISP).
 */
class DonationRepositoryPort {
  async createDonation(data) {
    throw new Error('Method DonationRepositoryPort.createDonation() must be implemented.');
  }

  async updateDonation(id, data) {
    throw new Error('Method DonationRepositoryPort.updateDonation() must be implemented.');
  }

  async findDonationById(id) {
    throw new Error('Method DonationRepositoryPort.findDonationById() must be implemented.');
  }

  async findDonationByProviderOrderId(orderId) {
    throw new Error('Method DonationRepositoryPort.findDonationByProviderOrderId() must be implemented.');
  }

  async findDonationByPaymentIntentId(intentId) {
    throw new Error('Method DonationRepositoryPort.findDonationByPaymentIntentId() must be implemented.');
  }

  async createPaymentIntent(data) {
    throw new Error('Method DonationRepositoryPort.createPaymentIntent() must be implemented.');
  }

  async createPaymentAttempt(data) {
    throw new Error('Method DonationRepositoryPort.createPaymentAttempt() must be implemented.');
  }

  async updatePaymentAttempt(id, data) {
    throw new Error('Method DonationRepositoryPort.updatePaymentAttempt() must be implemented.');
  }

  async updatePaymentIntentStatus(id, status) {
    throw new Error('Method DonationRepositoryPort.updatePaymentIntentStatus() must be implemented.');
  }

  async updateDonationStatus(id, status) {
    throw new Error('Method DonationRepositoryPort.updateDonationStatus() must be implemented.');
  }

  async finalizePaymentTransaction(params) {
    throw new Error('Method DonationRepositoryPort.finalizePaymentTransaction() must be implemented.');
  }

  async processWebhookPaymentCaptured(params) {
    throw new Error('Method DonationRepositoryPort.processWebhookPaymentCaptured() must be implemented.');
  }

  async getCampaignPublicDonors(campaignId, options = {}) {
    throw new Error('Method DonationRepositoryPort.getCampaignPublicDonors() must be implemented.');
  }

  async getPublicStats() {
    throw new Error('Method DonationRepositoryPort.getPublicStats() must be implemented.');
  }

  async findUserDonations(userId, options = {}) {
    throw new Error('Method DonationRepositoryPort.findUserDonations() must be implemented.');
  }

  async findTenantDonations(tenantId, options = {}) {
    throw new Error('Method DonationRepositoryPort.findTenantDonations() must be implemented.');
  }

  async getDonorAnalytics(donorId) {
    throw new Error('Method DonationRepositoryPort.getDonorAnalytics() must be implemented.');
  }

  async getAdminDonations(options = {}) {
    throw new Error('Method DonationRepositoryPort.getAdminDonations() must be implemented.');
  }

  async getAdminDonors(options = {}) {
    throw new Error('Method DonationRepositoryPort.getAdminDonors() must be implemented.');
  }

  async getExportDonations(filter = {}) {
    throw new Error('Method DonationRepositoryPort.getExportDonations() must be implemented.');
  }
}

module.exports = DonationRepositoryPort;
