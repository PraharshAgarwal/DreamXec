const { PrismaClient, OrgType, OrgRole, Role, LifecycleStatus, MembershipStatus, AccountStatus } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const redis = require('../config/redis');

const DEFAULT_PASSWORD = 'Password@123';

async function main() {
  console.log('================================================================');
  console.log('🏛️  SETTING UP "NIT KKR" WITH STUDENT, MENTOR & ORG-ADMIN ROLES');
  console.log('================================================================\n');

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

  // 1. Find or create the primary NIT KKR organization
  let org = await prisma.organization.findFirst({
    where: {
      OR: [
        { id: '9c297f57-d379-4c80-bcc1-6e4fa389d286' },
        { slug: 'nit-kkr' },
      ],
    },
  });

  const targetRoles = [
    OrgRole.STUDENT,
    OrgRole.MENTOR,
    OrgRole.ORG_ADMIN,
    OrgRole.PROFESSOR,
    OrgRole.RESEARCHER,
    OrgRole.STUDENT_PRESIDENT,
  ];

  const orgMetadata = {
    fullName: 'Vellore Institute of Technology, Chennai',
    shortName: 'NIT KKR',
    aliases: ['nit kkr', 'nit-kkr', 'nit kurukshetra', 'Vellore Institute of Technology, Chennai'],
    domain: 'vit.ac.in',
    website: 'https://chennai.vit.ac.in',
    location: 'Vandalur-Kelambakkam Road, Chennai, Tamil Nadu, India',
    established: 1963,
    accreditation: 'NIRF Tier-1 Institute of National Importance',
  };

  if (!org) {
    org = await prisma.organization.create({
      data: {
        id: '9c297f57-d379-4c80-bcc1-6e4fa389d286',
        name: 'NIT KKR',
        slug: 'nit-kkr',
        orgType: OrgType.COLLEGE,
        depth: 0,
        hierarchyPath: 'nit-kkr',
        lifecycleStatus: LifecycleStatus.ACTIVE,
        allowedRoles: targetRoles,
        metadata: orgMetadata,
      },
    });
    console.log(`✅ Created Organization: "${org.name}" (slug: ${org.slug}, id: ${org.id})`);
  } else {
    org = await prisma.organization.update({
      where: { id: org.id },
      data: {
        name: 'NIT KKR',
        lifecycleStatus: LifecycleStatus.ACTIVE,
        allowedRoles: targetRoles,
        metadata: orgMetadata,
      },
    });
    console.log(`✅ Updated Organization name to: "${org.name}" (slug: ${org.slug}, id: ${org.id})`);
  }

  console.log(`   Allowed roles: ${JSON.stringify(org.allowedRoles)}\n`);

  // 2. Ensure Users with STUDENT, MENTOR, and ORG-ADMIN roles
  const usersToConfigure = [
    {
      email: 'student.nitkkr@dreamxec.com',
      fullName: 'NIT KKR Student Lead',
      username: 'student_nitkkr',
      role: Role.USER,
      orgRole: OrgRole.STUDENT,
      designation: 'Undergraduate Researcher',
      department: 'Computer Science & Engineering',
    },
    {
      email: 'mentor.nitkkr@dreamxec.com',
      fullName: 'NIT KKR Faculty Mentor',
      username: 'mentor_nitkkr',
      role: Role.USER,
      orgRole: OrgRole.MENTOR,
      designation: 'Senior Faculty Guide & Project Mentor',
      department: 'Robotics & Automation',
    },
    {
      email: 'admin.nitkkr@dreamxec.com',
      fullName: 'NIT KKR Institutional Administrator',
      username: 'admin_nitkkr',
      role: Role.ADMIN,
      orgRole: OrgRole.ORG_ADMIN,
      designation: 'Dean of Academic Research & Institutional Admin',
      department: 'Office of the Dean',
    },
    // Also cross-link existing institutional accounts
    {
      email: 'aarav.sharma@vit.ac.in',
      fullName: 'Aarav Sharma',
      username: 'aarav_sharma',
      role: Role.USER,
      orgRole: OrgRole.STUDENT,
      designation: 'Student Project Lead',
      department: 'Mechanical Engineering',
    },
    {
      email: 'vikram.mentor@vit.ac.in',
      fullName: 'Vikram Aditya',
      username: 'vikram_aditya',
      role: Role.USER,
      orgRole: OrgRole.MENTOR,
      designation: 'Industry & Academic Mentor',
      department: 'Aerospace & Robotics',
    },
    {
      email: 'registrar@vit.ac.in',
      fullName: 'Dean & Registrar Admin',
      username: 'registrar_nitkkr',
      role: Role.USER,
      orgRole: OrgRole.ORG_ADMIN,
      designation: 'Registrar & Head of Grants',
      department: 'Institutional Governance',
    },
  ];

  // Also include developer/user account jaynrk2002@gmail.com for active access across roles
  const devUser = await prisma.user.findFirst({
    where: { email: { equals: 'jaynrk2002@gmail.com', mode: 'insensitive' } },
  });

  for (const item of usersToConfigure) {
    let user = await prisma.user.findUnique({
      where: { email: item.email },
    });

    if (!user) {
      // Check username collision
      let finalUsername = item.username;
      const existingUserByUsername = await prisma.user.findUnique({
        where: { username: finalUsername },
      });
      if (existingUserByUsername) {
        finalUsername = `${item.username}_${Date.now().toString().slice(-4)}`;
      }

      user = await prisma.user.create({
        data: {
          email: item.email,
          fullName: item.fullName,
          username: finalUsername,
          passwordHash,
          role: item.role,
          accountStatus: AccountStatus.ACTIVE,
          isKycVerified: true,
          profileMetadata: {
            title: item.designation,
            department: item.department,
            organizationName: org.name,
            organizationSlug: org.slug,
          },
        },
      });
      console.log(`👤 Created user: ${user.fullName} <${user.email}>`);
    } else {
      // Ensure password and active status
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          accountStatus: AccountStatus.ACTIVE,
          passwordHash, // Reset to standard test password for easy access
        },
      });
      console.log(`👤 Updated user: ${user.fullName} <${user.email}>`);
    }

    // Upsert Active Membership
    const membership = await prisma.membership.upsert({
      where: {
        userId_organizationId_role: {
          userId: user.id,
          organizationId: org.id,
          role: item.orgRole,
        },
      },
      update: {
        status: MembershipStatus.ACTIVE,
        designation: item.designation,
        department: item.department,
        joinedAt: new Date(),
      },
      create: {
        userId: user.id,
        organizationId: org.id,
        role: item.orgRole,
        status: MembershipStatus.ACTIVE,
        designation: item.designation,
        department: item.department,
        joinedAt: new Date(),
      },
    });

    console.log(`   🔗 Assigned Active Role: [${item.orgRole}] in "${org.name}" (membershipId: ${membership.id})`);
  }

  // 3. Link devUser (jaynrk2002@gmail.com) with active roles in NIT KKR
  if (devUser) {
    console.log(`\n👨‍💻 Configuring dev user: ${devUser.fullName} <${devUser.email}>`);
    for (const devRole of [OrgRole.STUDENT, OrgRole.MENTOR, OrgRole.ORG_ADMIN]) {
      const devMembership = await prisma.membership.upsert({
        where: {
          userId_organizationId_role: {
            userId: devUser.id,
            organizationId: org.id,
            role: devRole,
          },
        },
        update: {
          status: MembershipStatus.ACTIVE,
          joinedAt: new Date(),
        },
        create: {
          userId: devUser.id,
          organizationId: org.id,
          role: devRole,
          status: MembershipStatus.ACTIVE,
          joinedAt: new Date(),
        },
      });
      console.log(`   🔗 Dev User Active Role: [${devRole}] in "${org.name}" (membershipId: ${devMembership.id})`);
    }
  }

  // 4. Invalidate Redis Caches so UI and API instantly serve fresh data
  console.log('\n🧹 Clearing Redis organization and governance caches...');
  try {
    if (redis && redis.isOpen) {
      const keysToClear = [
        'dx:gov:all_orgs:false',
        'dx:gov:all_orgs:true',
        'dx:wf:orgs:*',
        'dx:org:*',
      ];

      for (const pattern of keysToClear) {
        if (pattern.includes('*')) {
          const matchingKeys = await redis.keys(pattern);
          if (matchingKeys.length > 0) {
            await redis.del(matchingKeys);
            console.log(`   Deleted ${matchingKeys.length} keys matching "${pattern}"`);
          }
        } else {
          await redis.del(pattern);
          console.log(`   Deleted key "${pattern}"`);
        }
      }
    }
  } catch (redisErr) {
    console.warn('   Redis cache clean notice:', redisErr.message);
  }

  // 5. Verification summary
  const finalOrg = await prisma.organization.findUnique({
    where: { id: org.id },
    include: {
      memberships: {
        where: { status: MembershipStatus.ACTIVE },
        include: {
          user: {
            select: { id: true, email: true, fullName: true },
          },
        },
      },
    },
  });

  console.log('\n================================================================');
  console.log('🎉 SETUP COMPLETE! NIT KKR VERIFICATION SUMMARY');
  console.log('================================================================');
  console.log(`Organization Name : ${finalOrg.name}`);
  console.log(`Organization Slug : ${finalOrg.slug}`);
  console.log(`Allowed Roles     : ${JSON.stringify(finalOrg.allowedRoles)}`);
  console.log(`Active Memberships: ${finalOrg.memberships.length}`);
  for (const m of finalOrg.memberships) {
    console.log(`  - Role: ${m.role.padEnd(10)} | User: ${m.user.fullName} <${m.user.email}>`);
  }
  console.log('================================================================\n');

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Fatal error during setup:', err);
  process.exit(1);
});
