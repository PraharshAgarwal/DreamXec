const AppError = require('../../utils/AppError');

class InteractionError extends AppError {
  constructor(message = 'Interaction operation failed.', statusCode = 400) {
    super(message, statusCode);
  }
}

class CommentNotFoundError extends InteractionError {
  constructor(message = 'Comment not found.') {
    super(message, 404);
  }
}

class UnauthorizedInteractionError extends InteractionError {
  constructor(message = 'You are not authorized to perform this action.') {
    super(message, 403);
  }
}

module.exports = {
  InteractionError,
  CommentNotFoundError,
  UnauthorizedInteractionError,
};
