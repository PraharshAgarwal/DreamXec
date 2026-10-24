const prisma = require('../config/prisma');
const { ENDANGERED_SPECIES_DATA } = require('../modules/species/data/endangered-species.data');

async function seedEndangeredSpecies() {
  console.log(`🌱 Seeding ${ENDANGERED_SPECIES_DATA.length} Endangered Species into Database with Fun Avatars...`);

  let insertedCount = 0;
  let updatedCount = 0;

  for (const item of ENDANGERED_SPECIES_DATA) {
    // Construct vibrant, fun vector character avatar URL
    const funAvatarUrl = `/api/species/${item.slug}/avatar.svg`;
    const funThumbnailUrl = `/api/species/${item.slug}/avatar.svg`;

    const existing = await prisma.endangeredSpecies.findUnique({
      where: { slug: item.slug },
    });

    if (existing) {
      await prisma.endangeredSpecies.update({
        where: { slug: item.slug },
        data: {
          commonName: item.commonName,
          scientificName: item.scientificName,
          taxonomicGroup: item.taxonomicGroup,
          category: item.category,
          estimatedCount: item.estimatedCount,
          avatarUrl: funAvatarUrl,
          thumbnailUrl: funThumbnailUrl,
          habitat: item.habitat,
          region: item.region,
          description: item.description,
          isActive: true,
        },
      });
      updatedCount++;
    } else {
      await prisma.endangeredSpecies.create({
        data: {
          commonName: item.commonName,
          scientificName: item.scientificName,
          slug: item.slug,
          taxonomicGroup: item.taxonomicGroup,
          category: item.category,
          estimatedCount: item.estimatedCount,
          assignedCount: 0,
          avatarUrl: funAvatarUrl,
          thumbnailUrl: funThumbnailUrl,
          habitat: item.habitat,
          region: item.region,
          description: item.description,
          isActive: true,
        },
      });
      insertedCount++;
    }
  }

  console.log(`✅ Endangered Species Seeding Complete: ${insertedCount} created, ${updatedCount} updated.`);
}

seedEndangeredSpecies()
  .then(() => {
    console.log('🎉 Seed process finished.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  });
