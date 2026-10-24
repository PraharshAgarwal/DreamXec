const express = require('express');
const collegesController = require('../controllers/college-directory.controller');
const { redisCacheMiddleware } = require('../../../middleware/cache.middleware');

const router = express.Router();

// Cache college directory for 1 hour (3600s)
router.get('/', redisCacheMiddleware(3600, { prefix: 'dx:colleges:' }), collegesController.getColleges);

module.exports = router;

