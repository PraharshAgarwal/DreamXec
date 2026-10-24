const defaultService = require('../platform.service');
const catchAsync = require('../../../utils/catchAsync');

class CollegeDirectoryController {
  constructor(service = defaultService) {
    this.service = service;
  }

  getColleges = catchAsync(async (req, res) => {
    const colleges = await this.service.getAllColleges(req.query.search);
    res.status(200).json({
      status: 'success',
      results: colleges.length,
      data: { colleges },
    });
  });
}

module.exports = new CollegeDirectoryController();
module.exports.CollegeDirectoryController = CollegeDirectoryController;
