const jwt = require('jsonwebtoken');
const TokenProviderPort = require('../ports/token-provider.port');

class JwtTokenAdapter extends TokenProviderPort {
  generateAccessToken(user, orgRoles = []) {
    const roles = Array.from(
      new Set([user.role, ...orgRoles.map((r) => r.role)].filter(Boolean))
    );
    const organizations = orgRoles.map((r) => ({
      id: r.organizationId || r.orgId || r.id,
      name: r.orgName || r.name || null,
      slug: r.orgSlug || r.slug || null,
      orgType: r.orgType || null,
      role: r.role,
    }));

    const payload = {
      id: user.id,
      email: user.email,
      name: user.fullName || user.name || '',
      role: user.role,
      roles,
      organizations,
      orgRoles,
    };
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');
    return jwt.sign(payload, secret, { expiresIn: '7d' });
  }

  generateScopedAccessToken(user, activeProfile, allOrgRoles = []) {
    const orgRolesList = allOrgRoles && allOrgRoles.length > 0 ? allOrgRoles : [activeProfile];
    const roles = Array.from(
      new Set([user.role, activeProfile.role, ...orgRolesList.map((r) => r.role)].filter(Boolean))
    );
    const organizations = orgRolesList.map((r) => ({
      id: r.organizationId || r.orgId || r.id,
      name: r.orgName || r.name || null,
      slug: r.orgSlug || r.slug || null,
      orgType: r.orgType || null,
      role: r.role,
    }));

    const payload = {
      id: user.id,
      email: user.email,
      name: user.fullName || user.name || '',
      role: activeProfile.role || user.role,
      activeTenantId: activeProfile.organizationId || activeProfile.id,
      activeProfile: {
        organizationId: activeProfile.organizationId || activeProfile.id,
        orgName: activeProfile.orgName || activeProfile.name || null,
        orgSlug: activeProfile.orgSlug || activeProfile.slug || null,
        role: activeProfile.role,
      },
      roles,
      organizations,
      orgRoles: orgRolesList,
    };
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');
    return jwt.sign(payload, secret, { expiresIn: '7d' });
  }

  generateVerificationToken(email) {
    const secret = process.env.JWT_VERIFICATION_SECRET || 'fallback_verification_secret';
    return jwt.sign({ email }, secret, { expiresIn: '1d' });
  }

  generateResetToken(email) {
    const secret = process.env.JWT_PASSWORD_RESET_SECRET || 'fallback_reset_secret';
    return jwt.sign({ email, nonce: Date.now() + Math.random() }, secret, { expiresIn: '5m' });
  }

  generateRefreshToken(user) {
    const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
    const payload = {
      id: user.id,
      email: user.email,
      type: 'refresh',
    };
    return jwt.sign(payload, secret, { expiresIn: '7d' });
  }

  async verifyRefreshToken(token) {
    const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
    return this.verifyToken(token, secret);
  }

  async verifyToken(token, secret) {
    try {
      return jwt.verify(token, secret);
    } catch (err) {
      return null;
    }
  }
}

module.exports = new JwtTokenAdapter();
