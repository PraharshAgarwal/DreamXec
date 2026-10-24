const AppError = require('../../utils/AppError');

class ProjectError extends AppError {
  constructor(message = 'Project operation failed.', statusCode = 400) {
    super(message, statusCode);
  }
}

class ProjectNotFoundError extends ProjectError {
  constructor(message = 'Project not found.') {
    super(message, 404);
  }
}

class UnauthorizedProjectActionError extends ProjectError {
  constructor(message = 'You are not authorized to perform actions on this project.') {
    super(message, 403);
  }
}

module.exports = {
  ProjectError,
  ProjectNotFoundError,
  UnauthorizedProjectActionError,
};
