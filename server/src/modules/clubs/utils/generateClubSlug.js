const slugify = require("slugify");
const prisma = require("../../../config/prisma");

/**
 * Generate unique slug for clubs
 * Format: college-name-club-name
 */
async function generateClubSlug(name, college) {
  const baseSlug = slugify(`${college} ${name}`, {
    lower: true,
    strict: true,
    trim: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (await prisma.organization.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

module.exports = generateClubSlug;
