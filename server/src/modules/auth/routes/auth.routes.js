const express = require('express');

const authController = require('../controllers/auth.controller');
const oauthController = require('../controllers/oauth.controller');
const digilockerController = require('../controllers/digilocker.controller');
const validate = require('../../../middleware/validate.middleware');
const { protect } = require('../../../middleware/auth.middleware');

const {
  registerSchema,
  claimRoleSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../auth.validator');
const { authLimiter, otpLimiter } = require('../../../middleware/rate-limiters');

const router = express.Router();

// Authentication
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  authController.register
);

router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  authController.login
);

router.get(
  '/me',
  protect,
  authController.getMe
);

router.post(
  '/switch-profile',
  protect,
  authController.switchProfile
);
router.post(
  '/claim-role',
  protect,
  validate(claimRoleSchema),
  authController.claimRole
);

// Email Check
router.post(
  '/check-email',
  authLimiter,
  authController.checkEmail
);

// OTP
router.post(
  '/send-otp',
  otpLimiter,
  authController.sendOTP
);

router.post(
  '/verify-otp',
  otpLimiter,
  authController.verifyOTP
);

// Email verification
router.get(
  '/verify-email',
  authController.verifyEmail
);

// Password recovery
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);

router.get(
  '/verify-reset-token',
  authController.verifyResetToken
);

router.post(
  '/verify-reset-token',
  authController.verifyResetToken
);

router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);

router.post(
  '/refresh-token',
  authController.refreshToken
);

// Specific OAuth endpoints
router.get('/google', oauthController.googleInitiate);
router.get('/google/callback', oauthController.googleCallback);

// Pluggable Generic OAuth endpoints for ANY provider (e.g. /api/auth/provider/github)
router.get('/provider/:provider', oauthController.initiateOAuth);
router.get('/provider/:provider/callback', oauthController.handleCallback);

// Government DigiLocker / MeriPehchaan OAuth endpoints
router.get('/digilocker', digilockerController.initiate);
router.get('/digilocker/callback', digilockerController.callback);
router.get('/digilocker/auth-url', digilockerController.getAuthUrl);
router.post('/digilocker/exchange', digilockerController.exchange);

module.exports = router;
