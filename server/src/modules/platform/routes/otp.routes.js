const express = require('express');
const otpController = require('../controllers/otp.controller');
const validate = require('../../../middleware/validate.middleware');
const { sendOtpSchema, verifyOtpSchema } = require('../platform.validation');

const router = express.Router();

router.post('/send-otp', validate(sendOtpSchema), otpController.sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), otpController.verifyOtp);

module.exports = router;
