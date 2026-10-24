const userService = require('../user.service');
const catchAsync = require('../../../utils/catchAsync');
const { invalidateUserAuth } = require('../../../middleware/auth.middleware');
const { invalidateMembershipCache } = require('../../../middleware/organization.middleware');

class UserController {
  constructor(svc = userService) {
    this.service = svc;
  }

  getMe = catchAsync(async (req, res) => {
    const response = await this.service.getMe(req.user.id);
    res.status(200).json(response);
  });

  getMyProfile = catchAsync(async (req, res) => {
    const response = await this.service.getProfile(req.user.id, req.user.role);
    res.status(200).json(response);
  });

  updateMyProfile = catchAsync(async (req, res) => {
    const response = await this.service.updateProfile(req.user.id, req.user.role, req.body);
    await invalidateUserAuth(req.user.id);
    res.status(200).json(response);
  });

  updateProfilePicture = catchAsync(async (req, res) => {
    const response = await this.service.updateProfilePicture(req.user.id, req.file);
    res.status(200).json(response);
  });

  getAllUsers = catchAsync(async (req, res) => {
    const response = await this.service.getAllUsers();
    res.status(200).json(response);
  });

  suspendUser = catchAsync(async (req, res) => {
    const response = await this.service.suspendUser(req.params.id);
    await invalidateUserAuth(req.params.id);
    await invalidateMembershipCache(req.params.id);
    res.status(200).json(response);
  });

  getMyKyc = catchAsync(async (req, res) => {
    const response = await this.service.getKycStatus(req.user.id);
    res.status(200).json(response);
  });

  submitKyc = catchAsync(async (req, res) => {
    const response = await this.service.submitKyc(req.user.id, req.body);
    res.status(200).json(response);
  });

  exportUserData = catchAsync(async (req, res) => {
    const response = await this.service.exportUserData(req.user.id);
    res.status(200).json({ status: 'success', data: response });
  });

  requestAccountDeletion = catchAsync(async (req, res) => {
    const response = await this.service.requestAccountDeletion(req.user.id);
    res.status(200).json(response);
  });

  recordConsent = catchAsync(async (req, res) => {
    const consentData = {
      ...req.body,
      ipAddress: req.ip || req.headers['x-forwarded-for'] || null,
      userAgent: req.headers['user-agent'] || null,
    };
    const response = await this.service.recordDpdpConsent(req.user.id, consentData);
    res.status(200).json(response);
  });
}

module.exports = new UserController();
module.exports.UserController = UserController;
