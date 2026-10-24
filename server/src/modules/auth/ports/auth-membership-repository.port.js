/**
 * Abstract Port defining the persistence contract for User Organization Memberships.
 * @abstract
 */
class AuthMembershipRepositoryPort {
  /**
   * Find organization memberships and roles for a given user.
   * @param {string} userId
   * @returns {Promise<Array<{ orgId: string, role: string }>>}
   */
  async findUserOrganizations(userId) {
    throw new Error('Method AuthMembershipRepositoryPort.findUserOrganizations() must be implemented.');
  }
}

module.exports = AuthMembershipRepositoryPort;
