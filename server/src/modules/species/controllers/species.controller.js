const speciesIdentityService = require('../services/species-identity.service');
const iucnSyncService = require('../services/iucn-sync.service');
const { generateFunAnimalSvg } = require('../services/species-avatar.service');

/**
 * Controller exposing endpoints for Endangered Species registry & adoption.
 */
class SpeciesController {
  constructor(service = speciesIdentityService, syncService = iucnSyncService) {
    this.speciesService = service;
    this.syncService = syncService;
  }

  /**
   * GET /api/species
   * List all endangered species with filters (category, group, search) and pagination.
   */
  async getAllSpecies(req, res, next) {
    try {
      const { category, taxonomicGroup, search, page, limit } = req.query;
      const result = await this.speciesService.getAllSpecies({
        category,
        taxonomicGroup,
        search,
        page,
        limit,
      });

      return res.json({
        status: 'success',
        ...result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/species/:slug
   * Retrieve details and top adopters for a specific species.
   */
  async getSpeciesBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const species = await this.speciesService.getSpeciesBySlug(slug);

      if (!species) {
        return res.status(404).json({
          status: 'fail',
          message: `Endangered species "${slug}" not found.`,
        });
      }

      return res.json({
        status: 'success',
        data: { species },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/species/:slug/avatar.svg
   * Returns a dynamic, fun vector SVG avatar for the species.
   */
  async getSpeciesAvatarSvg(req, res, next) {
    try {
      const { slug } = req.params;
      const cleanSlug = (slug || 'animal').replace(/\.svg$/, '');

      let commonName = cleanSlug.replace(/_/g, ' ');
      let taxonomicGroup = 'MAMMAL';

      try {
        const species = await this.speciesService.getSpeciesBySlug(cleanSlug);
        if (species) {
          commonName = species.commonName;
          taxonomicGroup = species.taxonomicGroup;
        }
      } catch (dbErr) {
        // Safe fallback without blocking SVG generation
      }

      const { shape, animated, accessory, mood, seed } = req.query || {};
      const isAnimated = animated !== 'false' && animated !== '0';

      const svg = generateFunAnimalSvg(
        {
          slug: cleanSlug,
          commonName,
          taxonomicGroup,
        },
        {
          shape: shape === 'circle' ? 'circle' : 'badge',
          animated: isAnimated,
          accessory,
          mood,
          seed,
        }
      );

      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(svg);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/species/sync (Admin endpoint)
   * Syncs new endangered species batch.
   */
  async syncBatch(req, res, next) {
    try {
      const { speciesList } = req.body;
      const result = await this.syncService.syncSpeciesBatch(speciesList || []);

      return res.json({
        status: 'success',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new SpeciesController();
module.exports.SpeciesController = SpeciesController;
