const speciesIdentityService = require('../modules/species/services/species-identity.service');
const prisma = require('../config/prisma');

/**
 * Generates an endangered species handle for a user.
 * Falls back to generic handle if database species table is inaccessible.
 * @param {string} [fullName]
 * @param {string} [excludeUserId] - If updating existing user
 * @returns {Promise<string>} Unique endangered species username
 */
async function generateUniqueUsername(fullName = '', excludeUserId = null) {
  try {
    const allocation = await speciesIdentityService.assignNextSpeciesIdentity();
    if (allocation && allocation.username) {
      const existing = await prisma.user.findUnique({
        where: { username: allocation.username },
        select: { id: true },
      });
      if (!existing || (excludeUserId && existing.id === excludeUserId)) {
        return allocation.username;
      }
    }
  } catch (err) {
    console.warn('[UsernameGenerator] Species assignment error, using fallback slug generator:', err.message);
  }

  let baseSlug = (fullName || 'innovator')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 30);

  if (!baseSlug || baseSlug.length < 2) {
    baseSlug = 'innovator';
  }

  let isUnique = false;
  let candidate = '';
  let attempts = 0;

  while (!isUnique && attempts < 20) {
    attempts++;
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    candidate = `${baseSlug}_${randomSuffix}`;

    const existing = await prisma.user.findFirst({
      where: {
        username: candidate,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) {
      isUnique = true;
    }
  }

  if (!isUnique) {
    candidate = `${baseSlug}_${Date.now().toString().slice(-4)}`;
  }

  return candidate;
}

module.exports = {
  generateUniqueUsername,
};
