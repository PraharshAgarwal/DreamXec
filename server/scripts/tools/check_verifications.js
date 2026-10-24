const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const v = await prisma.verification.findMany({
    include: {
      instance: true
    }
  });
  console.log(JSON.stringify(v, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
