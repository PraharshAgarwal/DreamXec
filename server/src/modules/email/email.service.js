const EVENTS = require('../../config/events');
const { publishEvent } = require('../../config/eventPublisher');
const defaultSendGridAdapter = require('./adapters/sendgrid-email.adapter');
const { getClientUrl } = require('../../utils/urlConfig');

class EmailService {
  /**
   * @param {Object} options
   * @param {import('./ports/email-provider.port')} [options.emailProvider]
   */
  constructor({ emailProvider = defaultSendGridAdapter } = {}) {
    this.emailProvider = emailProvider;
  }

  /**
   * Directly dispatches an email via injected EmailProviderPort adapter.
   */
  async sendEmail({ to, subject, message, text, html }) {
    return this.emailProvider.send({
      to,
      subject,
      text: text || message,
      html,
    });
  }

  /**
   * Dispatches email verification event.
   */
  async sendVerificationEmail({ email, name, verificationToken }) {
    try {
      const clientUrl = getClientUrl();
      await publishEvent(EVENTS.EMAIL_VERIFICATION, {
        email,
        name,
        verificationUrl: `${clientUrl}/verify-email?token=${verificationToken}`,
      });
    } catch (err) {
      console.error('[EmailService] Verification email failed to send:', err.message);
    }
  }

  /**
   * Dispatches password reset event.
   */
  async sendResetPasswordEmail({ email, name, resetToken }) {
    const clientUrl = getClientUrl();
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;
    
    try {
      await publishEvent(EVENTS.PASSWORD_RESET_REQUEST, {
        email,
        name,
        resetUrl,
      });
    } catch (e) {
      console.warn('[EmailService] Event publisher warning:', e.message);
    }

    const subject = '🔐 Reset Your DreamXec Account Password';
    const html = `
      <div style="font-family: 'Poppins', Arial, sans-serif; padding: 30px; background-color: #f8fafc; color: #121316;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 4px solid #121316; box-shadow: 6px 6px 0px #FE4E1A; p: 25px; padding: 25px;">
          <div style="background-color: #FFDD33; border: 2px solid #121316; padding: 6px 12px; display: inline-block; font-weight: 900; font-size: 11px; text-transform: uppercase; margin-bottom: 15px; color: #121316;">
            DREAMXEC SECURITY VERIFICATION
          </div>
          <h2 style="color: #0F534A; margin-top: 0; font-size: 22px; text-transform: uppercase; font-weight: 900;">
            Password Reset Verification Link
          </h2>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Hello <strong>${name || 'Innovator'}</strong>,
          </p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            We received an authorized request to reset your password for your DreamXec account (<code>${email}</code>).
          </p>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Click the verification button below to set a new password. This token link is valid for <strong>5 minutes</strong>.
          </p>
          <div style="margin: 25px 0; text-align: center;">
            <a href="${resetUrl}" style="background-color: #FE4E1A; color: #ffffff; padding: 14px 28px; text-decoration: none; border: 3px solid #121316; box-shadow: 4px 4px 0px #121316; font-weight: 900; font-size: 13px; text-transform: uppercase; display: inline-block;">
              VERIFY & RESET PASSWORD →
            </a>
          </div>
          <p style="font-size: 12px; color: #64748b;">
            Or copy and paste this verification URL into your browser:<br/>
            <a href="${resetUrl}" style="color: #4717AE; word-break: break-all;">${resetUrl}</a>
          </p>
          <div style="margin-top: 30px; border-top: 2px border #cbd5e1; padding-top: 15px; font-size: 11px; color: #94a3b8;">
            If you did not request this password reset, please ignore this message. Your password will remain unchanged.
          </div>
        </div>
      </div>
    `;

    const text = `Hello ${name || 'Innovator'},\n\nWe received a request to reset your password for your DreamXec account (${email}).\n\nPlease click the link below to verify and reset your password:\n${resetUrl}\n\nThis link is valid for 5 minutes.\n\nIf you did not request this, please ignore this email.`;

    await this.sendEmail({
      to: email,
      subject,
      text,
      html,
    });
  }

  /**
   * Dispatches welcome email event.
   */
  async sendWelcomeEmail({ email, name }) {
    try {
      const clientUrl = getClientUrl();
      await publishEvent(EVENTS.USER_WELCOME, {
        email,
        name,
        dashboardUrl: `${clientUrl}/dashboard`,
      });
    } catch (err) {
      console.error('[EmailService] Welcome email failed to send:', err.message);
    }
  }

  /**
   * Dispatches an email notification to the Org Admin when a combined document verification request is generated.
   */
  async sendOrgAdminVerificationRequest({ orgAdminEmail, orgAdminName, orgName, applicantName, verificationType, verificationId }) {
    try {
      const clientUrl = getClientUrl();
      const reviewUrl = `${clientUrl}/dx-admin?tab=verifications&id=${verificationId}`;

      const subject = `[Verification Action Required] New Document Verification Request for ${orgName}`;
      const html = `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #003366;">
          <h2 style="color: #003366;">Document Verification Request</h2>
          <p>Hello ${orgAdminName || 'Organization Admin'},</p>
          <p>A new combined document verification request has been generated for <strong>${orgName}</strong> and requires your manual inspection.</p>
          <div style="background-color: #fdf8f0; padding: 15px; border-left: 4px solid #FF7F00; margin: 15px 0;">
            <p><strong>Applicant:</strong> ${applicantName}</p>
            <p><strong>Stage / Type:</strong> ${verificationType}</p>
            <p><strong>Verification ID:</strong> ${verificationId}</p>
          </div>
          <p>All submitted form details and uploaded document proofs prior to manual review have been compiled into a single verification request package.</p>
          <p><a href="${reviewUrl}" style="background-color: #003366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Review Verification Request</a></p>
        </div>
      `;

      return await this.sendEmail({
        to: orgAdminEmail,
        subject,
        html,
      });
    } catch (err) {
      console.error('[EmailService] Org Admin verification email failed to send:', err.message);
    }
  }

  /**
   * Dispatches automated order confirmation email to the student / researcher
   */
  async sendServiceOrderConfirmationEmail({ studentEmail, studentName, orderNumber, serviceTitle, vendorName, amount, trackingCode, shippingAddress }) {
    if (!studentEmail) return;
    try {
      const clientUrl = getClientUrl();
      const trackingUrl = `${clientUrl}/services/orders?track=${orderNumber}`;

      const subject = `🚀 Order Confirmed: ${serviceTitle} [${orderNumber}]`;
      const html = `
        <div style="font-family: 'Poppins', Arial, sans-serif; padding: 30px; background-color: #f8fafc; color: #121316;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 4px solid #121316; box-shadow: 6px 6px 0px #FE4E1A; padding: 25px;">
            <div style="background-color: #0F534A; color: #ffffff; border: 2px solid #121316; padding: 6px 12px; display: inline-block; font-weight: 900; font-size: 11px; text-transform: uppercase; margin-bottom: 15px;">
              DREAMXEC SERVICES CONFIRMATION
            </div>
            <h2 style="color: #121316; margin-top: 0; font-size: 22px; text-transform: uppercase; font-weight: 900;">
              Your Fabrication Work Order is Confirmed
            </h2>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              Hello <strong>${studentName || 'Innovator'}</strong>,<br/>
              Your booking for <strong>${serviceTitle}</strong> with <strong>${vendorName}</strong> has been received and scheduled for engineering execution.
            </p>
            <div style="background-color: #FFF9F2; border: 2px solid #121316; padding: 15px; margin: 20px 0;">
              <p style="margin: 4px 0; font-size: 13px;"><strong>Order ID:</strong> ${orderNumber}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Tracking Barcode:</strong> ${trackingCode}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Total Paid:</strong> ₹${Number(amount).toLocaleString('en-IN')}</p>
              ${shippingAddress && shippingAddress.addressLine1 ? `
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 12px; color: #475569;">
                  <strong>Dispatch Destination:</strong><br/>
                  ${shippingAddress.recipientName || studentName}<br/>
                  ${shippingAddress.addressLine1}${shippingAddress.addressLine2 ? ', ' + shippingAddress.addressLine2 : ''}<br/>
                  ${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.postalCode}
                </div>
              ` : ''}
            </div>
            <div style="margin: 25px 0; text-align: center;">
              <a href="${trackingUrl}" style="background-color: #FE4E1A; color: #ffffff; padding: 14px 28px; text-decoration: none; border: 3px solid #121316; box-shadow: 4px 4px 0px #121316; font-weight: 900; font-size: 13px; text-transform: uppercase; display: inline-block;">
                TRACK SHIPMENT & STATUS →
              </a>
            </div>
            <p style="font-size: 12px; color: #64748b; margin-top: 25px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
              Direct question? Reply to this email or track real-time progress on your DreamXec Orders dashboard.
            </p>
          </div>
        </div>
      `;

      await this.sendEmail({
        to: studentEmail,
        subject,
        html,
      });
    } catch (err) {
      console.error('[EmailService] Service order confirmation email notice:', err.message);
    }
  }

  /**
   * Dispatches work order alert email to the fulfilling Lab Partner
   */
  async sendLabWorkOrderAlertEmail({ labEmail, labName, orderNumber, serviceTitle, studentName, studentEmail, quantity, intakeResponses, shippingAddress }) {
    if (!labEmail) return;
    try {
      const clientUrl = getClientUrl();
      const orderUrl = `${clientUrl}/services/orders?track=${orderNumber}`;

      const subject = `📦 New Service Work Order: ${serviceTitle} [#${orderNumber}]`;
      const html = `
        <div style="font-family: 'Poppins', Arial, sans-serif; padding: 30px; background-color: #f8fafc; color: #121316;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 4px solid #121316; box-shadow: 6px 6px 0px #0F534A; padding: 25px;">
            <div style="background-color: #FFDD33; color: #121316; border: 2px solid #121316; padding: 6px 12px; display: inline-block; font-weight: 900; font-size: 11px; text-transform: uppercase; margin-bottom: 15px;">
              NEW FABRICATION WORK ORDER
            </div>
            <h2 style="color: #0F534A; margin-top: 0; font-size: 22px; text-transform: uppercase; font-weight: 900;">
              New Customer Order for ${labName}
            </h2>
            <p style="font-size: 14px; color: #334155; line-height: 1.6;">
              Hello <strong>${labName} Team</strong>,<br/>
              A new customer order has been booked and paid for <strong>${serviceTitle}</strong> (Quantity: ${quantity || 1}).
            </p>
            <div style="background-color: #f8fafc; border: 2px solid #121316; padding: 15px; margin: 20px 0;">
              <p style="margin: 4px 0; font-size: 13px;"><strong>Order ID:</strong> ${orderNumber}</p>
              <p style="margin: 4px 0; font-size: 13px;"><strong>Customer:</strong> ${studentName} (${studentEmail})</p>
              ${shippingAddress && shippingAddress.addressLine1 ? `
                <p style="margin: 4px 0; font-size: 13px;"><strong>Shipping Target:</strong> ${shippingAddress.city}, ${shippingAddress.state} (${shippingAddress.postalCode})</p>
              ` : ''}
              ${intakeResponses && Object.keys(intakeResponses).length > 0 ? `
                <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #cbd5e1; font-size: 12px;">
                  <strong>Intake Specifications:</strong>
                  <pre style="background: #ffffff; padding: 8px; border: 1px solid #e2e8f0; font-size: 11px; overflow-x: auto;">${JSON.stringify(intakeResponses, null, 2)}</pre>
                </div>
              ` : ''}
            </div>
            <div style="margin: 25px 0; text-align: center;">
              <a href="${orderUrl}" style="background-color: #0F534A; color: #ffffff; padding: 14px 28px; text-decoration: none; border: 3px solid #121316; box-shadow: 4px 4px 0px #121316; font-weight: 900; font-size: 13px; text-transform: uppercase; display: inline-block;">
                VIEW ORDER & UPDATE STATUS →
              </a>
            </div>
          </div>
        </div>
      `;

      await this.sendEmail({
        to: labEmail,
        subject,
        html,
      });
    } catch (err) {
      console.error('[EmailService] Lab work order alert email notice:', err.message);
    }
  }
}

module.exports = new EmailService();
module.exports.EmailService = EmailService;
