jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(async () => [{ statusCode: 202 }]),
}));

const emailService = require('../../src/modules/email/email.service');

describe('Email Subsystem Integration & Parity Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('EmailService Domain Operations', () => {
    it('should dispatch verification email event without throwing errors', async () => {
      const result = await emailService.sendVerificationEmail({
        email: 'user@example.com',
        name: 'John Doe',
        verificationToken: 'token_123',
      });

      expect(result).toBeUndefined();
    });

    it('should dispatch password reset email event without throwing errors', async () => {
      const result = await emailService.sendResetPasswordEmail({
        email: 'reset@example.com',
        name: 'Jane Doe',
        resetToken: 'reset_token_456',
      });

      expect(result).toBeUndefined();
    });

    it('should dispatch welcome email event without throwing errors', async () => {
      const result = await emailService.sendWelcomeEmail({
        email: 'welcome@example.com',
        name: 'New Member',
      });

      expect(result).toBeUndefined();
    });

    it('should send generic email via sendEmail without throwing errors', async () => {
      const result = await emailService.sendEmail({
        to: 'recipient@example.com',
        subject: 'Welcome to DreamXec',
        html: '<h1>Hello World</h1>',
      });

      expect(result).toBeDefined();
      expect(result).toHaveProperty('status');
    });
  });
});
