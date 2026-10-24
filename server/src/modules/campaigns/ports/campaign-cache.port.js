/**
 * Port (Interface) for High-Throughput Campaign Caching.
 * Decouples caching provider from domain services.
 */
class CampaignCachePort {
  /**
   * Retrieves cached public campaigns list.
   * @param {string} cacheKey 
   * @returns {Promise<Object|null>}
   */
  async getPublicCampaigns(cacheKey) {
    throw new Error('Method getPublicCampaigns() must be implemented.');
  }

  /**
   * Sets cached public campaigns list with TTL.
   * @param {string} cacheKey 
   * @param {Object} data 
   * @param {number} ttlSeconds 
   * @returns {Promise<void>}
   */
  async setPublicCampaigns(cacheKey, data, ttlSeconds = 60) {
    throw new Error('Method setPublicCampaigns() must be implemented.');
  }

  /**
   * Retrieves cached single campaign details.
   * @param {string} idOrSlug 
   * @returns {Promise<Object|null>}
   */
  async getCampaignDetails(idOrSlug) {
    throw new Error('Method getCampaignDetails() must be implemented.');
  }

  /**
   * Sets cached single campaign details with TTL.
   * @param {string} idOrSlug 
   * @param {Object} data 
   * @param {number} ttlSeconds 
   * @returns {Promise<void>}
   */
  async setCampaignDetails(idOrSlug, data, ttlSeconds = 60) {
    throw new Error('Method setCampaignDetails() must be implemented.');
  }

  /**
   * Invalidates cached keys for a campaign and public lists.
   * @param {string} idOrSlug 
   * @param {string|null} tenantId 
   * @returns {Promise<void>}
   */
  async invalidateCampaign(idOrSlug, tenantId = null) {
    throw new Error('Method invalidateCampaign() must be implemented.');
  }
}

module.exports = CampaignCachePort;
