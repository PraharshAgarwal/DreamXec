const AppError = require('../utils/AppError');

exports.validateCampaignEligibility = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return next(new AppError('You must be logged in.', 401));
  }

  next();
};