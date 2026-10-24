const { userRepository } = require('./auth.repository');

const tokenService = require('./services/token.service');
const passwordService = require('./services/password.service');
const auditService = require('./services/audit.service');
const mfaService = require('./services/mfa.service');
const sessionService = require('./services/session.service');

const { AccountStatus } = require('./auth.constants');

const {
  InvalidCredentialsError,
  AccountDisabledError,
  MFARequiredError,
  AppError,
} = require('./auth.errors');
const prisma = require('../../config/prisma');
const { OrgRole } = require('@prisma/client');

const normalizeEmail = (email) =>
  String(email || '')
    .trim()
    .toLowerCase();

const sanitizeAuditValue = (value, maximumLength) => {
  if (!value) return null;
  return String(value).slice(0, maximumLength);
};

class AuthService {
  constructor({
    userRepo = userRepository,
    passwordSvc = passwordService,
    auditSvc = auditService,
    mfaSvc = mfaService,
    tokenSvc = tokenService,
    sessionSvc = sessionService,
  } = {}) {
    this.userRepository = userRepo;
    this.passwordService = passwordSvc;
    this.auditService = auditSvc;
    this.mfaService = mfaSvc;
    this.tokenService = tokenSvc;
    this.sessionService = sessionSvc;
  }
    /**
   * Checks if user completed the workflow for a given organization and role,
   * then safely creates/activates the membership and issues a scoped token.
   */
  // Replace lines 48-155 in auth.service.js with:

  /**
   * Checks if user completed the workflow for a given organization and role,
   * dynamically validates allowed roles from DB, safely activates membership inside a transaction,
   * and issues a scoped JWT token.
   */
  async claimRole(authenticatedUser, { organizationId, role, workflowInstanceId }) {
    if (!authenticatedUser) {
      throw new AppError('You must be logged in to claim a role.', 401);
    }


    const requestedRole = String(role || '').trim().toUpperCase();

    // 1. Dynamically validate requested role against Database OrgRole Enum
    if (!OrgRole || !Object.values(OrgRole).includes(requestedRole)) {
      throw new AppError(`Invalid role '${requestedRole}'. Role must be a valid organization role.`, 400);
    }

    // 2. Resolve organization by ID or slug directly from DB
    const org = await prisma.organization.findFirst({
      where: {
        OR: [
          { id: organizationId },
          { slug: organizationId },
        ],
      },
    });

    if (!org) {
      throw new AppError('Organization not found.', 404);
    }

    // 3. Dynamically validate against organization's allowed_roles from DB
    if (Array.isArray(org.allowedRoles) && org.allowedRoles.length > 0) {
      if (!org.allowedRoles.includes(requestedRole)) {
        throw new AppError(
          `Role '${requestedRole}' is not permitted for organization '${org.name}'. Allowed roles: ${org.allowedRoles.join(', ')}`,
          400
        );
      }
    }

    // 4. Fast-path: Check if user already has an ACTIVE membership in DB
    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId: authenticatedUser.id,
        organizationId: org.id,
        role: requestedRole,
        status: 'ACTIVE',
      },
    });

    if (existingMembership) {
      return this.sessionService.switchProfile(authenticatedUser, org.id, requestedRole);
    }

    // 5. Enforce verified email if matching workflow applicant by email
    const isEmailVerified = Boolean(
      authenticatedUser.emailVerified || authenticatedUser.profileMetadata?.emailVerified
    );

    const applicantConditions = [{ applicantId: authenticatedUser.id }];
    if (isEmailVerified && authenticatedUser.email) {
      applicantConditions.push({
        applicantEmail: { equals: authenticatedUser.email.toLowerCase(), mode: 'insensitive' },
      });
    }

    // 6. Verify COMPLETED workflow exists in DB with strict role matching
    const workflowWhere = {
      tenantId: org.id,
      status: 'COMPLETED',
      OR: applicantConditions,
      AND: [
        {
          OR: [
            { instanceData: { path: ['selectedRole'], equals: requestedRole } },
            { instanceData: { path: ['role'], equals: requestedRole } },
          ],
        },
      ],
    };

    if (workflowInstanceId) {
      workflowWhere.id = workflowInstanceId;
    }

    const completedWorkflow = await prisma.workflowInstance.findFirst({
      where: workflowWhere,
      orderBy: { completedAt: 'desc' },
    });

    if (!completedWorkflow) {
      throw new AppError(
        `Cannot assign role '${requestedRole}'. No completed verification workflow found for this role in ${org.name}. Please complete the required verification workflow first.`,
        403
      );
    }

    // 7. Atomic DB Transaction: Activate Membership & Link applicantId
    await prisma.$transaction(async (tx) => {
      await tx.membership.upsert({
        where: {
          userId_organizationId_role: {
            userId: authenticatedUser.id,
            organizationId: org.id,
            role: requestedRole,
          },
        },
        update: {
          role: requestedRole,
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
        create: {
          userId: authenticatedUser.id,
          organizationId: org.id,
          role: requestedRole,
          status: 'ACTIVE',
          joinedAt: new Date(),
        },
      });

      if (!completedWorkflow.applicantId) {
        await tx.workflowInstance.update({
          where: { id: completedWorkflow.id },
          data: { applicantId: authenticatedUser.id },
        });
      }
    });

    // 8. Switch active profile & return updated scoped JWT with permissions
    return this.sessionService.switchProfile(authenticatedUser, org.id, requestedRole);
  }


  async login({ email, password, ip, userAgent }) {
    const context = this.#buildLoginContext({
      email,
      ip,
      userAgent,
    });

    const user = await this.#authenticateCredentials(
      context.email,
      password,
      context
    );

    this.#ensureActiveUser(user);

    await this.#enforceMFA(user);

    const session = await this.sessionService.createSession(user);

    await this.#safeAuditLoginSuccess(user, context);

    return session;
  }

  async getMe(authenticatedUser) {
    if (!authenticatedUser) {
      throw new AppError('You are not logged in.', 401);
    }

    const userDto = await this.sessionService.buildUserDTO(authenticatedUser);

    return {
      user: userDto,
    };
  }

  async switchProfile(authenticatedUser, organizationId, role, isIndependent = false) {
    if (!authenticatedUser) {
      throw new AppError('You are not logged in.', 401);
    }
    return this.sessionService.switchProfile(authenticatedUser, organizationId, role, isIndependent);
  }

  async #authenticateCredentials(
    email,
    password,
    context
  ) {
    const user = await this.userRepository.findByEmail(email);

    const hasPassword = Boolean(user?.passwordHash);

    let passwordMatches = false;

    if (hasPassword) {
      passwordMatches = await this.passwordService.verify(
        password,
        user.passwordHash
      );
    } else {
      /*
       * This fallback reduces obvious timing differences when the
       * password service provides a dummy hash.
       *
       * Add getDummyHash() to password.service.js for full timing
       * equalization.
       */
      await this.#performDummyPasswordVerification(password);
    }

    if (!user || !hasPassword || !passwordMatches) {
      await this.#safeAuditLoginFailure(context);
      throw new InvalidCredentialsError();
    }

    return user;
  }

  async #performDummyPasswordVerification(password) {
    if (
      typeof this.passwordService.getDummyHash !== 'function'
    ) {
      return;
    }

    const dummyHash = this.passwordService.getDummyHash();

    if (!dummyHash) {
      return;
    }

    try {
      await this.passwordService.verify(password, dummyHash);
    } catch (error) {
      console.error(
        '[AuthService] Dummy password verification failed:',
        error.message
      );
    }
  }

  async refreshSession(refreshTokenStr) {
    if (!refreshTokenStr) {
      throw new AppError('Refresh token is required', 400);
    }
    const decoded = await this.tokenService.verifyRefreshToken(refreshTokenStr);
    if (!decoded || !decoded.id) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
    const user = await this.userRepository.findById(decoded.id);
    if (!user) {
      throw new AppError('User account not found', 404);
    }
    this.#ensureActiveUser(user);
    const orgRoles = await this.userRepository.getUserOrgRoles(user.id);
    const accessToken = this.tokenService.generateAccessToken(user, orgRoles);
    const refreshToken = this.tokenService.generateRefreshToken(user);
    const mappedUser = this.userRepository.mapUser(user, orgRoles);
    return {
      token: accessToken,
      refreshToken,
      user: mappedUser,
    };
  }

  #ensureActiveUser(user) {
    if (user.accountStatus === AccountStatus.ACTIVE) {
      return;
    }

    throw AccountDisabledError.forStatus(user.accountStatus);
  }

  async #enforceMFA(user) {
    const isMFAEnabled =
      await this.mfaService.isMFAEnabled(user.id);

    if (!isMFAEnabled) {
      return;
    }

    /*
     * Prefer replacing this with:
     *
     * mfaService.createLoginChallenge({
     *   userId: user.id,
     *   purpose: 'mfa_login'
     * })
     *
     * This current call is preserved for compatibility with your
     * existing token service.
     */
    const mfaSessionToken =
      this.tokenService.generateVerificationToken(user.email);

    throw new MFARequiredError(
      'MFA verification required.',
      mfaSessionToken
    );
  }

  #buildLoginContext({ email, ip, userAgent }) {
    return {
      email: normalizeEmail(email),
      ip: sanitizeAuditValue(ip, 64),
      userAgent: sanitizeAuditValue(userAgent, 512),
    };
  }

  async #safeAuditLoginSuccess(user, context) {
    try {
      Promise.resolve(
        this.auditService.loginSuccess({
          user,
          ip: context.ip,
          userAgent: context.userAgent,
        })
      ).catch((error) => {
        console.error(
          '[AuthService] Non-blocking login-success audit failed:',
          error.message
        );
      });
    } catch (error) {
      console.error(
        '[AuthService] Non-blocking login-success audit failed:',
        error.message
      );
    }
  }

  async #safeAuditLoginFailure(context) {
    try {
      Promise.resolve(
        this.auditService.loginFailure({
          email: context.email,
          ip: context.ip,
          userAgent: context.userAgent,
          reason: 'Invalid credentials',
        })
      ).catch((error) => {
        console.error(
          '[AuthService] Non-blocking login-failure audit failed:',
          error.message
        );
      });
    } catch (error) {
      console.error(
        '[AuthService] Non-blocking login-failure audit failed:',
        error.message
      );
    }
  }
}

module.exports = new AuthService();
module.exports.AuthService = AuthService;