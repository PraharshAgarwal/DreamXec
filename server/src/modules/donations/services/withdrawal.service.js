const prisma = require('../../../config/prisma');
const ledgerService = require('../../../services/ledger.service');
const RazorpayPayoutAdapter = require('../adapters/razorpay-payout.adapter');
const AppError = require('../../../utils/AppError');

const MIN_WITHDRAWAL_AMOUNT = 500.00;

class WithdrawalService {
  constructor(payoutAdapter = null) {
    this.payoutAdapter = payoutAdapter || new RazorpayPayoutAdapter();
    this.ledger = ledgerService;
  }

  /**
   * Check withdrawal eligibility, user ledger balance, and verified bank accounts
   */
  async getWithdrawalEligibility(userId) {
    if (!userId) {
      throw new AppError('User ID is required to check withdrawal eligibility.', 400);
    }

    const [balanceInfo, bankAccounts, inflightCount] = await Promise.all([
      this.ledger.getUserBalance(userId),
      prisma.userAccountVault.findMany({
        where: { userId, deletedAt: null },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.withdrawalRequest.count({
        where: {
          userId,
          status: { in: ['REQUESTED', 'PROCESSING'] },
        },
      }),
    ]);

    const hasAccounts = bankAccounts.length > 0;
    const meetsMinimum = balanceInfo.availableBalance >= MIN_WITHDRAWAL_AMOUNT;

    return {
      eligible: hasAccounts && meetsMinimum,
      totalBalance: balanceInfo.totalBalance,
      pendingWithdrawals: balanceInfo.pendingWithdrawals,
      availableBalance: balanceInfo.availableBalance,
      minAmount: MIN_WITHDRAWAL_AMOUNT,
      inflightCount,
      bankAccounts,
      reason: !hasAccounts
        ? 'No saved bank or UPI accounts found in vault.'
        : !meetsMinimum
        ? `Available balance (₹${balanceInfo.availableBalance}) is below the minimum threshold of ₹${MIN_WITHDRAWAL_AMOUNT}.`
        : null,
    };
  }

  /**
   * Request a withdrawal (Auto-Approved)
   * 1. Validate balance >= ₹500 & verified vault account
   * 2. Atomically create WithdrawalRequest and post ledger debit hold (DR User, CR Payable)
   * 3. Initiate RazorpayX Contact + Fund Account + Payout
   * 4. Update status to PROCESSING or SETTLED (if immediate)
   * 5. Fallback/Rollback ledger hold if initiation fails
   */
  async requestWithdrawal(userId, {
    amount,
    vaultAccountId,
    tenantId = null,
    idempotencyKey = null,
    req = null,
  }) {
    const numAmount = Math.round(Number(amount || 0) * 100) / 100;

    if (!numAmount || isNaN(numAmount) || numAmount < MIN_WITHDRAWAL_AMOUNT) {
      throw new AppError(`Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}. Provided: ₹${amount}`, 400);
    }

    if (!vaultAccountId) {
      throw new AppError('Vault bank account ID is required for withdrawal.', 400);
    }

    // 1. Verify bank account belongs to user and is active
    const bankAccount = await prisma.userAccountVault.findFirst({
      where: {
        id: vaultAccountId,
        userId,
        deletedAt: null,
      },
    });

    if (!bankAccount) {
      throw new AppError('Bank account not found or does not belong to this user.', 404);
    }

    const key = idempotencyKey || `withdr_${userId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 2. Check for duplicate idempotency key
    const existing = await prisma.withdrawalRequest.findUnique({
      where: { idempotencyKey: key },
    });
    if (existing) {
      return existing;
    }

    // 3. Atomically check available balance, create WithdrawalRequest, and post debit hold
    let withdrawal = await prisma.$transaction(async (tx) => {
      const balance = await this.ledger.getUserBalance(userId, tx);
      if (balance.availableBalance < numAmount) {
        throw new AppError(
          `Insufficient available balance. Available: ₹${balance.availableBalance}, Requested: ₹${numAmount}`,
          400
        );
      }

      // Auto-sweep stranded change: If remaining balance is < ₹500, bundle it into the payout
      let finalPayoutAmount = numAmount;
      let autoSweptRemainder = 0;
      const remainingBalance = this.ledger.roundAmount(balance.availableBalance - numAmount);
      if (remainingBalance > 0 && remainingBalance < MIN_WITHDRAWAL_AMOUNT) {
        autoSweptRemainder = remainingBalance;
        finalPayoutAmount = balance.availableBalance;
      }

      // Create withdrawal request in REQUESTED state
      const created = await tx.withdrawalRequest.create({
        data: {
          userId,
          tenantId,
          amount: finalPayoutAmount,
          currency: 'INR',
          status: 'REQUESTED',
          vaultAccountId: bankAccount.id,
          accountHolderName: bankAccount.accountHolderName,
          bankAccountNumber: bankAccount.bankAccountNumber,
          ifscCode: bankAccount.ifscCode,
          upiId: bankAccount.upiId,
          idempotencyKey: key,
          metadata: {
            bankName: bankAccount.bankName,
            accountType: bankAccount.accountType,
            ...(autoSweptRemainder > 0
              ? {
                  originalRequestedAmount: numAmount,
                  autoSweptRemainder,
                  autoSweepNote: `Remaining ₹${autoSweptRemainder} is below ₹${MIN_WITHDRAWAL_AMOUNT} minimum threshold and was automatically added to prevent stranded funds.`,
                }
              : {}),
          },
        },
      });

      // Post debit hold in ledger: DR User Stored Value, CR Withdrawal Payable
      const reservationTx = await this.ledger.postWithdrawalReservation({
        userId,
        withdrawalId: created.id,
        amount: finalPayoutAmount,
        idempotencyKey: `idemp_res_${created.id}`,
      }, tx);

      // Link reservation transaction
      return tx.withdrawalRequest.update({
        where: { id: created.id },
        data: {
          reservationLedgerTxId: reservationTx.id,
        },
      });
    }, {
      maxWait: 10000,
      timeout: 20000,
    });

    // 4. Initiate Payout via RazorpayX (outside DB transaction to prevent holding locks)
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, fullName: true },
      });

      // Step A: Contact (Razorpay defaults: customer, vendor, employee, self)
      const contact = await this.payoutAdapter.createContact({
        name: bankAccount.accountHolderName || user?.fullName || 'Beneficiary',
        email: user?.email,
        type: 'customer',
        referenceId: userId,
        req,
      });

      // Step B: Fund Account (UPI or Bank)
      const fundAccount = await this.payoutAdapter.createFundAccount({
        contactId: contact.id,
        accountType: bankAccount.upiId ? 'vpa' : 'bank_account',
        bankAccount: {
          name: bankAccount.accountHolderName,
          ifsc: bankAccount.ifscCode,
          accountNumber: bankAccount.bankAccountNumber,
        },
        vpa: bankAccount.upiId,
        req,
      });

      // Step C: Create Payout
      const payoutMode = bankAccount.upiId ? 'UPI' : (process.env.RAZORPAYX_PAYOUT_MODE || 'IMPS');
      const payout = await this.payoutAdapter.createPayout({
        fundAccountId: fundAccount.id,
        amount: Number(withdrawal.amount),
        mode: payoutMode,
        purpose: 'payout',
        referenceId: withdrawal.id,
        narration: 'DreamXec Withdrawal',
        idempotencyKey: `pout_idemp_${withdrawal.id}`,
        req,
      });

      const isImmediateSuccess = payout.status === 'processed';

      if (isImmediateSuccess) {
        // Payout settled immediately (simulation or instant settlement)
        const settleTx = await this.ledger.postWithdrawalSettlement({
          withdrawalId: withdrawal.id,
          amount: Number(withdrawal.amount),
          idempotencyKey: `idemp_set_${withdrawal.id}`,
        });

        withdrawal = await prisma.withdrawalRequest.update({
          where: { id: withdrawal.id },
          data: {
            status: 'SETTLED',
            razorpayContactId: contact.id,
            razorpayFundAccId: fundAccount.id,
            razorpayPayoutId: payout.id,
            settlementLedgerTxId: settleTx.id,
            processedAt: new Date(),
            settledAt: new Date(),
            metadata: {
              ...(withdrawal.metadata || {}),
              payoutMode,
              utr: payout.utr || null,
            },
          },
        });
      } else {
        // Payout is in PROCESSING / QUEUED state (waiting for bank webhook)
        withdrawal = await prisma.withdrawalRequest.update({
          where: { id: withdrawal.id },
          data: {
            status: 'PROCESSING',
            razorpayContactId: contact.id,
            razorpayFundAccId: fundAccount.id,
            razorpayPayoutId: payout.id,
            processedAt: new Date(),
            metadata: {
              ...(withdrawal.metadata || {}),
              payoutMode,
              gatewayStatus: payout.status,
            },
          },
        });
      }

      return withdrawal;
    } catch (err) {
      console.error(`[WithdrawalService] Payout initiation failed for request #${withdrawal.id}:`, err.message);

      // Rollback reservation ledger hold if payout initiation errored
      if (withdrawal.reservationLedgerTxId) {
        try {
          await this.ledger.reverseTransaction({
            transactionId: withdrawal.reservationLedgerTxId,
            reason: `Payout initiation failure: ${err.message}`,
            actorUserId: userId,
            idempotencyKey: `idemp_rollback_${withdrawal.id}`,
          });
        } catch (revErr) {
          console.error(`[WithdrawalService] Failed to reverse reservation hold #${withdrawal.id}:`, revErr.message);
        }
      }

      withdrawal = await prisma.withdrawalRequest.update({
        where: { id: withdrawal.id },
        data: {
          status: 'FAILED',
          failedAt: new Date(),
          failureReason: err.message,
        },
      });

      throw new AppError(`Payout initiation failed: ${err.message}. Funds have been restored to your balance.`, 502);
    }
  }

  /**
   * Get user's withdrawals with pagination
   */
  async getMyWithdrawals(userId, { page = 1, limit = 20, status = null } = {}) {
    const take = Math.min(Number(limit) || 20, 100);
    const skip = Math.max((Number(page) || 1) - 1, 0) * take;

    const where = { userId };
    if (status) {
      where.status = status;
    }

    const [total, withdrawals] = await Promise.all([
      prisma.withdrawalRequest.count({ where }),
      prisma.withdrawalRequest.findMany({
        where,
        skip,
        take,
        orderBy: { requestedAt: 'desc' },
      }),
    ]);

    return {
      pagination: {
        page: Number(page) || 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
      withdrawals,
    };
  }

  /**
   * Get single withdrawal by ID
   */
  async getWithdrawalById(withdrawalId, userId = null) {
    const where = { id: withdrawalId };
    if (userId) {
      where.userId = userId;
    }

    const item = await prisma.withdrawalRequest.findFirst({
      where,
      include: {
        user: {
          select: { id: true, fullName: true, email: true },
        },
      },
    });

    if (!item) {
      throw new AppError('Withdrawal request not found.', 404);
    }
    return item;
  }

  /**
   * Student cancel withdrawal: only allowed if status is REQUESTED (before payout fires)
   */
  async cancelWithdrawal(withdrawalId, userId) {
    const withdrawal = await prisma.withdrawalRequest.findFirst({
      where: { id: withdrawalId, userId },
    });

    if (!withdrawal) {
      throw new AppError('Withdrawal request not found.', 404);
    }

    if (withdrawal.status !== 'REQUESTED') {
      throw new AppError(`Cannot cancel withdrawal in ${withdrawal.status} state. Payout already dispatched.`, 400);
    }

    return prisma.$transaction(async (tx) => {
      // Reverse reservation hold
      if (withdrawal.reservationLedgerTxId) {
        await this.ledger.reverseTransaction({
          transactionId: withdrawal.reservationLedgerTxId,
          reason: 'Student cancelled withdrawal request before payout dispatch',
          actorUserId: userId,
          idempotencyKey: `idemp_cancel_${withdrawal.id}`,
        }, tx);
      }

      return tx.withdrawalRequest.update({
        where: { id: withdrawal.id },
        data: {
          status: 'CANCELLED',
          failedAt: new Date(),
          failureReason: 'Cancelled by student',
        },
      });
    });
  }

  /**
   * Handle RazorpayX Payout Webhook events
   */
  async handlePayoutWebhook({ headers, body, rawBody = null }) {
    const parsed = this.payoutAdapter.parsePayoutWebhookEvent({ headers, body, rawBody });
    if (!parsed || !parsed.eventType) {
      return { status: 'IGNORED', reason: 'Unrecognized event' };
    }

    const { eventType, payoutId, referenceId, failureReason, utr, status: gatewayStatus } = parsed;

    // Locate withdrawal request
    const withdrawal = await prisma.withdrawalRequest.findFirst({
      where: {
        OR: [
          ...(payoutId ? [{ razorpayPayoutId: payoutId }] : []),
          ...(referenceId ? [{ id: referenceId }] : []),
        ],
      },
    });

    if (!withdrawal) {
      console.warn(`[WithdrawalService] Webhook received for untracked payout: ${payoutId || referenceId}`);
      return { status: 'NOT_FOUND', payoutId };
    }

    switch (eventType) {
      case 'payout.processed': {
        if (withdrawal.status === 'SETTLED') {
          return { status: 'ALREADY_SETTLED', withdrawalId: withdrawal.id };
        }

        const settleTx = await this.ledger.postWithdrawalSettlement({
          withdrawalId: withdrawal.id,
          amount: Number(withdrawal.amount),
          idempotencyKey: `idemp_webhook_set_${withdrawal.id}`,
        });

        const updated = await prisma.withdrawalRequest.update({
          where: { id: withdrawal.id },
          data: {
            status: 'SETTLED',
            settledAt: new Date(),
            settlementLedgerTxId: settleTx.id,
            metadata: {
              ...(withdrawal.metadata || {}),
              utr: utr || withdrawal.metadata?.utr || null,
              settledViaWebhook: true,
            },
          },
        });

        return { status: 'SETTLED', withdrawalId: updated.id, utr };
      }

      case 'payout.failed':
      case 'payout.rejected': {
        if (['FAILED', 'REVERSED', 'CANCELLED'].includes(withdrawal.status)) {
          return { status: 'ALREADY_TERMINATED', withdrawalId: withdrawal.id };
        }

        // Reverse reservation hold so money returns to user balance
        if (withdrawal.reservationLedgerTxId) {
          try {
            await this.ledger.reverseTransaction({
              transactionId: withdrawal.reservationLedgerTxId,
              reason: `Razorpay payout failure: ${failureReason || 'Bank rejection'}`,
              idempotencyKey: `idemp_fail_rev_${withdrawal.id}`,
            });
          } catch (revErr) {
            console.error(`[WithdrawalService] Error reversing hold on failure #${withdrawal.id}:`, revErr.message);
          }
        }

        const updated = await prisma.withdrawalRequest.update({
          where: { id: withdrawal.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            failureReason: failureReason || 'Payout rejected by bank',
            metadata: {
              ...(withdrawal.metadata || {}),
              failedViaWebhook: true,
            },
          },
        });

        return { status: 'FAILED', withdrawalId: updated.id };
      }

      case 'payout.reversed': {
        if (withdrawal.status === 'REVERSED') {
          return { status: 'ALREADY_REVERSED', withdrawalId: withdrawal.id };
        }

        // Reverse both settlement and reservation entries if settled
        if (withdrawal.settlementLedgerTxId) {
          try {
            await this.ledger.reverseTransaction({
              transactionId: withdrawal.settlementLedgerTxId,
              reason: `Razorpay payout reversed by banking network: ${failureReason || 'Network reversal'}`,
              idempotencyKey: `idemp_set_rev_${withdrawal.id}`,
            });
          } catch (err) {
            console.error(`[WithdrawalService] Settlement reversal error #${withdrawal.id}:`, err.message);
          }
        }

        const updated = await prisma.withdrawalRequest.update({
          where: { id: withdrawal.id },
          data: {
            status: 'REVERSED',
            failureReason: failureReason || 'Reversed by banking network',
          },
        });

        return { status: 'REVERSED', withdrawalId: updated.id };
      }

      case 'payout.initiated':
      case 'payout.queued': {
        if (withdrawal.status === 'REQUESTED') {
          await prisma.withdrawalRequest.update({
            where: { id: withdrawal.id },
            data: {
              status: 'PROCESSING',
              processedAt: new Date(),
              metadata: {
                ...(withdrawal.metadata || {}),
                gatewayStatus,
              },
            },
          });
        }
        return { status: 'PROCESSING', withdrawalId: withdrawal.id };
      }

      default:
        return { status: 'UNHANDLED_EVENT', eventType };
    }
  }

  /**
   * Admin monitoring: query all withdrawal requests across the platform
   */
  async getAllWithdrawals({ page = 1, limit = 20, status = null, search = null } = {}) {
    const take = Math.min(Number(limit) || 20, 100);
    const skip = Math.max((Number(page) || 1) - 1, 0) * take;

    const where = {};
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { accountHolderName: { contains: search, mode: 'insensitive' } },
        { bankAccountNumber: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, withdrawals] = await Promise.all([
      prisma.withdrawalRequest.count({ where }),
      prisma.withdrawalRequest.findMany({
        where,
        skip,
        take,
        orderBy: { requestedAt: 'desc' },
        include: {
          user: {
            select: { id: true, fullName: true, email: true },
          },
          organization: {
            select: { id: true, name: true },
          },
        },
      }),
    ]);

    return {
      pagination: {
        page: Number(page) || 1,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
      withdrawals,
    };
  }
}

const withdrawalService = new WithdrawalService();
module.exports = withdrawalService;
module.exports.WithdrawalService = WithdrawalService;
