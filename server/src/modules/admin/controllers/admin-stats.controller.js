const defaultService = require('../admin.service');
const catchAsync = require('../../../utils/catchAsync');

const prisma = require('../../../config/prisma');

class AdminStatsController {
  constructor(service = defaultService) {
    this.service = service;
  }

  getDashboardStats = catchAsync(async (req, res) => {
    const tenantId = req.query.tenantId || req.query.organizationId;
    const stats = await this.service.getDashboardStats({ tenantId });
    res.status(200).json({
      status: 'success',
      data: {
        ...stats,
        stats,
      },
    });
  });

  getOrgTree = catchAsync(async (req, res) => {
    const tenantId = req.query.tenantId || req.query.organizationId;
    if (!tenantId) {
      return res.status(200).json({
        status: 'success',
        data: { organization: null, childOrgs: [] },
      });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: tenantId },
      include: {
        children: {
          include: {
            _count: {
              select: {
                memberships: true,
                tenantCampaigns: true,
                departmentCampaigns: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: {
            memberships: true,
            tenantCampaigns: true,
            departmentCampaigns: true,
          },
        },
      },
    });

    res.status(200).json({
      status: 'success',
      data: {
        organization,
        childOrgs: organization?.children || [],
      },
    });
  });

  getAuditLogs = catchAsync(async (req, res) => {
    const logs = await this.service.getAuditLogs();
    res.status(200).json({
      status: 'success',
      results: logs.length,
      data: { logs },
    });
  });
}

module.exports = new AdminStatsController();
module.exports.AdminStatsController = AdminStatsController;
