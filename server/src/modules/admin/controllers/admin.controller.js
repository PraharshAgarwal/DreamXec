const defaultService = require('../admin.service');
const catchAsync = require('../../../utils/catchAsync');

class AdminController {
  constructor(service = defaultService) {
    this.service = service;
  }

  getDashboardStats = catchAsync(async (req, res) => {
    const stats = await this.service.getDashboardStats();

    res.status(200).json({
      status: 'success',
      data: { stats },
    });
  });

  getAllProjects = catchAsync(async (req, res) => {
    const { tenantId, status, page, limit } = req.query;
    const result = await this.service.getAllProjects({ tenantId, status, page, limit });

    res.status(200).json({
      status: 'success',
      results: Array.isArray(result) ? result.length : (result.projects?.length || 0),
      total: result.total ?? (Array.isArray(result) ? result.length : (result.projects?.length || 0)),
      page: result.page ?? 1,
      limit: result.limit ?? 50,
      data: Array.isArray(result) ? { projects: result } : result,
    });
  });

  getAllUsers = catchAsync(async (req, res) => {
    const { page, limit, search, role, accountStatus } = req.query;
    const result = await this.service.getAllUsers({ page, limit, search, role, accountStatus });

    res.status(200).json({
      status: 'success',
      results: Array.isArray(result) ? result.length : (result.users?.length || 0),
      total: result.total ?? (Array.isArray(result) ? result.length : (result.users?.length || 0)),
      page: result.page ?? 1,
      limit: result.limit ?? 50,
      data: Array.isArray(result) ? { users: result } : result,
    });
  });

  getAllDonors = catchAsync(async (req, res) => {
    const { page, limit, search } = req.query;
    const result = await this.service.getAllDonors({ page, limit, search });

    res.status(200).json({
      status: 'success',
      results: Array.isArray(result) ? result.length : (result.donors?.length || 0),
      total: result.total ?? (Array.isArray(result) ? result.length : (result.donors?.length || 0)),
      page: result.page ?? 1,
      limit: result.limit ?? 50,
      data: Array.isArray(result) ? { donors: result } : result,
    });
  });

  getAllClubs = catchAsync(async (req, res) => {
    const clubs = await this.service.getAllClubs();

    res.status(200).json({
      status: 'success',
      results: clubs.length,
      data: { clubs },
    });
  });

  getAllDonations = catchAsync(async (req, res) => {
    const donations = await this.service.getAllDonations();

    res.status(200).json({
      status: 'success',
      results: donations.length,
      data: { donations },
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

  getWithdrawals = catchAsync(async (req, res) => {
    const withdrawals = await this.service.getWithdrawals();

    res.status(200).json({
      status: 'success',
      results: withdrawals.length,
      data: { withdrawals },
    });
  });

  verifyUserProject = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Project verified successfully',
    });
  });

  verifyDonorProject = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Donor project verified successfully',
    });
  });

  manageUserStatus = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'User status updated',
    });
  });

  manageClubStatus = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Club status updated',
    });
  });

  getClubMembers = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      data: { members: [] },
    });
  });

  uploadClubMembers = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Club members uploaded',
    });
  });

  manageWithdrawal = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Withdrawal status updated',
    });
  });

  getAllMilestones = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      data: { milestones: [] },
    });
  });

  getPendingMilestones = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      data: { milestones: [] },
    });
  });

  verifyMilestone = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Milestone verified',
    });
  });

  verifyDonor = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Donor verified',
    });
  });

  manageDonorStatus = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Donor status updated',
    });
  });

  getAllApplications = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      data: { applications: [] },
    });
  });

  overrideApplicationStatus = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Application status overridden',
    });
  });

  getProjectFullDetails = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      data: { details: {} },
    });
  });
}

module.exports = new AdminController();
module.exports.AdminController = AdminController;
