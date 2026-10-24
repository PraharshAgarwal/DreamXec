const prisma = require('../config/prisma');

async function seedClubs() {
  console.log('--- SEEDING SAMPLE CLUBS ---');

  // Find or verify NIT KKr college organization
  let nitKkr = await prisma.organization.findFirst({
    where: {
      OR: [
        { id: '9c297f57-d379-4c80-bcc1-6e4fa389d286' },
        { slug: 'nit-kkr' },
      ],
    },
  });

  if (!nitKkr) {
    console.log('Creating NIT KKr organisation...');
    nitKkr = await prisma.organization.create({
      data: {
        id: '9c297f57-d379-4c80-bcc1-6e4fa389d286',
        name: 'NIT KKr',
        slug: 'nit-kkr',
        orgType: 'COLLEGE',
        depth: 0,
        hierarchyPath: 'nit-kkr',
        lifecycleStatus: 'ACTIVE',
        allowedRoles: ['STUDENT', 'ORG_ADMIN', 'PROFESSOR', 'RESEARCHER', 'STUDENT_PRESIDENT'],
      },
    });
  }

  const sampleClubs = [
    // 1. Enrolled Campus Clubs under NIT KKr
    {
      name: 'NIT Kurukshetra Robotics & Autonomous Systems Club',
      slug: 'nitkkr-robotics-club',
      orgType: 'CLUB',
      parentId: nitKkr.id,
      depth: 1,
      hierarchyPath: `${nitKkr.slug}.nitkkr-robotics-club`,
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT'],
    },
    {
      name: 'NIT KKr Quantum Computing & AI Guild',
      slug: 'nitkkr-quantum-ai-guild',
      orgType: 'CLUB',
      parentId: nitKkr.id,
      depth: 1,
      hierarchyPath: `${nitKkr.slug}.nitkkr-quantum-ai-guild`,
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT'],
    },
    // 2. Open & Independent Clubs (parentId = null)
    {
      name: 'All-India Open Aerospace & Rocketry Collective',
      slug: 'open-aerospace-rocketry',
      orgType: 'CLUB',
      parentId: null,
      depth: 0,
      hierarchyPath: 'open-aerospace-rocketry',
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
    },
    {
      name: 'Indie Biotech & CleanTech Innovation Lab',
      slug: 'indie-biotech-cleantech',
      orgType: 'CLUB',
      parentId: null,
      depth: 0,
      hierarchyPath: 'indie-biotech-cleantech',
      lifecycleStatus: 'ACTIVE',
      allowedRoles: ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'],
    },
  ];

  for (const c of sampleClubs) {
    const existing = await prisma.organization.findUnique({
      where: { slug: c.slug },
    });

    if (!existing) {
      const created = await prisma.organization.create({ data: c });
      console.log(`✓ Created club: ${created.name} (${created.parentId ? 'Campus Affiliated: ' + nitKkr.name : 'Open / Independent'})`);
    } else {
      const updated = await prisma.organization.update({
        where: { id: existing.id },
        data: {
          parentId: c.parentId,
          name: c.name,
          lifecycleStatus: 'ACTIVE',
        },
      });
      console.log(`• Updated existing club: ${updated.name}`);
    }
  }

  console.log('--- SEEDING CLUBS FINISHED SUCCESSFULLY ---');
  await prisma.$disconnect();
}

seedClubs().catch(async (err) => {
  console.error('Seed clubs error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
