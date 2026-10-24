const ledgerService = require('../src/services/ledger.service');
const disbursementService = require('../src/services/disbursement.service');

describe('Double-Entry Ledger & 4-Eyes Governance Tests', () => {
  describe('Double-Entry Ledger Invariant', () => {
    it('should validate balanced journal entries', () => {
      const entries = [
        { accountNumber: '1010_GATEWAY', debitAmount: 5000, creditAmount: 0 },
        { accountNumber: '2010_ESCROW', debitAmount: 0, creditAmount: 4750 },
        { accountNumber: '4010_PLATFORM_FEE', debitAmount: 0, creditAmount: 250 },
      ];
      const result = ledgerService.validatePosting(entries);
      expect(result.isBalanced).toBe(true);
      expect(result.totalDebits).toBe(5000);
      expect(result.totalCredits).toBe(5000);
    });

    it('should throw an error when debits and credits do not balance', () => {
      const unbalancedEntries = [
        { accountNumber: '1010_GATEWAY', debitAmount: 5000, creditAmount: 0 },
        { accountNumber: '2010_ESCROW', debitAmount: 0, creditAmount: 4000 },
      ];
      expect(() => ledgerService.validatePosting(unbalancedEntries)).toThrow(
        /Double-entry balance mismatch/
      );
    });

    it('should generate donation settlement journal correctly', () => {
      const journal = ledgerService.createDonationSettlementJournal({
        donationId: 'don_123',
        campaignId: 'camp_456',
        grossAmount: 10000,
        gatewayFee: 200,
        platformFee: 500,
      });

      expect(journal.journalType).toBe('DONATION_SETTLEMENT');
      expect(journal.entries.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('4-Eyes Maker-Checker Governance Separation', () => {
    const makerUserId = 'user_maker_111';
    const checkerUserId = 'user_checker_222';

    it('should allow Maker to initiate a disbursement tranche', () => {
      const intent = disbursementService.createDisbursementIntent({
        milestoneId: 'm_1',
        campaignId: 'c_1',
        amount: 25000,
        makerUserId,
        notes: 'Prototype phase 1 component procurement sign-off',
      });

      expect(intent.status).toBe('INITIATED');
      expect(intent.makerUserId).toBe(makerUserId);
      expect(intent.checkerUserId).toBeNull();
    });

    it('should BLOCK the Maker from acting as their own Checker (4-Eyes Violation)', () => {
      const intent = disbursementService.createDisbursementIntent({
        milestoneId: 'm_1',
        campaignId: 'c_1',
        amount: 25000,
        makerUserId,
      });

      expect(() =>
        disbursementService.authorizeDisbursement(intent, {
          checkerUserId: makerUserId, // Same user acting as Checker!
          decision: 'APPROVED',
        })
      ).toThrow(/4-Eyes Governance Violation/);
    });

    it('should allow a distinct Checker to authorize and generate a settlement ledger journal', () => {
      const intent = disbursementService.createDisbursementIntent({
        milestoneId: 'm_1',
        campaignId: 'c_1',
        amount: 25000,
        makerUserId,
      });

      const authorized = disbursementService.authorizeDisbursement(intent, {
        checkerUserId,
        decision: 'APPROVED',
        remarks: 'Faculty advisor and lab inspection verified.',
      });

      expect(authorized.status).toBe('AUTHORIZED');
      expect(authorized.checkerUserId).toBe(checkerUserId);
      expect(authorized.payoutReference).toBeDefined();
      expect(authorized.ledgerJournal.entries[0].debitAmount).toBe(25000);
    });
  });
});
