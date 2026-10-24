const express = require('express');
const interactionController = require('../controllers/interaction.controller');
const { protect } = require('../../../middleware/auth.middleware');
const validate = require('../../../middleware/validate.middleware');
const { createCommentSchema } = require('../interaction.validation');

const router = express.Router({ mergeParams: true });

router.post('/campaigns/:campaignId/comments', protect, validate(createCommentSchema), interactionController.createComment);
router.get('/campaigns/:campaignId/comments', interactionController.getComments);

router.delete('/comments/:commentId', protect, interactionController.deleteComment);
router.post('/comments/:commentId/report', protect, interactionController.reportComment);

module.exports = router;
