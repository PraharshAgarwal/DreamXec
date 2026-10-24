const defaultService = require('../platform.service');
const catchAsync = require('../../../utils/catchAsync');

class NewsletterController {
  constructor(service = defaultService) {
    this.service = service;
  }

  subscribeNewsletter = catchAsync(async (req, res) => {
    await this.service.subscribeNewsletter(req.body.email);
    res.status(200).json({
      status: 'success',
      message: 'Subscribed to newsletter successfully',
    });
  });
}

module.exports = new NewsletterController();
module.exports.NewsletterController = NewsletterController;
