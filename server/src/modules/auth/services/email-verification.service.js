const { userRepository } = require('../auth.repository');
const tokenService = require('./token.service');
const emailService = require('../../email/email.service');
const { AppError } = require('../auth.errors');
const { getClientUrl } = require('../../../utils/urlConfig');

/**
 * Dedicated service handling email verification token decoding and user status updates.
 */
class EmailVerificationService {
  constructor({
    userRepo = userRepository,
    tokenSvc = tokenService,
    emailSvc = emailService,
  } = {}) {
    this.userRepository = userRepo;
    this.tokenService = tokenSvc;
    this.emailService = emailSvc;
  }

  /**
   * Verifies user email from token.
   */
  async verifyEmail(token, req) {
    if (!token) {
      throw new AppError('Verification token is missing.', 400);
    }

    let decoded;
    try {
      decoded = await this.tokenService.verifyVerificationToken(token);
    } catch (err) {
      throw new AppError('Invalid or expired verification token.', 400);
    }

    const user = await this.userRepository.findByEmail(decoded.email);
    if (!user) {
      throw new AppError('No account found for this verification link.', 404);
    }

    const metadata = user.profileMetadata || {};
    if (metadata.emailVerified) {
      return { redirectUrl: `${getClientUrl(req)}/email-verified?status=already` };
    }

    if (metadata.verificationTokenExpiry && new Date() > new Date(metadata.verificationTokenExpiry)) {
      throw new AppError('Verification link has expired. Please request a new one.', 400);
    }

    await this.userRepository.update(user.id, {
      profileMetadata: {
        ...metadata,
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    await this.emailService.sendWelcomeEmail({ email: user.email, name: user.fullName });

    return { redirectUrl: `${getClientUrl(req)}/email-verified?status=success` };
  }
}

module.exports = new EmailVerificationService();
module.exports.EmailVerificationService = EmailVerificationService;
