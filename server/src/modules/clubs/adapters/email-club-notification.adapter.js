const ClubNotificationPort = require('../ports/club-notification.port');
const emailService = require('../../email/email.service');

class EmailClubNotificationAdapter extends ClubNotificationPort {
  async sendReferralNotification(referral) {
    try {
      await emailService.sendEmail({
        to: referral.presidentEmail,
        subject: 'Your Club Has Been Referred to DreamXec!',
        text: `Hi ${referral.presidentName},\n\nYour club "${referral.clubName}" at ${referral.collegeName} was referred by ${referral.referrerName}.`,
      });
      return true;
    } catch (err) {
      console.error('[EmailClubNotificationAdapter] Referral notification error:', err.message);
      return false;
    }
  }

  async sendVerificationNotification(verification) {
    try {
      await emailService.sendEmail({
        to: verification.email,
        subject: 'DreamXec Club Verification Status Update',
        text: `Your club verification request has been updated to ${verification.status}.`,
      });
      return true;
    } catch (err) {
      console.error('[EmailClubNotificationAdapter] Verification notification error:', err.message);
      return false;
    }
  }
}

module.exports = new EmailClubNotificationAdapter();
module.exports.EmailClubNotificationAdapter = EmailClubNotificationAdapter;
