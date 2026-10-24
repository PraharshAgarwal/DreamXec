const VerificationEmailSubscriber = require('../../src/modules/email/subscribers/verification-email.subscriber');
const DonationReceiptSubscriber = require('../../src/modules/donations/subscribers/donation-receipt.subscriber');
const HighValueDonationSubscriber = require('../../src/modules/donations/subscribers/high-value-donation.subscriber');
const CampaignMilestoneSubscriber = require('../../src/modules/donations/subscribers/campaign-milestone.subscriber');

describe('Dedicated Event Subscribers (SRP) Integration & Parity Tests', () => {
  let mockEmailProvider;
  let mockEventPublisher;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();

    mockEmailProvider = {
      send: jest.fn().mockResolvedValue({ messageId: 'msg_123' }),
    };

    mockEventPublisher = {
      publishEvent: jest.fn().mockResolvedValue(true),
    };
  });

  describe('VerificationEmailSubscriber', () => {
    it('should process EMAIL_VERIFICATION event and invoke email provider with verification link', async () => {
      const subscriber = new VerificationEmailSubscriber({ emailProvider: mockEmailProvider });

      await subscriber.handleVerificationEmail({
        email: 'user@example.com',
        name: 'Test User',
        verificationToken: 'token_abc123',
      });

      expect(mockEmailProvider.send).toHaveBeenCalledTimes(1);
      expect(mockEmailProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@example.com',
          subject: expect.stringContaining('Verify'),
        })
      );
    });
  });

  describe('DonationReceiptSubscriber', () => {
    it('should process DONATION_SUCCESS event and dispatch receipt to donor', async () => {
      const subscriber = new DonationReceiptSubscriber({ emailProvider: mockEmailProvider });

      await subscriber.handleDonationSuccess({
        email: 'donor@example.com',
        amount: 2500,
        currency: 'INR',
        transactionId: 'pay_xyz789',
        campaignTitle: 'Clean Energy Project',
        donorName: 'John Doe',
      });

      expect(mockEmailProvider.send).toHaveBeenCalledTimes(1);
      expect(mockEmailProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'donor@example.com',
          subject: expect.stringContaining('Receipt'),
        })
      );
    });
  });

  describe('HighValueDonationSubscriber', () => {
    it('should process HIGH_VALUE_DONATION event and alert compliance team', async () => {
      const subscriber = new HighValueDonationSubscriber({ emailProvider: mockEmailProvider });

      await subscriber.handleHighValueDonation({
        amount: 50000,
        currency: 'INR',
        transactionId: 'pay_large_100',
        donorEmail: 'bigdonor@example.com',
        campaignTitle: 'AI Research Lab',
      });

      expect(mockEmailProvider.send).toHaveBeenCalledTimes(1);
      expect(mockEmailProvider.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.any(String),
          subject: expect.stringContaining('High Value'),
        })
      );
    });
  });

  describe('CampaignMilestoneSubscriber', () => {
    it('should publish milestone and completion events when milestone thresholds are crossed', async () => {
      const subscriber = new CampaignMilestoneSubscriber({ eventPublisher: mockEventPublisher });

      // Project went from 40% (4,000) to 100% (10,000) with a 6,000 donation
      const project = {
        title: 'Solar Water Pump',
        goalAmount: 10000,
        amountRaised: 10000,
        user: { email: 'owner@example.com' },
      };

      await subscriber.evaluateMilestones({
        project,
        amount: 6000,
        currency: 'INR',
      });

      // Should publish milestone events for 50%, 75%, and 100%, plus CAMPAIGN_COMPLETED
      expect(mockEventPublisher.publishEvent).toHaveBeenCalled();
      const calls = mockEventPublisher.publishEvent.mock.calls;
      
      const milestoneEvents = calls.filter(([name]) => name === 'CAMPAIGN_MILESTONE');
      const completedEvents = calls.filter(([name]) => name === 'CAMPAIGN_COMPLETED');

      expect(milestoneEvents.length).toBe(3); // 50%, 75%, 100%
      expect(completedEvents.length).toBe(1);
    });

    it('should do nothing if project goal is missing or zero', async () => {
      const subscriber = new CampaignMilestoneSubscriber({ eventPublisher: mockEventPublisher });

      await subscriber.evaluateMilestones({
        project: { goalAmount: 0, amountRaised: 500 },
        amount: 500,
      });

      expect(mockEventPublisher.publishEvent).not.toHaveBeenCalled();
    });
  });
});
