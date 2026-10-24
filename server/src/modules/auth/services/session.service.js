const { membershipRepository } = require('../auth.repository');
const tokenService = require('./token.service');
const UserMapper = require('../auth.mapper');
const { getEffectivePermissions } = require('../../../permissions/matrix');

/**
 * Service dedicated to managing user sessions and DTO mappings.
 */
class SessionService {
  constructor({
    membershipRepo = membershipRepository,
    tokenSvc = tokenService,
    permissionsResolver = getEffectivePermissions,
    userMapper = UserMapper,
  } = {}) {
    this.membershipRepository = membershipRepo;
    this.tokenService = tokenSvc;
    this.getEffectivePermissions = permissionsResolver;
    this.UserMapper = userMapper;
  }

  /**
   * Fetches user organization roles, calculates effective permissions,
   * generates access token, and maps public user DTO for authenticated sessions.
   * @param {Object} user - Domain user object
   * @returns {Promise<{ token: string, user: Object }>}
   */
  async createSession(user) {
    const orgRoles = await this.membershipRepository.findUserOrganizations(user.id);
    const activeOrgRoles = orgRoles.filter(r => r.status === 'ACTIVE');
    const permissions = this.getEffectivePermissions(user, activeOrgRoles);
    const token = this.tokenService.generateAccessToken(user, activeOrgRoles);
    const safeUser = this.UserMapper.toPublicUser(user, orgRoles, permissions);

    return { token, user: safeUser };
  }

  /**
   * Fetches user organization roles, calculates effective permissions,
   * and maps public user DTO WITHOUT generating new tokens (for /me endpoint).
   * @param {Object} user - Domain user object
   * @returns {Promise<Object>} public user DTO
   */
  async buildUserDTO(user) {
    const orgRoles = await this.membershipRepository.findUserOrganizations(user.id);
    const activeOrgRoles = orgRoles.filter(r => r.status === 'ACTIVE');

    let activeProfile = null;
    if (user.activeTenantId && user.scopedRole) {
      activeProfile = orgRoles.find(r => r.organizationId === user.activeTenantId && r.role === user.scopedRole) || null;
    }

    // Segregate permissions: strictly for the activeProfile if active, else independent USER permissions
    const permissions = activeProfile
      ? this.getEffectivePermissions(user, [activeProfile], activeProfile)
      : this.getEffectivePermissions({ role: 'USER', id: user.id }, []);

    const safeUser = this.UserMapper.toPublicUser(user, orgRoles, permissions);

    if (activeProfile) {
      safeUser.activeProfile = activeProfile;
      const adminRoles = ['ORG_ADMIN', 'CORPORATE_ADMIN', 'INCUBATOR_MANAGER', 'ADMIN', 'DX_ADMIN'];
      safeUser.activeIdentityType = adminRoles.includes((activeProfile.role || '').toUpperCase()) ? 'ORG_ADMIN' : 'ORG_MEMBER';
    } else {
      safeUser.activeProfile = null;
      safeUser.activeIdentityType = 'USER';
    }

    safeUser.permissions = permissions;
    return safeUser;
  }

  /**
   * Switches the active profile and returns a scoped or independent token
   * @param {Object} user - Domain user object
   * @param {string|null} organizationId - Target organization ID (or null for independent)
   * @param {string} role - Target role (or USER for independent)
   * @param {boolean} isIndependent - Flag explicitly requesting independent user mode
   */
  async switchProfile(user, organizationId, role, isIndependent = false) {
    const orgRoles = await this.membershipRepository.findUserOrganizations(user.id);
    
    // Check if switching to Independent User mode (not tied to any organization)
    if (isIndependent || !organizationId || role === 'USER') {
      const permissions = this.getEffectivePermissions({ role: 'USER', id: user.id }, []);
      const token = this.tokenService.generateAccessToken(user, orgRoles.filter(r => r.status === 'ACTIVE'));
      const safeUser = this.UserMapper.toPublicUser(user, orgRoles, permissions);
      safeUser.activeProfile = null;
      safeUser.activeIdentityType = 'USER';
      safeUser.permissions = permissions;
      return { token, user: safeUser };
    }

    // Validate that the user actually has this membership
    const activeProfile = orgRoles.find(r => r.organizationId === organizationId && r.role === role);
    if (!activeProfile) {
      throw new Error('Invalid profile selection');
    }
    if (activeProfile.status === 'PENDING') {
      throw new Error('This profile is pending verification. You can access it once approved.');
    }

    // Segregate permissions: strictly for the active profile role
    const permissions = this.getEffectivePermissions(user, [activeProfile], activeProfile);
    const token = this.tokenService.generateScopedAccessToken(user, activeProfile, orgRoles);
    
    const safeUser = this.UserMapper.toPublicUser(user, orgRoles, permissions);
    safeUser.activeProfile = activeProfile;
    safeUser.permissions = permissions;
    
    const adminRoles = ['ORG_ADMIN', 'CORPORATE_ADMIN', 'INCUBATOR_MANAGER', 'ADMIN', 'DX_ADMIN'];
    safeUser.activeIdentityType = adminRoles.includes((activeProfile.role || '').toUpperCase()) ? 'ORG_ADMIN' : 'ORG_MEMBER';
    
    return { token, user: safeUser };
  }
}

module.exports = new SessionService();
module.exports.SessionService = SessionService;

