const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.workflowTemplate.findMany({
    include: {
      organization: { select: { name: true, slug: true } },
      stages: {
        orderBy: { executionOrder: 'asc' }
      }
    }
  });
  const fs = require('fs');
  fs.writeFileSync('all_templates.json', JSON.stringify(templates, null, 2), 'utf8');
  console.log(`Saved ${templates.length} templates.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
