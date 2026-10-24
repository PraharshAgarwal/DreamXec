const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { PrismaClient, OrgType, OrgRole, Role, LifecycleStatus, MembershipStatus, AccountStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { DX_SYSTEM_ORG_SLUG } = require('../constants/orgRoles.constants');
const { PERMISSIONS, PERMISSION_MATRIX } = require('../permissions/matrix');

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const email = (args[0] || process.env.ADMIN_EMAIL || 'admin@dreamxec.com').toLowerCase().trim();
  const rawPassword = args[1] || process.env.ADMIN_PASSWORD || 'Admin@123456';
  const fullName = args[2] || 'Super Administrator';

  console.log(`🚀 Creating/Promoting SUPER_ADMIN account for: ${email}`);

  // 1. Seed Permissions & Role Permissions if missing
  console.log('📋 Verifying Permissions Matrix...');
  const permissionEntries = Object.entries(PERMISSIONS).map(([nameKey, permValue]) => ({
    key: permValue,
    name: nameKey.replace(/_/g, ' '),
    description: `Permission for ${permValue}`,
    category: permValue.split(':')[0].toUpperCase(),
  }));

  for (const entry of permissionEntries) {
    await prisma.permission.upsert({
      where: { key: entry.key },
      update: entry,
      create: entry,
    });
  }

  for (const [permKey, allowedRoles] of Object.entries(PERMISSION_MATRIX)) {
    for (const role of allowedRoles) {
      await prisma.rolePermission.upsert({
        where: {
          role_permissionKey: {
            role,
            permissionKey: permKey,
          },
        },
        update: {},
        create: {
          role,
          permissionKey: permKey,
        },
      });
    }
  }

  // 2. Create / Upsert DX Platform Governance Org
  console.log('🏢 Ensuring DreamXec Platform Governance Org exists...');
  const dxOrg = await prisma.organization.upsert({
    where: { slug: 'dreamxec' },
    update: {
      name: 'DreamXec Platform',
      lifecycleStatus: LifecycleStatus.ACTIVE,
    },
    create: {
      name: 'DreamXec Platform',
      slug: 'dreamxec',
      orgType: OrgType.CORPORATE,
      allowedRoles: [
        OrgRole.ORG_ADMIN,
        OrgRole.COMPLIANCE_OFFICER,
        OrgRole.CORPORATE_ADMIN,
        OrgRole.DONOR,
        OrgRole.MENTOR,
      ],
      hierarchyPath: 'dreamxec',
      depth: 0,
      lifecycleStatus: LifecycleStatus.ACTIVE,
    },
  });

  // 3. Create or Update Super Admin User
  console.log('👤 Upserting Super Admin User...');
  const passwordHash = await bcrypt.hash(rawPassword, 10);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  let user;
  if (existingUser) {
    user = await prisma.user.update({
      where: { email },
      data: {
        role: Role.SUPER_ADMIN,
        accountStatus: AccountStatus.ACTIVE,
        fullName: existingUser.fullName || fullName,
        ...(rawPassword ? { passwordHash } : {}),
        profileMetadata: {
          ...(existingUser.profileMetadata || {}),
          isAdmin: true,
          isSuperAdmin: true,
          isDxAdmin: true,
        },
      },
    });
    console.log(`   ✅ Existing user promoted to SUPER_ADMIN: ${user.email}`);
  } else {
    // Generate clean username
    const baseSlug = email.split('@')[0].replace(/[^a-z0-9]+/g, '_').slice(0, 30);
    let username = baseSlug;
    let counter = 1;
    while (await prisma.user.findUnique({ where: { username } })) {
      username = `${baseSlug}_${counter++}`;
    }

    user = await prisma.user.create({
      data: {
        email,
        fullName,
        username,
        passwordHash,
        role: Role.SUPER_ADMIN,
        accountStatus: AccountStatus.ACTIVE,
        profileMetadata: {
          isAdmin: true,
          isSuperAdmin: true,
          isDxAdmin: true,
        },
      },
    });
    console.log(`   ✅ New SUPER_ADMIN user created: ${user.email} (Username: ${user.username})`);
  }

  // 4. Link ORG_ADMIN membership in DX Governance Org
  await prisma.membership.upsert({
    where: {
      userId_organizationId_role: {
        userId: user.id,
        organizationId: dxOrg.id,
        role: OrgRole.ORG_ADMIN,
      },
    },
    update: {
      status: MembershipStatus.ACTIVE,
      designation: 'Super Administrator & Platform Lead',
    },
    create: {
      userId: user.id,
      organizationId: dxOrg.id,
      role: OrgRole.ORG_ADMIN,
      designation: 'Super Administrator & Platform Lead',
      status: MembershipStatus.ACTIVE,
    },
  });

  console.log('\n🎉 SUPER_ADMIN successfully configured!');
  console.log('--------------------------------------------------');
  console.log(`Email:       ${user.email}`);
  console.log(`Password:    ${rawPassword}`);
  console.log(`System Role: ${user.role}`);
  console.log(`Org Role:    ORG_ADMIN in ${dxOrg.name}`);
  console.log('--------------------------------------------------');
}

main()
  .catch((err) => {
    console.error('❌ Failed to create super admin:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
