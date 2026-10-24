const prisma = require('./src/config/prisma');

async function clearAllInstances() {
  console.log('🧹 Clearing all Workflow Instances and related execution data...');

  try {
    const deletedSubmissions = await prisma.stageSubmission.deleteMany({});
    console.log(`Deleted ${deletedSubmissions.count} StageSubmission records.`);

    const deletedExecutions = await prisma.stageExecution.deleteMany({});
    console.log(`Deleted ${deletedExecutions.count} StageExecution records.`);

    if (prisma.verification) {
      const deletedVerifications = await prisma.verification.deleteMany({});
      console.log(`Deleted ${deletedVerifications.count} Verification records.`);
    }

    const deletedInstances = await prisma.workflowInstance.deleteMany({});
    console.log(`✅ Successfully cleared all ${deletedInstances.count} WorkflowInstance records from the database.`);
  } catch (err) {
    console.error('❌ Failed to clear workflow instances:', err);
  } finally {
    await prisma.$disconnect();
  }
}

clearAllInstances();
