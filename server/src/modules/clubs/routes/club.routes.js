const express = require('express');
const multer = require('multer');
const publicClubController = require('../controllers/public-club.controller');
const adminClubVerificationController = require('../controllers/admin-club-verification.controller');
const adminClubReferralController = require('../controllers/admin-club-referral.controller');
const { referClubSchema } = require('../club.validation');
const validate = require('../../../middleware/validate.middleware');
const { protect } = require('../../../middleware/auth.middleware');
const { requirePermission } = require('../../../middleware/permission.middleware');
const PERMISSIONS = require('../../../permissions/permissions');
const { redisCacheMiddleware, invalidateRedisPattern } = require('../../../middleware/cache.middleware');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// ─── Public Club Routes (Cached in Redis for 120s) ───────────────────────────
router.get('/public', redisCacheMiddleware(120, { prefix: 'dx:clubs:' }), publicClubController.getPublicClubs);
router.post('/refer-club', validate(referClubSchema), async (req, res, next) => {
  await invalidateRedisPattern('dx:clubs:*');
  return publicClubController.referClub(req, res, next);
});
router.get('/public/:id', redisCacheMiddleware(120, { prefix: 'dx:clubs:' }), publicClubController.getClubById);
router.get('/:id', redisCacheMiddleware(120, { prefix: 'dx:clubs:' }), publicClubController.getClubById);
router.post('/:id/upload-members', protect, upload.single('membersFile'), async (req, res, next) => {
  await invalidateRedisPattern('dx:clubs:*');
  return publicClubController.uploadMembers(req, res, next);
});
router.patch('/:id/profile', protect, async (req, res, next) => {
  await invalidateRedisPattern('dx:clubs:*');
  return publicClubController.updateClubProfile(req, res, next);
});
router.post('/:id/transfer-presidency', protect, async (req, res, next) => {
  await invalidateRedisPattern('dx:clubs:*');
  return publicClubController.transferPresidency(req, res, next);
});
router.post('/:id/join', protect, async (req, res, next) => {
  await invalidateRedisPattern('dx:clubs:*');
  return publicClubController.joinClub(req, res, next);
});
router.post('/public/:id/join', protect, async (req, res, next) => {
  await invalidateRedisPattern('dx:clubs:*');
  return publicClubController.joinClub(req, res, next);
});

// ─── Club Verification (student/president) ────────────────────────────────────
// Mounted at /api/club-verification
const verificationRouter = express.Router();
verificationRouter.post(
  '/verify-president',
  protect,
  upload.single('document'),
  publicClubController.submitClubVerification,
);
router.use('/verification', verificationRouter);

// ─── Admin Club Verification ──────────────────────────────────────────────────
// Mounted at /api/admin/club-verifications
const adminVerificationRouter = express.Router();
adminVerificationRouter.use(protect, requirePermission(PERMISSIONS.ADMIN_ACCESS));
adminVerificationRouter.get('/verifications', adminClubVerificationController.listVerifications);
adminVerificationRouter.get('/verifications/:id', adminClubVerificationController.getVerification);
adminVerificationRouter.post('/verifications/:id/approve', adminClubVerificationController.approveVerification);
adminVerificationRouter.post('/verifications/:id/reject', adminClubVerificationController.rejectVerification);
router.use('/admin-verification', adminVerificationRouter);

// ─── Club Referral (student) ──────────────────────────────────────────────────
// Mounted at /api/club-referral
const referralRouter = express.Router();
referralRouter.post('/refer', protect, upload.single('document'), publicClubController.referClub);
router.use('/referral', referralRouter);

// ─── Admin Club Referral ──────────────────────────────────────────────────────
// Mounted at /api/admin/referrals
const adminReferralRouter = express.Router();
adminReferralRouter.use(protect, requirePermission(PERMISSIONS.ADMIN_ACCESS));
adminReferralRouter.get('/', adminClubReferralController.listReferrals);
adminReferralRouter.get('/:id', adminClubReferralController.getReferral);
adminReferralRouter.patch('/:id/status', adminClubReferralController.updateReferralStatus);
adminReferralRouter.post('/:id/approve', adminClubReferralController.approveReferral);
adminReferralRouter.post('/:id/reject', adminClubReferralController.rejectReferral);
router.use('/admin-referral', adminReferralRouter);

module.exports = router;
module.exports.verificationRouter = verificationRouter;
module.exports.adminVerificationRouter = adminVerificationRouter;
module.exports.referralRouter = referralRouter;
module.exports.adminReferralRouter = adminReferralRouter;
