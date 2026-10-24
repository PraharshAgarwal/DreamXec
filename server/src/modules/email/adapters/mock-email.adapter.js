const EmailProviderPort = require('../ports/email-provider.port');

class MockEmailAdapter extends EmailProviderPort {
  constructor() {
    super();
    this.sentEmails = [];
  }

  async send({ to, subject, text, html }) {
    const record = {
      to,
      subject,
      text,
      html,
      sentAt: new Date(),
    };
    this.sentEmails.push(record);
    console.log(`[MockEmailAdapter] Sent email to ${to} | Subject: "${subject}"`);
    return { status: 'mocked', messageId: `mock_${Date.now()}` };
  }

  clearHistory() {
    this.sentEmails = [];
  }
}

module.exports = new MockEmailAdapter();
module.exports.MockEmailAdapter = MockEmailAdapter;
