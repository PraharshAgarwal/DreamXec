const express = require('express');
const donationController = require('../controllers/donation.controller');
const validate = require('../../../middleware/validate.middleware');
const { protect, optionalAuth } = require('../../../middleware/auth.middleware');
const { requirePermission } = require('../../../middleware/permission.middleware');
const PERMISSIONS = require('../../../permissions/permissions');
const { createOrderSchema, verifyPaymentSchema } = require('../donation.validation');
const { paymentLimiter } = require('../../../middleware/rate-limiters');
const catchAsync = require('../../../utils/catchAsync');
const prisma = require('../../../config/prisma');
const AppError = require('../../../utils/AppError');

/**
 * Middleware: verifies the requesting user owns this donation
 * or is an ADMIN / FINANCE_OFFICER role.
 */
const requireDonationOwnership = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  if (!req.user) return next(new AppError('Authentication required to access tax receipts.', 401));

  const privilegedRoles = ['ADMIN', 'SUPERADMIN', 'FINANCE_OFFICER'];
  if (privilegedRoles.includes(req.user.role)) return next();

  const donation = await prisma.donation.findUnique({
    where: { id },
    select: { userId: true, donorId: true, guestEmail: true },
  });

  if (!donation) return next(new AppError('Donation record not found.', 404));

  const isOwner =
    (donation.userId && donation.userId === req.user.id) ||
    (donation.donorId && donation.donorId === req.user.id) ||
    (donation.guestEmail && donation.guestEmail === req.user.email);

  if (!isOwner) return next(new AppError('You are not authorised to access this tax receipt.', 403));

  next();
});

/**
 * Middleware: restricts CSR utilisation reports to ADMIN / FINANCE_OFFICER only.
 */
const requireFinanceRole = (req, res, next) => {
  if (!req.user) return next(new AppError('Authentication required.', 401));
  const allowed = ['ADMIN', 'SUPERADMIN', 'FINANCE_OFFICER'];
  if (!allowed.includes(req.user.role)) {
    return next(new AppError('Only Finance Officers and Admins may access CSR utilisation reports.', 403));
  }
  next();
};

const router = express.Router();

// PUBLIC ROUTES
router.post(
  '/create-order',
  paymentLimiter,
  optionalAuth,
  validate(createOrderSchema),
  donationController.createOrder
);

router.post(
  '/verify',
  paymentLimiter,
  validate(verifyPaymentSchema),
  donationController.verifyPayment
);

router.post('/webhook', donationController.handlePaymentWebhook);
router.post('/verify-webhook', donationController.handlePaymentWebhook);
router.get('/status/:orderId', paymentLimiter, donationController.getDonationStatus);

// AUTHENTICATED ROUTES
router.get('/my', protect, donationController.getMyDonations);
router.get('/my-ledger', protect, donationController.getMyLedger);
router.get('/project/:projectId', protect, donationController.getProjectDonations);
router.get('/summary', protect, donationController.getDonationSummary);

router.get(
  '/me/eligibility',
  protect,
  requirePermission(PERMISSIONS.GRANT_POST),
  donationController.getMyEligibility
);

// STATUTORY TAX EXEMPTION & CSR UTILISATION EXPORTS (K6, K7, O2)
// 80G receipt: requires auth + ownership check (ADMIN/FINANCE_OFFICER bypass ownership)
router.get('/:id/receipt-80g', protect, requireDonationOwnership, donationController.download80GReceipt);
router.get('/:id/receipt/80g', protect, requireDonationOwnership, donationController.download80GReceipt);
// CSR report: restricted to finance/admin roles — contains donor PII & disbursement data
router.get('/campaign/:campaignId/utilisation-report', protect, requireFinanceRole, donationController.downloadCSRUtilisationReport);
router.get('/campaign/:campaignId/csr-utilisation', protect, requireFinanceRole, donationController.downloadCSRUtilisationReport);

module.exports = router;
