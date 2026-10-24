const { getProvider } = require('../registry/auth.registry');
const sessionService = require('./session.service');
const { userRepository } = require('../auth.repository');
const { publishEvent } = require('../../../config/eventPublisher');
const EVENTS = require('../../../config/events');
const { getClientUrl } = require('../../../utils/urlConfig');

/**
 * Dedicated service handling third-party social OAuth initiation and callback resolution.
 */
class OAuthService {
  constructor({
    getOAuthProvider = getProvider,
    sessionSvc = sessionService,
    userRepo = userRepository,
  } = {}) {
    this.getOAuthProvider = getOAuthProvider;
    this.sessionService = sessionSvc;
    this.userRepository = userRepo;
  }

  /**
   * Common workflow to process OAuth user profile (detect existing, link provider ID, or create new).
   */
  async processOAuthUser(providerNameOrKey, profile, requestedRole) {
    const email = profile.emails?.[0]?.value || profile.email;
    const providerId = profile.id || profile.providerUserId;

    if (!email) {
      throw new Error('OAuth profile email not found');
    }

    const existingUser = await this.userRepository.findByEmail(email);
    const role = requestedRole || 'USER';

    if (existingUser) {
      return this.userRepository.linkOAuthProvider(existingUser.id, providerNameOrKey, providerId, profile.avatarUrl || profile.picture);
    }

    const name = profile.displayName || profile.name || 'User';

    const newUser = await this.userRepository.createOAuthUser({
      email,
      name,
      providerName: providerNameOrKey,
      providerIdKey: providerNameOrKey,
      providerId,
      role,
      emailVerified: true,
      avatarUrl: profile.avatarUrl || profile.picture || null,
    });

    // Non-blocking welcome event publishing
    publishEvent(EVENTS.USER_WELCOME, {
      email: newUser.email,
      name: newUser.name,
      dashboardUrl: `${getClientUrl()}/dashboard`,
    }).catch((err) =>
      console.error('[OAuthService] Failed to publish welcome event:', err.message)
    );

    return newUser;
  }

  /**
   * Generates authorization URL for a social provider.
   */
  async getOAuthUrl(providerName, role = 'USER') {
    const provider = this.getOAuthProvider(providerName);
    return provider.getAuthUrl(role);
  }

  /**
   * Handles OAuth callback and returns authenticated session DTO.
   */
  async handleOAuthCallback(providerName, { req, expectedState, profile, role }) {
    const provider = this.getOAuthProvider(providerName);
    const user = await provider.handleCallback({ req, expectedState, profile, role });

    return this.sessionService.createSession(user);
  }

  /**
   * Backward-compatible helper for LinkedIn Auth URL.
   */
  async getLinkedInAuthUrl(role = 'USER') {
    return this.getOAuthUrl('linkedin', role);
  }

  /**
   * Backward-compatible helper for LinkedIn Callback.
   */
  async handleLinkedInCallback({ req, expectedState }) {
    return this.handleOAuthCallback('linkedin', { req, expectedState });
  }
}

module.exports = new OAuthService();
module.exports.OAuthService = OAuthService;
