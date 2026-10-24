const prisma = require('./src/config/prisma');

async function main() {
  const orgs = await prisma.organization.findMany();
  console.log('--- ALL ORGANIZATIONS IN DB ---');
  for (const o of orgs) {
    console.log(`- ${o.name} | ID: ${o.id} | Slug: ${o.slug} | Type: ${o.type}`);
  }
  await prisma.$disconnect();
}

main().catch(console.error);
