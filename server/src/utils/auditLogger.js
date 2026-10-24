const prisma = require('../config/prisma');

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

function ensureUuid(val) {
  if (val && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val)) {
    return val;
  }
  return NIL_UUID;
}

/**
 * Centralized Audit Logger for security compliance & RBAC event auditing (Milestone M1 - B7).
 * Immutably logs security actions, authentication events, and role updates.
 */
let cachedDefaultTenantId = null;

async function logAuditEvent({
  action,
  entityType = 'USER',
  entityId,
  performedBy,
  userId,
  tenantId,
  ipAddress = null,
  userAgent = null,
  oldValue = null,
  newValue = null,
  details = {},
  tx = null,
}) {
  try {
    const client = tx || prisma;
    const effectiveUserId = userId || performedBy;
    const safeUserId = effectiveUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(effectiveUserId)
      ? effectiveUserId
      : null;

    let safeTenantId = ensureUuid(tenantId);
    if (safeTenantId === NIL_UUID) {
      if (!cachedDefaultTenantId) {
        const defaultOrg = await client.organization.findFirst({ select: { id: true } }).catch(() => null);
        if (defaultOrg?.id) cachedDefaultTenantId = defaultOrg.id;
      }
      if (cachedDefaultTenantId) safeTenantId = cachedDefaultTenantId;
    }

    const safeEntityId = ensureUuid(entityId || effectiveUserId);

    if (client.auditEvent) {
      const writePromise = client.auditEvent.create({
        data: {
          action: String(action || 'SECURITY_ACTION').slice(0, 100),
          entityType: String(entityType || 'SYSTEM').slice(0, 100),
          entityId: safeEntityId,
          tenantId: safeTenantId,
          userId: safeUserId,
          ipAddress: ipAddress ? String(ipAddress).slice(0, 45) : null,
          userAgent: userAgent ? String(userAgent).slice(0, 500) : null,
          oldValue: oldValue || null,
          newValue: newValue || (Object.keys(details).length > 0 ? details : null),
        },
      }).catch((err) => {
        console.warn('[AuditLogger] Failed to write audit log event:', err.message);
      });

      if (tx) {
        return await writePromise;
      }
      return true;
    }
  } catch (err) {
    console.warn('[AuditLogger] Failed to write audit log event:', err.message);
  }
}

module.exports = {
  logAuditEvent,
  ensureUuid,
};
