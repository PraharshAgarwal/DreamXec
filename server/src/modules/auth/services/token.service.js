const defaultJwtAdapter = require('../adapters/jwt-token.adapter');

class TokenService {
  constructor({ tokenProvider = defaultJwtAdapter } = {}) {
    this.tokenProvider = tokenProvider;
  }

  generateAccessToken(user, orgRoles = []) {
    return this.tokenProvider.generateAccessToken(user, orgRoles);
  }

  generateScopedAccessToken(user, activeProfile, allOrgRoles = []) {
    if (this.tokenProvider.generateScopedAccessToken) {
      return this.tokenProvider.generateScopedAccessToken(user, activeProfile, allOrgRoles);
    }
    return this.generateAccessToken(user, allOrgRoles.length > 0 ? allOrgRoles : [activeProfile]);
  }

  generateVerificationToken(email) {
    return this.tokenProvider.generateVerificationToken(email);
  }

  generateResetToken(email) {
    return this.tokenProvider.generateResetToken(email);
  }

  generateRefreshToken(user) {
    if (this.tokenProvider.generateRefreshToken) {
      return this.tokenProvider.generateRefreshToken(user);
    }
    return this.generateAccessToken(user, []);
  }

  async verifyRefreshToken(token) {
    if (this.tokenProvider.verifyRefreshToken) {
      return this.tokenProvider.verifyRefreshToken(token);
    }
    return this.verifyAccessToken(token);
  }

  async verifyToken(token, secret) {
    return this.tokenProvider.verifyToken(token, secret);
  }

  async verifyAccessToken(token) {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');
    return this.verifyToken(token, secret);
  }

  async verifyVerificationToken(token) {
    const secret = process.env.JWT_VERIFICATION_SECRET || 'fallback_verification_secret';
    return this.verifyToken(token, secret);
  }

  async verifyResetToken(token) {
    const secret = process.env.JWT_PASSWORD_RESET_SECRET || 'fallback_reset_secret';
    return this.verifyToken(token, secret);
  }
}

module.exports = new TokenService();
module.exports.TokenService = TokenService;
