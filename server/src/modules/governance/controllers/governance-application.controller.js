const defaultService = require('../governance.service');
const catchAsync = require('../../../utils/catchAsync');

class GovernanceApplicationController {
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
}

module.exports = new GovernanceApplicationController();
module.exports.GovernanceApplicationController = GovernanceApplicationController;
