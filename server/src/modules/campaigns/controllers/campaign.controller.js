const catchAsync = require('../../../utils/catchAsync');
const campaignService = require('../services/campaign.service');

/**
 * Express Controller for Campaign endpoints.
 */
class CampaignController {
  constructor({ campaignSvc = campaignService } = {}) {
    this.service = campaignSvc;
  }

  createCampaign = catchAsync(async (req, res) => {
    const campaign = await this.service.createCampaign(req.user, req.body);
    res.status(201).json({
      status: 'success',
      data: { campaign },
    });
  });

  submitCampaignForReview = catchAsync(async (req, res) => {
    const { id } = req.params;
    const campaign = await this.service.submitCampaignForReview(req.user, id);
    res.status(200).json({
      status: 'success',
      message: `Campaign submitted for review (Status: ${campaign.status}).`,
      data: { campaign },
    });
  });

  getPublicCampaigns = catchAsync(async (req, res) => {
    const { category, search, page, limit, cursor, skipCache } = req.query;
    const shouldSkip = skipCache === 'true' || !!req.query._t || req.headers['cache-control']?.includes('no-cache');
    const result = await this.service.getPublicCampaigns({ category, search, page, limit, cursor }, shouldSkip);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  getCampaignDetails = catchAsync(async (req, res) => {
    const { idOrSlug } = req.params;
    const shouldSkip = req.query.skipCache === 'true' || !!req.query._t || req.headers['cache-control']?.includes('no-cache');
    const campaign = await this.service.getCampaignDetails(idOrSlug, shouldSkip);
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.status(200).json({
      status: 'success',
      data: { campaign },
    });
  });

  getMyCampaigns = catchAsync(async (req, res) => {
    const orgId =
      req.query.orgId ||
      req.query.organizationId ||
      req.headers['x-organization-id'] ||
      req.headers['x-tenant-id'] ||
      req.user.activeTenantId ||
      req.user.activeProfile?.orgId ||
      null;

    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 50;

    const campaigns = await this.service.getMyCampaigns(req.user.id, orgId, { page, limit });
    res.status(200).json({
      status: 'success',
      results: campaigns.length,
      pagination: {
        page,
        limit,
      },
      data: { campaigns },
    });
  });

  getPendingCampaigns = catchAsync(async (req, res) => {
    const campaigns = await this.service.getPendingCampaigns(req.user);
    res.status(200).json({
      status: 'success',
      results: campaigns.length,
      data: { campaigns },
    });
  });

  updateCampaign = catchAsync(async (req, res) => {
    const { id } = req.params;
    const campaign = await this.service.updateCampaign(req.user, id, req.body);
    res.status(200).json({
      status: 'success',
      data: { campaign },
    });
  });

  deleteCampaign = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await this.service.deleteCampaign(req.user, id);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  lookupUser = catchAsync(async (req, res) => {
    const query = req.query.query || req.query.username || req.query.email;
    const user = await this.service.lookupUser(query);
    res.status(200).json({
      status: 'success',
      data: { user },
    });
  });

  verifyCampaign = catchAsync(async (req, res) => {
    const { id } = req.params;
    const campaign = await this.service.verifyCampaign(req.user, id, req.body);
    res.status(200).json({
      status: 'success',
      data: { campaign },
    });
  });

  approveCampaign = catchAsync(async (req, res) => {
    const { id } = req.params;
    const campaign = await this.service.verifyCampaign(req.user, id, {
      status: 'APPROVED',
      rejectionReason: req.body?.reason || null,
    });
    res.status(200).json({
      status: 'success',
      data: { campaign },
    });
  });

  rejectCampaign = catchAsync(async (req, res) => {
    const { id } = req.params;
    const campaign = await this.service.verifyCampaign(req.user, id, {
      status: 'REJECTED',
      rejectionReason: req.body?.reason || req.body?.rejectionReason || 'Campaign rejected during administrative verification.',
    });
    res.status(200).json({
      status: 'success',
      data: { campaign },
    });
  });

  endorseCampaign = catchAsync(async (req, res) => {
    const { id } = req.params;
    const endorsement = await this.service.endorseCampaign(req.user, id, req.body);
    res.status(200).json({
      status: 'success',
      data: { endorsement },
    });
  });

  getMembers = catchAsync(async (req, res) => {
    const { id } = req.params;
    const members = await this.service.getMembers(id);
    res.status(200).json({
      status: 'success',
      data: { members },
    });
  });

  addMember = catchAsync(async (req, res) => {
    const { id } = req.params;
    const member = await this.service.addMember(req.user, id, req.body);
    res.status(201).json({
      status: 'success',
      message: 'Team member added successfully',
      data: { member },
    });
  });

  updateMember = catchAsync(async (req, res) => {
    const { id, memberId } = req.params;
    const member = await this.service.updateMember(req.user, id, memberId, req.body);
    res.status(200).json({
      status: 'success',
      message: 'Team member updated successfully',
      data: { member },
    });
  });

  removeMember = catchAsync(async (req, res) => {
    const { id, memberId } = req.params;
    const result = await this.service.removeMember(req.user, id, memberId);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  getImpactDashboardMetrics = catchAsync(async (req, res) => {
    const metrics = await this.service.getImpactDashboardMetrics();
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.status(200).json({
      status: 'success',
      data: metrics,
    });
  });
}

module.exports = new CampaignController();
module.exports.CampaignController = CampaignController;
