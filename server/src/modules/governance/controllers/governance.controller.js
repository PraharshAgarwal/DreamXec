const defaultService = require('../governance.service');
const catchAsync = require('../../../utils/catchAsync');

class GovernanceController {
  constructor(service = defaultService) {
    this.service = service;
  }

  submitApplication = catchAsync(async (req, res) => {
    const application = await this.service.submitApplication(req.user.id, req.body);

    res.status(201).json({
      status: 'success',
      data: { application },
    });
  });

  getApplications = catchAsync(async (req, res) => {
    const applications = await this.service.getApplications(req.user.id);

    res.status(200).json({
      status: 'success',
      results: applications.length,
      data: { applications },
    });
  });

  getMentors = catchAsync(async (req, res) => {
    const mentors = await this.service.getAllMentors();

    res.status(200).json({
      status: 'success',
      results: mentors.length,
      data: { mentors },
    });
  });

  onboardMentor = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      message: 'Mentor onboarded successfully',
    });
  });

  createStudentVerificationOrder = catchAsync(async (req, res) => {
    const order = await this.service.createStudentVerificationOrder({
      studentEmail: req.body.studentEmail,
      officialEmail: req.body.officialEmail,
      mobileNumber: req.body.mobileNumber,
      user: req.user,
      origin: req.headers.origin || req.headers.referer,
      req,
    });

    res.status(200).json({ order });
  });

  getWorkflows = catchAsync(async (req, res) => {
    res.status(200).json({
      status: 'success',
      data: { workflows: [] },
    });
  });

  createWorkflow = catchAsync(async (req, res) => {
    res.status(201).json({
      status: 'success',
      message: 'Workflow created successfully',
    });
  });

  getAllStudentVerifications = catchAsync(async (req, res) => {
    res.status(200).json({
      success: true,
      results: 0,
      data: { verifications: [] },
    });
  });

  approveStudentVerification = catchAsync(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Student is verified.',
    });
  });

  rejectStudentVerification = catchAsync(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Student verification rejected.',
    });
  });
}

module.exports = new GovernanceController();
module.exports.GovernanceController = GovernanceController;
