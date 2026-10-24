const defaultService = require('../interaction.service');
const catchAsync = require('../../../utils/catchAsync');

class InteractionController {
  constructor(service = defaultService) {
    this.service = service;
  }

  createComment = catchAsync(async (req, res) => {
    const { campaignId } = req.params;
    const { content, parentId } = req.body;

    const comment = await this.service.createComment({
      campaignId,
      content,
      parentId,
      currentUser: req.user,
    });

    res.status(201).json({
      status: 'success',
      data: { comment },
    });
  });

  getComments = catchAsync(async (req, res) => {
    const { campaignId } = req.params;
    const comments = await this.service.getCommentsByCampaign(campaignId);

    res.status(200).json({
      status: 'success',
      results: comments.length,
      data: { comments },
    });
  });

  deleteComment = catchAsync(async (req, res) => {
    const { commentId } = req.params;
    await this.service.deleteComment({
      commentId,
      currentUser: req.user,
    });

    res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully',
    });
  });

  reportComment = catchAsync(async (req, res) => {
    const { commentId } = req.params;
    await this.service.reportComment({ commentId });

    res.status(200).json({
      status: 'success',
      message: 'Comment reported for review',
    });
  });

  toggleWishlist = catchAsync(async (req, res) => {
    const result = await this.service.toggleWishlist({
      donorId: req.user.id,
      campaignId: req.body.campaignId,
    });

    res.status(200).json({
      status: 'success',
      message: result.message,
      isWishlisted: result.isWishlisted,
    });
  });

  getMyWishlist = catchAsync(async (req, res) => {
    const campaigns = await this.service.getMyWishlist(req.user.id);

    res.status(200).json({
      status: 'success',
      results: campaigns.length,
      data: { campaigns },
    });
  });

  checkWishlistStatus = catchAsync(async (req, res) => {
    const result = await this.service.checkWishlistStatus({
      donorId: req.user.id,
      campaignId: req.params.campaignId,
    });

    res.status(200).json({
      status: 'success',
      isWishlisted: result.isWishlisted,
    });
  });

  removeFromWishlist = catchAsync(async (req, res) => {
    const result = await this.service.removeFromWishlist({
      donorId: req.user.id,
      campaignId: req.params.campaignId,
    });

    res.status(200).json({
      status: 'success',
      message: result.message,
      isWishlisted: result.isWishlisted,
    });
  });
}

module.exports = new InteractionController();
module.exports.InteractionController = InteractionController;
