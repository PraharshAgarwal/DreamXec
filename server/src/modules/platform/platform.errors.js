const AppError = require('../../utils/AppError');

class PlatformError extends AppError {
  constructor(message = 'Platform operation failed.', statusCode = 400) {
    super(message, statusCode);
  }
}

class InvalidOtpError extends PlatformError {
  constructor(message = 'Invalid or expired OTP.') {
    super(message, 400);
  }
}

class FileUploadError extends PlatformError {
  constructor(message = 'File upload failed.') {
    super(message, 500);
  }
}

module.exports = {
  PlatformError,
  InvalidOtpError,
  FileUploadError,
};
