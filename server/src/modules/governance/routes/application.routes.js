const express = require('express');
const governanceApplicationController = require('../controllers/governance-application.controller');
const { protect } = require('../../../middleware/auth.middleware');
const validate = require('../../../middleware/validate.middleware');
const { submitApplicationSchema } = require('../governance.validation');

const router = express.Router();

router.use(protect);

router.post('/', validate(submitApplicationSchema), governanceApplicationController.submitApplication);
router.get('/', governanceApplicationController.getApplications);
router.get('/my', governanceApplicationController.getApplications);
router.get('/me', governanceApplicationController.getApplications);

module.exports = router;
