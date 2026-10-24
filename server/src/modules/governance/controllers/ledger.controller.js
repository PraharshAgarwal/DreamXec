const prisma = require('../../../config/prisma');
const ledgerService = require('../../../services/ledger.service');
const donationRepository = require('../../donations/donation.repository');

class LedgerController {
  /**
   * GET /api/v1/dx-admin/ledger/overview
   * Returns system-wide & tenant treasury metrics, account balances, and recent ledger entries.
   */
  async getGlobalLedger(req, res) {
    try {
      const { tenantId, scopeType, page = 1, limit = 25 } = req.query;

      // 1. Ensure core system accounts are provisioned
      await ledgerService.ensureSystemAccounts();

      // 2. Fetch aggregated overview and transactions
      const [overviewData, transactionsData] = await Promise.all([
        ledgerService.getTreasuryOverview({ tenantId, scopeType }),
        ledgerService.getTransactions({
          page,
          limit,
          tenantId,
          scopeType,
        }),
      ]);

      return res.status(200).json({
        success: true,
        data: {
          overview: overviewData.overview,
          accounts: overviewData.accounts,
          transactions: transactionsData.transactions,
          pagination: transactionsData.pagination,
        },
      });
    } catch (error) {
      console.error('[LedgerController.getGlobalLedger] Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to fetch global ledger state',
      });
    }
  }

  /**
   * GET /api/v1/dx-admin/ledger/transactions
   * Filterable paginated transaction history
   */
  async getLedgerTransactions(req, res) {
    try {
      const { page, limit, scopeType, tenantId, userId, transactionType, referenceType, referenceId } = req.query;

      const data = await ledgerService.getTransactions({
        page,
        limit,
        scopeType,
        tenantId,
        userId,
        transactionType,
        referenceType,
        referenceId,
      });

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      console.error('[LedgerController.getLedgerTransactions] Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to query ledger transactions',
      });
    }
  }

  /**
   * POST /api/v1/dx-admin/ledger/simulate-payment
   * Interactive Sandbox Razorpay payment simulator.
   * Emulates exact Razorpay order creation, payment signature verification,
   * and triggers the atomic multi-leg double-entry ledger posting pipeline.
   */
  async simulateSandboxPayment(req, res) {
    try {
      const {
        amount = 1000,
        campaignId = null,
        donorName = 'Sandbox Supporter',
        donorEmail = 'tester@dreamxec.com',
        donorMessage = 'Simulated contribution for double-entry ledger verification',
        isAnonymous = false,
        paymentGateway = 'RAZORPAY_SANDBOX',
      } = req.body;

      const numericAmount = Math.max(Number(amount) || 100, 1);
      const authUserId = req.user?.id || null;

      // 1. Resolve Target Campaign or Default Active Campaign
      let targetCampaign = null;
      if (campaignId) {
        targetCampaign = await prisma.campaign.findUnique({
          where: { id: campaignId },
          include: { tenant: true },
        });
      }

      if (!targetCampaign) {
        targetCampaign = await prisma.campaign.findFirst({
          where: { isPublished: true },
          include: { tenant: true },
          orderBy: { createdAt: 'desc' },
        });
      }

      const tenantId = targetCampaign?.tenantId || null;
      const recipientOrgId = targetCampaign?.organizationId || tenantId;

      // 2. Provision or Lookup Donor User
      let donorUser = null;
      if (authUserId) {
        donorUser = await prisma.user.findUnique({ where: { id: authUserId } });
      } else if (donorEmail) {
        donorUser = await prisma.user.findFirst({
          where: { email: donorEmail.trim().toLowerCase() },
        });
        if (!donorUser) {
          donorUser = await prisma.user.create({
            data: {
              email: donorEmail.trim().toLowerCase(),
              fullName: donorName || 'Sandbox Supporter',
              role: 'USER',
              accountStatus: 'ACTIVE',
            },
          });
        }
      }

      // 3. Create Donation record
      const donation = await prisma.donation.create({
        data: {
          tenantId,
          recipientOrgId,
          campaignId: targetCampaign?.id || null,
          donorId: donorUser?.id || null,
          amount: numericAmount,
          currency: 'INR',
          isAnonymous: !!isAnonymous,
          donorDisplayName: donorName,
          donorMessage,
        },
      });

      // 4. Create PaymentIntent with unique idempotency key
      const idempotencyKey = `sim_idemp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const intent = await prisma.paymentIntent.create({
        data: {
          donationId: donation.id,
          tenantId,
          totalAmount: numericAmount,
          currency: 'INR',
          status: 'PENDING',
          idempotencyKey,
          metadata: {
            isSandbox: true,
            gateway: paymentGateway,
            simulatedBy: req.user?.email || 'admin',
          },
        },
      });

      // 5. Generate simulated Razorpay Order & Payment IDs
      const timestamp = Date.now();
      const simulatedOrderId = `order_sandbox_${timestamp}`;
      const simulatedPaymentId = `pay_sandbox_${timestamp}_${Math.random().toString(36).substring(2, 7)}`;
      const simulatedSignature = `sig_dx_sim_${timestamp}`;

      // 6. Create PaymentAttempt
      await prisma.paymentAttempt.create({
        data: {
          paymentIntentId: intent.id,
          gateway: 'RAZORPAY',
          gatewayOrderId: simulatedOrderId,
          gatewayTransactionId: simulatedOrderId,
          gatewayPaymentId: simulatedPaymentId,
          gatewaySignature: simulatedSignature,
          status: 'PENDING',
          rawResponse: {
            simulated: true,
            notes: { donationId: donation.id, campaignId: targetCampaign?.id },
          },
        },
      });

      // 7. Execute Atomic Verification & Multi-Leg Double-Entry Settlement
      const processedDonation = await donationRepository.processVerifiedPayment({
        orderId: simulatedOrderId,
        paymentId: simulatedPaymentId,
      });

      // 8. Fetch the newly created Ledger Transaction and updated accounts
      const postedLedgerTx = await prisma.ledgerTransaction.findFirst({
        where: {
          referenceType: 'DONATION',
          referenceId: donation.id,
        },
        include: {
          entries: {
            include: { account: true },
          },
        },
      });

      const overviewData = await ledgerService.getTreasuryOverview({ tenantId });

      return res.status(201).json({
        success: true,
        message: 'Sandbox payment processed and atomically settled into the double-entry ledger',
        data: {
          razorpayResponse: {
            razorpay_order_id: simulatedOrderId,
            razorpay_payment_id: simulatedPaymentId,
            razorpay_signature: simulatedSignature,
            status: 'captured',
            amount: numericAmount * 100, // in paise
            currency: 'INR',
          },
          donation: processedDonation,
          ledgerTransaction: postedLedgerTx,
          treasuryOverview: overviewData.overview,
        },
      });
    } catch (error) {
      console.error('[LedgerController.simulateSandboxPayment] Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to simulate sandbox payment',
      });
    }
  }

  /**
   * POST /api/v1/dx-admin/ledger/transactions/:id/reverse
   * Compensating reversal for an existing ledger transaction.
   */
  async reverseTransaction(req, res) {
    try {
      const { id } = req.params;
      const { reason = 'Manual administrative reversal' } = req.body;

      const reversalTx = await ledgerService.reverseTransaction({
        transactionId: id,
        reason,
        actorUserId: req.user?.id || null,
        idempotencyKey: `idemp_rev_${id}_${Date.now()}`,
      });

      return res.status(200).json({
        success: true,
        message: `Transaction #${id} successfully reversed with compensating journal entry #${reversalTx.id}`,
        data: reversalTx,
      });
    } catch (error) {
      console.error('[LedgerController.reverseTransaction] Error:', error);
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to reverse ledger transaction',
      });
    }
  }
}

module.exports = new LedgerController();
