const { userRepository } = require('../auth.repository');
const tokenService = require('./token.service');
const passwordService = require('./password.service');
const emailService = require('../../email/email.service');
const auditService = require('./audit.service');
const sessionService = require('./session.service');
const { AppError } = require('../auth.errors');
const { getClientUrl } = require('../../../utils/urlConfig');

/**
 * Dedicated service handling password reset requests and password updates.
 */
class PasswordResetService {
  constructor({
    userRepo = userRepository,
    tokenSvc = tokenService,
    passwordSvc = passwordService,
    emailSvc = emailService,
    auditSvc = auditService,
    sessionSvc = sessionService,
  } = {}) {
    this.userRepository = userRepo;
    this.tokenService = tokenSvc;
    this.passwordService = passwordSvc;
    this.emailService = emailSvc;
    this.auditService = auditSvc;
    this.sessionService = sessionSvc;
  }

  /**
   * Initiates forgot password flow.
   */
  async forgotPassword(email) {
    const user = await this.userRepository.findByEmail(email);

    if (!user) {
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    if (!user.passwordHash) {
      throw new AppError('This account uses social login (Google/LinkedIn). Please sign in with that provider.', 400);
    }

    const resetToken = this.tokenService.generateResetToken(email);
    // Every request generates a fresh unique token with a strict 5-minute active window
    const resetPasswordExpiry = new Date(Date.now() + 5 * 60 * 1000);

    const metadata = user.profileMetadata || {};
    await this.userRepository.update(user.id, {
      profileMetadata: {
        ...metadata,
        resetPasswordToken: resetToken,
        resetPasswordExpiry,
      },
    });

    try {
      await this.emailService.sendResetPasswordEmail({
        email: user.email,
        name: user.fullName,
        resetToken,
      });

      const clientUrl = getClientUrl();
      const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

      // Only log in non-production to avoid token leakage in log aggregators
      if (process.env.NODE_ENV !== 'production') {
        console.log(`\n===========================================================`);
        console.log(`🔑 [DEV] Password reset link for: ${user.email}`);
        console.log(`   Reset URL: ${resetUrl}`);
        console.log(`===========================================================\n`);
      }

      return {
        message: 'If an account with that email exists, a password reset link has been sent.',
      };
    } catch (emailErr) {
      await this.userRepository.update(user.id, {
        profileMetadata: {
          ...metadata,
          resetPasswordToken: null,
          resetPasswordExpiry: null,
        },
      });

      console.error('[PasswordResetService] Password reset email failed:', emailErr.message);
      throw new AppError('Could not send reset email. Please try again later.', 500);
    }
  }

  /**
   * Validates if a password reset token is active, genuine, and not expired.
   */
  async verifyResetToken(token) {
    if (!token) {
      throw new AppError('Reset token is missing.', 400);
    }

    let decoded;
    try {
      decoded = await this.tokenService.verifyResetToken(token);
    } catch (err) {
      throw new AppError('Invalid or expired reset token link.', 400);
    }

    if (!decoded || !decoded.email) {
      throw new AppError('Invalid or expired reset token link.', 400);
    }

    const user = await this.userRepository.findByEmail(decoded.email);
    if (!user) {
      throw new AppError('No account found for this reset link.', 404);
    }

    const metadata = user.profileMetadata || {};
    if (metadata.resetPasswordToken !== token) {
      throw new AppError('This reset link has already been used or replaced by a newer request.', 400);
    }

    if (!metadata.resetPasswordExpiry || new Date() > new Date(metadata.resetPasswordExpiry)) {
      throw new AppError('Reset link has expired (5-minute limit reached). Please request a new one.', 400);
    }

    return {
      valid: true,
      email: user.email,
      expiresAt: metadata.resetPasswordExpiry,
    };
  }

  /**
   * Resets user password using reset token and returns authenticated session.
   */
  async resetPassword(token, newPassword) {
    if (!token) {
      throw new AppError('Reset token is missing.', 400);
    }

    if (!newPassword || String(newPassword).length < 8) {
      throw new AppError('Password must be at least 8 characters long.', 400);
    }

    const tokenInfo = await this.verifyResetToken(token);
    const user = await this.userRepository.findByEmail(tokenInfo.email);
    if (!user) {
      throw new AppError('No account found for this reset link.', 404);
    }

    const metadata = user.profileMetadata || {};
    const hashedPassword = await this.passwordService.hash(newPassword);

    const updatedUser = await this.userRepository.update(user.id, {
      passwordHash: hashedPassword,
      profileMetadata: {
        ...metadata,
        resetPasswordToken: null,
        resetPasswordExpiry: null,
      },
    });

    await this.auditService.passwordReset({ user: updatedUser });

    return this.sessionService.createSession(updatedUser);
  }
}

module.exports = new PasswordResetService();
module.exports.PasswordResetService = PasswordResetService;
