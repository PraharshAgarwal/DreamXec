const defaultSendGridAdapter = require('../../email/adapters/sendgrid-email.adapter');

/**
 * Dedicated Event Subscriber handling high-value donation alerts.
 * Adheres strictly to Single Responsibility Principle (SRP).
 */
class HighValueDonationSubscriber {
  constructor({ emailProvider = defaultSendGridAdapter, alertRecipient = process.env.COMPLIANCE_EMAIL || 'admin@dreamxec.com' } = {}) {
    this.emailProvider = emailProvider;
    this.alertRecipient = alertRecipient;
  }

  async handleHighValueDonation({ amount, currency = 'INR', transactionId, donorEmail, campaignTitle }) {
    try {
      return await this.emailProvider.send({
        to: this.alertRecipient,
        subject: `High Value Donation Alert: ${currency} ${amount}`,
        text: `High value donation recorded for "${campaignTitle}". Amount: ${currency} ${amount}. Donor: ${donorEmail}. Transaction ID: ${transactionId}`,
        html: `<h3>High Value Donation Alert</h3><p>Amount: <strong>${currency} ${amount}</strong></p><p>Campaign: ${campaignTitle}</p><p>Donor: ${donorEmail}</p><p>Transaction ID: ${transactionId}</p>`,
      });
    } catch (err) {
      console.error('[HighValueDonationSubscriber] Failed to send high-value donation alert:', err.message);
    }
  }
}

module.exports = HighValueDonationSubscriber;
