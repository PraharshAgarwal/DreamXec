const defaultService = require('../platform.service');
const catchAsync = require('../../../utils/catchAsync');

class PlatformController {
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

  subscribeNewsletter = catchAsync(async (req, res) => {
    await this.service.subscribeNewsletter(req.body.email);

    res.status(200).json({
      status: 'success',
      message: 'Subscribed to newsletter successfully',
    });
  });

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

  getSitemap = catchAsync(async (req, res) => {
    const xml = await this.service.generateSitemapXml();

    res.header('Content-Type', 'application/xml');
    res.status(200).send(xml);
  });

  getRobots = catchAsync(async (req, res) => {
    const txt = this.service.generateRobotsTxt();

    res.header('Content-Type', 'text/plain');
    res.status(200).send(txt);
  });

  uploadFile = catchAsync(async (req, res) => {
    const folder = req.body.folder || 'uploads';
    const result = await this.service.uploadFile(req.file, folder);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });
}

module.exports = new PlatformController();
module.exports.PlatformController = PlatformController;
