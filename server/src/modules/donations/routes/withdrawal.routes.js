const express = require('express');
const withdrawalController = require('../controllers/withdrawal.controller');
const { protect } = require('../../../middleware/auth.middleware');
const { paymentLimiter } = require('../../../middleware/rate-limiters');

const router = express.Router();

// Public Webhook (RazorpayX Payouts)
router.post('/webhook', withdrawalController.handlePayoutWebhook);

// Authenticated Student Routes
router.use(protect);

router.get('/eligibility', withdrawalController.getEligibility);
router.post('/request', paymentLimiter, withdrawalController.requestWithdrawal);
router.get('/my', withdrawalController.getMyWithdrawals);
router.get('/:id', withdrawalController.getWithdrawalById);
router.post('/:id/cancel', withdrawalController.cancelWithdrawal);

module.exports = router;
