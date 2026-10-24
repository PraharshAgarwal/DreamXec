const AppError = require('../../utils/AppError');

class InvalidCredentialsError extends AppError {
  constructor(message = 'Incorrect email or password.') {
    super(message, 401);
  }
}

class EmailNotVerifiedError extends AppError {
  constructor(message = 'Email address is not verified.') {
    super(message, 403);
  }
}

class MFARequiredError extends AppError {
  constructor(message = 'MFA verification required.', mfaSessionToken = null) {
    super(message, 403);
    this.mfaRequired = true;
    if (mfaSessionToken) {
      this.mfaSessionToken = mfaSessionToken;
    }
  }
}

class AccountDisabledError extends AppError {
  constructor(message = 'Your account has been disabled or suspended. Please contact support.') {
    super(message, 403);
  }

  static forStatus(status) {
    const formatted = String(status || 'disabled').toLowerCase().replace(/_/g, ' ');
    return new AccountDisabledError(`Your account is ${formatted}. Please contact support.`);
  }
}

class InvalidOTPError extends AppError {
  constructor(message = 'Invalid or expired OTP code.') {
    super(message, 400);
  }
}

class SessionExpiredError extends AppError {
  constructor(message = 'Session has expired. Please log in again.') {
    super(message, 401);
  }
}

module.exports = {
  AppError,
  InvalidCredentialsError,
  EmailNotVerifiedError,
  MFARequiredError,
  AccountDisabledError,
  InvalidOTPError,
  SessionExpiredError,
};
