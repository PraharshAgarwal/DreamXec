const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const inst = await prisma.workflowInstance.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      template: {
        include: {
          stages: {
            orderBy: { executionOrder: 'asc' }
          }
        }
      },
      currentStage: true
    }
  });
  console.log(JSON.stringify(inst, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
