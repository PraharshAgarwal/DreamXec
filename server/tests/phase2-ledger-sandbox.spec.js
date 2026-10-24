const ledgerService = require('../src/services/ledger.service');

describe('Phase 2: Database-Backed Ledger Engine & Multi-Leg Transactions', () => {
  describe('Double-Entry Balance Validation & High Precision Arithmetic', () => {
    it('should validate exact multi-leg split with platform and gateway fee', () => {
      const gross = 10000;
      const gatewayFee = 200;
      const platformFee = 300;
      const netEscrow = 9500;

      const entries = [
        { accountNumber: '1010_GATEWAY_CLEARING', debitAmount: gross, creditAmount: 0 },
        { accountNumber: '2010_CAMPAIGN_ESCROW', debitAmount: 0, creditAmount: netEscrow },
        { accountNumber: '4010_PLATFORM_FEE', debitAmount: 0, creditAmount: platformFee },
        { accountNumber: '5010_GATEWAY_FEE', debitAmount: 0, creditAmount: gatewayFee },
      ];

      const result = ledgerService.validatePosting(entries);
      expect(result.isBalanced).toBe(true);
      expect(result.totalDebits).toBe(10000);
      expect(result.totalCredits).toBe(10000);
    });

    it('should prevent floating-point rounding errors on decimal amounts', () => {
      const entries = [
        { accountNumber: '1010_GATEWAY_CLEARING', debitAmount: 199.99, creditAmount: 0 },
        { accountNumber: '2010_CAMPAIGN_ESCROW', debitAmount: 0, creditAmount: 193.99 },
        { accountNumber: '4010_PLATFORM_FEE', debitAmount: 0, creditAmount: 6.00 },
      ];

      const result = ledgerService.validatePosting(entries);
      expect(result.isBalanced).toBe(true);
      expect(result.totalDebits).toBe(199.99);
      expect(result.totalCredits).toBe(199.99);
    });

    it('should reject zero or negative journal amounts', () => {
      const zeroEntries = [
        { accountNumber: '1010_GATEWAY_CLEARING', debitAmount: 0, creditAmount: 0 },
        { accountNumber: '2010_CAMPAIGN_ESCROW', debitAmount: 0, creditAmount: 0 },
      ];

      expect(() => ledgerService.validatePosting(zeroEntries)).toThrow(
        /Total journal amount must be strictly greater than 0/
      );
    });
  });

  describe('Chart of Accounts Invariants', () => {
    it('should define standardized Asset, Liability, Revenue and Expense account codes', () => {
      expect(ledgerService.accounts.ASSET_GATEWAY_CLEARING).toBe('1010_GATEWAY_CLEARING');
      expect(ledgerService.accounts.ASSET_ESCROW_BANK_POOL).toBe('1020_ESCROW_BANK_POOL');
      expect(ledgerService.accounts.LIABILITY_CAMPAIGN_ESCROW).toBe('2010_CAMPAIGN_ESCROW');
      expect(ledgerService.accounts.LIABILITY_USER_WALLET).toBe('2030_USER_WALLET');
      expect(ledgerService.accounts.REVENUE_PLATFORM_FEE).toBe('4010_PLATFORM_FEE');
      expect(ledgerService.accounts.EXPENSE_GATEWAY_FEE).toBe('5010_GATEWAY_FEE');
    });
  });
});
