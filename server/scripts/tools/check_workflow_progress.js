const prisma = require('./src/config/prisma');

async function checkStages() {
  const instances = await prisma.workflowInstance.findMany({
    where: { applicantEmail: 'jaynrk2002@gmail.com' },
    include: {
      template: {
        include: {
          stages: { orderBy: { executionOrder: 'asc' } }
        }
      },
      submissions: true,
      executions: true
    }
  });

  for (const inst of instances) {
    console.log(`\n========================================`);
    console.log(`INSTANCE ID: ${inst.id}`);
    console.log(`Role: ${inst.instanceData?.selectedRole}`);
    console.log(`Org: ${inst.instanceData?.selectedOrgName}`);
    console.log(`Status: ${inst.status}`);
    console.log(`Current Stage ID: ${inst.currentStageId}`);
    console.log(`Stages Count: ${inst.template?.stages?.length}`);
    for (const s of (inst.template?.stages || [])) {
      const exec = inst.executions.find(e => e.stageId === s.id);
      console.log(`  - Stage ${s.executionOrder}: [${s.stageType}] "${s.name}" -> Status: ${exec ? exec.status : 'NOT_STARTED'}`);
    }
  }
  await prisma.$disconnect();
}

checkStages().catch(console.error);
