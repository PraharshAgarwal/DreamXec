const catchAsync = require('../../../utils/catchAsync');
const milestoneService = require('../services/milestone.service');

/**
 * Express Controller for Milestone, Revision & Proof endpoints.
 */
class MilestoneController {
  constructor({ milestoneSvc = milestoneService } = {}) {
    this.service = milestoneSvc;
  }

  requestMilestoneRevision = catchAsync(async (req, res) => {
    const { id: campaignId, milestoneId } = req.params;
    const result = await this.service.requestMilestoneRevision(req.user, campaignId, milestoneId, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Milestone revision snapshot recorded.',
      data: result,
    });
  });

  reviewMilestoneRevision = catchAsync(async (req, res) => {
    const { id: campaignId, milestoneId, revisionId } = req.params;
    const result = await this.service.reviewMilestoneRevision(
      req.user,
      campaignId,
      milestoneId,
      revisionId,
      req.body
    );
    res.status(200).json({
      status: 'success',
      message: `Milestone revision ${req.body.status.toLowerCase()}.`,
      data: result,
    });
  });

  getMilestoneHistory = catchAsync(async (req, res) => {
    const { id: campaignId, milestoneId } = req.params;
    const revisions = await this.service.getMilestoneHistory(campaignId, milestoneId);
    res.status(200).json({
      status: 'success',
      results: revisions.length,
      data: { revisions },
    });
  });

  submitMilestoneProof = catchAsync(async (req, res) => {
    const { id: campaignId, milestoneId } = req.params;
    const submission = await this.service.submitMilestoneProof(req.user, campaignId, milestoneId, req.body);
    res.status(201).json({
      status: 'success',
      message: 'Milestone proof submitted for review.',
      data: { submission },
    });
  });

  reviewMilestoneSubmission = catchAsync(async (req, res) => {
    const { id: campaignId, milestoneId, submissionId } = req.params;
    const submission = await this.service.reviewMilestoneSubmission(
      req.user,
      campaignId,
      milestoneId,
      submissionId,
      req.body
    );
    res.status(200).json({
      status: 'success',
      message: `Milestone submission ${req.body.status.toLowerCase()}.`,
      data: { submission },
    });
  });
}

module.exports = new MilestoneController();
module.exports.MilestoneController = MilestoneController;
