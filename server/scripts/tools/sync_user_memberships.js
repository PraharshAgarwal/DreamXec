const prisma = require('./src/config/prisma');

async function sync() {
  const user = await prisma.user.findFirst({
    where: { email: 'jaynrk2002@gmail.com' }
  });

  if (!user) {
    console.error('User not found!');
    return;
  }

  const instances = await prisma.workflowInstance.findMany({
    where: { applicantId: user.id }
  });

  console.log(`Found ${instances.length} workflow instances for user ${user.email}`);

  for (const inst of instances) {
    const role = inst.instanceData?.selectedRole;
    if (role && inst.tenantId) {
      try {
        const roleEnum = role.toUpperCase();
        await prisma.membership.upsert({
          where: {
            userId_organizationId_role: {
              userId: user.id,
              organizationId: inst.tenantId,
              role: roleEnum
            }
          },
          update: { status: 'ACTIVE' },
          create: {
            userId: user.id,
            organizationId: inst.tenantId,
            role: roleEnum,
            status: 'ACTIVE',
            joinedAt: new Date()
          }
        });
        console.log(`✅ Provisioned membership: ${roleEnum} in Org ${inst.tenantId}`);
      } catch (err) {
        console.error(`❌ Failed to provision ${role}:`, err.message);
      }
    }
  }

  const finalMemberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: { organization: true }
  });

  console.log(`\n🎉 Total active memberships now for user: ${finalMemberships.length}`);
  for (const m of finalMemberships) {
    console.log(`- Role: ${m.role} | Org: ${m.organization?.name} (${m.organizationId})`);
  }

  await prisma.$disconnect();
}

sync().catch(console.error);
