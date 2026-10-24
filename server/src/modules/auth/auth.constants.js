const Roles = Object.freeze({
  USER: 'USER',
  ADMIN: 'ADMIN',
  DONOR: 'DONOR',
  STUDENT_PRESIDENT: 'STUDENT_PRESIDENT',
  RESEARCHER: 'RESEARCHER',
  PROFESSOR: 'PROFESSOR',
  MENTOR: 'MENTOR',
  INCUBATOR_MANAGER: 'INCUBATOR_MANAGER',
  COMPLIANCE_OFFICER: 'COMPLIANCE_OFFICER',
  ORG_ADMIN: 'ORG_ADMIN',
  CORPORATE_ADMIN: 'CORPORATE_ADMIN',
});

const AccountStatus = Object.freeze({
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  DELETED: 'DELETED',
});

const AccountStatusFormatter = Object.freeze({
  format(status) {
    if (!status) return 'unknown';
    return String(status).toLowerCase().replace(/_/g, ' ');
  },
});

const AuthStatus = Object.freeze({
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  MFA_REQUIRED: 'MFA_REQUIRED',
});

const TokenExpiry = Object.freeze({
  ACCESS_TOKEN: process.env.JWT_EXPIRES_IN || '7d',
  VERIFICATION_TOKEN: process.env.JWT_VERIFICATION_EXPIRES_IN || '10m',
  PASSWORD_RESET_TOKEN: process.env.JWT_PASSWORD_RESET_EXPIRES_IN || '10m',
});

const OTPConstants = Object.freeze({
  EXPIRY_SECONDS: 300,              // 5 minutes
  COOLDOWN_SECONDS: 60,            // 1 minute
  RATE_LIMIT_WINDOW_SECONDS: 900,  // 15 minutes
  MAX_REQUESTS: 3,
  MAX_VERIFY_ATTEMPTS: 3,
  LOCK_PERIOD_SECONDS: 1800,       // 30 minutes
});

const MFAConstants = Object.freeze({
  SCRATCH_CODES_COUNT: 10,
  SCRATCH_CODE_LENGTH: 8,
  ALGORITHM: 'sha256',
});

module.exports = {
  Roles,
  AccountStatus,
  AccountStatusFormatter,
  AuthStatus,
  TokenExpiry,
  OTPConstants,
  MFAConstants,
};
