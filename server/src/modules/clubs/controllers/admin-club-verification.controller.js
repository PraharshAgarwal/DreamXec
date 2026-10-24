const defaultClubService = require('../club.service');
const catchAsync = require('../../../utils/catchAsync');

class AdminClubVerificationController {
  constructor(svc = defaultClubService) {
    this.service = svc;
  }

  listVerifications = catchAsync(async (req, res) => {
    const list = await this.service.listVerifications(req.query);
    res.json({ success: true, data: list });
  });

  getVerification = catchAsync(async (req, res) => {
    const item = await this.service.getVerification(req.params.id);
    res.json({ success: true, data: item });
  });

  approveVerification = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await this.service.approveVerification(id);
    res.json({ success: true, message: 'Verification approved and student upgraded to president', data: result });
  });

  rejectVerification = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const updated = await this.service.rejectVerification(id, reason, req.user?.id);
    res.json({ success: true, message: 'Verification rejected successfully', data: updated });
  });
}

module.exports = new AdminClubVerificationController();
module.exports.AdminClubVerificationController = AdminClubVerificationController;
