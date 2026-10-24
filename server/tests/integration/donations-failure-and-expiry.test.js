const { describe, it, expect, beforeEach, jest: testJest } = require('@jest/globals');

describe('Donation Failure, Auto-Expiry, and Receipt Protection Tests', () => {
  beforeEach(() => {
    testJest.clearAllMocks();
  });

  it('should auto-expire pending attempts older than 30 minutes', async () => {
    const PrismaDonationRepositoryAdapter = require('../../src/modules/donations/adapters/prisma-donation-repository.adapter');
    const prismaDonationRepo = new PrismaDonationRepositoryAdapter();
    const prisma = require('../../src/config/prisma');

    const staleAttempt = {
      id: 'att_stale_1',
      paymentIntentId: 'pi_stale_1',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 35 * 60 * 1000), // 35 minutes ago (> 30m)
      intent: {
        id: 'pi_stale_1',
      },
    };

    const findManySpy = testJest.spyOn(prisma.paymentAttempt, 'findMany').mockResolvedValue([staleAttempt]);
    const updateSpy = testJest.spyOn(prisma.paymentAttempt, 'update').mockResolvedValue({ ...staleAttempt, status: 'FAILED' });
    const intentUpdateSpy = testJest.spyOn(prisma.paymentIntent, 'update').mockResolvedValue({ id: 'pi_stale_1', status: 'FAILED' });

    const result = await prismaDonationRepo.autoExpireStaleTransactions(30);

    expect(result).toBe(1);
    expect(findManySpy).toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'att_stale_1' },
        data: expect.objectContaining({
          status: 'FAILED',
          errorMessage: expect.stringContaining('Transaction timed out: exceeded 30 minutes'),
        }),
      })
    );
    expect(intentUpdateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'pi_stale_1' },
        data: expect.objectContaining({ status: 'FAILED' }),
      })
    );

    findManySpy.mockRestore();
    updateSpy.mockRestore();
    intentUpdateSpy.mockRestore();
  });

  it('should wait and return waitingForWebhook if order is under 30 minutes old, and auto-expire if >= 30 mins', async () => {
    const PrismaDonationRepositoryAdapter = require('../../src/modules/donations/adapters/prisma-donation-repository.adapter');
    const prismaDonationRepo = new PrismaDonationRepositoryAdapter();
    const prisma = require('../../src/config/prisma');

    // Case 1: 15 minutes old (still within 30 min window) -> wait for webhook
    const recentAttempt = {
      id: 'att_recent_1',
      gatewayTransactionId: 'order_recent_123',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      intent: {
        id: 'pi_recent_1',
        totalAmount: 1000,
        currency: 'INR',
        status: 'PENDING',
        donation: {
          id: 'don_recent_1',
          projectId: 'proj_1',
        },
      },
    };

    let findFirstSpy = testJest.spyOn(prisma.paymentAttempt, 'findFirst').mockResolvedValue(recentAttempt);
    let statusResult = await prismaDonationRepo.findDonationStatusByOrderId('order_recent_123');

    expect(statusResult.status).toBe('PENDING');
    expect(statusResult.isSettled).toBe(false);
    expect(statusResult.waitingForWebhook).toBe(true);
    findFirstSpy.mockRestore();

    // Case 2: 32 minutes old (> 30 min window) -> auto-marked as FAILED
    const expiredAttempt = {
      id: 'att_elapsed_1',
      gatewayTransactionId: 'order_elapsed_123',
      status: 'PENDING',
      createdAt: new Date(Date.now() - 32 * 60 * 1000), // 32 minutes ago
      intent: {
        id: 'pi_elapsed_1',
        totalAmount: 1000,
        currency: 'INR',
        status: 'PENDING',
        donation: {
          id: 'don_elapsed_1',
          projectId: 'proj_1',
        },
      },
    };

    findFirstSpy = testJest.spyOn(prisma.paymentAttempt, 'findFirst').mockResolvedValue(expiredAttempt);
    const updateSpy = testJest.spyOn(prisma.paymentAttempt, 'update').mockResolvedValue({ ...expiredAttempt, status: 'FAILED' });
    const intentUpdateSpy = testJest.spyOn(prisma.paymentIntent, 'update').mockResolvedValue({ id: 'pi_elapsed_1', status: 'FAILED' });

    statusResult = await prismaDonationRepo.findDonationStatusByOrderId('order_elapsed_123');

    expect(statusResult.status).toBe('FAILED');
    expect(statusResult.isSettled).toBe(false);
    expect(statusResult.waitingForWebhook).toBe(false);
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'att_elapsed_1' },
        data: expect.objectContaining({ status: 'FAILED' }),
      })
    );

    findFirstSpy.mockRestore();
    updateSpy.mockRestore();
    intentUpdateSpy.mockRestore();
  });

  it('should reject 80G receipt download if donation status is not completed/succeeded', async () => {
    const donationController = require('../../src/modules/donations/controllers/donation.controller');
    const prisma = require('../../src/config/prisma');

    const pendingDonation = {
      id: 'don_pending_123',
      donorId: 'user_donor_1',
      tenantId: 'tenant_1',
      amount: 1000,
      createdAt: new Date(),
      paymentIntents: [
        {
          id: 'pi_pending_123',
          status: 'PENDING',
          attempts: [
            {
              id: 'att_pending_123',
              status: 'PENDING',
            },
          ],
        },
      ],
    };

    const findUniqueSpy = testJest.spyOn(prisma.donation, 'findUnique').mockResolvedValue(pendingDonation);

    const req = {
      params: { id: 'don_pending_123' },
      user: { id: 'user_donor_1', role: 'DONOR' },
    };
    const res = {
      setHeader: testJest.fn(),
      status: testJest.fn().mockReturnThis(),
      json: testJest.fn(),
      send: testJest.fn(),
    };
    const next = testJest.fn();

    await donationController.download80GReceipt(req, res, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: expect.stringContaining('Section 80G tax receipt can only be generated for successfully completed and settled donations'),
      })
    );

    findUniqueSpy.mockRestore();
  });

  it('should exclude pending and processing donations in findUserDonations query for dashboard', async () => {
    const PrismaDonationRepositoryAdapter = require('../../src/modules/donations/adapters/prisma-donation-repository.adapter');
    const prismaDonationRepo = new PrismaDonationRepositoryAdapter();
    const prisma = require('../../src/config/prisma');

    const findManySpy = testJest.spyOn(prisma.donation, 'findMany').mockResolvedValue([]);

    await prismaDonationRepo.findUserDonations('user_donor_1');

    expect(findManySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          donorId: 'user_donor_1',
          paymentIntents: {
            none: { status: { in: ['PENDING', 'PROCESSING'] } },
          },
        }),
      })
    );

    findManySpy.mockRestore();
  });
});
