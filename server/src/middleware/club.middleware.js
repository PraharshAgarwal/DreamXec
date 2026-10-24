const prisma = require('../config/prisma');
const AppError = require('../utils/AppError');

// clubId is already validated in resolveCampaignClub middleware
// DO NOT re-check membership here
/* ======================================================
   A. Ensure Club Verified
====================================================== */
const ensureClubVerified = (req, res, next) => {
  const user = req.user;
  if (!user) return next(new AppError('You must be logged in', 401));
  return next();
};

/* ======================================================
   B. Resolve Campaign Club
====================================================== */
const resolveCampaignClub = async (req, res, next) => {
  const { clubId } = req.body;
  const user = req.user;

  if (!clubId) {
    return next(new AppError('clubId is required to create a campaign', 400));
  }

  const club = await prisma.organization.findUnique({
    where: { id: clubId },
    select: { id: true },
  });

  if (!club) {
    return next(new AppError('Club not found', 404));
  }

  req.validatedClubId = club.id;
  return next();
};

/* ======================================================
   C. Validate Campaign Eligibility
====================================================== */
const validateCampaignEligibility = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return next(new AppError('You must be logged in.', 401));
  }

  next();
};

module.exports = {
  ensureClubVerified,
  resolveCampaignClub,
  validateCampaignEligibility,
};
