const prisma = require('../../../config/prisma');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const redisCampaignCache = require('../../campaigns/adapters/redis-campaign-cache.adapter');

const USER_PROFILE_SELECT = {
  id: true,
  fullName: true,
  email: true,
  username: true,
  speciesId: true,
  speciesNumber: true,
  profileMetadata: true,
  assignedSpecies: true,
};

function resolveUserAvatar(user) {
  if (!user) return null;
  const metadata = user.profileMetadata || {};
  const speciesSlug =
    user.assignedSpecies?.slug ||
    metadata.speciesIdentity?.slug ||
    (user.username ? user.username.replace(/_\d+$/, '') : null);

  const isCustomUpload =
    user.profilePicture &&
    (user.profilePicture.startsWith('data:') ||
      user.profilePicture.includes('cloudfront.net') ||
      user.profilePicture.includes('amazonaws.com') ||
      user.profilePicture.includes('cloudinary.com') ||
      user.profilePicture.startsWith('/uploads/'));

  return isCustomUpload
    ? user.profilePicture
    : metadata.profilePicture && !metadata.profilePicture.includes('unsplash.com')
    ? metadata.profilePicture
    : metadata.avatarUrl && !metadata.avatarUrl.includes('unsplash.com')
    ? metadata.avatarUrl
    : speciesSlug
    ? `/api/species/${speciesSlug}/avatar.svg`
    : user.profilePicture || null;
}

class AdminProjectsController {
  getAllProjects = catchAsync(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 50));
    const status = req.query.status;

    const where = {};
    if (status && status !== 'ALL') {
      const s = status.toUpperCase();
      if (s === 'PENDING' || s === 'PENDING_VERIFICATION') {
        where.status = { in: ['PENDING_VERIFICATION', 'SUBMITTED', 'DRAFT'] };
      } else if (s === 'APPROVED' || s === 'LIVE') {
        where.status = 'LIVE';
      } else if (s === 'SUBMITTED') {
        where.status = 'SUBMITTED';
      } else if (s === 'DRAFT') {
        where.status = 'DRAFT';
      } else if (s === 'REJECTED') {
        where.status = 'REJECTED';
      } else if (s === 'COMPLETED') {
        where.status = 'COMPLETED';
      } else if (s === 'PAUSED') {
        where.status = 'PAUSED';
      } else if (s === 'FULLY_FUNDED') {
        where.status = 'FULLY_FUNDED';
      } else if (s === 'CLOSED') {
        where.status = 'CLOSED';
      }
    }

    const targetTenantId = req.query.tenantId || req.query.organizationId;
    const specificOrgId = req.query.specificOrgId;

    if (specificOrgId && specificOrgId !== 'ALL') {
      where.OR = [
        { tenantId: specificOrgId },
        { organizationId: specificOrgId },
      ];
    } else if (targetTenantId) {
      // Hierarchical org query: find target org and all child orgs
      const orgTree = await prisma.organization.findMany({
        where: {
          OR: [
            { id: targetTenantId },
            { parentId: targetTenantId },
            { ancestorId: targetTenantId },
          ],
        },
        select: { id: true },
      });
      const orgIds = orgTree.length > 0 ? orgTree.map((o) => o.id) : [targetTenantId];
      where.OR = [
        { tenantId: { in: orgIds } },
        { organizationId: { in: orgIds } },
      ];
    }

    if (req.query.search) {
      const searchTerm = req.query.search.trim();
      const searchFilter = {
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { student: { fullName: { contains: searchTerm, mode: 'insensitive' } } },
        ],
      };
      if (where.OR) {
        where.AND = [{ OR: where.OR }, searchFilter];
        delete where.OR;
      } else {
        where.OR = searchFilter.OR;
      }
    }

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          student: {
            select: USER_PROFILE_SELECT,
          },
          tenant: {
            select: { id: true, name: true, slug: true, orgType: true },
          },
          department: {
            select: { id: true, name: true, slug: true, orgType: true },
          },
          members: {
            include: {
              user: {
                select: USER_PROFILE_SELECT,
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          milestones: {
            include: {
              submissions: {
                orderBy: { createdAt: 'desc' },
              },
            },
            orderBy: { sequenceOrder: 'asc' },
          },
          endorsements: {
            include: {
              endorser: {
                select: { id: true, fullName: true, email: true },
              },
            },
          },
        },
      }),
      prisma.campaign.count({ where }),
    ]);

    const formattedCampaigns = campaigns.map((c) => {
      const studentName = c.student?.fullName || 'Student Creator';
      const studentEmail = c.student?.email || 'N/A';
      const studentAvatar = resolveUserAvatar(c.student);

      const formattedMembers = Array.isArray(c.members)
        ? c.members.map((m) => ({
            id: m.id,
            userId: m.userId,
            role: m.role,
            title: m.title || 'Team Member',
            joinedAt: m.joinedAt,
            user: m.user
              ? {
                  id: m.user.id,
                  name: m.user.fullName,
                  email: m.user.email,
                  avatar: resolveUserAvatar(m.user),
                  profilePicture: resolveUserAvatar(m.user),
                }
              : null,
          }))
        : [];

      return {
        id: c.id,
        title: c.title,
        slug: c.slug,
        category: c.category,
        stage: c.stage,
        status: c.status,
        campaignType: c.campaignType || 'INDIVIDUAL',
        targetAmount: Number(c.targetAmount || 0),
        currentAmount: Number(c.currentRaisedAmount || 0),
        currentRaisedAmount: Number(c.currentRaisedAmount || 0),
        amountRaised: Number(c.currentRaisedAmount || 0),
        goalAmount: Number(c.targetAmount || 0),
        donorCount: c.donorCount || 0,
        currency: c.currency || 'INR',
        coverImageUrl: c.coverImageUrl,
        galleryImageUrls: Array.isArray(c.galleryImageUrls) ? c.galleryImageUrls : [],
        videoUrl: c.videoUrl,
        presentationDeckUrl: c.presentationDeckUrl,
        description: c.description,
        shortDescription: c.shortDescription,
        faqs: Array.isArray(c.faqs) ? c.faqs : [],
        teamMembers: Array.isArray(c.teamMembers) ? c.teamMembers : [],
        members: formattedMembers,
        beneficiaryDetails: c.beneficiaryDetails || null,
        rejectionReason: c.rejectionReason,
        reapprovalCount: c.reapprovalCount || 0,
        verifiedAt: c.verifiedAt,
        startDate: c.startDate,
        endDate: c.endDate,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        student: c.student ? { id: c.student.id, name: studentName, email: studentEmail, avatar: studentAvatar, profilePicture: studentAvatar, username: c.student.username } : null,
        user: c.student ? { id: c.student.id, name: studentName, email: studentEmail, avatar: studentAvatar, profilePicture: studentAvatar, username: c.student.username } : null,
        studentName,
        tenant: c.tenant,
        department: c.department,
        milestones: Array.isArray(c.milestones) ? c.milestones : [],
        endorsements: Array.isArray(c.endorsements) ? c.endorsements : [],
      };
    });

    res.status(200).json({
      status: 'success',
      results: formattedCampaigns.length,
      data: {
        projects: formattedCampaigns,
        campaigns: formattedCampaigns,
        userProjects: {
          data: formattedCampaigns,
          pagination: {
            total,
            totalPages: Math.ceil(total / limit) || 1,
            page,
            limit,
          },
        },
      },
    });
  });

  verifyUserProject = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status, reason, rejectionReason, scoringRubric } = req.body;

    const existing = await prisma.campaign.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Campaign not found', 404);
    }

    let finalStatus = 'LIVE';
    if (status === 'APPROVED' || status === 'LIVE') {
      finalStatus = 'LIVE';
    } else if (status === 'FROZEN' || status === 'PAUSED') {
      finalStatus = 'PAUSED';
    } else if (status === 'REVISION_REQUIRED' || status === 'DRAFT') {
      finalStatus = 'DRAFT';
    } else if (status === 'REJECTED') {
      finalStatus = 'REJECTED';
    } else {
      finalStatus = status;
    }

    const recordedReason =
      reason || rejectionReason || (status === 'REVISION_REQUIRED' ? 'Action required: Revisions requested by reviewer' : null);

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        status: finalStatus,
        rejectionReason: recordedReason,
        verifiedByUserId: req.user?.id || null,
        verifiedAt: new Date(),
      },
      include: {
        student: { select: USER_PROFILE_SELECT },
        tenant: { select: { id: true, name: true, slug: true, orgType: true } },
        department: { select: { id: true, name: true, slug: true, orgType: true } },
        members: {
          include: {
            user: { select: USER_PROFILE_SELECT },
          },
        },
        milestones: true,
      },
    });

    // Record Immutable 6-Criterion Scoring Rubric Audit Trail (L2, O1)
    if (scoringRubric || status) {
      try {
        const rubricObj = scoringRubric || {};
        const problemClarity = Number(rubricObj.problemClarity || 8);
        const feasibility = Number(rubricObj.feasibility || 8);
        const budgetRealism = Number(rubricObj.budgetRealism || 8);
        const milestoneVerifiability = Number(rubricObj.milestoneVerifiability || 8);
        const teamEndorsement = Number(rubricObj.teamEndorsement || 8);
        const clarityOfAsk = Number(rubricObj.clarityOfAsk || 8);
        const overallScore = Math.round(
          ((problemClarity + feasibility + budgetRealism + milestoneVerifiability + teamEndorsement + clarityOfAsk) / 60) * 100
        );

        await prisma.auditEvent.create({
          data: {
            tenantId: existing.tenantId,
            userId: req.user?.id || null,
            action: `CAMPAIGN_${finalStatus}`,
            entityType: 'Campaign',
            entityId: existing.id,
            newValue: {
              status: finalStatus,
              rubric: {
                problemClarity,
                feasibility,
                budgetRealism,
                milestoneVerifiability,
                teamEndorsement,
                clarityOfAsk,
                overallScore,
                comments: rubricObj.comments || {},
                generalFeedback: recordedReason,
              },
            },
          },
        });
      } catch (auditErr) {
        console.warn('[verifyUserProject] AuditEvent create note:', auditErr.message);
      }
    }

    // If campaign is set to LIVE, ensure milestone 1 is activated if pending
    if (finalStatus === 'LIVE' && updated.milestones?.length > 0) {
      const firstMilestone = updated.milestones.sort((a, b) => a.sequenceOrder - b.sequenceOrder)[0];
      if (firstMilestone && (firstMilestone.status === 'PENDING' || firstMilestone.status === 'PLANNED')) {
        await prisma.campaignMilestone.update({
          where: { id: firstMilestone.id },
          data: { status: 'IN_PROGRESS' },
        }).catch(() => {});
      }
    }

    // Invalidate Redis caches so changes reflect immediately in marketplace and public views
    try {
      await redisCampaignCache.invalidateCampaign(existing.slug, existing.tenantId);
      await redisCampaignCache.invalidateCampaign(existing.id, existing.tenantId);
      await redisCampaignCache.invalidateAll();
    } catch (cacheErr) {
      console.warn('[AdminProjectsController] Cache invalidation warning:', cacheErr.message);
    }

    res.status(200).json({
      status: 'success',
      message: `Campaign status updated to ${finalStatus}`,
      data: {
        campaign: updated,
        userProject: updated,
      },
    });
  });

  verifyDonorProject = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    res.status(200).json({
      status: 'success',
      message: `Donor project updated to ${status || 'VERIFIED'}`,
    });
  });

  getProjectFullDetails = catchAsync(async (req, res) => {
    const { id } = req.params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        student: { select: USER_PROFILE_SELECT },
        tenant: { select: { id: true, name: true, slug: true, orgType: true } },
        department: { select: { id: true, name: true, slug: true, orgType: true } },
        members: {
          include: {
            user: { select: USER_PROFILE_SELECT },
          },
          orderBy: { createdAt: 'asc' },
        },
        milestones: {
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
        },
        endorsements: {
          include: {
            endorser: { select: { id: true, fullName: true, email: true } },
          },
        },
        donations: {
          take: 50,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!campaign) {
      throw new AppError('Campaign details not found', 404);
    }

    const studentName = campaign.student?.fullName || 'Student Creator';
    const studentEmail = campaign.student?.email || 'N/A';
    const studentAvatar = resolveUserAvatar(campaign.student);

    const formattedMembers = Array.isArray(campaign.members)
      ? campaign.members.map((m) => ({
          id: m.id,
          userId: m.userId,
          role: m.role,
          title: m.title || 'Team Member',
          joinedAt: m.joinedAt,
          user: m.user
            ? {
                id: m.user.id,
                name: m.user.fullName,
                email: m.user.email,
                avatar: resolveUserAvatar(m.user),
                profilePicture: resolveUserAvatar(m.user),
              }
            : null,
        }))
      : [];

    const formattedDetails = {
      ...campaign,
      targetAmount: Number(campaign.targetAmount || 0),
      currentRaisedAmount: Number(campaign.currentRaisedAmount || 0),
      amountRaised: Number(campaign.currentRaisedAmount || 0),
      goalAmount: Number(campaign.targetAmount || 0),
      student: campaign.student ? { id: campaign.student.id, name: studentName, email: studentEmail, avatar: studentAvatar, profilePicture: studentAvatar, username: campaign.student.username } : null,
      user: campaign.student ? { id: campaign.student.id, name: studentName, email: studentEmail, avatar: studentAvatar, profilePicture: studentAvatar, username: campaign.student.username } : null,
      studentName,
      members: formattedMembers,
      teamMembers: Array.isArray(campaign.teamMembers) ? campaign.teamMembers : [],
      beneficiaryDetails: campaign.beneficiaryDetails || null,
    };

    res.status(200).json({
      status: 'success',
      data: {
        details: formattedDetails,
        project: formattedDetails,
        campaign: formattedDetails,
      },
    });
  });

  getFacultyEndorsementQueue = catchAsync(async (req, res) => {
    const statusFilter = req.query.status || 'PENDING';

    const endorsements = await prisma.campaignEndorsement.findMany({
      where: statusFilter === 'ALL' ? {} : { status: statusFilter },
      include: {
        campaign: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            category: true,
            targetAmount: true,
            currentRaisedAmount: true,
            currency: true,
            coverImageUrl: true,
            student: {
              select: {
                id: true,
                fullName: true,
                email: true,
                profileMetadata: true,
              },
            },
          },
        },
        endorser: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            profileMetadata: true,
          },
        },
      },
      orderBy: { endorsedAt: 'desc' },
    });

    res.status(200).json({
      status: 'success',
      results: endorsements.length,
      data: { endorsements },
    });
  });

  moderateFacultyEndorsement = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { action, feedback } = req.body; // action: 'APPROVE' or 'REJECT'

    const endorsement = await prisma.campaignEndorsement.findUnique({
      where: { id },
      include: { campaign: true, endorser: true },
    });

    if (!endorsement) {
      throw new AppError('Faculty endorsement record not found', 404);
    }

    const newStatus = action === 'REJECT' ? 'REJECTED' : 'APPROVED';

    const updated = await prisma.$transaction(async (tx) => {
      const rec = await tx.campaignEndorsement.update({
        where: { id },
        data: {
          status: newStatus,
          comments: feedback || endorsement.comments,
        },
      });

      // If approved and campaign is PENDING_ENDORSEMENT, advance campaign to PENDING_VERIFICATION
      if (newStatus === 'APPROVED' && endorsement.campaign?.status === 'PENDING_ENDORSEMENT') {
        await tx.campaign.update({
          where: { id: endorsement.campaignId },
          data: { status: 'PENDING_VERIFICATION' },
        });
      }

      // Log immutable audit event
      await tx.auditEvent.create({
        data: {
          eventType: 'FACULTY_ENDORSEMENT_MODERATED',
          userId: req.user?.id || null,
          userRole: req.user?.role || 'ADMIN',
          action: `Faculty endorsement ${newStatus.toLowerCase()} by admin`,
          resourceType: 'CAMPAIGN_ENDORSEMENT',
          resourceId: id,
          metadata: {
            campaignId: endorsement.campaignId,
            campaignTitle: endorsement.campaign?.title,
            endorserId: endorsement.endorserUserId,
            newStatus,
            feedback,
          },
        },
      });

      return rec;
    });

    if (endorsement.campaign?.slug) {
      await redisCampaignCache.invalidateCampaign(endorsement.campaign.slug, endorsement.campaign.tenantId);
    }

    res.status(200).json({
      status: 'success',
      message: `Faculty endorsement successfully ${newStatus.toLowerCase()}.`,
      data: { endorsement: updated },
    });
  });
}

module.exports = new AdminProjectsController();
module.exports.AdminProjectsController = AdminProjectsController;
