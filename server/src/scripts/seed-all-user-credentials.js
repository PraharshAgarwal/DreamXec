/**
 * Seed All User Credentials Script
 * Referenced in docs/USER_CREDENTIALS.md
 * 
 * Runs the Master Demo Seeder to ensure all accounts, clubs, workflows,
 * and credentials exist and are configured with Password@123.
 */

const seedMasterDemo = require('./seed-master-demo');

if (require.main === module) {
  seedMasterDemo()
    .then(() => {
      console.log('✅ seed-all-user-credentials completed successfully.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ seed-all-user-credentials failed:', err);
      process.exit(1);
    });
}

module.exports = seedMasterDemo;
