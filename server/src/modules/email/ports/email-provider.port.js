/**
 * Abstract Port defining the contract for email delivery providers.
 * @abstract
 */
class EmailProviderPort {
  /**
   * Sends an email to a recipient.
   * @param {Object} options
   * @param {string} options.to - Recipient email address
   * @param {string} options.subject - Email subject line
   * @param {string} [options.text] - Plain text body
   * @param {string} [options.html] - HTML body
   * @returns {Promise<Object>} Delivery result metadata
   */
  async send({ to, subject, text, html }) {
    throw new Error('Method EmailProviderPort.send() must be implemented.');
  }
}

module.exports = EmailProviderPort;
