const AppError = require('../../utils/AppError');

class EmailError extends AppError {
  constructor(message = 'Email delivery failed.', statusCode = 500) {
    super(message, statusCode);
  }
}

class SendGridDeliveryError extends EmailError {
  constructor(message = 'SendGrid API delivery error.') {
    super(message, 502);
  }
}

class InvalidRecipientError extends EmailError {
  constructor(message = 'Recipient email address is required and must be valid.') {
    super(message, 400);
  }
}

module.exports = {
  EmailError,
  SendGridDeliveryError,
  InvalidRecipientError,
};
