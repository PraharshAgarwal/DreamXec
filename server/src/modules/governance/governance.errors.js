const AppError = require('../../utils/AppError');

class GovernanceError extends AppError {
  constructor(message = 'Governance operation failed.', statusCode = 400) {
    super(message, statusCode);
  }
}

class ApplicationNotFoundError extends GovernanceError {
  constructor(message = 'Application not found.') {
    super(message, 404);
  }
}

class StudentVerificationError extends GovernanceError {
  constructor(message = 'Student verification failed.', statusCode = 400) {
    super(message, statusCode);
  }
}

module.exports = {
  GovernanceError,
  ApplicationNotFoundError,
  StudentVerificationError,
};
