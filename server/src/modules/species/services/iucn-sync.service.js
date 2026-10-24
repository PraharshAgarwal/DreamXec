const axios = require('axios');
const prisma = require('../../../config/prisma');

/**
 * IUCN Red List Sync & Open Conservation Data Service.
 * Allows importing and enriching global endangered species records from IUCN Red List API v3/v4
 * or open conservation databases.
 */
class IucnSyncService {
  constructor(apiKey = process.env.IUCN_API_KEY) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://apiv3.iucnredlist.org/api/v3';
  }

  /**
   * Generates a clean slug from common name or scientific name.
   */
  slugify(text) {
    return String(text || '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 50);
  }

  /**
   * Fetches species by category from IUCN API (e.g. CR, EN, VU) if API key is present.
   * @param {string} category 'CR' (Critically Endangered), 'EN' (Endangered), 'VU' (Vulnerable)
   * @param {number} page Page number
   */
  async fetchIucnCategory(category = 'CR', page = 0) {
    if (!this.apiKey) {
      console.warn('[IucnSyncService] IUCN_API_KEY not configured. Skipping live IUCN network sync.');
      return [];
    }

    try {
      const url = `${this.baseUrl}/species/category/${category}?token=${this.apiKey}&page=${page}`;
      const response = await axios.get(url, { timeout: 10000 });
      return response.data?.result || [];
    } catch (err) {
      console.error(`[IucnSyncService] Failed to fetch category ${category} from IUCN:`, err.message);
      return [];
    }
  }

  /**
   * Upserts species list into the database, guaranteeing strictly positive estimated counts
   * and clean slugs.
   * @param {Array<Object>} speciesList
   */
  async syncSpeciesBatch(speciesList) {
    if (!Array.isArray(speciesList) || speciesList.length === 0) {
      return { syncedCount: 0, errors: [] };
    }

    let syncedCount = 0;
    const errors = [];

    for (const item of speciesList) {
      try {
        const slug = item.slug || this.slugify(item.commonName || item.scientificName);
        if (!slug) continue;

        const estimatedCount = Math.max(1, parseInt(item.estimatedCount, 10) || 100);
        const avatarUrl = item.avatarUrl || `https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=400&auto=format&fit=crop&q=80`;

        await prisma.endangeredSpecies.upsert({
          where: { slug },
          update: {
            commonName: item.commonName,
            scientificName: item.scientificName || null,
            taxonomicGroup: item.taxonomicGroup || 'MAMMAL',
            category: item.category || 'CRITICALLY_ENDANGERED',
            estimatedCount,
            avatarUrl,
            thumbnailUrl: item.thumbnailUrl || avatarUrl,
            habitat: item.habitat || null,
            region: item.region || null,
            description: item.description || null,
            isActive: item.isActive !== undefined ? item.isActive : true,
          },
          create: {
            commonName: item.commonName,
            scientificName: item.scientificName || null,
            slug,
            taxonomicGroup: item.taxonomicGroup || 'MAMMAL',
            category: item.category || 'CRITICALLY_ENDANGERED',
            estimatedCount,
            assignedCount: 0,
            avatarUrl,
            thumbnailUrl: item.thumbnailUrl || avatarUrl,
            habitat: item.habitat || null,
            region: item.region || null,
            description: item.description || null,
            isActive: item.isActive !== undefined ? item.isActive : true,
          },
        });

        syncedCount++;
      } catch (err) {
        errors.push({ name: item.commonName, error: err.message });
      }
    }

    return { syncedCount, errors };
  }
}

module.exports = new IucnSyncService();
module.exports.IucnSyncService = IucnSyncService;
