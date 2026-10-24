const defaultService = require('../platform.service');
const catchAsync = require('../../../utils/catchAsync');

class OtpController {
  constructor(service = defaultService) {
    this.service = service;
  }

  sendOtp = catchAsync(async (req, res) => {
    const result = await this.service.sendOtp(req.body);
    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  });

  verifyOtp = catchAsync(async (req, res) => {
    const result = await this.service.verifyOtp(req.body);
    res.status(200).json({
      status: 'success',
      message: result.message,
    });
  });
}

module.exports = new OtpController();
module.exports.OtpController = OtpController;
