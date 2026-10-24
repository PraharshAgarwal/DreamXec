const prisma = require('./src/config/prisma');

async function cleanDuplicates() {
  const instances = await prisma.workflowInstance.findMany({
    include: {
      submissions: true,
      executions: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const seenKeys = new Set();
  const duplicateIds = [];

  for (const inst of instances) {
    const role = (inst.instanceData?.selectedRole || inst.instanceData?.role || 'UNKNOWN').toUpperCase();
    const email = (inst.applicantEmail || 'NO_EMAIL').toLowerCase();
    const org = inst.tenantId;

    const key = `${org}:${email}:${role}`;

    if (seenKeys.has(key)) {
      // If duplicate instance has no stage submissions, mark for deletion
      if (!inst.submissions || inst.submissions.length === 0) {
        duplicateIds.push(inst.id);
      }
    } else {
      seenKeys.add(key);
    }
  }

  console.log(`Found ${duplicateIds.length} duplicate instances to clean up:`, duplicateIds);

  for (const id of duplicateIds) {
    await prisma.stageExecution.deleteMany({ where: { workflowInstanceId: id } }).catch(() => {});
    await prisma.workflowInstance.delete({ where: { id } }).catch((e) => console.warn(`Could not delete ${id}:`, e.message));
  }

  console.log('✅ Cleanup finished.');
  await prisma.$disconnect();
}

cleanDuplicates().catch(console.error);
