const EVENTS = require('../../../config/events');
const { publishEvent } = require('../../../config/eventPublisher');
const { logAuditEvent } = require('../../../utils/auditLogger');

class AuditService {
  async loginSuccess({ user, ip, userAgent }) {
    try {
      await publishEvent(EVENTS.SECURITY_ALERT, {
        email: user.email,
        action: 'LOGIN_SUCCESS',
        ip,
        userAgent,
      });

      await logAuditEvent({
        action: 'LOGIN_SUCCESS',
        entityType: 'USER',
        entityId: user.id,
        userId: user.id,
        ipAddress: ip,
        userAgent,
        newValue: { email: user.email, role: user.role },
      });
    } catch (err) {
      console.error('[AuditService] loginSuccess audit failed:', err.message);
    }
  }

  async loginFailure({ email, ip, userAgent, reason = 'Incorrect credentials' }) {
    try {
      await publishEvent(EVENTS.SECURITY_ALERT, {
        email,
        action: 'LOGIN_FAILED',
        reason,
        ip,
        userAgent,
      });

      await logAuditEvent({
        action: 'LOGIN_FAILED',
        entityType: 'USER',
        ipAddress: ip,
        userAgent,
        newValue: { email, reason },
      });
    } catch (err) {
      console.error('[AuditService] loginFailure audit failed:', err.message);
    }
  }

  async passwordReset({ user, ip }) {
    try {
      await publishEvent(EVENTS.SECURITY_ALERT, {
        email: user.email,
        action: 'PASSWORD_RESET',
        ip,
      });
    } catch (err) {
      console.error('[AuditService] passwordReset audit failed:', err.message);
    }
  }

  async userRegistered({ user }) {
    try {
      await publishEvent(EVENTS.USER_WELCOME, {
        email: user.email,
        name: user.fullName || user.name,
      });
    } catch (err) {
      console.error('[AuditService] userRegistered audit failed:', err.message);
    }
  }

  async suspiciousActivity({ type, value, reason }) {
    try {
      await publishEvent(EVENTS.SUSPICIOUS_ACTIVITY, {
        type,
        value,
        reason,
      });
    } catch (err) {
      console.error('[AuditService] suspiciousActivity audit failed:', err.message);
    }
  }
}

module.exports = new AuditService();
