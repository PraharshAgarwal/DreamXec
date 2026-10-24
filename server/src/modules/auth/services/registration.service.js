const { userRepository } = require('../auth.repository');
const tokenService = require('./token.service');
const passwordService = require('./password.service');
const emailService = require('../../email/email.service');
const UserMapper = require('../auth.mapper');
const { AccountStatus } = require('../auth.constants');
const { AppError } = require('../auth.errors');
const sessionService = require('./session.service');

/**
 * Dedicated service handling default account registration (always assigns base USER role).
 */
class RegistrationService {
  constructor({
    userRepo = userRepository,
    tokenSvc = tokenService,
    passwordSvc = passwordService,
    emailSvc = emailService,
    userMapper = UserMapper,
  } = {}) {
    this.userRepository = userRepo;
    this.tokenService = tokenSvc;
    this.passwordService = passwordSvc;
    this.emailService = emailSvc;
    this.UserMapper = userMapper;
    this.sessionService = sessionService;
  }

  /**
   * Registers a new user with basic details and standard USER role.
   */
  async register(data) {
    const { name, email, password } = data;
    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (!normalizedEmail) {
      throw new AppError('Email address is required.', 400);
    }

    const existingUser = await this.userRepository.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new AppError('An account with this email already exists.', 400);
    }

    const hashedPassword = await this.passwordService.hash(password);
    const verificationToken = this.tokenService.generateVerificationToken(normalizedEmail);
    const verificationTokenExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const newUser = await this.userRepository.create({
      fullName: name || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      passwordHash: hashedPassword,
      role: 'USER', // Always default to standard USER
      accountStatus: AccountStatus.ACTIVE,
      profileMetadata: {
        verificationToken,
        verificationTokenExpiry,
        emailVerified: true,
        profileComplete: false,
        isMinor: Boolean(data.isMinor),
        guardianEmail: data.guardianEmail ? String(data.guardianEmail).trim().toLowerCase() : null,
        statutoryAgeAttestedAt: new Date().toISOString(),
      },
    });

    // Send guardian notification email if under 18 for DPDP Act 2023 compliance
    if (data.guardianEmail && this.emailService && typeof this.emailService.send === 'function') {
      try {
        await this.emailService.send({
          to: data.guardianEmail.trim().toLowerCase(),
          subject: `[DreamXec] Guardian Notice: Account Registered for ${name || 'Your Ward'}`,
          text: `Dear Guardian,\n\nThis notification is provided in compliance with Section 9 of the Digital Personal Data Protection (DPDP) Act, 2023. Your ward (${name || 'Student'}) has created a student researcher account on the DreamXec academic platform using email: ${normalizedEmail}.\n\nIf you have any questions or did not authorize this, please contact support@dreamxec.com.`,
        });
      } catch (emailErr) {
        console.warn('[RegistrationService] Guardian notification notice:', emailErr.message);
      }
    }

    // Create session for the new standard user
    const session = await this.sessionService.createSession(newUser);
    return session;
  }
}

module.exports = new RegistrationService();
module.exports.RegistrationService = RegistrationService;
