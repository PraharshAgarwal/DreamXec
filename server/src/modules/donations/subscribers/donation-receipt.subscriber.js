const defaultSendGridAdapter = require('../../email/adapters/sendgrid-email.adapter');

/**
 * Dedicated Event Subscriber handling donation transaction receipts.
 * Dynamically produces DAF non-profit 80G receipts or FICPL platform invoices.
 */
class DonationReceiptSubscriber {
  constructor({ emailProvider = defaultSendGridAdapter } = {}) {
    this.emailProvider = emailProvider;
  }

  async handleDonationSuccess({
    email,
    amount,
    currency = 'INR',
    transactionId,
    campaignTitle,
    donorName,
    operatingEntity = 'DAF',
    merchantDomain = 'dreamxec.org',
  }) {
    try {
      const isDaf = operatingEntity === 'DAF' || (merchantDomain && merchantDomain.endsWith('dreamxec.org'));

      const entityName = isDaf
        ? 'DreamXec Academic Foundation (DAF)'
        : 'FICPL Private Limited';

      const subject = isDaf
        ? `[DAF 80G Tax Exemption Receipt] Contribution to ${campaignTitle}`
        : `Payment Receipt: ${campaignTitle} - DreamXec Platform`;

      const legalNotice = isDaf
        ? `<div style="margin-top: 16px; padding: 12px; background: #F4FBF9; border-left: 4px solid #0F534A; font-size: 12px; color: #0F534A;">
             <strong>80G Tax Exemption Certificate Note:</strong><br/>
             This contribution is made to <strong>DreamXec Academic Foundation</strong> (Section 8 Non-Profit, Reg: Gurgaon, Haryana). Eligible for deduction under Section 80G of the Income Tax Act, 1961. Retain this receipt for your annual tax filing.
           </div>`
        : `<div style="margin-top: 16px; padding: 12px; background: #FFF8F5; border-left: 4px solid #FE4E1A; font-size: 12px; color: #555;">
             <strong>Platform Service Note:</strong><br/>
             Processed by <strong>FICPL Private Limited</strong> (AR-101, Eldeco Accolade, Sohna, Gurgaon, Haryana). Platform & Tech Services (SAC: 998313).
           </div>`;

      const text = `Thank you ${donorName || 'Valued Donor'} for your contribution of ${currency} ${amount} to "${campaignTitle}".\n` +
        `Operating Entity: ${entityName}\n` +
        `Transaction ID: ${transactionId}\n` +
        `Registered Office: AR-101, Eldeco Accolade, Sohna, Gurgaon, Haryana\n` +
        (isDaf ? `Tax Exemption: Eligible under Section 80G of the Income Tax Act.` : `Platform Tech Provider: FICPL Private Limited.`);

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; border: 2px solid #121316; background: #ffffff;">
          <h2 style="color: ${isDaf ? '#0F534A' : '#FE4E1A'}; margin-top: 0; text-transform: uppercase;">
            ${isDaf ? 'Research Grant Donation Receipt' : 'Platform Contribution Receipt'}
          </h2>
          <p>Dear <strong>${donorName || 'Valued Contributor'}</strong>,</p>
          <p>We gratefully acknowledge receipt of your contribution towards <strong>"${campaignTitle}"</strong>.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 14px;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px 0; color: #666;">Amount Received:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">${currency} ${amount}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px 0; color: #666;">Transaction / Payment ID:</td>
              <td style="padding: 8px 0; font-family: monospace; text-align: right;">${transactionId}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 8px 0; color: #666;">Receiving Entity:</td>
              <td style="padding: 8px 0; font-weight: bold; text-align: right;">${entityName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666;">Date:</td>
              <td style="padding: 8px 0; text-align: right;">${new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
            </tr>
          </table>

          ${legalNotice}

          <p style="font-size: 11px; color: #888; margin-top: 24px; text-align: center;">
            DreamXec &bull; AR-101, Eldeco Accolade, Sohna, Gurgaon, Haryana 122103
          </p>
        </div>
      `;

      return await this.emailProvider.send({
        to: email,
        subject,
        text,
        html,
      });
    } catch (err) {
      console.error('[DonationReceiptSubscriber] Failed to send donation receipt:', err.message);
    }
  }
}

module.exports = DonationReceiptSubscriber;

