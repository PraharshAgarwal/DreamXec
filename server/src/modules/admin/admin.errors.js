const AppError = require('../../utils/AppError');

class AdminError extends AppError {
  constructor(message = 'Admin operation failed.', statusCode = 400) {
    super(message, statusCode);
  }
}

class AdminAccessDeniedError extends AdminError {
  constructor(message = 'Access denied. Administrator privileges required.') {
    super(message, 403);
  }
}

class WithdrawalNotFoundError extends AdminError {
  constructor(message = 'Withdrawal request not found.') {
    super(message, 404);
  }
}

module.exports = {
  AdminError,
  AdminAccessDeniedError,
  WithdrawalNotFoundError,
};
