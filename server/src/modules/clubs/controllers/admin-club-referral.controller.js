const defaultClubService = require('../club.service');
const catchAsync = require('../../../utils/catchAsync');

class AdminClubReferralController {
  constructor(svc = defaultClubService) {
    this.service = svc;
  }

  listReferrals = catchAsync(async (req, res) => {
    const referrals = await this.service.listReferrals(req.query);
    res.json({ success: true, data: referrals });
  });

  getReferral = catchAsync(async (req, res) => {
    const referral = await this.service.getReferral(req.params.id);
    res.json({ success: true, data: referral });
  });

  updateReferralStatus = catchAsync(async (req, res) => {
    const { status, notes } = req.body;
    const updated = await this.service.updateReferralStatus(req.params.id, { status, notes });
    res.json({ success: true, data: updated });
  });

  approveReferral = catchAsync(async (req, res) => {
    const updated = await this.service.approveReferral(req.params.id);
    res.json({ success: true, data: updated });
  });

  rejectReferral = catchAsync(async (req, res) => {
    const { reason } = req.body;
    const updated = await this.service.rejectReferral(req.params.id, reason);
    res.json({ success: true, data: updated });
  });
}

module.exports = new AdminClubReferralController();
module.exports.AdminClubReferralController = AdminClubReferralController;
