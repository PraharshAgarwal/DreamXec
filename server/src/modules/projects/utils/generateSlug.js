const slugify = require("slugify");
const prisma = require("../../../config/prisma");

async function generateUniqueSlug(title, tx = prisma) {
    const baseSlug = slugify(title, {
        lower: true,
        strict: true,
        trim: true,
    });

    let slug = baseSlug;
    let counter = 1;

    const findExisting = async (s) => {
        if (tx.campaign) return tx.campaign.findUnique({ where: { slug: s } });
        if (tx.userProject) return tx.userProject.findUnique({ where: { slug: s } });
        if (tx.project) return tx.project.findUnique({ where: { slug: s } });
        return null;
    };

    while (await findExisting(slug)) {
        slug = `${baseSlug}-${counter}`;
        counter++;
    }

    return slug;
}

module.exports = generateUniqueSlug;
