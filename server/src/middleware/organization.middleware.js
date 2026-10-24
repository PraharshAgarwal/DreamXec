const prisma = require('../config/prisma');
const redis = require('../config/redis');

// Two-tier cache: L1 in-process Map (15s) + L2 Redis (60s)
const membershipCache = new Map();
const L1_CACHE_TTL_MS = 15 * 1000;
const L2_REDIS_TTL_SEC = 60;
const MAX_CACHE_ENTRIES = 5000;

function setCachedMemberships(userId, data) {
  if (membershipCache.size >= MAX_CACHE_ENTRIES) {
    // Evict oldest entry (FIFO using Map iteration)
    const oldestKey = membershipCache.keys().next().value;
    if (oldestKey) membershipCache.delete(oldestKey);
  }
  membershipCache.set(userId, data);
}

/**
 * Extracts organization ID cleanly from request params, query, body, or headers,
 * preventing duplicated extraction logic.
 */
function getOrganizationId(req) {
  if (!req) return null;
  return (
    req.params?.organizationId ||
    req.params?.orgId ||
    req.query?.organizationId ||
    req.query?.orgId ||
    req.body?.organizationId ||
    req.body?.orgId ||
    req.headers['x-organization-id'] ||
    req.headers['x-tenant-id'] ||
    req.user?.activeTenantId ||
    null
  );
}

/**
 * Dynamically loads organization memberships from DB / cache.
 * Avoids relying on stale JWT orgRoles claims.
 */
async function loadUserOrgMemberships(userId) {
  if (!userId) return [];

  const now = Date.now();
  // 1. Check L1 in-memory cache
  const cachedL1 = membershipCache.get(userId);
  if (cachedL1) {
    if (now - cachedL1.timestamp < L1_CACHE_TTL_MS) {
      return cachedL1.memberships;
    }
    membershipCache.delete(userId);
  }

  // 2. Check L2 Redis cache
  const redisKey = `dx:user:memberships:${userId}`;
  try {
    if (redis && redis.get) {
      const cachedL2 = await redis.get(redisKey);
      if (cachedL2) {
        const memberships = JSON.parse(cachedL2);
        setCachedMemberships(userId, { memberships, timestamp: now });
        return memberships;
      }
    }
  } catch (_) {}

  try {
    let memberships = [];
    if (prisma.membership) {
      const dbMemberships = await prisma.membership.findMany({
        where: { 
          userId,
          status: 'ACTIVE',
          organization: {
            lifecycleStatus: { in: ['ACTIVE', 'APPROVED'] }
          }
        },
        include: { organization: { select: { id: true, slug: true } } },
      });
      memberships = dbMemberships.map((m) => ({
        orgId: m.organizationId,
        organizationId: m.organizationId,
        role: m.role,
        slug: m.organization?.slug || null,
        organization: m.organization,
      }));
    } else if (prisma.userOrganization) {
      const dbMemberships = await prisma.userOrganization.findMany({
        where: { 
          userId,
          status: 'ACTIVE',
          organization: {
            lifecycleStatus: { in: ['ACTIVE', 'APPROVED'] }
          }
        },
        include: { organization: { select: { id: true, slug: true } } },
      });
      memberships = dbMemberships.map((m) => ({
        orgId: m.organizationId,
        organizationId: m.organizationId,
        role: m.role,
        slug: m.organization?.slug || null,
        organization: m.organization,
      }));
    }

    try {
      if (redis && redis.set) {
        await redis.set(redisKey, JSON.stringify(memberships), { EX: L2_REDIS_TTL_SEC });
      }
    } catch (_) {}

    setCachedMemberships(userId, { memberships, timestamp: now });
    return memberships;
  } catch (err) {
    console.error('[OrganizationMiddleware] Failed to load memberships:', err.message);
    return [];
  }
}

/**
 * Invalidates cached memberships for a user (e.g. on role change or removal).
 */
async function invalidateMembershipCache(userId) {
  if (userId) {
    membershipCache.delete(userId);
    try {
      if (redis && redis.del) {
        await redis.del(`dx:user:memberships:${userId}`);
      }
    } catch (_) {}
  }
}

module.exports = {
  getOrganizationId,
  loadUserOrgMemberships,
  invalidateMembershipCache,
};
