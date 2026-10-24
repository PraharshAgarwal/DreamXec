const AppError = require('../../utils/AppError');

class InvalidDonationAmountError extends AppError {
  constructor(message = 'A valid donation amount is required') {
    super(message, 400);
  }
}

class ProjectNotFoundError extends AppError {
  constructor(message = 'Project not found') {
    super(message, 404);
  }
}

class GuestEmailRequiredError extends AppError {
  constructor(message = 'Email is required for guest donations') {
    super(message, 400);
  }
}

class InvalidPaymentSignatureError extends AppError {
  constructor(message = 'Invalid payment signature') {
    super(message, 400);
  }
}

class DonationNotFoundError extends AppError {
  constructor(message = 'Donation record not found') {
    super(message, 404);
  }
}

class DonationAuthorizationError extends AppError {
  constructor(message = 'Not authorized') {
    super(message, 403);
  }
}

module.exports = {
  AppError,
  InvalidDonationAmountError,
  ProjectNotFoundError,
  GuestEmailRequiredError,
  InvalidPaymentSignatureError,
  DonationNotFoundError,
  DonationAuthorizationError,
};
