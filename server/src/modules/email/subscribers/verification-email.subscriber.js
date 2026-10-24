const defaultSendGridAdapter = require('../adapters/sendgrid-email.adapter');
const { getClientUrl } = require('../../../utils/urlConfig');

/**
 * Dedicated Event Subscriber handling verification email side-effects.
 * Adheres strictly to Single Responsibility Principle (SRP).
 */
class VerificationEmailSubscriber {
  constructor({ emailProvider = defaultSendGridAdapter } = {}) {
    this.emailProvider = emailProvider;
  }

  async handleVerificationEmail({ email, name, verificationToken }) {
    try {
      const clientUrl = getClientUrl();
      const verificationUrl = `${clientUrl}/verify-email?token=${verificationToken}`;

      return await this.emailProvider.send({
        to: email,
        subject: 'Verify Your Email - DreamXec',
        text: `Hello ${name || 'User'},\n\nPlease click the following link to verify your email: ${verificationUrl}`,
        html: `<p>Hello <strong>${name || 'User'}</strong>,</p><p>Please click <a href="${verificationUrl}">here</a> to verify your email address.</p>`,
      });
    } catch (err) {
      console.error('[VerificationEmailSubscriber] Failed to send verification email:', err.message);
    }
  }
}

module.exports = VerificationEmailSubscriber;
