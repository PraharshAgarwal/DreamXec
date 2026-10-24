const prisma = require('../../../config/prisma');
const AdminRepositoryPort = require('../ports/admin-repository.port');

class PrismaAdminRepositoryAdapter extends AdminRepositoryPort {
  async getDashboardStats({ tenantId } = {}) {
    try {
      let orgIds = null;
      if (tenantId) {
        const orgTree = await prisma.organization.findMany({
          where: {
            OR: [
              { id: tenantId },
              { parentId: tenantId },
              { ancestorId: tenantId },
            ],
          },
          select: { id: true },
        }).catch(() => []);
        orgIds = orgTree.length > 0 ? orgTree.map((o) => o.id) : [tenantId];
      }

      const userWhere = {
        accountStatus: { not: 'DELETED' },
        ...(orgIds ? { memberships: { some: { organizationId: { in: orgIds } } } } : {}),
      };

      const campaignWhere = orgIds
        ? { OR: [{ tenantId: { in: orgIds } }, { organizationId: { in: orgIds } }] }
        : {};

      const [
        totalUsers,
        totalCampaigns,
        pendingCampaigns,
        liveCampaigns,
        pendingMilestones,
        pendingVerifications,
        totalDonations,
        donationsSum,
        campaignsSum,
      ] = await Promise.all([
        prisma.user.count({ where: userWhere }),
        prisma.campaign.count({ where: campaignWhere }),
        prisma.campaign.count({
          where: {
            ...campaignWhere,
            status: { in: ['PENDING_VERIFICATION', 'SUBMITTED', 'DRAFT'] },
          },
        }),
        prisma.campaign.count({
          where: {
            ...campaignWhere,
            status: 'LIVE',
          },
        }),
        prisma.campaignMilestone.count({
          where: {
            status: { in: ['SUBMITTED', 'UNDER_VERIFICATION', 'PLANNED'] },
            ...(orgIds ? { campaign: campaignWhere } : {}),
          },
        }).catch(() => 0),
        prisma.verification.count({
          where: {
            status: 'PENDING',
            ...(orgIds ? { organizationId: { in: orgIds } } : {}),
          },
        }).catch(() => 0),
        prisma.donation.count({
          where: orgIds ? { campaign: campaignWhere } : {},
        }).catch(() => 0),
        prisma.donation.aggregate({
          where: orgIds ? { campaign: campaignWhere } : {},
          _sum: { amount: true },
        }).catch(() => ({ _sum: {} })),
        prisma.campaign.aggregate({
          where: campaignWhere,
          _sum: { targetAmount: true },
        }).catch(() => ({ _sum: {} })),
      ]);

      return {
        totalUsers,
        totalCampaigns,
        pendingCampaigns,
        liveCampaigns,
        pendingMilestones,
        pendingVerifications,
        totalDonations,
        totalAmountRaised: Number(donationsSum._sum?.amount || 0),
        totalTargetGoal: Number(campaignsSum._sum?.targetAmount || 0),
      };
    } catch (err) {
      console.warn('[PrismaAdminRepositoryAdapter] getDashboardStats error:', err.message);
      return {
        totalUsers: 0,
        totalCampaigns: 0,
        pendingCampaigns: 0,
        liveCampaigns: 0,
        pendingMilestones: 0,
        pendingVerifications: 0,
        totalDonations: 0,
        totalAmountRaised: 0,
        totalTargetGoal: 0,
      };
    }
  }

  async findAllProjects({ tenantId, status, page = 1, limit = 50 } = {}) {
    try {
      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
      const skip = (pageNum - 1) * limitNum;

      let orgIds = null;
      if (tenantId) {
        const orgTree = await prisma.organization.findMany({
          where: {
            OR: [
              { id: tenantId },
              { parentId: tenantId },
              { ancestorId: tenantId },
            ],
          },
          select: { id: true },
        }).catch(() => []);
        orgIds = orgTree.length > 0 ? orgTree.map((o) => o.id) : [tenantId];
      }

      const where = {
        ...(orgIds ? { OR: [{ tenantId: { in: orgIds } }, { organizationId: { in: orgIds } }] } : {}),
        ...(status ? { status } : {}),
      };

      const [total, projects] = await Promise.all([
        prisma.campaign.count({ where }).catch(() => 0),
        prisma.campaign.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            targetAmount: true,
            currentRaisedAmount: true,
            tenantId: true,
            organizationId: true,
            createdAt: true,
            student: { select: { id: true, fullName: true, email: true } },
            tenant: { select: { id: true, name: true, slug: true } },
            department: { select: { id: true, name: true, slug: true } },
          },
        }).catch(() => []),
      ]);

      return { projects, total, page: pageNum, limit: limitNum };
    } catch (err) {
      console.warn('[PrismaAdminRepositoryAdapter] findAllProjects error:', err.message);
      return { projects: [], total: 0, page: 1, limit };
    }
  }

  async findAllUsers({ page = 1, limit = 50, search, role, accountStatus, tenantId, organizationId, specificOrgId } = {}) {
    try {
      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
      const skip = (pageNum - 1) * limitNum;

      let orgIds = null;
      if (specificOrgId && specificOrgId !== 'ALL') {
        orgIds = [specificOrgId];
      } else if (tenantId || organizationId) {
        const targetId = tenantId || organizationId;
        const orgTree = await prisma.organization.findMany({
          where: {
            OR: [
              { id: targetId },
              { parentId: targetId },
              { ancestorId: targetId },
            ],
          },
          select: { id: true },
        }).catch(() => []);
        orgIds = orgTree.length > 0 ? orgTree.map((o) => o.id) : [targetId];
      }

      const where = {
        accountStatus: accountStatus || { not: 'DELETED' },
        ...(orgIds ? { memberships: { some: { organizationId: { in: orgIds } } } } : {}),
        ...(role && role !== 'ALL' ? { memberships: { some: { orgRole: role } } } : {}),
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      };

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
          select: {
            id: true,
            fullName: true,
            email: true,
            username: true,
            role: true,
            accountStatus: true,
            speciesId: true,
            speciesNumber: true,
            profileMetadata: true,
            assignedSpecies: true,
            createdAt: true,
            memberships: {
              ...(orgIds ? { where: { organizationId: { in: orgIds } } } : {}),
              include: {
                organization: {
                  select: { id: true, name: true, slug: true, orgType: true },
                },
              },
            },
          },
        }),
      ]);

      return {
        users: users.map((u) => {
          const primaryMembership = u.memberships?.[0];
          return {
            id: u.id,
            name: u.fullName,
            fullName: u.fullName,
            username: u.username,
            email: u.email,
            role: primaryMembership?.role || u.role,
            globalRole: u.role,
            accountStatus: u.accountStatus,
            status: u.accountStatus,
            department: primaryMembership?.department || null,
            designation: primaryMembership?.designation || null,
            organization: primaryMembership?.organization || null,
            memberships: u.memberships || [],
            speciesId: u.speciesId,
            assignedSpecies: u.assignedSpecies,
            profileMetadata: u.profileMetadata,
            createdAt: u.createdAt,
          };
        }),
        total,
        page: pageNum,
        limit: limitNum,
      };
    } catch (err) {
      console.warn('[PrismaAdminRepositoryAdapter] findAllUsers error:', err.message);
      return { users: [], total: 0, page: 1, limit };
    }
  }

  async findAllDonors({ page = 1, limit = 50, search } = {}) {
    try {
      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
      const skip = (pageNum - 1) * limitNum;

      const where = {
        accountStatus: { not: 'DELETED' },
        memberships: { some: { orgRole: 'DONOR' } },
        ...(search
          ? {
              OR: [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { username: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      };

      const [total, donors] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limitNum,
          select: {
            id: true,
            fullName: true,
            email: true,
            username: true,
            role: true,
            accountStatus: true,
            createdAt: true,
          },
        }),
      ]);

      return {
        donors: donors.map((u) => ({
          id: u.id,
          name: u.fullName,
          fullName: u.fullName,
          username: u.username,
          email: u.email,
          role: u.role,
          accountStatus: u.accountStatus,
          status: u.accountStatus,
          createdAt: u.createdAt,
        })),
        total,
        page: pageNum,
        limit: limitNum,
      };
    } catch (err) {
      console.warn('[PrismaAdminRepositoryAdapter] findAllDonors error:', err.message);
      return { donors: [], total: 0, page: 1, limit };
    }
  }

  async findAllClubs() {
    try {
      return await prisma.organization.findMany({
        where: { orgType: 'CLUB' },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      console.warn('[PrismaAdminRepositoryAdapter] findAllClubs error:', err.message);
      return [];
    }
  }

  async findAllDonations() {
    try {
      return await prisma.donation.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } catch (err) {
      console.warn('[PrismaAdminRepositoryAdapter] findAllDonations error:', err.message);
      return [];
    }
  }

  async findAuditLogs() {
    try {
      return await prisma.auditEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    } catch (err) {
      console.warn('[PrismaAdminRepositoryAdapter] findAuditLogs error:', err.message);
      return [];
    }
  }

  async findWithdrawals() {
    try {
      return await prisma.withdrawalRequest.findMany({
        orderBy: { requestedAt: 'desc' },
        take: 100,
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
          organization: {
            select: { id: true, name: true },
          },
        },
      });
    } catch (err) {
      console.warn('[PrismaAdminRepositoryAdapter] findWithdrawals error:', err.message);
      return [];
    }
  }
}

module.exports = new PrismaAdminRepositoryAdapter();
module.exports.PrismaAdminRepositoryAdapter = PrismaAdminRepositoryAdapter;
