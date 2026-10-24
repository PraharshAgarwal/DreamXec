const express = require('express');
const { protect } = require('../../../middleware/auth.middleware');
const { requirePermission } = require('../../../middleware/permission.middleware');
const PERMISSIONS = require('../../../permissions/permissions');
const { checkRedisHealth } = require('../../platform/utils/redisHealth');

const router = express.Router();

router.use(protect);
router.use(requirePermission(PERMISSIONS.ADMIN_ACCESS));

router.get('/health', async (req, res) => {
  const health = await checkRedisHealth();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json({
    status: health.status === 'healthy' ? 'success' : 'fail',
    redis: health,
  });
});

module.exports = router;
