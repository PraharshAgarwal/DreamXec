const authService = require('../auth.service');
const registrationService = require('../services/registration.service');
const emailVerificationService = require('../services/email-verification.service');
const passwordResetService = require('../services/password-reset.service');
const otpService = require('../otp.service');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');
const { userRepository } = require('../auth.repository');
const { invalidateUserAuth } = require('../../../middleware/auth.middleware');
const { invalidateMembershipCache } = require('../../../middleware/organization.middleware');



class AuthController {
  constructor({
    authSvc = authService,
    registrationSvc = registrationService,
    emailVerificationSvc = emailVerificationService,
    passwordResetSvc = passwordResetService,
    otpSvc = otpService,
  } = {}) {
    this.authService = authSvc;
    this.registrationService = registrationSvc;
    this.emailVerificationService = emailVerificationSvc;
    this.passwordResetService = passwordResetSvc;
    this.otpService = otpSvc;
    this.userRepository = userRepository;
  }
  
    claimRole = catchAsync(async (req, res) => {
    const { organizationId, role, workflowInstanceId } = req.body;
    const result = await this.authService.claimRole(req.user, {
      organizationId,
      role,
      workflowInstanceId,
    });

    res.status(200).json({
      status: 'success',
      message: `Role '${role}' successfully verified and activated!`,
      token: result.token,
      data: {
        user: result.user,
      },
    });
  });

  register = catchAsync(async (req, res) => {
    const result = await this.registrationService.register(req.body);

    res.status(201).json({
      status: 'success',
      message:
        'Registration successful. Please check your email to verify your account.',
      token: result.token,
      data: { user: result.user },
    });
  });

  login = catchAsync(async (req, res) => {
    const { email, password } = req.body;

    const result = await this.authService.login({
      email,
      password,
      ip: req.ip,
      userAgent: req.get('user-agent') || null,
    });

    res.status(200).json({
      status: 'success',
      token: result.token,
      data: {
        user: result.user,
      },
    });
  });

  getMe = catchAsync(async (req, res) => {
    const result = await this.authService.getMe(req.user);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  switchProfile = catchAsync(async (req, res) => {
    const { organizationId, role, isIndependent } = req.body;
    
    if (!isIndependent && !organizationId && role !== 'USER') {
      throw new AppError('Organization ID and role are required', 400);
    }

    const result = await this.authService.switchProfile(
      req.user,
      organizationId || null,
      role || 'USER',
      Boolean(isIndependent || !organizationId || role === 'USER')
    );

    if (req.user?.id) {
      await invalidateUserAuth(req.user.id);
      await invalidateMembershipCache(req.user.id);
    }

    res.status(200).json({
      status: 'success',
      token: result.token,
      data: {
        user: result.user,
      },
    });
  });

  verifyEmail = catchAsync(async (req, res) => {
    const { token } = req.query;

    if (!token) {
      throw new AppError('Email verification token is required.', 400);
    }

    const result = await this.emailVerificationService.verifyEmail(token, req);

    res.redirect(result.redirectUrl);
  });

  forgotPassword = catchAsync(async (req, res) => {
    const { email } = req.body;

    const result = await this.passwordResetService.forgotPassword(email);

    res.status(200).json({
      status: 'success',
      message:
        result?.message || 'If an account exists for that email, password reset instructions have been sent.',
      // resetUrl intentionally NOT exposed: the token is only safe inside the emailed link
    });
  });

  verifyResetToken = catchAsync(async (req, res) => {
    const token = req.query.token || req.body.token;

    if (!token) {
      throw new AppError('Password reset token is required.', 400);
    }

    const result = await this.passwordResetService.verifyResetToken(token);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  resetPassword = catchAsync(async (req, res) => {
    const token = req.query.token || req.body.token;
    const { password } = req.body;

    if (!token) {
      throw new AppError('Password reset token is required.', 400);
    }

    const result = await this.passwordResetService.resetPassword(
      token,
      password
    );

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully.',
      token: result.token,
      data: {
        user: result.user,
      },
    });
  });

  refreshToken = catchAsync(async (req, res) => {
    const refreshTokenStr = req.body.refreshToken || req.cookies?.refreshToken || req.headers['x-refresh-token'];
    const result = await this.authService.refreshSession(refreshTokenStr);

    res.status(200).json({
      status: 'success',
      token: result.token,
      refreshToken: result.refreshToken,
      data: {
        user: result.user,
      },
    });
  });

  sendOTP = catchAsync(async (req, res) => {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email is required.', 400);
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('An account with this email already exists. Please log in instead.', 409);
    }

    const result = await this.otpService.sendOTP(email);

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: {
        expiresIn: result.expiresIn,
      },
    });
  });

  checkEmail = catchAsync(async (req, res) => {
    const { email } = req.body;

    if (!email || !email.includes('@')) {
      throw new AppError('A valid email address is required.', 400);
    }

    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      return res.status(200).json({
        status: 'success',
        available: false,
        message: 'An account with this email already exists.',
      });
    }

    return res.status(200).json({
      status: 'success',
      available: true,
      message: 'Email is available.',
    });
  });

  verifyOTP = catchAsync(async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
      throw new AppError('Email and OTP are required.', 400);
    }

    const result = await this.otpService.verifyOTP(email, otp);

    res.status(200).json({
      status: 'success',
      message: result.message,
      data: result.data,
    });
  });
}

module.exports = new AuthController();
module.exports.AuthController = AuthController;
