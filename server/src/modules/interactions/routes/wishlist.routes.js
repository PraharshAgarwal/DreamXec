const express = require('express');
const interactionController = require('../controllers/interaction.controller');
const { protect } = require('../../../middleware/auth.middleware');
const validate = require('../../../middleware/validate.middleware');
const { toggleWishlistSchema } = require('../interaction.validation');

const router = express.Router();

router.use(protect);

router.get('/', interactionController.getMyWishlist);
router.get('/my', interactionController.getMyWishlist);
router.post('/toggle', validate(toggleWishlistSchema), interactionController.toggleWishlist);
router.get('/check/:campaignId', interactionController.checkWishlistStatus);
router.delete('/:campaignId', interactionController.removeFromWishlist);

module.exports = router;
