const prisma = require('../../../config/prisma');
const PlatformRepositoryPort = require('../ports/platform-repository.port');
const { getClientUrl } = require('../../../utils/urlConfig');

class PrismaPlatformRepositoryAdapter extends PlatformRepositoryPort {
  async findAllColleges(searchQuery) {
    try {
      const where = searchQuery
        ? {
            OR: [
              { name: { contains: searchQuery, mode: 'insensitive' } },
              { state: { contains: searchQuery, mode: 'insensitive' } },
            ],
          }
        : {};

      return await prisma.college.findMany({
        where,
        take: 50,
        orderBy: { name: 'asc' },
      });
    } catch (err) {
      console.warn('[PrismaPlatformRepositoryAdapter] findAllColleges error:', err.message);
      return [];
    }
  }

  async subscribeNewsletter(email) {
    return await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: { active: true },
      create: { email, active: true },
    });
  }

  async findSitemapEntries() {
    try {
      const campaigns = await prisma.campaign.findMany({
        where: {
          status: 'LIVE',
          deletedAt: null,
        },
        select: { id: true, slug: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 100,
      });

      const baseUrl = getClientUrl();
      return campaigns.map((c) => ({
        loc: `${baseUrl}/campaign/${c.slug || c.id}`,
        lastmod: c.updatedAt ? c.updatedAt.toISOString() : new Date().toISOString(),
      }));
    } catch (err) {
      console.warn('[PrismaPlatformRepositoryAdapter] findSitemapEntries error:', err.message);
      return [];
    }
  }
}

module.exports = new PrismaPlatformRepositoryAdapter();
module.exports.PrismaPlatformRepositoryAdapter = PrismaPlatformRepositoryAdapter;
