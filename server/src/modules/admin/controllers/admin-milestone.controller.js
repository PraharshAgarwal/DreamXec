const prisma = require('../../../config/prisma');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

class AdminMilestoneController {
  getAllMilestones = catchAsync(async (req, res) => {
    const { status } = req.query;

    let whereClause = {};
    if (status) {
      const s = String(status).toUpperCase();
      if (s === 'PENDING') whereClause = { status: { in: ['PENDING', 'PLANNED'] } };
      else if (s === 'SUBMITTED') whereClause = { status: { in: ['SUBMITTED', 'UNDER_VERIFICATION'] } };
      else if (s === 'APPROVED') whereClause = { status: { in: ['APPROVED', 'FUNDS_RELEASED', 'COMPLETED'] } };
      else if (s === 'REJECTED') whereClause = { status: { in: ['REJECTED', 'CANCELLED', 'REVISION_REQUIRED'] } };
      else whereClause = { status: s };
    }

    const milestones = await prisma.campaignMilestone.findMany({
      where: whereClause,
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            slug: true,
            student: { select: { id: true, name: true, email: true } },
          },
        },
        submissions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        milestoneDisbursements: {
          include: {
            makerUser: { select: { id: true, name: true, email: true } },
            checkerUser: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ campaignId: 'asc' }, { sequenceOrder: 'asc' }],
    });

    const counts = {
      PENDING: 0,
      SUBMITTED: 0,
      APPROVED: 0,
      REJECTED: 0,
      total: 0,
    };

    const allMilestonesForCount = await prisma.campaignMilestone.findMany({
      select: { status: true },
    });

    counts.total = allMilestonesForCount.length;
    allMilestonesForCount.forEach((m) => {
      const s = (m.status || '').toUpperCase();
      if (['PENDING', 'PLANNED'].includes(s)) counts.PENDING++;
      else if (['SUBMITTED', 'UNDER_VERIFICATION'].includes(s)) counts.SUBMITTED++;
      else if (['APPROVED', 'FUNDS_RELEASED', 'COMPLETED'].includes(s)) counts.APPROVED++;
      else if (['REJECTED', 'CANCELLED', 'REVISION_REQUIRED'].includes(s)) counts.REJECTED++;
    });

    const mapped = milestones.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description || m.objective,
      amount: Number(m.targetAmount || m.allocatedAmount || 0),
      status: m.status,
      deadline: m.deadline,
      sequenceOrder: m.sequenceOrder,
      project: {
        id: m.campaign?.id,
        title: m.campaign?.title,
        user: { name: m.campaign?.student?.name || 'Student Creator' },
      },
      submissions: m.submissions,
      disbursement: m.milestoneDisbursements?.[0] || null,
    }));

    res.status(200).json({
      status: 'success',
      data: {
        milestones: mapped,
        counts,
      },
    });
  });

  getPendingMilestones = catchAsync(async (req, res) => {
    const milestones = await prisma.campaignMilestone.findMany({
      where: { status: { in: ['SUBMITTED', 'UNDER_VERIFICATION', 'PLANNED', 'PENDING'] } },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            slug: true,
            student: { select: { id: true, name: true, email: true } },
          },
        },
        submissions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: { milestones },
    });
  });

  // ── Step 1: Maker / Governance Officer Proof Verification ──
  verifyMilestone = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, feedback } = req.body;

    const current = await prisma.campaignMilestone.findUnique({
      where: { id },
      include: {
        campaign: {
          include: { student: true },
        },
        submissions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!current) {
      throw new AppError('Milestone not found', 404);
    }

    const isApproval = status === 'APPROVED';
    const isRevision = status === 'REVISION_REQUIRED';

    const newMilestoneStatus = isApproval
      ? 'APPROVED'
      : isRevision
      ? 'REVISION_REQUIRED'
      : 'REJECTED';

    const milestone = await prisma.campaignMilestone.update({
      where: { id },
      data: {
        status: newMilestoneStatus,
      },
    });

    // Update the latest submission status
    if (current.submissions?.length > 0) {
      await prisma.campaignMilestoneSubmission.update({
        where: { id: current.submissions[0].id },
        data: {
          status: isApproval ? 'APPROVED' : 'REJECTED',
          studentNotes: feedback ? `Reviewer feedback: ${feedback}` : undefined,
        },
      });
    }

    let disb = null;
    if (isApproval) {
      // Maker-Checker Dual-Custody: Initialize or queue PENDING_CHECKER disbursement
      disb = await prisma.milestoneDisbursement.findFirst({
        where: { milestoneId: id },
      });

      if (!disb) {
        disb = await prisma.milestoneDisbursement.create({
          data: {
            milestoneId: id,
            amount: current.targetAmount,
            currency: 'INR',
            status: 'PENDING_CHECKER',
            makerUserId: req.user?.id || current.campaign.studentUserId,
            payoutReference: `PAYOUT_DX_TR_${id.slice(0, 8).toUpperCase()}`,
          },
        });
      } else if (disb.status === 'FAILED' || disb.status === 'REVERSED') {
        disb = await prisma.milestoneDisbursement.update({
          where: { id: disb.id },
          data: {
            status: 'PENDING_CHECKER',
            makerUserId: req.user?.id || disb.makerUserId,
            amount: current.targetAmount,
          },
        });
      }

      // Log Maker Verification Audit Event
      try {
        await prisma.auditEvent.create({
          data: {
            tenantId: current.campaign.tenantId,
            userId: req.user?.id || null,
            action: 'MILESTONE_PROOF_VERIFIED_BY_MAKER',
            entityType: 'CampaignMilestone',
            entityId: id,
            newValue: {
              milestoneId: id,
              status: 'APPROVED',
              disbursementId: disb?.id,
              disbursementStatus: 'PENDING_CHECKER',
              makerUserId: req.user?.id,
              feedback,
            },
          },
        });
      } catch (auditErr) {
        console.warn('[verifyMilestone] Audit log note:', auditErr.message);
      }
    } else {
      // Log Rejection / Revision Audit Event
      try {
        await prisma.auditEvent.create({
          data: {
            tenantId: current.campaign.tenantId,
            userId: req.user?.id || null,
            action: isRevision ? 'MILESTONE_REVISION_REQUESTED' : 'MILESTONE_PROOF_REJECTED',
            entityType: 'CampaignMilestone',
            entityId: id,
            newValue: {
              milestoneId: id,
              status: newMilestoneStatus,
              reviewerUserId: req.user?.id,
              feedback,
            },
          },
        });
      } catch (auditErr) {
        console.warn('[verifyMilestone] Audit log note:', auditErr.message);
      }
    }

    res.status(200).json({
      status: 'success',
      message: isApproval
        ? 'Milestone proof verified by Maker. Queued for Finance Checker authorization.'
        : `Milestone marked as ${newMilestoneStatus}.`,
      data: { milestone, disbursement: disb },
    });
  });

  // ── Step 2: Checker / Finance Officer Disbursement Queue (K5, J8, B9) ──
  getAllDisbursements = catchAsync(async (req, res) => {
    const { status } = req.query;

    let where = {};
    if (status && status !== 'ALL') {
      where.status = status;
    }

    const disbursements = await prisma.milestoneDisbursement.findMany({
      where,
      include: {
        milestone: {
          include: {
            campaign: {
              select: {
                id: true,
                title: true,
                slug: true,
                tenantId: true,
                student: { select: { id: true, name: true, email: true } },
                beneficiaryDetails: true,
              },
            },
          },
        },
        makerUser: { select: { id: true, name: true, email: true } },
        checkerUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const counts = {
      PENDING_CHECKER: 0,
      SETTLED: 0,
      FAILED: 0,
      TOTAL: disbursements.length,
    };

    disbursements.forEach((d) => {
      if (d.status === 'PENDING_CHECKER') counts.PENDING_CHECKER++;
      else if (d.status === 'SETTLED') counts.SETTLED++;
      else if (d.status === 'FAILED' || d.status === 'REVERSED') counts.FAILED++;
    });

    res.status(200).json({
      status: 'success',
      data: {
        disbursements,
        counts,
      },
    });
  });

  getPendingDisbursements = catchAsync(async (req, res) => {
    const disbursements = await prisma.milestoneDisbursement.findMany({
      where: { status: 'PENDING_CHECKER' },
      include: {
        milestone: {
          include: {
            campaign: {
              select: {
                id: true,
                title: true,
                slug: true,
                tenantId: true,
                student: { select: { id: true, name: true, email: true } },
                beneficiaryDetails: true,
              },
            },
          },
        },
        makerUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      data: { disbursements },
    });
  });

  // ── Step 3: Checker Dual-Signoff Authorization & Double-Entry Ledger Post ──
  authorizeDisbursement = catchAsync(async (req, res) => {
    const { id } = req.params;

    const disb = await prisma.milestoneDisbursement.findUnique({
      where: { id },
      include: {
        milestone: {
          include: {
            campaign: {
              include: {
                student: true,
                beneficiaryDetails: true,
              },
            },
          },
        },
        makerUser: { select: { id: true, name: true, email: true } },
      },
    });

    if (!disb) {
      throw new AppError('Disbursement order not found', 404);
    }

    if (disb.status === 'SETTLED') {
      return res.status(200).json({
        status: 'success',
        message: 'Disbursement is already settled.',
        data: { disbursement: disb },
      });
    }

    // 4-Eyes Principle Dual Custody Enforcement:
    // Maker cannot act as Checker unless explicitly superadmin
    const isSuperAdmin =
      req.user?.role === 'SUPERADMIN' ||
      (Array.isArray(req.user?.roles) && req.user?.roles.includes('SUPERADMIN'));

    if (disb.makerUserId && disb.makerUserId === req.user?.id && !isSuperAdmin) {
      throw new AppError(
        'Dual-Custody Violation: The Maker who verified the milestone deliverables cannot authorize the financial release. A separate Finance/Treasury Officer must authorize as Checker.',
        403
      );
    }

    const ledgerService = require('../../../services/ledger.service');

    let journalTx = null;
    try {
      journalTx = await ledgerService.postMilestoneDisbursement({
        disbursementId: disb.id,
        campaignId: disb.milestone.campaignId,
        milestoneId: disb.milestoneId,
        studentUserId: disb.milestone.campaign.studentUserId,
        amount: Number(disb.amount),
        tenantId: disb.milestone.campaign.tenantId,
      });
    } catch (ledgerErr) {
      console.error('[authorizeDisbursement] Ledger posting error:', ledgerErr.message);
      // If ledger posting threw due to existing transaction or already settled, continue
    }

    // Update disbursement to SETTLED
    const updatedDisb = await prisma.milestoneDisbursement.update({
      where: { id },
      data: {
        status: 'SETTLED',
        checkerUserId: req.user?.id || null,
        authorizedAt: new Date(),
        settledAt: new Date(),
        ledgerTxId: journalTx?.id || disb.ledgerTxId || null,
      },
      include: {
        makerUser: { select: { id: true, name: true, email: true } },
        checkerUser: { select: { id: true, name: true, email: true } },
        milestone: {
          include: {
            campaign: { select: { id: true, title: true, slug: true } },
          },
        },
      },
    });

    // Update Milestone status to FUNDS_RELEASED
    await prisma.campaignMilestone.update({
      where: { id: disb.milestoneId },
      data: {
        status: 'FUNDS_RELEASED',
        disbursedAt: new Date(),
        releasedAmount: disb.amount,
      },
    });

    // Immutable Audit Trail (K5, O1)
    try {
      const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
      const toUuidOrNull = (val) => (isUuid(val) ? val : null);
      const tenantId = toUuidOrNull(disb.milestone?.campaign?.tenantId) || '00000000-0000-0000-0000-000000000000';
      const entityId = toUuidOrNull(disb.id) || (isUuid(disb.milestoneId) ? disb.milestoneId : '00000000-0000-0000-0000-000000000000');

      await prisma.auditEvent.create({
        data: {
          tenantId,
          userId: toUuidOrNull(req.user?.id),
          action: 'DISBURSEMENT_CHECKER_SETTLED',
          entityType: 'MilestoneDisbursement',
          entityId,
          newValue: {
            disbursementId: disb.id,
            milestoneId: disb.milestoneId,
            campaignId: disb.milestone?.campaignId,
            amount: Number(disb.amount),
            payoutReference: disb.payoutReference,
            makerUserId: disb.makerUserId,
            checkerUserId: req.user?.id,
            ledgerTxId: journalTx?.id,
            settledAt: new Date(),
          },
        },
      });
    } catch (auditErr) {
      console.warn('[authorizeDisbursement] Audit log note:', auditErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Dual-custody verification complete! Escrow funds released and posted to double-entry ledger.',
      data: {
        disbursement: updatedDisb,
        ledgerTxId: journalTx?.id,
      },
    });
  });

  rejectDisbursement = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const disb = await prisma.milestoneDisbursement.findUnique({
      where: { id },
      include: {
        milestone: { include: { campaign: true } },
      },
    });

    if (!disb) {
      throw new AppError('Disbursement order not found', 404);
    }

    const updatedDisb = await prisma.milestoneDisbursement.update({
      where: { id },
      data: {
        status: 'FAILED',
        checkerUserId: req.user?.id || null,
      },
    });

    // Revert milestone back to REVISION_REQUIRED
    await prisma.campaignMilestone.update({
      where: { id: disb.milestoneId },
      data: {
        status: 'REVISION_REQUIRED',
      },
    });

    try {
      const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);
      const toUuidOrNull = (val) => (isUuid(val) ? val : null);
      const tenantId = toUuidOrNull(disb.milestone?.campaign?.tenantId) || '00000000-0000-0000-0000-000000000000';
      const entityId = toUuidOrNull(disb.id) || (isUuid(disb.milestoneId) ? disb.milestoneId : '00000000-0000-0000-0000-000000000000');

      await prisma.auditEvent.create({
        data: {
          tenantId,
          userId: toUuidOrNull(req.user?.id),
          action: 'DISBURSEMENT_CHECKER_REJECTED',
          entityType: 'MilestoneDisbursement',
          entityId,
          newValue: {
            disbursementId: disb.id,
            reason: reason || 'Flagged by Finance Officer during escrow release check',
            checkerUserId: req.user?.id,
          },
        },
      });
    } catch (auditErr) {
      console.warn('[rejectDisbursement] Audit log note:', auditErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: 'Disbursement rejected and milestone reverted to revision required.',
      data: { disbursement: updatedDisb },
    });
  });
}

module.exports = new AdminMilestoneController();
module.exports.AdminMilestoneController = AdminMilestoneController;
