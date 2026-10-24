const EventPublisherPort = require('../ports/event-publisher.port');
const EVENTS = require('../../../config/events');

class DefaultEventPublisher extends EventPublisherPort {
  async publishEvent(eventName, payload) {
    try {
      const { publishEvent } = require('../../../config/eventPublisher');
      return await publishEvent(eventName, payload);
    } catch (err) {
      console.error(`[DefaultEventPublisher] Error publishing event ${eventName}:`, err.message);
    }
  }
}

/**
 * Dedicated Event Subscriber handling campaign milestone calculations and notifications.
 * Adheres strictly to Single Responsibility Principle (SRP).
 */
class CampaignMilestoneSubscriber {
  constructor({ eventPublisher = new DefaultEventPublisher() } = {}) {
    this.eventPublisher = eventPublisher;
  }

  /**
   * Evaluates if a payment triggers campaign milestones (25%, 50%, 75%, 100%) and publishes relevant events.
   * @param {Object} params
   * @param {Object} params.project - Project object containing goalAmount, amountRaised, user, title
   * @param {number} params.amount - Donation amount added in this payment
   * @param {string} [params.currency='INR']
   */
  async evaluateMilestones({ project, amount, currency = 'INR' }) {
    const goalAmount = Number(project?.targetAmount || project?.goalAmount || 0);
    const amountRaised = Number(project?.currentRaisedAmount || project?.amountRaised || 0);
    const userEmail = project?.student?.email || project?.beneficiary?.email || project?.user?.email;

    if (!project || goalAmount <= 0) {
      return;
    }

    const prevAmount = amountRaised - amount;
    const prevPercent = (prevAmount / goalAmount) * 100;
    const newPercent = (amountRaised / goalAmount) * 100;

    const milestones = [25, 50, 75, 100];

    for (const milestone of milestones) {
      if (prevPercent < milestone && newPercent >= milestone) {
        if (milestone === 100 && userEmail) {
          await this.eventPublisher.publishEvent(EVENTS.CAMPAIGN_COMPLETED, {
            email: userEmail,
            campaignTitle: project.title,
            totalRaised: amountRaised,
            currency,
          });
        }

        if (userEmail) {
          await this.eventPublisher.publishEvent(EVENTS.CAMPAIGN_MILESTONE, {
            email: userEmail,
            percentage: milestone,
            campaignTitle: project.title,
          });
        }
      }
    }
  }
}

module.exports = CampaignMilestoneSubscriber;
