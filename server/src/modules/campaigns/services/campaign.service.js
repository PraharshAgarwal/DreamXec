const slugify = require('slugify');
const AppError = require('../../../utils/AppError');
const prismaCampaignRepository = require('../adapters/prisma-campaign-repository.adapter');
const redisCampaignCache = require('../adapters/redis-campaign-cache.adapter');
const CampaignMapper = require('../campaign.mapper');
const prisma = require('../../../config/prisma');

/**
 * Domain Service for Campaign Aggregate Lifecycle.
 * Implements SOLID principles with full dependency injection and PRD compliance.
 */
class CampaignService {
  constructor({
    campaignRepo = prismaCampaignRepository,
    cache = redisCampaignCache,
    prismaClient = prisma,
  } = {}) {
    this.campaignRepo = campaignRepo;
    this.cache = cache;
    this.prisma = prismaClient;
  }

  /**
   * Generates a collision-resistant unique slug for a campaign.
   */
  async generateUniqueSlug(title) {
    const baseSlug = slugify(title || 'campaign', {
      lower: true,
      strict: true,
      trim: true,
    }) || 'campaign';

    const existingCampaigns = await this.prisma.campaign.findMany({
      where: { slug: { startsWith: baseSlug } },
      select: { slug: true }
    });

    if (existingCampaigns.length === 0) return baseSlug;

    const slugSet = new Set(existingCampaigns.map(c => c.slug));
    if (!slugSet.has(baseSlug)) return baseSlug;

    let counter = 1;
    let slug = `${baseSlug}-${counter}`;

    while (slugSet.has(slug)) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    return slug;
  }

  /**
   * Creates a new campaign in DRAFT or SUBMITTED state with milestones.
   */
  async createCampaign(user, payload) {
    if (!user || !user.id) {
      throw new AppError('Authentication required to create a campaign', 401);
    }

    // 1. Resolve & Validate Club / Organization Membership
    let targetOrgId = payload.clubId || payload.organizationId;
    let tenantId = payload.tenantId;

    if (targetOrgId) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetOrgId);
      const targetOrg = await this.prisma.organization.findFirst({
        where: isUuid ? { id: targetOrgId } : { slug: targetOrgId },
        select: { id: true, name: true, parentId: true, orgType: true },
      });

      if (!targetOrg) {
        throw new AppError('The specified club or organization was not found.', 404);
      }

      targetOrgId = targetOrg.id;

      // Check creator's active membership in this club/org
      const orgMembership = await this.prisma.membership.findFirst({
        where: {
          userId: user.id,
          organizationId: targetOrgId,
          status: 'ACTIVE',
        },
      });

      if (!orgMembership) {
        throw new AppError(
          `Unauthorized: You must be an active, verified member of "${targetOrg.name}" to launch a campaign under its banner. Please join the club or launch as an independent project.`,
          403
        );
      }

      // Link institutional custody: if club has parent college, use parentId; otherwise org itself
      tenantId = targetOrg.parentId || targetOrg.id;
    } else if (!tenantId) {
      // Independent or fallback tenant resolution
      const membership = await this.prisma.membership.findFirst({
        where: { userId: user.id, status: 'ACTIVE' },
        include: { organization: true },
      });

      if (membership?.organization) {
        tenantId = membership.organization.parentId || membership.organization.id;
      } else {
        const defaultOrg = await this.prisma.organization.findFirst({
          where: { lifecycleStatus: 'ACTIVE' },
        });
        if (!defaultOrg) {
          throw new AppError('No active organization found. Please complete organization onboarding.', 400);
        }
        tenantId = defaultOrg.id;
      }
    }

    // 2. Validate Milestone Budget Consistency
    const goalAmount = parseFloat(payload.goalAmount);
    const milestones = payload.milestones || [];
    const totalMilestoneBudget = milestones.reduce((sum, m) => sum + parseFloat(m.budget || m.targetAmount || 0), 0);

    if (Math.abs(totalMilestoneBudget - goalAmount) > 0.01) {
      throw new AppError(
        `Total milestone budget (₹${totalMilestoneBudget.toLocaleString()}) must equal the campaign funding goal (₹${goalAmount.toLocaleString()})`,
        400
      );
    }

    // 3. Validate Team Members - Must be actual registered users
    const validatedTeamMembers = await this.validateAndResolveTeamMembers(payload.teamMembers, user.id);

    // 4. Generate Unique Slug
    const slug = await this.generateUniqueSlug(payload.title);

    // 5. Create Campaign in Database
    const shortDesc = payload.shortDescription || payload.description.slice(0, 200).trim();
    const created = await this.campaignRepo.createCampaign(
      {
        tenantId,
        studentUserId: user.id,
        organizationId: targetOrgId || null,
        title: payload.title,
        slug,
        category: payload.category,
        campaignType: payload.campaignType || 'INDIVIDUAL',
        stage: payload.stage || 'DISCOVERY',
        trlLevel: payload.trlLevel || null,
        sdgGoals: payload.sdgGoals || [],
        shortDescription: shortDesc,
        description: payload.description,
        coverImageUrl: payload.coverImageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
        galleryImageUrls: payload.galleryImageUrls || [],
        videoUrl: payload.videoUrl || null,
        presentationDeckUrl: payload.presentationDeckUrl || null,
        faqs: payload.faqs || [],
        teamMembers: validatedTeamMembers,
        beneficiaryDetails: payload.beneficiaryDetails || null,
        targetAmount: goalAmount,
        minDonationAmount: payload.minDonationAmount || 1.00,
        currency: 'INR',
        status: payload.status || 'PENDING_VERIFICATION', // Starts in PENDING_VERIFICATION for administrative review
      },
      milestones
    );

    // 6. Invalidate List Caches
    await this.cache.invalidateCampaign(slug, tenantId);

    return CampaignMapper.toCampaignDTO(created);
  }

  /**
   * Submits a campaign draft for review (transitions to PENDING_ENDORSEMENT or PENDING_VERIFICATION).
   */
  async submitCampaignForReview(user, campaignId) {
    const existing = await this.campaignRepo.findByIdOrSlug(campaignId);
    if (!existing) {
      throw new AppError('Campaign not found', 404);
    }

    if (existing.studentUserId !== user.id && user.role !== 'ADMIN') {
      throw new AppError('Only the project creator can submit this campaign for review', 403);
    }

    // Require faculty endorsement if goal exceeds ₹40,000 (~$500) or if club/startup category
    const targetAmount = parseFloat(existing.targetAmount);
    const requiresFacultyEndorsement = targetAmount >= 40000 || existing.category === 'CLUB_PROJECT' || existing.category === 'STARTUP_INNOVATION';

    const targetStatus = requiresFacultyEndorsement ? 'PENDING_ENDORSEMENT' : 'PENDING_VERIFICATION';

    const updated = await this.campaignRepo.updateCampaign(existing.id, {
      status: targetStatus,
    });

    await this.cache.invalidateCampaign(existing.slug, existing.tenantId);
    await this.cache.invalidateCampaign(existing.id, existing.tenantId);

    return CampaignMapper.toCampaignDTO(updated);
  }

  /**
   * Retrieves all campaigns pending administrative verification.
   */
  async getPendingCampaigns(adminUser) {
    const campaigns = await this.campaignRepo.findPendingCampaigns();
    return campaigns.map(CampaignMapper.toCampaignDTO);
  }

  /**
   * Retrieves public active campaigns with multi-filter and Redis Cache-Aside.
   */
  async getPublicCampaigns({ category, search, page = 1, limit = 20, cursor = null } = {}, skipCache = false) {
    const cacheKey = `public:${category || 'ALL'}:${search || 'none'}:${page}:${limit}:${cursor || 'none'}`;
    if (!skipCache) {
      try {
        const cached = await this.cache.getPublicCampaigns(cacheKey);
        if (cached) {
          return cached;
        }
      } catch (e) {}
    }

    let result;
    try {
      result = await this.campaignRepo.findPublicCampaigns({ category, search, page, limit, cursor });
    } catch (error) {
      try {
        const fallback =
          (await this.cache.getPublicCampaigns(cacheKey)) ||
          (this.cache.getFallbackPublicCampaigns && this.cache.getFallbackPublicCampaigns(cacheKey));
        if (fallback) {
          console.warn('[CampaignService] Serving fallback cache for public campaigns after DB error:', error.message);
          return fallback;
        }
      } catch (e) {}
      throw error;
    }

    const formatted = {
      campaigns: result.campaigns.map(CampaignMapper.toCampaignListDTO),
      total: result.total,
      page: result.page,
      limit: result.limit,
      hasNextPage: result.hasNextPage,
      nextCursor: result.nextCursor,
    };

    // Cache for 60 seconds
    await this.cache.setPublicCampaigns(cacheKey, formatted, 60);

    return formatted;
  }

  /**
   * Retrieves single campaign by ID or Slug with Redis caching.
   */
  async getCampaignDetails(idOrSlug, skipCache = false) {
    if (!skipCache) {
      try {
        const cached = await this.cache.getCampaignDetails(idOrSlug);
        if (cached) {
          return cached;
        }
      } catch (e) {}
    }

    let campaign;
    try {
      campaign = await this.campaignRepo.findByIdOrSlug(idOrSlug);
    } catch (error) {
      try {
        const fallback =
          (await this.cache.getCampaignDetails(idOrSlug)) ||
          (this.cache.getFallbackCampaignDetails && this.cache.getFallbackCampaignDetails(idOrSlug));
        if (fallback) {
          console.warn(`[CampaignService] Serving fallback cache for ${idOrSlug} after DB error:`, error.message);
          return fallback;
        }
      } catch (cacheErr) {}
      throw error;
    }

    if (!campaign) {
      throw new AppError('Campaign not found', 404);
    }

    const dto = CampaignMapper.toCampaignDTO(campaign);
    await this.cache.setCampaignDetails(idOrSlug, dto, 120);

    return dto;
  }

  /**
   * Retrieves campaigns created by the authenticated user, optionally scoped to an active organization/profile.
   */
  async getMyCampaigns(userId, orgId = null, pagination = {}) {
    const campaigns = await this.campaignRepo.findUserCampaigns(userId, orgId, pagination);
    return campaigns.map(CampaignMapper.toCampaignDTO);
  }

  /**
   * Updates an existing campaign (post-launch / draft editing).
   */
  async updateCampaign(user, campaignId, updateData) {
    const existing = await this.campaignRepo.findByIdOrSlug(campaignId);
    if (!existing) {
      throw new AppError('Campaign not found', 404);
    }

    // Permission check: Creator or Platform Admin
    const isOwner = existing.studentUserId === user.id;
    const isAdmin = user.role === 'ADMIN' || (user.orgRoles && user.orgRoles.includes('ORG_ADMIN'));

    if (!isOwner && !isAdmin) {
      throw new AppError('You do not have permission to edit this campaign', 403);
    }

    // Validate milestone budget consistency if milestones are updated
    if (Array.isArray(updateData.milestones) && updateData.milestones.length > 0) {
      const goalAmount = parseFloat(updateData.goalAmount || existing.targetAmount || 0);
      const totalMilestoneBudget = updateData.milestones.reduce(
        (sum, m) => sum + parseFloat(m.budget || m.targetAmount || 0),
        0
      );

      if (goalAmount > 0 && Math.abs(totalMilestoneBudget - goalAmount) > 0.01) {
        throw new AppError(
          `Total milestone budget (₹${totalMilestoneBudget.toLocaleString()}) must equal the campaign funding goal (₹${goalAmount.toLocaleString()})`,
          400
        );
      }
    }

    // Validate team members if provided
    let dataToUpdate = { ...updateData };
    if (Array.isArray(updateData.teamMembers)) {
      dataToUpdate.teamMembers = await this.validateAndResolveTeamMembers(updateData.teamMembers, existing.studentUserId);
    }

    const updated = await this.campaignRepo.updateCampaign(existing.id, dataToUpdate, user.id);

    // Invalidate caches
    await this.cache.invalidateCampaign(existing.slug, existing.tenantId);
    await this.cache.invalidateCampaign(existing.id, existing.tenantId);

    return CampaignMapper.toCampaignDTO(updated);
  }

  /**
   * Deletes a campaign if user is owner or admin.
   */
  async deleteCampaign(user, campaignId) {
    const existing = await this.campaignRepo.findByIdOrSlug(campaignId);
    if (!existing) {
      throw new AppError('Campaign not found', 404);
    }

    const isOwner = existing.studentUserId === user.id;
    const isAdmin = user.role === 'ADMIN' || (user.orgRoles && user.orgRoles.includes('ORG_ADMIN'));

    if (!isOwner && !isAdmin) {
      throw new AppError('You do not have permission to delete this campaign', 403);
    }

    // Safety check: If funds have already been raised, mark cancelled to preserve accounting ledger
    const currentRaised = parseFloat(existing.currentRaisedAmount || 0);
    if (currentRaised > 0) {
      const cancelled = await this.campaignRepo.updateCampaign(existing.id, {
        status: 'CANCELLED',
        deletedAt: new Date(),
      }, user.id);
      await this.cache.invalidateCampaign(existing.slug, existing.tenantId);
      await this.cache.invalidateCampaign(existing.id, existing.tenantId);
      return { success: true, message: 'Campaign cancelled as contributions were already recorded.', campaign: CampaignMapper.toCampaignDTO(cancelled) };
    }

    await this.campaignRepo.deleteCampaign(existing.id);

    // Invalidate caches
    await this.cache.invalidateCampaign(existing.slug, existing.tenantId);
    await this.cache.invalidateCampaign(existing.id, existing.tenantId);
    await this.cache.invalidateAll();

    return { success: true, message: 'Campaign deleted successfully.' };
  }

  /**
   * Verifies (approves or rejects) a campaign by an institutional/platform admin.
   */
  async verifyCampaign(adminUser, campaignId, { status, rejectionReason }) {
    const existing = await this.campaignRepo.findByIdOrSlug(campaignId);
    if (!existing) {
      throw new AppError('Campaign not found', 404);
    }

    const finalStatus = status === 'APPROVED' || status === 'LIVE' ? 'LIVE' : status;

    const updated = await this.campaignRepo.verifyCampaign(existing.id, {
      verifiedByUserId: adminUser?.id || null,
      status: finalStatus,
      rejectionReason: finalStatus === 'REJECTED' ? rejectionReason : null,
    });

    // If approved, also approve any pending milestone revisions
    if (finalStatus === 'LIVE') {
      try {
        await this.prisma.campaignMilestoneRevision.updateMany({
          where: {
            milestone: { campaignId: existing.id },
            status: 'PENDING_APPROVAL',
          },
          data: {
            status: 'APPROVED',
            reviewedByUserId: adminUser?.id || null,
            reviewedAt: new Date(),
          },
        });
      } catch (e) {
        console.warn('Failed to update milestone revisions on approval:', e);
      }

      // If approved and has planned milestones, activate the first milestone
      const firstMilestone = existing.milestones?.find((m) => m.sequenceOrder === 1);
      if (firstMilestone && firstMilestone.status === 'PLANNED') {
        try {
          await this.prisma.campaignMilestone.update({
            where: { id: firstMilestone.id },
            data: { status: 'ACTIVE' },
          });
        } catch (e) {
          // ignore
        }
      }
    } else if (finalStatus === 'REJECTED') {
      try {
        await this.prisma.campaignMilestoneRevision.updateMany({
          where: {
            milestone: { campaignId: existing.id },
            status: 'PENDING_APPROVAL',
          },
          data: {
            status: 'REJECTED',
            reviewedByUserId: adminUser?.id || null,
            reviewedAt: new Date(),
            rejectionReason: rejectionReason || null,
          },
        });
      } catch (e) {
        console.warn('Failed to reject milestone revisions:', e);
      }
    }

    await this.cache.invalidateCampaign(existing.slug, existing.tenantId);
    await this.cache.invalidateCampaign(existing.id, existing.tenantId);

    return CampaignMapper.toCampaignDTO(updated);
  }

  /**
   * Creates a faculty or mentor endorsement for a campaign.
   * On approval, advances campaign state to PENDING_VERIFICATION.
   */
  async endorseCampaign(endorserUser, campaignId, endorsementData) {
    const existing = await this.campaignRepo.findByIdOrSlug(campaignId);
    if (!existing) {
      throw new AppError('Campaign not found', 404);
    }

    const endorsement = await this.campaignRepo.createEndorsement(
      existing.id,
      endorserUser.id,
      endorsementData
    );

    // If campaign was PENDING_ENDORSEMENT and faculty approved, move to PENDING_VERIFICATION
    if (existing.status === 'PENDING_ENDORSEMENT' && endorsementData.status === 'APPROVED') {
      await this.campaignRepo.updateCampaign(existing.id, { status: 'PENDING_VERIFICATION' });
    }

    await this.cache.invalidateCampaign(existing.slug, existing.tenantId);
    return endorsement;
  }

  /**
   * Retrieves all registered team members for a campaign.
   */
  async getMembers(campaignId) {
    const existing = await this.campaignRepo.findByIdOrSlug(campaignId);
    if (!existing) {
      throw new AppError('Campaign not found', 404);
    }
    return this.campaignRepo.findMembersByCampaignId(existing.id);
  }

  /**
   * Adds a new team member by email (Project Owner / Admin only).
   */
  async addMember(currentUser, campaignId, { email, role = 'MEMBER', title }) {
    const existing = await this.campaignRepo.findByIdOrSlug(campaignId);
    if (!existing) {
      throw new AppError('Campaign not found', 404);
    }

    // Lookup user by email
    const targetUser = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, fullName: true, email: true },
    });

    if (!targetUser) {
      throw new AppError(`No registered user found with email: ${email}`, 404);
    }

    // Check if already a member
    const existingMember = await this.campaignRepo.findMember(existing.id, targetUser.id);
    if (existingMember) {
      throw new AppError('User is already a member of this campaign team', 409);
    }

    const createdMember = await this.campaignRepo.addMember(existing.id, {
      userId: targetUser.id,
      role,
      title: title || 'Team Member',
      invitedBy: currentUser.id,
    });

    // Invalidate Redis team permissions cache
    try {
      const redisClient = require('../../../config/redis');
      if (redisClient && typeof redisClient.del === 'function') {
        await redisClient.del(`dx:campaign:${existing.id}:team`);
      }
    } catch (err) {}
    await this.cache.invalidateCampaign(existing.slug, existing.tenantId);

    return createdMember;
  }

  /**
   * Updates a team member's title or role (Project Owner / Admin only).
   */
  async updateMember(currentUser, campaignId, memberId, { role, title }) {
    const existing = await this.campaignRepo.findByIdOrSlug(campaignId);
    if (!existing) {
      throw new AppError('Campaign not found', 404);
    }

    const targetMember = await this.campaignRepo.findMemberById(memberId);
    if (!targetMember || targetMember.campaignId !== existing.id) {
      throw new AppError('Team member record not found', 404);
    }

    // Prevent removing the sole owner or downgrading owner without transfer
    if (targetMember.role === 'OWNER' && role === 'MEMBER') {
      const allMembers = await this.campaignRepo.findMembersByCampaignId(existing.id);
      const ownerCount = allMembers.filter((m) => m.role === 'OWNER').length;
      if (ownerCount <= 1) {
        throw new AppError('Campaign must have at least one Owner. Promote another member before demoting.', 400);
      }
    }

    const updated = await this.campaignRepo.updateMember(memberId, { role, title });

    // Invalidate Redis team permissions cache
    try {
      const redisClient = require('../../../config/redis');
      if (redisClient && typeof redisClient.del === 'function') {
        await redisClient.del(`dx:campaign:${existing.id}:team`);
      }
    } catch (err) {}
    await this.cache.invalidateCampaign(existing.slug, existing.tenantId);

    return updated;
  }

  /**
   * Removes a member from the campaign team.
   */
  async removeMember(currentUser, campaignId, memberId) {
    const existing = await this.campaignRepo.findByIdOrSlug(campaignId);
    if (!existing) {
      throw new AppError('Campaign not found', 404);
    }

    const targetMember = await this.campaignRepo.findMemberById(memberId);
    if (!targetMember || targetMember.campaignId !== existing.id) {
      throw new AppError('Team member record not found', 404);
    }

    // Prevent removing creator if they are the sole owner
    if (targetMember.role === 'OWNER') {
      const allMembers = await this.campaignRepo.findMembersByCampaignId(existing.id);
      const ownerCount = allMembers.filter((m) => m.role === 'OWNER').length;
      if (ownerCount <= 1) {
        throw new AppError('Cannot remove the sole campaign Owner.', 400);
      }
    }

    await this.campaignRepo.removeMember(memberId);

    // Invalidate Redis team permissions cache
    try {
      const redisClient = require('../../../config/redis');
      if (redisClient && typeof redisClient.del === 'function') {
        await redisClient.del(`dx:campaign:${existing.id}:team`);
      }
    } catch (err) {}
    await this.cache.invalidateCampaign(existing.slug, existing.tenantId);

    return { message: 'Member removed from campaign team successfully' };
  }

  /**
   * Looks up a registered user by username or email for team member collaboration.
   */
  async lookupUser(query) {
    if (!query || !query.trim()) {
      throw new AppError('Username or email query parameter is required', 400);
    }
    const rawClean = query.trim().replace(/^@/, '').toLowerCase();
    const cleanEmail = query.toLowerCase().trim();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: { equals: rawClean, mode: 'insensitive' } },
          { email: { equals: cleanEmail, mode: 'insensitive' } },
        ],
        accountStatus: { not: 'DELETED' },
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        email: true,
        profileMetadata: true,
        role: true,
        memberships: {
          take: 1,
          select: {
            organization: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError(`No registered user found with username or email: "${query}"`, 404);
    }

    const metadata = (user.profileMetadata && typeof user.profileMetadata === 'object') ? user.profileMetadata : {};
    const orgName = user.memberships?.[0]?.organization?.name || metadata.institution || metadata.department || 'DreamXec Network';

    return {
      id: user.id,
      name: user.fullName,
      fullName: user.fullName,
      username: user.username || user.email.split('@')[0],
      email: user.email,
      avatar: metadata.avatarUrl || metadata.avatar || null,
      role: user.role,
      institution: orgName,
    };
  }

  /**
   * Backwards compatible lookupUserByEmail
   */
  async lookupUserByEmail(email) {
    return this.lookupUser(email);
  }

  /**
   * Validates that all team member emails belong to actual registered users in the database.
   */
  async validateAndResolveTeamMembers(teamMembers = [], ownerUserId) {
    if (!Array.isArray(teamMembers) || teamMembers.length === 0) {
      return [];
    }

    const resolvedMembers = [];
    for (const member of teamMembers) {
      const rawEmail = member.email ? member.email.toLowerCase().trim() : null;
      if (!rawEmail) {
        throw new AppError(`Team member "${member.name || 'Collaborator'}" must have a valid registered email address.`, 400);
      }

      const foundUser = await this.prisma.user.findUnique({
        where: { email: rawEmail },
        select: {
          id: true,
          fullName: true,
          email: true,
          profileMetadata: true,
          role: true,
        },
      });

      if (!foundUser) {
        throw new AppError(
          `User with email "${rawEmail}" is not registered on DreamXec. All collaborative team members must be registered platform users.`,
          400
        );
      }

      const userMeta = (foundUser.profileMetadata && typeof foundUser.profileMetadata === 'object') ? foundUser.profileMetadata : {};

      resolvedMembers.push({
        userId: foundUser.id,
        name: foundUser.fullName || member.name || 'Member',
        email: foundUser.email,
        avatar: userMeta.avatarUrl || userMeta.avatar || null,
        role: member.role || 'MEMBER',
        title: member.title || member.role || 'Team Member',
      });
    }

    return resolvedMembers;
  }

  /**
   * Retrieves live impact dashboard metrics.
   */
  async getImpactDashboardMetrics() {
    return this.campaignRepo.getImpactDashboardMetrics();
  }
}

module.exports = new CampaignService();
module.exports.CampaignService = CampaignService;
