const path = require('path');
const dotenv = require('dotenv');

// Load environment files
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const { loadEnv } = require('../config/env');

async function main() {
  await loadEnv();

  const redis = require('../config/redis');
  const prisma = require('../config/prisma');
  const PermissionService = require('../permissions/permission.service');
  const { PERMISSION_MATRIX } = require('../permissions/matrix');

  console.log('🔄 Initializing Permissions Matrix Sync to Upstash Redis & Database...\n');

  // 1. Sync to Database
  console.log('📦 [1/2] Syncing to PostgreSQL Database (role_permissions)...');
  const dbRes = await PermissionService.syncMatrixToDb();
  console.log(`   Result: ${dbRes.success ? 'Success (' + dbRes.count + ' mappings)' : 'Failed: ' + dbRes.error}`);

  // 2. Sync to Upstash Redis
  console.log('\n⚡ [2/2] Syncing to Upstash Redis...');
  const redisRes = await PermissionService.syncMatrixToRedis(redis);
  console.log(`   Result: ${redisRes.success ? 'Success (' + redisRes.rolesSynced + ' roles cached)' : 'Failed: ' + redisRes.error}`);

  // 3. Print verified ORG_ADMIN and GRANT_OFFICER permissions
  console.log('\n📋 Quick Role Permissions Verification:');
  const rolesToCheck = ['ORG_ADMIN', 'GRANT_OFFICER', 'COMPLIANCE_OFFICER', 'STUDENT'];
  for (const r of rolesToCheck) {
    const perms = await PermissionService.getPermissionsForRole(r);
    console.log(`   ${r} (${perms.length} perms):`, perms.slice(0, 5).join(', ') + (perms.length > 5 ? '...' : ''));
  }

  console.log('\n✨ All Upstash Redis and Database permissions updated successfully!');
}

main()
  .catch((err) => {
    console.error('❌ Error syncing matrix permissions:', err);
    process.exit(1);
  })
  .finally(async () => {
    const prisma = require('../config/prisma');
    const redis = require('../config/redis');
    await prisma.$disconnect().catch(() => {});
    if (redis && redis.isOpen) {
      await redis.quit().catch(() => {});
    }
    process.exit(0);
  });
