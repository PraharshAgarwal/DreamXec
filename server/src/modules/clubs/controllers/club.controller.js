const clubService = require('../club.service');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

class ClubController {
  constructor(svc = clubService) {
    this.service = svc;
  }

  // ─── Public Club Handlers ─────────────────────────────────────────────────

  getPublicClubs = catchAsync(async (req, res) => {
    const response = await this.service.getPublicClubs(req.query);
    res.status(200).json(response);
  });

  getClubById = catchAsync(async (req, res) => {
    const response = await this.service.getClubById(req.params.id);
    res.status(200).json(response);
  });

  referClub = catchAsync(async (req, res) => {
    const response = await this.service.referClub(req.body);
    res.status(201).json(response);
  });

  uploadMembers = catchAsync(async (req, res) => {
    const response = await this.service.uploadMembers(req.params.id, req.body.members || []);
    res.status(200).json({ status: 'success', data: response });
  });

  // ─── Club Verification ────────────────────────────────────────────────────

  /** POST /api/club-verification/verify-president */
  submitClubVerification = catchAsync(async (req, res) => {
    res.status(200).json({ success: true, message: 'Verification submitted successfully' });
  });

  // ─── Admin Club Verification ──────────────────────────────────────────────

  /** GET /api/admin/club-verifications/verifications */
  listVerifications = catchAsync(async (req, res) => {
    const list = await this.service.listVerifications(req.query);
    res.json({ success: true, data: list });
  });

  /** GET /api/admin/club-verifications/verifications/:id */
  getVerification = catchAsync(async (req, res) => {
    const item = await this.service.getVerification(req.params.id);
    res.json({ success: true, data: item });
  });

  /** POST /api/admin/club-verifications/verifications/:id/approve */
  approveVerification = catchAsync(async (req, res) => {
    const { id } = req.params;
    const result = await this.service.approveVerification(id);
    res.json({ success: true, message: 'Verification approved and student upgraded to president', data: result });
  });

  /** POST /api/admin/club-verifications/verifications/:id/reject */
  rejectVerification = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const updated = await this.service.rejectVerification(id, reason, req.user?.id);
    res.json({ success: true, message: 'Verification rejected successfully', data: updated });
  });

  // ─── Admin Club Referral ──────────────────────────────────────────────────

  /** GET /api/admin/referrals */
  listReferrals = catchAsync(async (req, res) => {
    const referrals = await this.service.listReferrals(req.query);
    res.json({ success: true, data: referrals });
  });

  /** GET /api/admin/referrals/:id */
  getReferral = catchAsync(async (req, res) => {
    const referral = await this.service.getReferral(req.params.id);
    res.json({ success: true, data: referral });
  });

  /** PATCH /api/admin/referrals/:id/status */
  updateReferralStatus = catchAsync(async (req, res) => {
    const { status, notes } = req.body;
    const updated = await this.service.updateReferralStatus(req.params.id, { status, notes });
    res.json({ success: true, data: updated });
  });

  /** POST /api/admin/referrals/:id/approve */
  approveReferral = catchAsync(async (req, res) => {
    const updated = await this.service.approveReferral(req.params.id);
    res.json({ success: true, data: updated });
  });

  /** POST /api/admin/referrals/:id/reject */
  rejectReferral = catchAsync(async (req, res) => {
    const { reason } = req.body;
    const updated = await this.service.rejectReferral(req.params.id, reason);
    res.json({ success: true, data: updated });
  });
}

module.exports = new ClubController();
module.exports.ClubController = ClubController;
