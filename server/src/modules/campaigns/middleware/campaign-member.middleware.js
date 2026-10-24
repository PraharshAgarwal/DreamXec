const prisma = require('../../../config/prisma');
const redisClient = require('../../../config/redis');
const AppError = require('../../../utils/AppError');

/**
 * Middleware factory ensuring the authenticated user has an authorized role on the campaign team.
 * Platform ADMINs automatically bypass.
 * 
 * @param {Array<'OWNER'|'MEMBER'>} allowedRoles 
 */
const requireCampaignRole = (allowedRoles = ['OWNER', 'MEMBER']) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      if (!user || !user.id) {
        return next(new AppError('Authentication required', 401));
      }

      // Platform ADMIN bypass
      if (user.role === 'ADMIN') {
        req.isPlatformAdmin = true;
        return next();
      }

      const campaignIdOrSlug = req.params.id || req.params.campaignId;
      if (!campaignIdOrSlug) {
        return next(new AppError('Campaign identifier required in request parameters', 400));
      }

      // Resolve campaign ID (UUID vs Slug)
      let campaignId = campaignIdOrSlug;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(campaignIdOrSlug);
      
      if (!isUuid) {
        const campaign = await prisma.campaign.findFirst({
          where: { slug: { equals: campaignIdOrSlug, mode: 'insensitive' } },
          select: { id: true, studentUserId: true },
        });
        if (!campaign) {
          return next(new AppError('Campaign not found', 404));
        }
        campaignId = campaign.id;
      }

      // 1. Check Redis Cache for Campaign Team
      const cacheKey = `dx:campaign:${campaignId}:team`;
      let teamMembers = null;

      try {
        if (redisClient && typeof redisClient.get === 'function') {
          const cached = await redisClient.get(cacheKey);
          if (cached) {
            teamMembers = JSON.parse(cached);
          }
        }
      } catch (err) {
        console.warn('[requireCampaignRole] Redis cache miss/error:', err.message);
      }

      // 2. Query Database if Cache Miss
      if (!teamMembers) {
        const members = await prisma.campaignMember.findMany({
          where: { campaignId },
          select: { userId: true, role: true, title: true },
        });

        // Also ensure creator is counted as OWNER if not yet populated
        const campaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          select: { studentUserId: true },
        });

        teamMembers = members;
        if (campaign && !members.some((m) => m.userId === campaign.studentUserId)) {
          teamMembers.push({ userId: campaign.studentUserId, role: 'OWNER', title: 'Project Lead' });
        }

        try {
          if (redisClient && typeof redisClient.set === 'function') {
            await redisClient.set(cacheKey, JSON.stringify(teamMembers), { EX: 600 }); // 10 mins TTL
          } else if (redisClient && typeof redisClient.setEx === 'function') {
            await redisClient.setEx(cacheKey, 600, JSON.stringify(teamMembers));
          }
        } catch (err) {
          // ignore cache write error
        }
      }

      // 3. Evaluate User Role against Allowed Roles
      const membership = teamMembers.find((m) => m.userId === user.id);
      if (!membership) {
        return next(
          new AppError('Access denied. You are not a registered member of this campaign team.', 403)
        );
      }

      if (!allowedRoles.includes(membership.role)) {
        return next(
          new AppError(
            `Insufficient permissions. Requires one of: ${allowedRoles.join(', ')}`,
            403
          )
        );
      }

      req.campaignId = campaignId;
      req.campaignMember = membership;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

module.exports = {
  requireCampaignRole,
};
