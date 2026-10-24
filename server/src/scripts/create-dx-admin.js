const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const { PrismaClient, OrgType, OrgRole, Role, LifecycleStatus, MembershipStatus, AccountStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { DX_SYSTEM_ORG_SLUG } = require('../constants/orgRoles.constants');
const { PERMISSIONS, PERMISSION_MATRIX } = require('../permissions/matrix');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Setting up DX Platform Org, Permissions, and Org Admin account...');

  // 1. Seed Permissions Table
  console.log('📋 Seeding Permissions...');
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

  // 2. Seed RolePermissions Table
  console.log('🔑 Seeding Role Permissions...');
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

  // 3. Create / Upsert DX Platform Organization
  console.log('🏢 Creating DX Platform Organization...');
  const dxOrg = await prisma.organization.upsert({
    where: { slug: DX_SYSTEM_ORG_SLUG },
    update: {
      name: 'DX Platform Governance',
      orgType: OrgType.CORPORATE,
      allowedRoles: [
        OrgRole.ORG_ADMIN,
        OrgRole.COMPLIANCE_OFFICER,
        OrgRole.CORPORATE_ADMIN,
        OrgRole.DONOR,
        OrgRole.MENTOR,
      ],
      hierarchyPath: 'dx_platform_org',
      depth: 0,
      lifecycleStatus: LifecycleStatus.ACTIVE,
    },
    create: {
      name: 'DX Platform Governance',
      slug: DX_SYSTEM_ORG_SLUG,
      orgType: OrgType.CORPORATE,
      allowedRoles: [
        OrgRole.ORG_ADMIN,
        OrgRole.COMPLIANCE_OFFICER,
        OrgRole.CORPORATE_ADMIN,
        OrgRole.DONOR,
        OrgRole.MENTOR,
      ],
      hierarchyPath: 'dx_platform_org',
      depth: 0,
      lifecycleStatus: LifecycleStatus.ACTIVE,
    },
  });

  console.log(`   ✅ DX Org: ${dxOrg.name} (${dxOrg.id})`);

  // 4. Create Org Admin User Account
  console.log('👤 Creating Org Admin User Account...');
  const passwordHash = await bcrypt.hash('Password@123', 10);
  const adminEmail = 'dx.admin@dreamxec.com';

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      fullName: 'DX Platform Admin',
      passwordHash,
      role: Role.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      profileMetadata: {
        bio: 'DX Platform Super Admin & Governance Lead with all permissions',
        isDxAdmin: true,
        isAdmin: true,
      },
    },
    create: {
      email: adminEmail,
      fullName: 'DX Platform Admin',
      passwordHash,
      role: Role.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      profileMetadata: {
        bio: 'DX Platform Super Admin & Governance Lead with all permissions',
        isDxAdmin: true,
        isAdmin: true,
      },
    },
  });

  console.log(`   ✅ Admin User: ${user.email} (${user.id})`);

  // 5. Create / Upsert Org Admin Membership in DX Org
  console.log('🎟️ Creating Org Admin Membership in DX Org...');
  const membership = await prisma.membership.upsert({
    where: {
      userId_organizationId_role: {
        userId: user.id,
        organizationId: dxOrg.id,
        role: OrgRole.ORG_ADMIN,
      },
    },
    update: {
      designation: 'Platform Administrator & Governance Lead',
      status: MembershipStatus.ACTIVE,
    },
    create: {
      userId: user.id,
      organizationId: dxOrg.id,
      role: OrgRole.ORG_ADMIN,
      designation: 'Platform Administrator & Governance Lead',
      status: MembershipStatus.ACTIVE,
    },
  });

  console.log(`   ✅ Membership created: ${membership.role} in ${dxOrg.name}`);
  console.log('\n🎉 Setup complete! Org Admin account is ready with all permissions.');
  console.log('--------------------------------------------------');
  console.log(`Email:    ${user.email}`);
  console.log(`Password: Password@123`);
  console.log(`Role:     ${user.role}`);
  console.log(`Org Role: ${membership.role}`);
  console.log(`Org:      ${dxOrg.name} (${dxOrg.slug})`);
  console.log('--------------------------------------------------');
}

main()
  .catch((err) => {
    console.error('❌ Error executing setup:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
