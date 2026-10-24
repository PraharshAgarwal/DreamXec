const prisma = require('../../../config/prisma');
const InteractionRepositoryPort = require('../ports/interaction-repository.port');

const COMMENT_USER_SELECT = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  username: true,
  speciesId: true,
  speciesNumber: true,
  profileMetadata: true,
  assignedSpecies: true,
};

class PrismaInteractionRepositoryAdapter extends InteractionRepositoryPort {
  async createComment({ campaignId, content, parentId, userId }) {
    return prisma.campaignComment.create({
      data: {
        content,
        parentId: parentId || null,
        campaignId,
        userId,
      },
      include: {
        user: {
          select: COMMENT_USER_SELECT,
        },
        replies: {
          include: {
            user: {
              select: COMMENT_USER_SELECT,
            },
          },
        },
      },
    });
  }

  async findCommentsByCampaignId(campaignId) {
    try {
      return await prisma.campaignComment.findMany({
        where: {
          campaignId,
          parentId: null,
          deletedAt: null,
        },
        include: {
          user: {
            select: COMMENT_USER_SELECT,
          },
          replies: {
            where: { deletedAt: null },
            include: {
              user: {
                select: COMMENT_USER_SELECT,
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.warn('[PrismaInteractionRepositoryAdapter] findCommentsByCampaignId error:', err.message);
      return [];
    }
  }

  async findCommentById(commentId) {
    try {
      return await prisma.campaignComment.findUnique({
        where: { id: commentId },
        include: {
          campaign: {
            select: { id: true, studentUserId: true },
          },
          user: {
            select: COMMENT_USER_SELECT,
          },
        },
      });
    } catch (err) {
      console.warn('[PrismaInteractionRepositoryAdapter] findCommentById error:', err.message);
      return null;
    }
  }

  async softDeleteComment(commentId) {
    return prisma.campaignComment.update({
      where: { id: commentId },
      data: { deletedAt: new Date() },
    });
  }

  async reportComment(commentId) {
    try {
      return await prisma.campaignComment.update({
        where: { id: commentId },
        data: { reported: true },
      });
    } catch (err) {
      console.warn('[PrismaInteractionRepositoryAdapter] reportComment error:', err.message);
      return null;
    }
  }

  async findWishlistItem({ donorId, campaignId }) {
    try {
      if (prisma.wishlist) {
        return await prisma.wishlist.findUnique({
          where: {
            donorId_userProjectId: {
              donorId,
              userProjectId: campaignId,
            },
          },
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: donorId },
        select: { profileMetadata: true },
      });
      const wishlist = Array.isArray(user?.profileMetadata?.wishlist) ? user.profileMetadata.wishlist : [];
      if (wishlist.includes(campaignId)) {
        return {
          id: `${donorId}_${campaignId}`,
          donorId,
          campaignId,
          userProjectId: campaignId,
        };
      }
      return null;
    } catch (err) {
      console.warn('[PrismaInteractionRepositoryAdapter] findWishlistItem error:', err.message);
      return null;
    }
  }

  async addWishlist({ donorId, campaignId }) {
    if (prisma.wishlist) {
      return prisma.wishlist.create({
        data: {
          donorId,
          userProjectId: campaignId,
        },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: donorId },
      select: { profileMetadata: true },
    });
    const current = Array.isArray(user?.profileMetadata?.wishlist) ? user.profileMetadata.wishlist : [];
    if (!current.includes(campaignId)) {
      const updated = [...current, campaignId];
      await prisma.user.update({
        where: { id: donorId },
        data: {
          profileMetadata: {
            ...(typeof user?.profileMetadata === 'object' && user?.profileMetadata !== null ? user.profileMetadata : {}),
            wishlist: updated,
          },
        },
      });
    }

    return {
      id: `${donorId}_${campaignId}`,
      donorId,
      campaignId,
      userProjectId: campaignId,
    };
  }

  async removeWishlist(wishlistId, { donorId, campaignId } = {}) {
    if (prisma.wishlist) {
      return prisma.wishlist.delete({
        where: { id: wishlistId },
      });
    }

    let targetDonorId = donorId;
    let targetCampaignId = campaignId;

    if ((!targetDonorId || !targetCampaignId) && typeof wishlistId === 'string' && wishlistId.includes('_')) {
      const parts = wishlistId.split('_');
      targetDonorId = parts[0];
      targetCampaignId = parts[1];
    }

    if (!targetDonorId) return null;

    const user = await prisma.user.findUnique({
      where: { id: targetDonorId },
      select: { profileMetadata: true },
    });
    const current = Array.isArray(user?.profileMetadata?.wishlist) ? user.profileMetadata.wishlist : [];
    const updated = current.filter((id) => id !== targetCampaignId && id !== wishlistId);

    return prisma.user.update({
      where: { id: targetDonorId },
      data: {
        profileMetadata: {
          ...(typeof user?.profileMetadata === 'object' && user?.profileMetadata !== null ? user.profileMetadata : {}),
          wishlist: updated,
        },
      },
    });
  }

  async findDonorWishlist(donorId) {
    try {
      if (prisma.wishlist) {
        return await prisma.wishlist.findMany({
          where: { donorId },
          include: {
            userProject: {
              select: {
                id: true,
                title: true,
                description: true,
                imageUrl: true,
                goalAmount: true,
                amountRaised: true,
                status: true,
                createdAt: true,
                companyName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: donorId },
        select: { profileMetadata: true },
      });
      const wishlistIds = Array.isArray(user?.profileMetadata?.wishlist) ? user.profileMetadata.wishlist : [];
      if (wishlistIds.length === 0) return [];

      const campaigns = await prisma.campaign.findMany({
        where: { id: { in: wishlistIds } },
        include: {
          student: { select: { fullName: true } },
          beneficiary: { select: { fullName: true } },
        },
      });

      return campaigns.map((c) => ({
        id: `${donorId}_${c.id}`,
        donorId,
        userProjectId: c.id,
        userProject: {
          id: c.id,
          title: c.title,
          description: c.summary || c.description,
          imageUrl: c.coverImageUrl,
          goalAmount: Number(c.fundingGoalAmount || 0),
          amountRaised: Number(c.currentRaisedAmount || 0),
          status: c.status,
          createdAt: c.createdAt,
          companyName: c.student?.fullName || c.beneficiary?.fullName || 'DreamXec Innovator',
        },
      }));
    } catch (err) {
      console.warn('[PrismaInteractionRepositoryAdapter] findDonorWishlist error:', err.message);
      return [];
    }
  }
}

module.exports = new PrismaInteractionRepositoryAdapter();
module.exports.PrismaInteractionRepositoryAdapter = PrismaInteractionRepositoryAdapter;
