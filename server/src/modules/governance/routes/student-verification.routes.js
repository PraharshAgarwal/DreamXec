const express = require('express');
const studentVerificationController = require('../controllers/student-verification.controller');
const { protect } = require('../../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post(
  '/create-order',
  studentVerificationController.createStudentVerificationOrder
);

module.exports = router;
