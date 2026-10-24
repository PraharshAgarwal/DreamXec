const prisma = require('../../config/prisma');
const prismaRepositoryAdapter = require('./adapters/prisma-interaction-repository.adapter');
const mapper = require('./interaction.mapper');
const { CommentNotFoundError, UnauthorizedInteractionError } = require('./interaction.errors');
const AppError = require('../../utils/AppError');

class InteractionService {
  constructor({ repositoryPort = prismaRepositoryAdapter } = {}) {
    this.repositoryPort = repositoryPort;
    this.prisma = prisma;
  }

  async buildCampaignContext(campaignId) {
    try {
      const [campaign, members, donations] = await Promise.all([
        this.prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { id: true, studentUserId: true },
        }),
        this.prisma.campaignMember.findMany({
          where: { campaignId },
          select: { userId: true, role: true },
        }),
        this.prisma.donation.findMany({
          where: { campaignId, deletedAt: null },
          select: { donorId: true },
        }),
      ]);

      const ownerUserIds = new Set();
      if (campaign?.studentUserId) ownerUserIds.add(campaign.studentUserId);
      members.filter((m) => m.role === 'OWNER').forEach((m) => ownerUserIds.add(m.userId));

      const teamUserIds = new Set();
      members.forEach((m) => teamUserIds.add(m.userId));
      if (campaign?.studentUserId) teamUserIds.add(campaign.studentUserId);

      const donorUserIds = new Set();
      donations.forEach((d) => {
        if (d.donorId) donorUserIds.add(d.donorId);
      });

      return { ownerUserIds, teamUserIds, donorUserIds };
    } catch (err) {
      console.warn('[InteractionService] buildCampaignContext error:', err.message);
      return { ownerUserIds: new Set(), teamUserIds: new Set(), donorUserIds: new Set() };
    }
  }

  async createComment({ campaignId, content, parentId, currentUser }) {
    let resolvedCampaignId = campaignId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId);
    if (!isUuid) {
      const camp = await this.prisma.campaign.findFirst({
        where: { slug: { equals: campaignId, mode: 'insensitive' } },
        select: { id: true },
      });
      if (!camp) throw new AppError('Campaign not found', 404);
      resolvedCampaignId = camp.id;
    }

    const rawComment = await this.repositoryPort.createComment({
      campaignId: resolvedCampaignId,
      content,
      parentId: parentId || null,
      userId: currentUser.id,
    });

    const context = await this.buildCampaignContext(resolvedCampaignId);
    return mapper.toCommentDto(rawComment, context);
  }

  async getCommentsByCampaign(campaignId) {
    let resolvedCampaignId = campaignId;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignId);
    if (!isUuid) {
      const camp = await this.prisma.campaign.findFirst({
        where: { slug: { equals: campaignId, mode: 'insensitive' } },
        select: { id: true },
      });
      if (!camp) return [];
      resolvedCampaignId = camp.id;
    }

    const [comments, context] = await Promise.all([
      this.repositoryPort.findCommentsByCampaignId(resolvedCampaignId),
      this.buildCampaignContext(resolvedCampaignId),
    ]);

    return comments.map((c) => mapper.toCommentDto(c, context));
  }

  async deleteComment({ commentId, currentUser }) {
    const comment = await this.repositoryPort.findCommentById(commentId);
    if (!comment) {
      throw new CommentNotFoundError();
    }

    let isAuthorized = comment.userId === currentUser.id || currentUser.role === 'ADMIN';

    if (!isAuthorized && comment.campaignId) {
      const member = await this.prisma.campaignMember.findUnique({
        where: {
          campaignId_userId: {
            campaignId: comment.campaignId,
            userId: currentUser.id,
          },
        },
      });
      if (member || comment.campaign?.studentUserId === currentUser.id) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      throw new UnauthorizedInteractionError();
    }

    await this.repositoryPort.softDeleteComment(commentId);
    return { message: 'Comment deleted successfully' };
  }

  async reportComment({ commentId }) {
    const comment = await this.repositoryPort.findCommentById(commentId);
    if (!comment) {
      throw new CommentNotFoundError();
    }

    await this.repositoryPort.reportComment(commentId);
    return { message: 'Comment reported successfully' };
  }

  async toggleWishlist({ donorId, campaignId }) {
    const existing = await this.repositoryPort.findWishlistItem({ donorId, campaignId });

    if (existing) {
      await this.repositoryPort.removeWishlist(existing.id, { donorId, campaignId });
      return {
        message: 'Removed from wishlist',
        isWishlisted: false,
      };
    }

    await this.repositoryPort.addWishlist({ donorId, campaignId });
    return {
      message: 'Added to wishlist',
      isWishlisted: true,
    };
  }

  async removeFromWishlist({ donorId, campaignId }) {
    await this.repositoryPort.removeWishlist(`${donorId}_${campaignId}`, { donorId, campaignId });
    return {
      message: 'Removed from wishlist',
      isWishlisted: false,
    };
  }

  async getMyWishlist(donorId) {
    const wishlistItems = await this.repositoryPort.findDonorWishlist(donorId);
    return wishlistItems.map((item) => mapper.toWishlistProjectDto(item));
  }

  async checkWishlistStatus({ donorId, campaignId }) {
    const existing = await this.repositoryPort.findWishlistItem({ donorId, campaignId });
    return { isWishlisted: !!existing };
  }
}

module.exports = new InteractionService();
module.exports.InteractionService = InteractionService;
