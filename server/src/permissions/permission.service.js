const prisma = require('../config/prisma');
const redis = require('../config/redis');
const { PERMISSIONS, PERMISSION_MATRIX, ROLES, ORG_ROLES } = require('./matrix');

/**
 * Service to manage DB and Upstash Redis-driven Permissions & RolePermissions
 */
class PermissionService {
  /**
   * Syncs latest PERMISSION_MATRIX to Upstash Redis.
   * Caches by-role mappings, full matrix, and clears stale user auth session caches.
   */
  static async syncMatrixToRedis(client = redis) {
    try {
      if (!client) {
        console.warn('[PermissionService] Redis client not initialized; skipping Upstash sync.');
        return { success: false, reason: 'Redis not initialized' };
      }

      const allRoles = Array.from(new Set([...Object.values(ROLES), ...Object.values(ORG_ROLES)]));
      const matrixByRole = {};

      // 1. Calculate permissions for each role and save to Upstash
      for (const role of allRoles) {
        const allowed = [];
        for (const [permKey, roles] of Object.entries(PERMISSION_MATRIX)) {
          if (Array.isArray(roles) && roles.includes(role)) {
            allowed.push(permKey);
          }
        }
        matrixByRole[role] = allowed;
        if (typeof client.set === 'function') {
          await client.set(`dx:permissions:role:${role}`, JSON.stringify(allowed));
        }
      }

      // 2. Store full matrix, catalog, and timestamp in Upstash
      if (typeof client.set === 'function') {
        await client.set('dx:permissions:matrix', JSON.stringify(PERMISSION_MATRIX));
        await client.set('dx:permissions:catalog', JSON.stringify(PERMISSIONS));
        await client.set('dx:permissions:by_role', JSON.stringify(matrixByRole));
        await client.set('dx:permissions:updated_at', new Date().toISOString());
      }

      // 3. Clear stale user auth caches and matrix cache middleware entries in Upstash
      if (typeof client.scanIterator === 'function') {
        const keysToDelete = [];
        try {
          for await (const key of client.scanIterator({ MATCH: 'dx:auth:user:*', COUNT: 100 })) {
            keysToDelete.push(key);
          }
          for await (const key of client.scanIterator({ MATCH: '*matrix*', COUNT: 100 })) {
            keysToDelete.push(key);
          }
          for await (const key of client.scanIterator({ MATCH: '*permissions*', COUNT: 100 })) {
            keysToDelete.push(key);
          }
        } catch (_) {}

        if (keysToDelete.length > 0 && typeof client.del === 'function') {
          await client.del(keysToDelete);
        }
      }

      console.log(`✅ [PermissionService] Successfully synced ${allRoles.length} roles to Upstash Redis.`);
      return { success: true, rolesSynced: allRoles.length, matrixByRole };
    } catch (error) {
      console.warn('[PermissionService] Upstash Redis sync notice:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Syncs latest PERMISSION_MATRIX definitions and role mappings into PostgreSQL DB tables.
   * Completely replaces stale mappings so revoked permissions are purged.
   */
  static async syncMatrixToDb() {
    try {
      // 1. Ensure all Permissions exist in catalog
      const permissionEntries = Object.entries(PERMISSIONS).map(([nameKey, permValue]) => ({
        key: permValue,
        name: nameKey.replace(/_/g, ' '),
        description: `Permission for ${permValue}`,
        category: permValue.split(':')[0].toUpperCase(),
      }));

      await prisma.permission.createMany({
        data: permissionEntries,
        skipDuplicates: true,
      });

      // 2. Build target mappings from current PERMISSION_MATRIX
      const rolePerms = [];
      for (const [permKey, allowedRoles] of Object.entries(PERMISSION_MATRIX)) {
        for (const role of allowedRoles) {
          rolePerms.push({
            role: role,
            permissionKey: permKey,
          });
        }
      }

      // 3. Clean up stale/revoked mappings from DB
      await prisma.rolePermission.deleteMany({});

      // 4. Batch insert clean mappings
      await prisma.rolePermission.createMany({
        data: rolePerms,
        skipDuplicates: true,
      });

      console.log(`✅ [PermissionService] Successfully synced ${rolePerms.length} DB role permissions.`);
      return { success: true, count: rolePerms.length };
    } catch (error) {
      console.warn('[PermissionService] DB Matrix sync warning:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convenience runner to sync both DB and Upstash Redis
   */
  static async syncAll() {
    const dbResult = await this.syncMatrixToDb();
    const redisResult = await this.syncMatrixToRedis();
    return { db: dbResult, redis: redisResult };
  }

  /**
   * Seeds initial permissions and role mappings on startup
   */
  static async seedPermissions() {
    await this.syncAll();
  }

  /**
   * Resolves all permissions assigned to a given role from Upstash Redis, DB, or static matrix.
   */
  static async getPermissionsForRole(role) {
    if (!role) return [];
    const roleUpper = String(role).toUpperCase();

    // 1. Try Upstash Redis fast-path
    try {
      if (redis && typeof redis.get === 'function') {
        const cached = await redis.get(`dx:permissions:role:${roleUpper}`);
        if (cached) {
          return JSON.parse(cached);
        }
      }
    } catch (_) {}

    // 2. Fallback to DB
    try {
      const mappings = await prisma.rolePermission.findMany({
        where: { role: roleUpper },
        select: { permissionKey: true },
      });

      if (mappings && mappings.length > 0) {
        const keys = mappings.map((m) => m.permissionKey);
        // Cache back to Upstash Redis asynchronously
        if (redis && typeof redis.set === 'function') {
          redis.set(`dx:permissions:role:${roleUpper}`, JSON.stringify(keys), { EX: 86400 }).catch(() => {});
        }
        return keys;
      }
    } catch (_) {}

    // 3. Fallback to static PERMISSION_MATRIX
    const staticPerms = [];
    for (const [permKey, allowedRoles] of Object.entries(PERMISSION_MATRIX)) {
      if (Array.isArray(allowedRoles) && allowedRoles.includes(roleUpper)) {
        staticPerms.push(permKey);
      }
    }

    // Cache back to Upstash Redis
    if (redis && typeof redis.set === 'function') {
      redis.set(`dx:permissions:role:${roleUpper}`, JSON.stringify(staticPerms), { EX: 86400 }).catch(() => {});
    }

    return staticPerms;
  }

  /**
   * Checks whether a role holds a specific permission via Upstash Redis, DB, or static matrix.
   */
  static async hasPermission(role, permissionKey) {
    if (!role || !permissionKey) return false;
    const permissions = await this.getPermissionsForRole(role);
    return permissions.includes(permissionKey);
  }
}

module.exports = PermissionService;
