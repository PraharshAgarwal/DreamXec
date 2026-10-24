const express = require('express');
const newsletterController = require('../controllers/newsletter.controller');
const validate = require('../../../middleware/validate.middleware');
const { newsletterSubscribeSchema } = require('../platform.validation');

const router = express.Router();

router.post(
  '/subscribe',
  validate(newsletterSubscribeSchema),
  newsletterController.subscribeNewsletter
);

module.exports = router;
