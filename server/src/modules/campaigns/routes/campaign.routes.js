const express = require('express');
const campaignController = require('../controllers/campaign.controller');
const milestoneController = require('../controllers/milestone.controller');
const { protect } = require('../../../middleware/auth.middleware');
const validate = require('../../../middleware/validate.middleware');
const { requireCampaignRole } = require('../middleware/campaign-member.middleware');
const {
  createCampaignSchema,
  updateCampaignSchema,
  requestMilestoneRevisionSchema,
  reviewMilestoneRevisionSchema,
  submitMilestoneProofSchema,
  reviewMilestoneSubmissionSchema,
  verifyCampaignSchema,
  endorseCampaignSchema,
  addCampaignMemberSchema,
  updateCampaignMemberSchema,
} = require('../campaign.validation');

const router = express.Router();

// ─── Public & User Campaign Endpoints ─────────────────────────────────────────
router.get('/', campaignController.getPublicCampaigns);
router.get('/impact-dashboard', campaignController.getImpactDashboardMetrics);
router.get('/my', protect, campaignController.getMyCampaigns);
router.get('/pending-review', protect, campaignController.getPendingCampaigns);
router.get('/lookup-user', protect, campaignController.lookupUser);
router.get('/:idOrSlug', campaignController.getCampaignDetails);

// ─── Campaign CRUD, Submission & Governance ──────────────────────────────────
router.post('/', protect, validate(createCampaignSchema), campaignController.createCampaign);
router.patch(
  '/:id',
  protect,
  requireCampaignRole(['OWNER', 'MEMBER']),
  validate(updateCampaignSchema),
  campaignController.updateCampaign
);
router.delete(
  '/:id',
  protect,
  requireCampaignRole(['OWNER']),
  campaignController.deleteCampaign
);
router.post(
  '/:id/submit',
  protect,
  requireCampaignRole(['OWNER', 'MEMBER']),
  campaignController.submitCampaignForReview
);
router.post('/:id/verify', protect, validate(verifyCampaignSchema), campaignController.verifyCampaign);
router.post('/:id/approve', protect, campaignController.approveCampaign);
router.post('/:id/reject', protect, campaignController.rejectCampaign);
router.post('/:id/endorse', protect, validate(endorseCampaignSchema), campaignController.endorseCampaign);

// ─── Campaign Team Members (Collaborative Multi-Member RBAC) ─────────────────
router.get('/:id/members', campaignController.getMembers);
router.post(
  '/:id/members',
  protect,
  requireCampaignRole(['OWNER']),
  validate(addCampaignMemberSchema),
  campaignController.addMember
);
router.patch(
  '/:id/members/:memberId',
  protect,
  requireCampaignRole(['OWNER']),
  validate(updateCampaignMemberSchema),
  campaignController.updateMember
);
router.delete(
  '/:id/members/:memberId',
  protect,
  requireCampaignRole(['OWNER', 'MEMBER']),
  campaignController.removeMember
);

// ─── Milestone Revisions (100+ Backtracking & Audit History) ────────────────
router.post(
  '/:id/milestones/:milestoneId/revisions',
  protect,
  requireCampaignRole(['OWNER', 'MEMBER']),
  validate(requestMilestoneRevisionSchema),
  milestoneController.requestMilestoneRevision
);

router.patch(
  '/:id/milestones/:milestoneId/revisions/:revisionId/review',
  protect,
  validate(reviewMilestoneRevisionSchema),
  milestoneController.reviewMilestoneRevision
);

router.get(
  '/:id/milestones/:milestoneId/history',
  milestoneController.getMilestoneHistory
);

// ─── Milestone Completion Proofs & Multi-Rejection Loop ─────────────────────
router.post(
  '/:id/milestones/:milestoneId/submit-proof',
  protect,
  requireCampaignRole(['OWNER', 'MEMBER']),
  validate(submitMilestoneProofSchema),
  milestoneController.submitMilestoneProof
);

router.post(
  '/:id/milestones/:milestoneId/submissions/:submissionId/review',
  protect,
  validate(reviewMilestoneSubmissionSchema),
  milestoneController.reviewMilestoneSubmission
);

module.exports = router;
