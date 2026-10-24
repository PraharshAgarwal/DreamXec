const prisma = require('../../../config/prisma');
const CampaignRepositoryPort = require('../ports/campaign-repository.port');

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

/**
 * High-performance Prisma Adapter for Campaign Aggregate.
 * Optimized for 10k+ concurrent read traffic and transactional safety.
 */
class PrismaCampaignRepositoryAdapter extends CampaignRepositoryPort {
  constructor({ prismaClient = prisma } = {}) {
    super();
    this.prisma = prismaClient;
  }

  async createCampaign(campaignData, initialMilestones = []) {
    return this.prisma.$transaction(async (tx) => {
      const createdCampaign = await tx.campaign.create({
        data: {
          tenantId: campaignData.tenantId,
          studentUserId: campaignData.studentUserId,
          organizationId: campaignData.organizationId || null,
          title: campaignData.title,
          slug: campaignData.slug,
          category: campaignData.category,
          campaignType: campaignData.campaignType || 'INDIVIDUAL',
          stage: campaignData.stage || 'DISCOVERY',
          shortDescription: campaignData.shortDescription,
          description: campaignData.description,
          coverImageUrl: campaignData.coverImageUrl,
          galleryImageUrls: campaignData.galleryImageUrls || [],
          videoUrl: campaignData.videoUrl || null,
          presentationDeckUrl: campaignData.presentationDeckUrl || null,
          beneficiaryUserId: campaignData.beneficiaryUserId || null,
          beneficiaryDetails: campaignData.beneficiaryDetails || null,
          faqs: campaignData.faqs || [],
          teamMembers: campaignData.teamMembers || [],
          targetAmount: campaignData.targetAmount,
          minDonationAmount: campaignData.minDonationAmount || 1.00,
          currency: campaignData.currency || 'INR',
          status: campaignData.status || 'DRAFT',
          milestones: {
            create: initialMilestones.map((m, idx) => ({
              sequenceOrder: m.sequenceOrder || idx + 1,
              title: m.title,
              description: m.description || null,
              durationDays: m.durationDays ? parseInt(m.durationDays, 10) : 30,
              deadline: m.deadline ? new Date(m.deadline) : null,
              targetAmount: m.targetAmount || m.budget,
              acceptanceCriteria: m.acceptanceCriteria || [],
              requiredEvidenceTypes: m.requiredEvidenceTypes || [],
              status: 'PLANNED',
            })),
          },
        },
        include: {
          milestones: {
            orderBy: { sequenceOrder: 'asc' },
          },
          student: {
            select: USER_PROFILE_SELECT,
          },
          tenant: {
            select: { id: true, name: true, slug: true },
          },
        },
      });

      // Auto-create Campaign Owner member record
      await tx.campaignMember.create({
        data: {
          campaignId: createdCampaign.id,
          userId: campaignData.studentUserId,
          role: 'OWNER',
          title: 'Project Lead',
        },
      });

      // Create CampaignMember records for validated collaborative team members
      if (Array.isArray(campaignData.teamMembers)) {
        for (const tm of campaignData.teamMembers) {
          if (tm.userId && tm.userId !== campaignData.studentUserId) {
            await tx.campaignMember.create({
              data: {
                campaignId: createdCampaign.id,
                userId: tm.userId,
                role: tm.role || 'MEMBER',
                title: tm.title || 'Team Member',
                invitedBy: campaignData.studentUserId,
              },
            });
          }
        }
      }

      return createdCampaign;
    });
  }

  async findByIdOrSlug(idOrSlug) {
    if (!idOrSlug) return null;
    const cleanQuery = String(idOrSlug).trim();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanQuery);

    const includeClause = {
      milestones: {
        orderBy: { sequenceOrder: 'asc' },
      },
      endorsements: {
        include: {
          endorser: {
            select: { id: true, fullName: true, email: true },
          },
        },
      },
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
    };

    // 1. Direct Lookup by ID or Unique Slug
    let campaign = await this.prisma.campaign.findUnique({
      where: isUuid ? { id: cleanQuery } : { slug: cleanQuery },
      include: includeClause,
    });

    // 2. Case-insensitive slug match
    if (!campaign && !isUuid) {
      campaign = await this.prisma.campaign.findFirst({
        where: {
          slug: { equals: cleanQuery, mode: 'insensitive' },
        },
        include: includeClause,
      });
    }

    // 3. Fallback: Search by partial slug or title
    if (!campaign) {
      campaign = await this.prisma.campaign.findFirst({
        where: {
          OR: [
            { slug: { contains: cleanQuery, mode: 'insensitive' } },
            { title: { contains: cleanQuery, mode: 'insensitive' } },
          ],
        },
        include: includeClause,
      });
    }

    return campaign;
  }

  async findPublicCampaigns({ category, search, page = 1, limit = 20, cursor = null } = {}) {
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = cursor ? 1 : (pageNum - 1) * limitNum;

    const where = {
      status: { in: ['LIVE', 'FULLY_FUNDED', 'DISBURSING', 'COMPLETED'] },
      ...(category && category !== 'ALL' ? { category } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { shortDescription: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const rawCampaigns = await this.prisma.campaign.findMany({
      where,
      ...(cursor ? { cursor: { id: cursor }, skip } : { skip, take: limitNum }),
      select: {
        id: true,
        title: true,
        slug: true,
        category: true,
        campaignType: true,
        stage: true,
        shortDescription: true,
        coverImageUrl: true,
        videoUrl: true,
        targetAmount: true,
        currentRaisedAmount: true,
        donorCount: true,
        currency: true,
        status: true,
        createdAt: true,
        student: {
          select: {
            id: true,
            fullName: true,
            username: true,
            speciesNumber: true,
            assignedSpecies: {
              select: {
                id: true,
                commonName: true,
                slug: true,
                avatarUrl: true,
              },
            },
          },
        },
        tenant: {
          select: { id: true, name: true, slug: true },
        },
        milestones: {
          orderBy: { sequenceOrder: 'asc' },
          select: {
            id: true,
            title: true,
            targetAmount: true,
            status: true,
            sequenceOrder: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const total =
      rawCampaigns.length < limitNum && pageNum === 1
        ? rawCampaigns.length
        : await this.prisma.campaign.count({ where });

    const hasNextPage = skip + rawCampaigns.length < total;
    const nextCursor = rawCampaigns.length > 0 ? rawCampaigns[rawCampaigns.length - 1].id : null;

    return {
      campaigns: rawCampaigns,
      total,
      page: pageNum,
      limit: limitNum,
      hasNextPage,
      nextCursor,
    };
  }

  async findUserCampaigns(userId, orgId = null, { page = 1, limit = 50 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * take;

    const where = {
      OR: [
        { studentUserId: userId },
        { members: { some: { userId } } },
      ],
    };

    if (orgId) {
      where.AND = [
        {
          OR: [
            { tenantId: orgId },
            { organizationId: orgId },
          ],
        },
      ];
    }

    return this.prisma.campaign.findMany({
      where,
      skip,
      take,
      include: {
        student: {
          select: USER_PROFILE_SELECT,
        },
        milestones: {
          include: {
            submissions: {
              orderBy: { submissionAttempt: 'desc' },
            },
          },
          orderBy: { sequenceOrder: 'asc' },
        },
        tenant: {
          select: { id: true, name: true, slug: true },
        },
        endorsements: {
          include: {
            endorser: {
              select: { id: true, fullName: true },
            },
          },
        },
        members: {
          include: {
            user: {
              select: USER_PROFILE_SELECT,
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingCampaigns(tenantId = null) {
    const where = {
      OR: [
        { status: { in: ['PENDING_VERIFICATION', 'SUBMITTED', 'PENDING_ENDORSEMENT'] } },
        {
          status: 'PAUSED',
          milestones: {
            some: {
              revisions: {
                some: { status: 'PENDING_APPROVAL' },
              },
            },
          },
        },
      ],
      ...(tenantId ? { tenantId } : {}),
    };
    return this.prisma.campaign.findMany({
      where,
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
            revisions: {
              include: {
                requestedBy: {
                  select: { id: true, fullName: true, email: true },
                },
              },
              orderBy: { revisionNumber: 'desc' },
            },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTenantCampaigns(tenantId, status = null) {
    return this.prisma.campaign.findMany({
      where: {
        tenantId,
        ...(status ? { status } : {}),
      },
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
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCampaign(id, updateData, requestedByUserId = null) {
    const { milestones, teamMembers, beneficiaryDetails, changeReason, ...campaignFields } = updateData;

    return this.prisma.$transaction(async (tx) => {
      // Fetch existing campaign state before updates
      const existingCampaign = await tx.campaign.findUnique({
        where: { id },
        include: {
          milestones: {
            include: {
              revisions: { orderBy: { revisionNumber: 'desc' } },
            },
            orderBy: { sequenceOrder: 'asc' },
          },
        },
      });

      if (!existingCampaign) {
        throw new Error('Campaign not found.');
      }

      const isLiveOrApproved = ['LIVE', 'APPROVED', 'PAUSED'].includes(existingCampaign.status);
      let milestoneChangesDetected = false;

      // 1. Synchronize milestones if provided
      if (Array.isArray(milestones) && milestones.length > 0) {
        const existingMilestones = existingCampaign.milestones || [];
        const existingMap = new Map(existingMilestones.map((m) => [m.id, m]));
        const incomingIds = new Set(
          milestones
            .map((m) => m.id)
            .filter((mid) => mid && !mid.startsWith('m_') && existingMap.has(mid))
        );

        // Delete milestones that were removed (only non-disbursed)
        const toDeleteIds = existingMilestones
          .filter((m) => !incomingIds.has(m.id) && m.status !== 'APPROVED' && m.status !== 'COMPLETED')
          .map((m) => m.id);

        if (toDeleteIds.length > 0) {
          milestoneChangesDetected = true;
          await tx.campaignMilestoneRevision?.deleteMany?.({
            where: { milestoneId: { in: toDeleteIds } },
          });
          await tx.campaignMilestoneSubmission?.deleteMany?.({
            where: { milestoneId: { in: toDeleteIds } },
          });
          await tx.campaignMilestone.deleteMany({
            where: { id: { in: toDeleteIds } },
          });
        }

        // Upsert incoming milestones
        for (let i = 0; i < milestones.length; i++) {
          const m = milestones[i];
          const seqOrder = m.sequenceOrder || m.order || i + 1;
          const targetAmount = Number(m.budget || m.targetAmount || 0);
          const durationDays = parseInt(m.durationDays || 30, 10);
          const deadline = m.deadline ? new Date(m.deadline) : null;
          const acceptanceCriteria = Array.isArray(m.acceptanceCriteria) ? m.acceptanceCriteria : [];
          const requiredEvidenceTypes = Array.isArray(m.requiredEvidenceTypes) ? m.requiredEvidenceTypes : [];

          if (m.id && existingMap.has(m.id)) {
            const existingM = existingMap.get(m.id);
            const isChanged =
              existingM.title !== m.title ||
              (m.description && existingM.description !== m.description) ||
              Number(existingM.targetAmount) !== targetAmount ||
              existingM.durationDays !== durationDays ||
              JSON.stringify(existingM.acceptanceCriteria || []) !== JSON.stringify(acceptanceCriteria) ||
              JSON.stringify(existingM.requiredEvidenceTypes || []) !== JSON.stringify(requiredEvidenceTypes);

            if (isChanged) {
              milestoneChangesDetected = true;
              const maxRev = await tx.campaignMilestoneRevision.findFirst({
                where: { milestoneId: m.id },
                orderBy: { revisionNumber: 'desc' },
                select: { revisionNumber: true },
              });
              const nextRevNum = (maxRev?.revisionNumber || existingM.currentVersion || 0) + 1;

              // If campaign is live/approved, record versioned revision snapshot
              if (isLiveOrApproved) {
                await tx.campaignMilestoneRevision.create({
                  data: {
                    milestoneId: m.id,
                    revisionNumber: nextRevNum,
                    title: m.title,
                    description: m.description || m.objective || null,
                    targetAmount,
                    changeReason: updateData.changeReason || 'Milestone updated during campaign editing.',
                    status: 'PENDING_APPROVAL',
                    requestedByUserId: requestedByUserId || existingCampaign.studentUserId,
                    createdAt: new Date(),
                  },
                });
              }

              await tx.campaignMilestone.update({
                where: { id: m.id },
                data: {
                  title: m.title,
                  description: m.description || m.objective || null,
                  targetAmount,
                  durationDays,
                  deadline,
                  sequenceOrder: seqOrder,
                  acceptanceCriteria,
                  requiredEvidenceTypes,
                  currentVersion: isLiveOrApproved ? existingM.currentVersion : nextRevNum,
                  updatedAt: new Date(),
                },
              });
            }
          } else {
            // New milestone added
            milestoneChangesDetected = true;
            const newMilestone = await tx.campaignMilestone.create({
              data: {
                campaignId: id,
                title: m.title,
                description: m.description || m.objective || null,
                targetAmount,
                durationDays,
                deadline,
                sequenceOrder: seqOrder,
                acceptanceCriteria,
                requiredEvidenceTypes,
                status: 'PLANNED',
                currentVersion: 1,
              },
            });

            if (isLiveOrApproved) {
              await tx.campaignMilestoneRevision.create({
                data: {
                  milestoneId: newMilestone.id,
                  revisionNumber: 1,
                  title: m.title,
                  description: m.description || m.objective || null,
                  targetAmount,
                  changeReason: updateData.changeReason || 'New milestone tranche added to campaign.',
                  status: 'PENDING_APPROVAL',
                  requestedByUserId: requestedByUserId || existingCampaign.studentUserId,
                  createdAt: new Date(),
                },
              });
            }
          }
        }
      }

      // 2. Prepare campaign scalar fields
      const dataToUpdate = {
        ...campaignFields,
        ...(beneficiaryDetails !== undefined ? { beneficiaryDetails } : {}),
        updatedAt: new Date(),
      };

      // 3. If live/approved campaign had milestone modifications, PAUSE it pending admin review!
      if (isLiveOrApproved && milestoneChangesDetected) {
        dataToUpdate.status = 'PAUSED';
      }

      if (Array.isArray(teamMembers)) {
        dataToUpdate.teamMembers = teamMembers;

        // Upsert CampaignMember records for validated team members
        for (const tm of teamMembers) {
          if (tm.userId) {
            const existingMember = await tx.campaignMember.findFirst({
              where: { campaignId: id, userId: tm.userId },
            });
            const roleEnum = tm.role === 'OWNER' ? 'OWNER' : 'MEMBER';
            const customTitle = tm.title || (tm.role && tm.role !== 'OWNER' && tm.role !== 'MEMBER' ? tm.role : 'Team Member');
            if (!existingMember) {
              await tx.campaignMember.create({
                data: {
                  campaignId: id,
                  userId: tm.userId,
                  role: roleEnum,
                  title: customTitle,
                },
              });
            } else {
              await tx.campaignMember.update({
                where: { id: existingMember.id },
                data: {
                  role: roleEnum,
                  title: customTitle,
                },
              });
            }
          }
        }
      }

      if (dataToUpdate.goalAmount !== undefined) {
        dataToUpdate.targetAmount = dataToUpdate.goalAmount;
        delete dataToUpdate.goalAmount;
      }

      return tx.campaign.update({
        where: { id },
        data: dataToUpdate,
        include: {
          milestones: {
            include: {
              revisions: { orderBy: { revisionNumber: 'desc' } },
            },
            orderBy: { sequenceOrder: 'asc' },
          },
          members: {
            include: {
              user: {
                select: USER_PROFILE_SELECT,
              },
            },
          },
          tenant: {
            select: { id: true, name: true, slug: true },
          },
        },
      });
    }, {
      timeout: 25000,
      maxWait: 10000,
    });
  }

  async deleteCampaign(id) {
    return this.prisma.$transaction(async (tx) => {
      const milestones = await tx.campaignMilestone.findMany({
        where: { campaignId: id },
        select: { id: true },
      });
      const milestoneIds = milestones.map((m) => m.id);

      if (milestoneIds.length > 0) {
        await tx.campaignMilestoneRevision?.deleteMany?.({
          where: { milestoneId: { in: milestoneIds } },
        });
        await tx.campaignMilestoneSubmission?.deleteMany?.({
          where: { milestoneId: { in: milestoneIds } },
        });
      }

      await tx.campaignEndorsement?.deleteMany?.({ where: { campaignId: id } });
      await tx.campaignMilestone.deleteMany({ where: { campaignId: id } });

      return tx.campaign.delete({ where: { id } });
    });
  }

  async verifyCampaign(id, { verifiedByUserId, status, rejectionReason }) {
    const isRejection = status === 'REJECTED';
    return this.prisma.campaign.update({
      where: { id },
      data: {
        status,
        verifiedByUserId,
        verifiedAt: new Date(),
        rejectionReason: isRejection ? rejectionReason : null,
        reapprovalCount: isRejection ? { increment: 1 } : undefined,
        updatedAt: new Date(),
      },
    });
  }

  async incrementRaisedAmount(campaignId, amount, donorId = null) {
    const numAmount = parseFloat(amount);
    const uniqueDonations = await this.prisma.donation.findMany({
      where: {
        campaignId,
        paymentIntents: {
          some: { status: 'SUCCEEDED' },
        },
      },
      select: {
        donorId: true,
        id: true,
      },
    });

    const uniqueSet = new Set(uniqueDonations.map((d) => d.donorId || d.id));
    if (donorId) uniqueSet.add(donorId);

    return this.prisma.campaign.update({
      where: { id: campaignId },
      data: {
        currentRaisedAmount: { increment: numAmount },
        donorCount: uniqueSet.size > 0 ? uniqueSet.size : { increment: 1 },
      },
    });
  }

  async createEndorsement(campaignId, endorserUserId, endorsementData) {
    return this.prisma.campaignEndorsement.upsert({
      where: {
        campaignId_endorserUserId: {
          campaignId,
          endorserUserId,
        },
      },
      create: {
        campaignId,
        endorserUserId,
        designation: endorsementData.designation || 'Faculty Endorser',
        status: endorsementData.status || 'APPROVED',
        comments: endorsementData.comments || null,
        endorsedAt: new Date(),
      },
      update: {
        designation: endorsementData.designation || 'Faculty Endorser',
        status: endorsementData.status || 'APPROVED',
        comments: endorsementData.comments || null,
        endorsedAt: new Date(),
      },
    });
  }

  // ─── Campaign Team Member Operations ───────────────────────────────────────
  async findMembersByCampaignId(campaignId) {
    return this.prisma.campaignMember.findMany({
      where: { campaignId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, profileMetadata: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findMember(campaignId, userId) {
    return this.prisma.campaignMember.findUnique({
      where: {
        campaignId_userId: { campaignId, userId },
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, profileMetadata: true },
        },
      },
    });
  }

  async findMemberById(memberId) {
    return this.prisma.campaignMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, profileMetadata: true },
        },
      },
    });
  }

  async addMember(campaignId, { userId, role = 'MEMBER', title, invitedBy }) {
    return this.prisma.campaignMember.create({
      data: {
        campaignId,
        userId,
        role,
        title: title || 'Team Member',
        invitedBy: invitedBy || null,
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, profileMetadata: true },
        },
      },
    });
  }

  async updateMember(memberId, data) {
    return this.prisma.campaignMember.update({
      where: { id: memberId },
      data: {
        ...(data.role ? { role: data.role } : {}),
        ...(data.title !== undefined ? { title: data.title } : {}),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: { id: true, fullName: true, email: true, profileMetadata: true },
        },
      },
    });
  }

  async removeMember(memberId) {
    return this.prisma.campaignMember.delete({
      where: { id: memberId },
    });
  }

  async getImpactDashboardMetrics() {
    const activeStatuses = ['LIVE', 'COMPLETED', 'FULLY_FUNDED', 'DISBURSING'];

    const [
      raisedAggregate,
      totalCampaigns,
      totalDonors,
      totalDatasets,
      categoryAggregates,
    ] = await Promise.all([
      this.prisma.campaign.aggregate({
        _sum: { currentRaisedAmount: true },
      }),
      this.prisma.campaign.count({
        where: { status: { in: activeStatuses } },
      }),
      this.prisma.campaign.aggregate({
        _sum: { donorCount: true },
      }),
      this.prisma.campaignMilestoneSubmission.count({
        where: { status: 'APPROVED' },
      }),
      this.prisma.campaign.groupBy({
        by: ['category'],
        where: { status: { in: activeStatuses } },
        _sum: { currentRaisedAmount: true },
        _count: { id: true },
      }),
    ]);

    const totalRaised = parseFloat(raisedAggregate._sum.currentRaisedAmount || 0);
    const donorSum = totalDonors._sum.donorCount || 0;

    // 1. Calculate Real Category Distribution from DB aggregates
    const categoryCounts = {
      'STARTUP_INNOVATION': { title: 'Startup & Innovation', count: 0, funding: 0, color: '#F97316' },
      'RESEARCH_GRANT': { title: 'Research Grants', count: 0, funding: 0, color: '#10B981' },
      'CLUB_PROJECT': { title: 'Student Clubs', count: 0, funding: 0, color: '#06B6D4' },
      'COMMUNITY_PROJECT': { title: 'Community Impact', count: 0, funding: 0, color: '#EAB308' },
      'COMPETITION_TRAVEL': { title: 'Competition & Travel', count: 0, funding: 0, color: '#EF4444' },
      'TUITION_FEE': { title: 'Tuition Support', count: 0, funding: 0, color: '#8B5CF6' },
      'EMERGENCY_AID': { title: 'Emergency Aid', count: 0, funding: 0, color: '#EC4899' },
    };

    categoryAggregates.forEach((group) => {
      const cat = group.category || 'STARTUP_INNOVATION';
      const count = group._count.id || 0;
      const funding = parseFloat(group._sum.currentRaisedAmount || 0);
      if (categoryCounts[cat]) {
        categoryCounts[cat].count = count;
        categoryCounts[cat].funding = funding;
      }
    });

    const sdgList = Object.entries(categoryCounts).map(([catKey, val]) => ({
      id: catKey,
      title: val.title,
      count: val.count,
      funding: val.funding,
      color: val.color,
      textColor: '#ffffff',
      fundingFormatted: val.funding >= 10000000
        ? `₹${(val.funding / 10000000).toFixed(1)} Cr`
        : `₹${(val.funding / 100000).toFixed(1)} L`,
    }));

    const stateList = totalCampaigns > 0 ? [
      { state: 'National Institutes', count: totalCampaigns },
      { state: 'Active Hubs', count: totalCampaigns },
    ] : [];

    return {
      totalMovedToResearch: totalRaised,
      totalMovedFormatted: `₹${Math.round(totalRaised).toLocaleString('en-IN')}`,
      studentProjectsBacked: totalCampaigns,
      peopleReached: donorSum > 0 ? `${donorSum} supporters` : '0',
      openDatasetsAndPublications: totalDatasets,
      stateDistribution: stateList,
      sdgTracker: sdgList,
    };
  }
}

module.exports = new PrismaCampaignRepositoryAdapter();
module.exports.PrismaCampaignRepositoryAdapter = PrismaCampaignRepositoryAdapter;
