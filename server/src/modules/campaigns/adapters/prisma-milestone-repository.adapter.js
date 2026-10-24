const prisma = require('../../../config/prisma');
const MilestoneRepositoryPort = require('../ports/milestone-repository.port');

/**
 * High-performance Prisma Adapter for Milestones, Submissions & Revisions.
 * Enforces transactional integrity for milestone change history snapshots and multi-rejection claim attempts.
 */
class PrismaMilestoneRepositoryAdapter extends MilestoneRepositoryPort {
  constructor({ prismaClient = prisma } = {}) {
    super();
    this.prisma = prismaClient;
  }

  async findMilestonesByCampaignId(campaignId) {
    return this.prisma.campaignMilestone.findMany({
      where: { campaignId },
      include: {
        submissions: {
          include: {
            evidenceDoc: {
              select: { id: true, name: true, storageKey: true, mimeType: true },
            },
            reviewedBy: {
              select: { id: true, fullName: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        revisions: {
          orderBy: { revisionNumber: 'desc' },
        },
      },
      orderBy: { sequenceOrder: 'asc' },
    });
  }

  async findMilestoneById(milestoneId) {
    return this.prisma.campaignMilestone.findUnique({
      where: { id: milestoneId },
      include: {
        campaign: {
          select: { id: true, studentUserId: true, tenantId: true, status: true, targetAmount: true },
        },
        submissions: {
          include: {
            evidenceDoc: {
              select: { id: true, name: true, storageKey: true, mimeType: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        revisions: {
          orderBy: { revisionNumber: 'desc' },
        },
      },
    });
  }

  async requestMilestoneRevision(milestoneId, updateData, revisionSnapshot) {
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.campaignMilestone.findUnique({
        where: { id: milestoneId },
        include: { campaign: true },
      });

      if (!existing) {
        throw new Error('Milestone not found.');
      }

      const nextRevisionNumber = (existing.currentVersion || 1) + 1;
      const isPreLive = ['DRAFT', 'PENDING', 'PENDING_VERIFICATION', 'REJECTED'].includes(existing.campaign.status);
      const initialStatus = isPreLive ? 'APPROVED' : (revisionSnapshot.status || 'PENDING_APPROVAL');

      // 1. Create Revision History Snapshot
      const revision = await tx.campaignMilestoneRevision.create({
        data: {
          milestoneId,
          revisionNumber: nextRevisionNumber,
          title: updateData.title || existing.title,
          description: updateData.description !== undefined ? updateData.description : existing.description,
          targetAmount: updateData.targetAmount !== undefined ? updateData.targetAmount : existing.targetAmount,
          changeReason: revisionSnapshot.changeReason || 'Milestone revision requested by project lead.',
          status: initialStatus,
          requestedByUserId: revisionSnapshot.requestedByUserId,
          reviewedByUserId: isPreLive ? revisionSnapshot.requestedByUserId : null,
          reviewedAt: isPreLive ? new Date() : null,
        },
      });

      // 2. If campaign is in pre-live state, apply immediately
      let updatedMilestone = existing;
      if (isPreLive) {
        updatedMilestone = await tx.campaignMilestone.update({
          where: { id: milestoneId },
          data: {
            title: updateData.title !== undefined ? updateData.title : existing.title,
            description: updateData.description !== undefined ? updateData.description : existing.description,
            durationDays: updateData.durationDays !== undefined ? parseInt(updateData.durationDays, 10) : existing.durationDays,
            deadline: updateData.deadline !== undefined ? (updateData.deadline ? new Date(updateData.deadline) : null) : existing.deadline,
            acceptanceCriteria: updateData.acceptanceCriteria !== undefined ? updateData.acceptanceCriteria : existing.acceptanceCriteria,
            requiredEvidenceTypes: updateData.requiredEvidenceTypes !== undefined ? updateData.requiredEvidenceTypes : existing.requiredEvidenceTypes,
            targetAmount: updateData.targetAmount !== undefined ? updateData.targetAmount : existing.targetAmount,
            currentVersion: nextRevisionNumber,
            updatedAt: new Date(),
          },
          include: {
            revisions: {
              orderBy: { revisionNumber: 'desc' },
            },
          },
        });
      }

      return { updatedMilestone, revision };
    }, {
      timeout: 25000,
      maxWait: 10000,
    });
  }

  async reviewMilestoneRevision(milestoneId, revisionId, { reviewedByUserId, status, rejectionReason }) {
    return this.prisma.$transaction(async (tx) => {
      const revision = await tx.campaignMilestoneRevision.update({
        where: { id: revisionId },
        data: {
          status,
          reviewedByUserId,
          reviewedAt: new Date(),
          rejectionReason: status === 'REJECTED' ? rejectionReason : null,
        },
      });

      let updatedMilestone = null;

      // If approved, apply revision snapshot to the active milestone
      if (status === 'APPROVED') {
        updatedMilestone = await tx.campaignMilestone.update({
          where: { id: milestoneId },
          data: {
            title: revision.title,
            description: revision.description,
            targetAmount: revision.targetAmount,
            currentVersion: revision.revisionNumber,
            updatedAt: new Date(),
          },
          include: {
            revisions: {
              orderBy: { revisionNumber: 'desc' },
            },
          },
        });
      }

      return { revision, updatedMilestone };
    });
  }

  async getMilestoneRevisions(milestoneId) {
    return this.prisma.campaignMilestoneRevision.findMany({
      where: { milestoneId },
      include: {
        requestedBy: {
          select: { id: true, fullName: true, email: true },
        },
        reviewedBy: {
          select: { id: true, fullName: true, email: true },
        },
      },
      orderBy: { revisionNumber: 'desc' },
    });
  }

  async createMilestoneSubmission(milestoneId, submissionData) {
    return this.prisma.$transaction(async (tx) => {
      // Calculate submission attempt number (1, 2, 3...)
      const previousCount = await tx.campaignMilestoneSubmission.count({
        where: { milestoneId },
      });

      const submission = await tx.campaignMilestoneSubmission.create({
        data: {
          milestoneId,
          submissionNumber: previousCount + 1,
          submissionAttempt: previousCount + 1,
          evidenceDocId: submissionData.evidenceDocId || null,
          narrative: submissionData.narrative || submissionData.studentNotes || null,
          studentNotes: submissionData.studentNotes || submissionData.narrative || null,
          evidenceMediaUrls: Array.isArray(submissionData.evidenceMediaUrls) && submissionData.evidenceMediaUrls.length > 0
            ? submissionData.evidenceMediaUrls
            : (submissionData.demoUrl ? [submissionData.demoUrl] : []),
          evidenceDocumentUrls: Array.isArray(submissionData.evidenceDocumentUrls) && submissionData.evidenceDocumentUrls.length > 0
            ? submissionData.evidenceDocumentUrls
            : (Array.isArray(submissionData.evidenceFiles) ? submissionData.evidenceFiles : []),
          criteriaChecklist: Array.isArray(submissionData.criteriaChecklist) && submissionData.criteriaChecklist.length > 0
            ? submissionData.criteriaChecklist
            : (Array.isArray(submissionData.checklistAnswers) ? submissionData.checklistAnswers : []),
          status: 'PENDING_REVIEW',
        },
        include: {
          evidenceDoc: {
            select: { id: true, name: true, storageKey: true, mimeType: true },
          },
        },
      });

      await tx.campaignMilestone.update({
        where: { id: milestoneId },
        data: {
          status: 'SUBMITTED',
          updatedAt: new Date(),
        },
      });

      return submission;
    });
  }

  async reviewMilestoneSubmission(submissionId, { reviewedByUserId, status, rejectionReason }) {
    return this.prisma.$transaction(async (tx) => {
      const submission = await tx.campaignMilestoneSubmission.update({
        where: { id: submissionId },
        data: {
          status,
          reviewedByUserId,
          reviewedAt: new Date(),
          rejectionReason: status === 'REJECTED' ? rejectionReason : null,
          updatedAt: new Date(),
        },
      });

      const targetMilestoneStatus = status === 'APPROVED' ? 'APPROVED' : 'REJECTED';

      await tx.campaignMilestone.update({
        where: { id: submission.milestoneId },
        data: {
          status: targetMilestoneStatus,
          disbursedAt: status === 'APPROVED' ? new Date() : undefined,
          updatedAt: new Date(),
        },
      });

      return submission;
    });
  }
}

module.exports = new PrismaMilestoneRepositoryAdapter();
module.exports.PrismaMilestoneRepositoryAdapter = PrismaMilestoneRepositoryAdapter;
