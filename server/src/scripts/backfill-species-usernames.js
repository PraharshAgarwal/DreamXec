const prisma = require('../config/prisma');
const speciesIdentityService = require('../modules/species/services/species-identity.service');

async function backfillSpeciesUsernames() {
  console.log('🔄 Updating users with fun endangered species avatars...');

  const users = await prisma.user.findMany({
    where: {
      speciesId: { not: null },
    },
    include: {
      assignedSpecies: true,
    },
  });

  console.log(`Found ${users.length} users with assigned species.`);

  for (const user of users) {
    const avatarUrl = user.assignedSpecies?.avatarUrl || `/api/species/${user.assignedSpecies?.slug || 'animal'}/avatar.svg`;
    const meta = (typeof user.profileMetadata === 'object' && user.profileMetadata !== null)
      ? { ...user.profileMetadata }
      : {};

    meta.profilePicture = avatarUrl;
    meta.avatarUrl = avatarUrl;
    if (meta.speciesIdentity) {
      meta.speciesIdentity.avatarUrl = avatarUrl;
      meta.speciesIdentity.thumbnailUrl = avatarUrl;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        profileMetadata: meta,
      },
    });

    console.log(`   ✅ Updated user "${user.fullName}" with fun avatar: ${avatarUrl}`);
  }

  console.log('🎉 Fun avatar backfill complete!');
}

backfillSpeciesUsernames()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
  });
