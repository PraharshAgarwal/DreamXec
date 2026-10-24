const express = require('express');
const userController = require('../controllers/user.controller');
const { protect } = require('../../../middleware/auth.middleware');
const { requirePermission } = require('../../../middleware/permission.middleware');
const PERMISSIONS = require('../../../permissions/permissions');

const router = express.Router();

router.use(protect);

// USER routes
router.get('/me', userController.getMe);
router.get('/me/dpdp-export', userController.exportUserData);
router.post('/me/dpdp-delete', userController.requestAccountDeletion);
router.post('/me/dpdp-consent', userController.recordConsent);

// ADMIN routes
router.use(requirePermission(PERMISSIONS.ADMIN_ACCESS));
router.get('/', userController.getAllUsers);
router.patch('/:id/suspend', userController.suspendUser);

module.exports = router;
