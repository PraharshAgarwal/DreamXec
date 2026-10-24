const defaultService = require('../platform.service');
const catchAsync = require('../../../utils/catchAsync');

class SeoController {
  constructor(service = defaultService) {
    this.service = service;
  }

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
}

module.exports = new SeoController();
module.exports.SeoController = SeoController;
