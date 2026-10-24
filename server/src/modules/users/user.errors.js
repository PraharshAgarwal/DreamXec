const AppError = require('../../utils/AppError');

class UserError extends AppError {
  constructor(message = 'User operation failed.', statusCode = 400) {
    super(message, statusCode);
  }
}

class UserNotFoundError extends UserError {
  constructor(message = 'User not found.') {
    super(message, 404);
  }
}

class InvalidProfileUpdateError extends UserError {
  constructor(message = 'Invalid profile update data.') {
    super(message, 400);
  }
}

module.exports = {
  UserError,
  UserNotFoundError,
  InvalidProfileUpdateError,
};
