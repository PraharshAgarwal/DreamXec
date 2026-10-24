const express = require('express');
const governanceMentorController = require('../controllers/mentor.controller');
const { protect } = require('../../../middleware/auth.middleware');
const { requirePermission } = require('../../../middleware/permission.middleware');
const PERMISSIONS = require('../../../permissions/permissions');

const router = express.Router();

router.get('/', governanceMentorController.getMentors);
router.post('/onboard', protect, requirePermission(PERMISSIONS.ADMIN_ACCESS), governanceMentorController.onboardMentor);

module.exports = router;
