const AppError = require('../../utils/AppError');

class ClubError extends AppError {
  constructor(message = 'Club operation failed.', statusCode = 400) {
    super(message, statusCode);
  }
}

class ClubNotFoundError extends ClubError {
  constructor(message = 'Club not found.') {
    super(message, 404);
  }
}

class UnauthorizedClubActionError extends ClubError {
  constructor(message = 'You are not authorized to perform actions on this club.') {
    super(message, 403);
  }
}

module.exports = {
  ClubError,
  ClubNotFoundError,
  UnauthorizedClubActionError,
};
