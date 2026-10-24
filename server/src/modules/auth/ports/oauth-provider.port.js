/**
 * @typedef {Object} NormalizedOAuthProfile
 * @property {string} provider - Vendor name (e.g. 'google', 'github')
 * @property {string} providerUserId - Unique user ID from vendor
 * @property {string} email - Primary verified user email address
 * @property {string} name - Display name or full name of user
 * @property {string} [avatarUrl] - Optional avatar profile picture URL
 */

/**
 * Interface contract for pluggable OAuth providers.
 */
class OAuthProviderPort {
  /**
   * Generates authorization URL for vendor login redirect.
   * @param {Object} params
   * @param {string} params.state - CSRF state token
   * @param {string} [params.role] - User role intent
   * @returns {string} Fully qualified vendor authorization URL
   */
  getAuthUrl({ state, role }) {
    throw new Error('Method oauthProviderPort.getAuthUrl() must be implemented.');
  }

  /**
   * Exchanges authorization code for user profile.
   * @param {Object} params
   * @param {string} params.code - Authorization code from callback
   * @param {string} [params.state] - CSRF state token
   * @returns {Promise<NormalizedOAuthProfile>}
   */
  async exchangeCodeForUser({ code, state }) {
    throw new Error('Method oauthProviderPort.exchangeCodeForUser() must be implemented.');
  }
}

module.exports = OAuthProviderPort;
