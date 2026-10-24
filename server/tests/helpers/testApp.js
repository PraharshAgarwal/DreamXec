process.env.JWT_SECRET = 'test-secret';
process.env.SESSION_SECRET = 'test-session-secret';
const express = require('express');
const session = require('express-session');

const authRoutes = require('../../src/modules/auth/routes/auth.routes');
const donationRoutes = require('../../src/modules/donations/routes/donation.routes');
const adminRoutes = require('../../src/modules/admin/routes/admin.routes');
const clubRoutes = require('../../src/modules/clubs/routes/club.routes');
const userProjectRoutes = require('../../src/modules/projects/routes/user-project.routes');
const userRoutes = require('../../src/modules/users/routes/user.routes');
const profileRoutes = require('../../src/modules/users/routes/profile.routes');
const commentRoutes = require('../../src/modules/interactions/routes/comment.routes');
const wishlistRoutes = require('../../src/modules/interactions/routes/wishlist.routes');
const collegesRoutes = require('../../src/modules/platform/routes/colleges.routes');
const newsletterRoutes = require('../../src/modules/platform/routes/newsletter.routes');
const otpRoutes = require('../../src/modules/platform/routes/otp.routes');
const seoRoutes = require('../../src/modules/platform/routes/seo.routes');
const uploadRoutes = require('../../src/modules/platform/routes/upload.routes');
const applicationRoutes = require('../../src/modules/governance/routes/application.routes');
const mentorRoutes = require('../../src/modules/governance/routes/mentor.routes');
const studentVerificationRoutes = require('../../src/modules/governance/routes/student-verification.routes');
const workflowRoutes = require('../../src/modules/governance/routes/workflow.routes');
const withdrawalRoutes = require('../../src/modules/donations/routes/withdrawal.routes');
const campaignRoutes = require('../../src/modules/campaigns/routes/campaign.routes');
const globalErrorHandler = require('../../src/middleware/error.middleware');

function createTestApp() {
  const app = express();

  app.use(express.json());

  // In-memory session for test suite
  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'test_session_secret',
      resave: false,
      saveUninitialized: false,
    })
  );

  // Session middleware for OAuth testing

  // Mount API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/donations', donationRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/clubs', clubRoutes);
  app.use('/api/user-projects', userProjectRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/profile', profileRoutes);
  app.use('/api/wishlist', wishlistRoutes);
  app.use('/api/colleges', collegesRoutes);
  app.use('/api/newsletter', newsletterRoutes);
  app.use('/api/otp', otpRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/api/applications', applicationRoutes);
  app.use('/api/mentor', mentorRoutes);
  app.use('/api/student-verification', studentVerificationRoutes);
  app.use('/api/workflows', workflowRoutes);
  app.use('/api/withdrawals', withdrawalRoutes);
  app.use('/api/campaigns', campaignRoutes);
  app.use('/', seoRoutes);
  app.use('/api', commentRoutes);

  // Global Error Handler
  app.use(globalErrorHandler);

  return app;
}

module.exports = createTestApp;
