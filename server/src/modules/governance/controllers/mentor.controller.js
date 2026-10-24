const defaultService = require('../governance.service');
const catchAsync = require('../../../utils/catchAsync');

class MentorController {
  constructor(service = defaultService) {
    this.service = service;
  }

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
}

module.exports = new MentorController();
module.exports.MentorController = MentorController;
