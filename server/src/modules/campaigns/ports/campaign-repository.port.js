/**
 * Port (Interface) for Campaign Data Access operations.
 * Adheres to Dependency Inversion Principle (DIP).
 */
class CampaignRepositoryPort {
  /**
   * Creates a campaign and its initial milestones transactionally.
   * @param {Object} campaignData 
   * @param {Array<Object>} initialMilestones 
   * @returns {Promise<Object>}
   */
  async createCampaign(campaignData, initialMilestones = []) {
    throw new Error('Method createCampaign() must be implemented.');
  }

  /**
   * Finds a campaign by its UUID or unique slug.
   * @param {string} idOrSlug 
   * @returns {Promise<Object|null>}
   */
  async findByIdOrSlug(idOrSlug) {
    throw new Error('Method findByIdOrSlug() must be implemented.');
  }

  /**
   * Finds paginated public live campaigns with optional filters.
   * Optimized for 10k+ concurrent read traffic.
   * @param {Object} params
   * @returns {Promise<{ campaigns: Array<Object>, total: number, hasNextPage: boolean }>}
   */
  async findPublicCampaigns({ category, search, page = 1, limit = 20, cursor = null } = {}) {
    throw new Error('Method findPublicCampaigns() must be implemented.');
  }

  /**
   * Finds all campaigns belonging to a specific student user and optional organization.
   * @param {string} userId 
   * @param {string|null} orgId 
   * @returns {Promise<Array<Object>>}
   */
  async findUserCampaigns(userId, orgId = null) {
    throw new Error('Method findUserCampaigns() must be implemented.');
  }

  /**
   * Finds all campaigns belonging to an institution tenant.
   * @param {string} tenantId 
   * @param {string|null} status 
   * @returns {Promise<Array<Object>>}
   */
  async findTenantCampaigns(tenantId, status = null) {
    throw new Error('Method findTenantCampaigns() must be implemented.');
  }

  /**
   * Updates an existing campaign aggregate.
   * @param {string} id 
   * @param {Object} updateData 
   * @returns {Promise<Object>}
   */
  async updateCampaign(id, updateData) {
    throw new Error('Method updateCampaign() must be implemented.');
  }

  /**
   * Verifies (approves or rejects) a campaign by an authorized reviewer.
   * @param {string} id 
   * @param {Object} verificationData 
   * @returns {Promise<Object>}
   */
  async verifyCampaign(id, { verifiedByUserId, status, rejectionReason }) {
    throw new Error('Method verifyCampaign() must be implemented.');
  }

  /**
   * Atomically increments raised funding amount and donor count.
   * Eliminates race conditions under high concurrent donation traffic.
   * @param {string} campaignId 
   * @param {number|string} amount 
   * @returns {Promise<Object>}
   */
  async incrementRaisedAmount(campaignId, amount) {
    throw new Error('Method incrementRaisedAmount() must be implemented.');
  }

  /**
   * Creates or updates a faculty/mentor endorsement.
   * @param {string} campaignId 
   * @param {string} endorserUserId 
   * @param {Object} endorsementData 
   * @returns {Promise<Object>}
   */
  async createEndorsement(campaignId, endorserUserId, endorsementData) {
    throw new Error('Method createEndorsement() must be implemented.');
  }

  /**
   * Retrieves aggregated live impact dashboard statistics.
   * @returns {Promise<Object>}
   */
  async getImpactDashboardMetrics() {
    throw new Error('Method getImpactDashboardMetrics() must be implemented.');
  }
}

module.exports = CampaignRepositoryPort;
