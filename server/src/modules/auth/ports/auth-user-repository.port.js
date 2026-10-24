/**
 * Abstract Port defining the persistence contract for Auth User operations.
 * Allows core domain authentication services to remain decoupled from underlying ORM/Storage engines.
 * @abstract
 */
class AuthUserRepositoryPort {
  /**
   * Find a user record by UUID id.
   * @param {string} id
   * @returns {Promise<Object|null>}
   */
  async findById(id) {
    throw new Error('Method AuthUserRepositoryPort.findById() must be implemented.');
  }

  /**
   * Find a user record by email address.
   * @param {string} email
   * @returns {Promise<Object|null>}
   */
  async findByEmail(email) {
    throw new Error('Method AuthUserRepositoryPort.findByEmail() must be implemented.');
  }

  /**
   * Create a new user record in storage.
   * @param {Object} userData
   * @returns {Promise<Object>}
   */
  async create(userData) {
    throw new Error('Method AuthUserRepositoryPort.create() must be implemented.');
  }

  /**
   * Update an existing user record.
   * @param {string} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async update(id, data) {
    throw new Error('Method AuthUserRepositoryPort.update() must be implemented.');
  }

  /**
   * Link an OAuth provider ID to a user account.
   * @param {string} userId
   * @param {string} providerName Domain provider identifier (e.g. 'google', 'linkedin')
   * @param {string} providerId
   * @returns {Promise<Object|null>}
   */
  async linkOAuthProvider(userId, providerName, providerId) {
    throw new Error('Method AuthUserRepositoryPort.linkOAuthProvider() must be implemented.');
  }

  /**
   * Create a new OAuth user record.
   * @param {Object} options
   * @returns {Promise<Object>}
   */
  async createOAuthUser(options) {
    throw new Error('Method AuthUserRepositoryPort.createOAuthUser() must be implemented.');
  }
}

module.exports = AuthUserRepositoryPort;
