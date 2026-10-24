const AppError = require('../../../utils/AppError');
const prismaMilestoneRepository = require('../adapters/prisma-milestone-repository.adapter');
const prismaCampaignRepository = require('../adapters/prisma-campaign-repository.adapter');
const redisCampaignCache = require('../adapters/redis-campaign-cache.adapter');
const CampaignMapper = require('../campaign.mapper');

/**
 * Domain Service for Milestone Lifecycle, Revision History & Proof Submissions.
 * Enforces audit logging, revision backtracking, and document verification rules.
 */
class MilestoneService {
  constructor({
    milestoneRepo = prismaMilestoneRepository,
    campaignRepo = prismaCampaignRepository,
    cache = redisCampaignCache,
  } = {}) {
    this.milestoneRepo = milestoneRepo;
    this.campaignRepo = campaignRepo;
    this.cache = cache;
  }

  /**
   * Requests a milestone revision (budget or scope change).
   * Creates an immutable revision snapshot; auto-applies if DRAFT, or requires admin approval if LIVE.
   */
  async requestMilestoneRevision(user, campaignId, milestoneId, updateData) {
    const milestone = await this.milestoneRepo.findMilestoneById(milestoneId);
    if (!milestone) {
      throw new AppError('Milestone not found', 404);
    }

    if (milestone.campaignId !== campaignId) {
      throw new AppError('Milestone does not belong to this campaign', 400);
    }

    // Permission check: Campaign Creator or Admin
    const isOwner = milestone.campaign.studentUserId === user.id;
    const isAdmin = user.role === 'ADMIN' || (user.orgRoles && user.orgRoles.includes('ORG_ADMIN'));

    if (!isOwner && !isAdmin) {
      throw new AppError('You do not have permission to request milestone revisions', 403);
    }

    const payload = {
      title: updateData.title,
      description: updateData.description,
      durationDays: updateData.durationDays,
      targetAmount: updateData.budget || updateData.targetAmount,
    };

    const revisionSnapshot = {
      changeReason: updateData.changeReason || 'Milestone revision requested by project lead.',
      requestedByUserId: user.id,
      status: milestone.campaign.status === 'DRAFT' ? 'APPROVED' : 'PENDING_APPROVAL',
      reviewedAt: milestone.campaign.status === 'DRAFT' ? new Date() : null,
    };

    const { updatedMilestone, revision } = await this.milestoneRepo.requestMilestoneRevision(
      milestoneId,
      payload,
      revisionSnapshot
    );

    // Invalidate campaign cache
    await this.cache.invalidateCampaign(campaignId);

    return {
      milestone: CampaignMapper.toMilestoneDTO(updatedMilestone),
      revision: CampaignMapper.toRevisionHistoryDTO(revision),
    };
  }

  /**
   * Reviews (approves or rejects) a requested milestone revision.
   */
  async reviewMilestoneRevision(reviewerUser, campaignId, milestoneId, revisionId, { status, rejectionReason }) {
    const milestone = await this.milestoneRepo.findMilestoneById(milestoneId);
    if (!milestone || milestone.campaignId !== campaignId) {
      throw new AppError('Milestone not found', 404);
    }

    const { revision, updatedMilestone } = await this.milestoneRepo.reviewMilestoneRevision(
      milestoneId,
      revisionId,
      {
        reviewedByUserId: reviewerUser.id,
        status,
        rejectionReason,
      }
    );

    await this.cache.invalidateCampaign(campaignId);

    return {
      revision: CampaignMapper.toRevisionHistoryDTO(revision),
      milestone: updatedMilestone ? CampaignMapper.toMilestoneDTO(updatedMilestone) : null,
    };
  }

  /**
   * Retrieves the full immutable revision history for a milestone.
   */
  async getMilestoneHistory(campaignId, milestoneId) {
    const milestone = await this.milestoneRepo.findMilestoneById(milestoneId);
    if (!milestone || milestone.campaignId !== campaignId) {
      throw new AppError('Milestone not found', 404);
    }

    const revisions = await this.milestoneRepo.getMilestoneRevisions(milestoneId);
    return revisions.map(CampaignMapper.toRevisionHistoryDTO);
  }

  /**
   * Submits evidence document and student notes for milestone verification.
   * Tracks attempt counter to support the multi-rejection feedback loop.
   */
  async submitMilestoneProof(user, campaignId, milestoneId, proofData) {
    const milestone = await this.milestoneRepo.findMilestoneById(milestoneId);
    if (!milestone || milestone.campaignId !== campaignId) {
      throw new AppError('Milestone not found', 404);
    }

    // Only campaign owner or authorized admin can submit completion proof
    const isOwner = milestone.campaign?.studentUserId === user.id;
    const isAdmin = user.role === 'ADMIN' || user.role === 'SUPER_ADMIN';
    if (!isOwner && !isAdmin) {
      throw new AppError('Only the project lead or admin can submit milestone completion proofs', 403);
    }

    const submission = await this.milestoneRepo.createMilestoneSubmission(milestoneId, proofData);

    await this.cache.invalidateCampaign(campaignId);

    return submission;
  }

  /**
   * Reviews (approves or rejects) an end-of-milestone proof submission.
   */
  async reviewMilestoneSubmission(reviewerUser, campaignId, milestoneId, submissionId, { status, rejectionReason }) {
    const milestone = await this.milestoneRepo.findMilestoneById(milestoneId);
    if (!milestone || milestone.campaignId !== campaignId) {
      throw new AppError('Milestone not found', 404);
    }

    const submission = await this.milestoneRepo.reviewMilestoneSubmission(submissionId, {
      reviewedByUserId: reviewerUser.id,
      status,
      rejectionReason,
    });

    await this.cache.invalidateCampaign(campaignId);

    return submission;
  }
}

module.exports = new MilestoneService();
module.exports.MilestoneService = MilestoneService;
