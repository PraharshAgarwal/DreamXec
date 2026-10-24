const prisma = require('./src/config/prisma');

async function check() {
  const user = await prisma.user.findFirst({
    where: { email: 'jaynrk2002@gmail.com' }
  });
  console.log('USER:', user?.id, user?.email);
  if (user) {
    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
      include: { organization: true }
    });
    console.log('MEMBERSHIPS COUNT:', memberships.length);
    console.log('MEMBERSHIPS:', JSON.stringify(memberships, null, 2));

    const instances = await prisma.workflowInstance.findMany({
      where: { applicantId: user.id }
    });
    console.log('WORKFLOW INSTANCES FOR USER:', JSON.stringify(instances, null, 2));
  }
  await prisma.$disconnect();
}

check().catch(console.error);
