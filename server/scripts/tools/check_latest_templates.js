const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.workflowTemplate.findMany({
    orderBy: { createdAt: 'desc' },
    take: 2,
    include: {
      stages: {
        orderBy: { executionOrder: 'asc' }
      }
    }
  });
  console.log(JSON.stringify(templates, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
