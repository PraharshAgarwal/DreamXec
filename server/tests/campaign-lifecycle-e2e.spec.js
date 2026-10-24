const ledgerService = require('../src/services/ledger.service');
const disbursementService = require('../src/services/disbursement.service');
const { createCampaignSchema } = require('../src/modules/campaigns/campaign.validation');

describe('Full Campaign Lifecycle & Governance End-to-End Spec', () => {
  const mockStudentId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
  const mockMakerId = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
  const mockCheckerId = 'c3d4e5f6-a7b8-9012-cdef-123456789012';

  describe('1. Campaign Initiation & Validation Engine', () => {
    it('should validate a compliant milestone campaign payload', () => {
      const validPayload = {
        title: 'Next-Gen Solar Powered Drone',
        description: 'Autonomous long-range UAV for agricultural crop disease monitoring.',
        shortDescription: 'Solar UAV for automated precision agriculture.',
        category: 'STARTUP_INNOVATION',
        campaignType: 'TEAM',
        stage: 'PROTOTYPE',
        goalAmount: 150000,
        minDonationAmount: 100,
        coverImageUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
        milestones: [
          {
            title: 'Phase 1: Frame Fabrication & Avionics',
            objective: 'Build carbon-fiber airframe and calibrate flight controllers.',
            budget: 60000,
            durationDays: 30,
            acceptanceCriteria: ['Airframe static load test passed', 'Flight controller firmware flashed'],
            requiredEvidenceTypes: ['ON_SITE_PHOTO', 'INVOICE'],
          },
          {
            title: 'Phase 2: Solar Array Integration & Flight Tests',
            objective: 'Install high-efficiency solar cells and complete 2-hour continuous flight test.',
            budget: 90000,
            durationDays: 45,
            acceptanceCriteria: ['2-hour endurance test video verified', 'Faculty advisor test sign-off'],
            requiredEvidenceTypes: ['VIDEO_WALKTHROUGH', 'INSPECTION_REPORT'],
          },
        ],
      };

      const parsed = createCampaignSchema.safeParse(validPayload);
      expect(parsed.success).toBe(true);
      expect(parsed.data.milestones.length).toBe(2);
    });

    it('should reject campaigns with empty milestones or invalid categories', () => {
      const invalidPayload = {
        title: 'Test Campaign',
        description: 'Short description text here',
        category: 'NON_EXISTENT_CATEGORY',
        goalAmount: 50000,
        milestones: [],
      };

      const parsed = createCampaignSchema.safeParse(invalidPayload);
      expect(parsed.success).toBe(false);
    });
  });

  describe('2. Donation Inflow & Double-Entry Ledger Posting', () => {
    it('should settle donation inflow with zero debit-credit drift', () => {
      const donationJournal = ledgerService.createDonationSettlementJournal({
        donationId: 'don_e2e_999',
        campaignId: 'camp_e2e_111',
        grossAmount: 50000,
        gatewayFee: 1000, // 2% gateway processing
        platformFee: 2500, // 5% platform fee
      });

      expect(donationJournal.journalType).toBe('DONATION_SETTLEMENT');
      const balanceCheck = ledgerService.validatePosting(donationJournal.entries);
      expect(balanceCheck.isBalanced).toBe(true);
      expect(balanceCheck.totalDebits).toBe(49000); // 50000 gross - 1000 gateway fee
      expect(balanceCheck.totalCredits).toBe(49000); // 46500 net escrow + 2500 platform fee
    });
  });

  describe('3. Maker-Checker 4-Eyes Sequential Disbursement', () => {
    it('should process full flow: Initiation -> 4-Eyes Violation Block -> Checker Authorization', () => {
      // Step A: Maker initiates tranche disbursement
      const intent = disbursementService.createDisbursementIntent({
        milestoneId: 'm_phase_1',
        campaignId: 'camp_e2e_111',
        amount: 60000,
        makerUserId: mockMakerId,
        notes: 'Phase 1 deliverables verified by faculty advisor.',
      });
      expect(intent.status).toBe('INITIATED');

      // Step B: Maker tries to authorize themselves (MUST FAIL)
      expect(() =>
        disbursementService.authorizeDisbursement(intent, {
          checkerUserId: mockMakerId,
          decision: 'APPROVED',
        })
      ).toThrow(/4-Eyes Governance Violation/);

      // Step C: Authorized Checker signs off payout
      const authorized = disbursementService.authorizeDisbursement(intent, {
        checkerUserId: mockCheckerId,
        decision: 'APPROVED',
        remarks: 'Institutional finance review complete. Released to student account.',
      });

      expect(authorized.status).toBe('AUTHORIZED');
      expect(authorized.checkerUserId).toBe(mockCheckerId);
      expect(authorized.payoutReference).toMatch(/^PAYOUT_SETTLE_/);
      expect(authorized.ledgerJournal.entries[0].debitAmount).toBe(60000);
      expect(authorized.ledgerJournal.entries[1].creditAmount).toBe(60000);
    });
  });
});
