/**
 * Abstract Port defining notification contract for Clubs.
 * @abstract
 */
class ClubNotificationPort {
  async sendReferralNotification(referral) {
    throw new Error('Method ClubNotificationPort.sendReferralNotification() must be implemented.');
  }

  async sendVerificationNotification(verification) {
    throw new Error('Method ClubNotificationPort.sendVerificationNotification() must be implemented.');
  }
}

module.exports = ClubNotificationPort;
