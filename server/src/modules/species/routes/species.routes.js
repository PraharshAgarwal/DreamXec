const express = require('express');
const router = express.Router();
const speciesController = require('../controllers/species.controller');
const { redisCacheMiddleware, invalidateRedisPattern } = require('../../../middleware/cache.middleware');

// Public endpoints cached for 300 seconds
router.get('/', redisCacheMiddleware(300, { prefix: 'dx:species:' }), (req, res, next) => speciesController.getAllSpecies(req, res, next));
router.get('/:slug/avatar.svg', (req, res, next) => speciesController.getSpeciesAvatarSvg(req, res, next));
router.get('/avatar/:slug', (req, res, next) => speciesController.getSpeciesAvatarSvg(req, res, next));
router.get('/:slug', redisCacheMiddleware(300, { prefix: 'dx:species:' }), (req, res, next) => speciesController.getSpeciesBySlug(req, res, next));

// Admin sync endpoint
router.post('/sync', async (req, res, next) => {
  await invalidateRedisPattern('dx:species:*');
  return speciesController.syncBatch(req, res, next);
});

module.exports = router;
