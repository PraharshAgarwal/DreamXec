const prisma = require('../config/prisma');
const { generateUniqueUsername } = require('../utils/username-generator');

async function backfillUsernames() {
  console.log('🔄 Backfilling unique usernames for existing users...');
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: null },
        { username: '' },
      ],
    },
    select: {
      id: true,
      fullName: true,
      email: true,
    },
  });

  console.log(`Found ${users.length} users requiring unique usernames.`);

  for (const user of users) {
    const username = await generateUniqueUsername(user.fullName, user.id);
    await prisma.user.update({
      where: { id: user.id },
      data: { username },
    });
    console.log(`   ✅ User "${user.fullName}" (${user.email}) assigned handle: @${username}`);
  }

  console.log('🎉 Username backfill completed successfully!');
}

backfillUsernames()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Backfill failed:', err);
    process.exit(1);
  });
