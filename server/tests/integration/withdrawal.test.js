const request = require('supertest');
const crypto = require('crypto');
const axios = require('axios');
const createTestApp = require('../helpers/testApp');
const RazorpayPayoutAdapter = require('../../src/modules/donations/adapters/razorpay-payout.adapter');
const withdrawalService = require('../../src/modules/donations/services/withdrawal.service');
const container = require('../../src/core/container');
const prisma = require('../../src/config/prisma');

jest.mock('axios');

describe('Withdrawal Layer Tests', () => {
  let app;

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    app = createTestApp();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('RazorpayPayoutAdapter Simulation Mode', () => {
    const adapter = new RazorpayPayoutAdapter({
      keyId: 'dummy_key_id',
      keySecret: 'dummy_key_secret',
    });

    it('should create simulated contact cleanly with default customer type', async () => {
      const contact = await adapter.createContact({
        name: 'Jane Doe',
        email: 'jane@example.com',
        referenceId: 'user-123',
      });

      expect(contact).toHaveProperty('id');
      expect(contact.id).toMatch(/^cont_sim_/);
      expect(contact.name).toBe('Jane Doe');
      expect(contact.type).toBe('customer');
      expect(contact.active).toBe(true);
    });

    it('should create simulated fund account for bank and UPI', async () => {
      const bankFA = await adapter.createFundAccount({
        contactId: 'cont_sim_123',
        accountType: 'bank_account',
        bankAccount: {
          name: 'Jane Doe',
          ifsc: 'HDFC0001234',
          accountNumber: '1234567890',
        },
      });

      expect(bankFA.id).toMatch(/^fa_sim_/);
      expect(bankFA.account_type).toBe('bank_account');

      const upiFA = await adapter.createFundAccount({
        contactId: 'cont_sim_123',
        accountType: 'vpa',
        vpa: 'jane@okhdfcbank',
      });

      expect(upiFA.id).toMatch(/^fa_sim_/);
      expect(upiFA.account_type).toBe('vpa');
    });

    it('should create simulated payout with correct paise conversion', async () => {
      const payout = await adapter.createPayout({
        fundAccountId: 'fa_sim_123',
        amount: 1500.00,
        currency: 'INR',
        mode: 'IMPS',
        referenceId: 'wreq-123',
      });

      expect(payout.id).toMatch(/^pout_sim_/);
      expect(payout.amount).toBe(150000); // 1500 * 100 paise
      expect(payout.status).toBe('processing');
      expect(payout.simulated).toBe(true);
    });

    it('should parse webhook event and extract UTR successfully', () => {
      const body = {
        event: 'payout.processed',
        payload: {
          payout: {
            entity: {
              id: 'pout_test_123',
              amount: 50000,
              currency: 'INR',
              status: 'processed',
              reference_id: 'wreq-abc',
              utr: 'UTR9876543210',
            },
          },
        },
      };

      const parsed = adapter.parsePayoutWebhookEvent({ headers: {}, body });
      expect(parsed.eventType).toBe('payout.processed');
      expect(parsed.payoutId).toBe('pout_test_123');
      expect(parsed.amount).toBe(500);
      expect(parsed.referenceId).toBe('wreq-abc');
      expect(parsed.utr).toBe('UTR9876543210');
    });
  });

  describe('RazorpayPayoutAdapter Live / Production Mode', () => {
    const liveAdapter = new RazorpayPayoutAdapter({
      keyId: 'rzp_live_test_key_id',
      keySecret: 'live_test_key_secret',
      webhookSecret: 'live_webhook_secret_key',
      accountNumber: '7878780080316316',
      isSimulation: false,
    });

    it('should throw error when gateway payout creation fails instead of falling back to simulation', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            error: {
              code: 'BAD_REQUEST_ERROR',
              description: 'Account balance is insufficient for payout',
            },
          },
        },
      });

      await expect(
        liveAdapter.createPayout({
          fundAccountId: 'fa_live_real_123',
          amount: 1000,
          mode: 'IMPS',
          referenceId: 'wreq-live-1',
        })
      ).rejects.toThrow('RazorpayX Payout Initiation Failed: Account balance is insufficient for payout');
    });

    it('should recover existing contact if contact creation conflicts on reference_id', async () => {
      axios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            error: {
              code: 'BAD_REQUEST_ERROR',
              description: 'A contact already exists with the given reference_id',
            },
          },
        },
      });

      axios.get.mockResolvedValueOnce({
        data: {
          count: 1,
          items: [{ id: 'cont_live_existing_999', name: 'Dr. Jane' }],
        },
      });

      const contact = await liveAdapter.createContact({
        name: 'Dr. Jane',
        referenceId: 'user-guid-999',
      });

      expect(contact.id).toBe('cont_live_existing_999');
      expect(axios.get).toHaveBeenCalledWith(
        expect.stringContaining('/contacts?reference_id=user-guid-999'),
        expect.any(Object)
      );
    });

    it('should verify webhook signature correctly with HMAC SHA256', () => {
      const payload = {
        event: 'payout.processed',
        payload: {
          payout: {
            entity: {
              id: 'pout_signed_123',
              amount: 75000,
              status: 'processed',
              reference_id: 'wreq-signed',
              utr: 'UTR_SIGNED_123',
            },
          },
        },
      };

      const rawBody = JSON.stringify(payload);
      const validSignature = crypto
        .createHmac('sha256', 'live_webhook_secret_key')
        .update(rawBody)
        .digest('hex');

      const parsed = liveAdapter.parsePayoutWebhookEvent({
        headers: { 'x-razorpay-signature': validSignature },
        body: payload,
        rawBody,
      });

      expect(parsed.payoutId).toBe('pout_signed_123');
      expect(parsed.utr).toBe('UTR_SIGNED_123');
    });

    it('should reject webhook with invalid signature', () => {
      const payload = { event: 'payout.processed' };
      expect(() => {
        liveAdapter.parsePayoutWebhookEvent({
          headers: { 'x-razorpay-signature': 'invalid_signature_hex' },
          body: payload,
          rawBody: JSON.stringify(payload),
        });
      }).toThrow('Invalid RazorpayX payout webhook signature.');
    });
  });

  describe('Withdrawal Service Logic', () => {
    it('should enforce minimum withdrawal threshold of ₹500', async () => {
      await expect(
        withdrawalService.requestWithdrawal('user-1', {
          amount: 200,
          vaultAccountId: 'vault-1',
        })
      ).rejects.toThrow('Minimum withdrawal amount is ₹500');
    });

    it('should reject request when bank account is missing or not owned by user', async () => {
      jest.spyOn(prisma.userAccountVault, 'findFirst').mockResolvedValue(null);

      await expect(
        withdrawalService.requestWithdrawal('user-1', {
          amount: 1000,
          vaultAccountId: 'vault-nonexistent',
        })
      ).rejects.toThrow('Bank account not found or does not belong to this user.');
    });

    it('should reject request when available balance is insufficient', async () => {
      const validUserId = 'a5032bfc-3ff1-4817-b27d-66c1028be653';
      const validVaultId = 'b6032bfc-3ff1-4817-b27d-66c1028be654';

      jest.spyOn(prisma.userAccountVault, 'findFirst').mockResolvedValue({
        id: validVaultId,
        userId: validUserId,
        accountHolderName: 'Jane Doe',
        bankAccountNumber: '9876543210',
        ifscCode: 'SBIN0001234',
        upiId: null,
      });

      jest.spyOn(prisma.withdrawalRequest, 'findUnique').mockResolvedValue(null);

      jest.spyOn(withdrawalService.ledger, 'getUserBalance').mockResolvedValue({
        totalBalance: 300,
        pendingWithdrawals: 0,
        availableBalance: 300,
      });

      jest.spyOn(prisma, '$transaction').mockImplementation(async (callback) => {
        const fakeTx = {
          withdrawalRequest: {
            create: jest.fn(),
            update: jest.fn(),
          },
        };
        return callback(fakeTx);
      });

      await expect(
        withdrawalService.requestWithdrawal(validUserId, {
          amount: 1000,
          vaultAccountId: validVaultId,
        })
      ).rejects.toThrow('Insufficient available balance');
    });

    it('should handle webhook payout.processed idempotently and record UTR', async () => {
      jest.spyOn(prisma.withdrawalRequest, 'findFirst').mockResolvedValue({
        id: 'wreq-1',
        status: 'PROCESSING',
        amount: 500,
        metadata: {},
      });

      jest.spyOn(withdrawalService.ledger, 'postWithdrawalSettlement').mockResolvedValue({
        id: 'tx-settle-123',
      });

      const updateSpy = jest.spyOn(prisma.withdrawalRequest, 'update').mockResolvedValue({
        id: 'wreq-1',
        status: 'SETTLED',
      });

      const result = await withdrawalService.handlePayoutWebhook({
        headers: {},
        body: {
          event: 'payout.processed',
          payload: {
            payout: {
              entity: {
                id: 'pout_123',
                amount: 50000,
                status: 'processed',
                reference_id: 'wreq-1',
                utr: 'UTR_LIVE_2026',
              },
            },
          },
        },
      });

      expect(result.status).toBe('SETTLED');
      expect(result.utr).toBe('UTR_LIVE_2026');
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'wreq-1' },
          data: expect.objectContaining({
            status: 'SETTLED',
            metadata: expect.objectContaining({ utr: 'UTR_LIVE_2026' }),
          }),
        })
      );
    });

    it('should reverse reservation hold on payout.failed webhook', async () => {
      jest.spyOn(prisma.withdrawalRequest, 'findFirst').mockResolvedValue({
        id: 'wreq-fail',
        status: 'PROCESSING',
        reservationLedgerTxId: 'tx-res-hold-999',
      });

      const reverseSpy = jest.spyOn(withdrawalService.ledger, 'reverseTransaction').mockResolvedValue({
        id: 'tx-rev-999',
      });

      jest.spyOn(prisma.withdrawalRequest, 'update').mockResolvedValue({
        id: 'wreq-fail',
        status: 'FAILED',
      });

      const result = await withdrawalService.handlePayoutWebhook({
        headers: {},
        body: {
          event: 'payout.failed',
          payload: {
            payout: {
              entity: {
                id: 'pout_failed_123',
                status: 'failed',
                reference_id: 'wreq-fail',
                failure_reason: 'Account closed at recipient bank',
              },
            },
          },
        },
      });

      expect(result.status).toBe('FAILED');
      expect(reverseSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionId: 'tx-res-hold-999',
          reason: expect.stringContaining('Account closed at recipient bank'),
        })
      );
    });
  });

  describe('Service Container Integration', () => {
    it('should resolve payoutAdapter and withdrawalService from dependency injection container', () => {
      const payoutAdapter = container.get('payoutAdapter');
      const service = container.get('withdrawalService');

      expect(payoutAdapter).toBeInstanceOf(RazorpayPayoutAdapter);
      expect(service).toBeInstanceOf(withdrawalService.constructor);
      expect(service.payoutAdapter).toBeDefined();
    });
  });

  describe('Withdrawal Routes Security', () => {
    it('should reject unauthenticated request to /api/withdrawals/eligibility with 401', async () => {
      const res = await request(app).get('/api/withdrawals/eligibility');
      expect(res.status).toBe(401);
    });

    it('should reject unauthenticated request to /api/withdrawals/request with 401', async () => {
      const res = await request(app).post('/api/withdrawals/request').send({ amount: 500 });
      expect(res.status).toBe(401);
    });

    it('should reject unauthenticated request to /api/withdrawals/my with 401', async () => {
      const res = await request(app).get('/api/withdrawals/my');
      expect(res.status).toBe(401);
    });

    it('should accept public webhook request at /api/withdrawals/webhook', async () => {
      jest.spyOn(withdrawalService, 'handlePayoutWebhook').mockResolvedValue({
        status: 'IGNORED',
      });

      const res = await request(app)
        .post('/api/withdrawals/webhook')
        .send({ event: 'unknown.event' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
    });
  });
});
