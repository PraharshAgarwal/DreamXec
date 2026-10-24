/**
 * Double-Entry Chart of Accounts (COA) & Immutable Ledger Engine
 * Invariant: Sum(Debits) === Sum(Credits) on every journal posting.
 * Precision: Decimal(18, 4) exact arithmetic.
 */

const prisma = require('../config/prisma');

const CHART_OF_ACCOUNTS = {
  ASSET_GATEWAY_CLEARING: '1010_GATEWAY_CLEARING',
  ASSET_ESCROW_BANK_POOL: '1020_ESCROW_BANK_POOL',
  LIABILITY_CAMPAIGN_ESCROW: '2010_CAMPAIGN_ESCROW',
  LIABILITY_TRANCHE_PAYABLE: '2020_TRANCHE_PAYABLE',
  LIABILITY_WITHDRAWAL_PAYABLE: '2025_WITHDRAWAL_PAYABLE',
  LIABILITY_USER_WALLET: '2030_USER_WALLET',
  LIABILITY_ORG_HOLDING: '2040_ORG_HOLDING',
  REVENUE_PLATFORM_FEE: '4010_PLATFORM_FEE',
  EXPENSE_GATEWAY_FEE: '5010_GATEWAY_FEE',
};

class LedgerService {
  constructor() {
    this.accounts = CHART_OF_ACCOUNTS;
  }

  /**
   * Helper for decimal rounding to 4 decimal places to prevent float drift
   */
  roundAmount(val) {
    return Math.round(Number(val || 0) * 10000) / 10000;
  }

  /**
   * Validate double-entry debits and credits balance.
   * Invariant: Sum(Debits) === Sum(Credits) > 0
   */
  validatePosting(entries = []) {
    if (!entries || entries.length < 2) {
      throw new Error('Double-entry journal must contain at least 2 leg entries.');
    }

    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of entries) {
      if (!entry.accountNumber && !entry.accountId) {
        throw new Error(`Entry missing account identifier: ${JSON.stringify(entry)}`);
      }
      const debit = this.roundAmount(entry.debitAmount || 0);
      const credit = this.roundAmount(entry.creditAmount || 0);

      if (debit < 0 || credit < 0) {
        throw new Error('Entry amounts must be non-negative.');
      }
      if (debit > 0 && credit > 0) {
        throw new Error('A single entry leg cannot have both debit and credit amounts.');
      }

      totalDebits = this.roundAmount(totalDebits + debit);
      totalCredits = this.roundAmount(totalCredits + credit);
    }

    if (totalDebits <= 0) {
      throw new Error('Total journal amount must be strictly greater than 0.');
    }

    const diff = Math.abs(this.roundAmount(totalDebits - totalCredits));
    if (diff > 0.0001) {
      throw new Error(
        `Double-entry balance mismatch! Total Debits (${totalDebits}) !== Total Credits (${totalCredits}). Diff: ${diff}`
      );
    }

    return { totalDebits, totalCredits, isBalanced: true };
  }

  /**
   * Generates donation settlement journal descriptor (in-memory)
   */
  createDonationSettlementJournal({ donationId, campaignId, grossAmount, gatewayFee = 0, platformFee = 0 }) {
    const netCashDeposited = this.roundAmount(grossAmount - gatewayFee);
    const netEscrowCredited = this.roundAmount(grossAmount - gatewayFee - platformFee);

    const entries = [
      {
        accountNumber: this.accounts.ASSET_GATEWAY_CLEARING,
        debitAmount: netCashDeposited,
        creditAmount: 0,
        description: `Net settlement received from Payment Gateway for donation #${donationId}`,
      },
      {
        accountNumber: this.accounts.LIABILITY_CAMPAIGN_ESCROW,
        debitAmount: 0,
        creditAmount: netEscrowCredited,
        description: `Escrow liability credit for campaign #${campaignId}`,
      },
    ];

    if (platformFee > 0) {
      entries.push({
        accountNumber: this.accounts.REVENUE_PLATFORM_FEE,
        debitAmount: 0,
        creditAmount: platformFee,
        description: `Platform fee revenue for donation #${donationId}`,
      });
    }

    this.validatePosting(entries);

    return {
      journalType: 'DONATION_SETTLEMENT',
      referenceId: donationId,
      campaignId,
      entries,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Generates milestone disbursement journal descriptor (in-memory)
   */
  createMilestoneDisbursementJournal({ disbursementId, campaignId, milestoneId, amount }) {
    const entries = [
      {
        accountNumber: this.accounts.LIABILITY_CAMPAIGN_ESCROW,
        debitAmount: amount,
        creditAmount: 0,
        description: `Release tranche liability for milestone #${milestoneId}`,
      },
      {
        accountNumber: this.accounts.ASSET_ESCROW_BANK_POOL,
        debitAmount: 0,
        creditAmount: amount,
        description: `Bank payout settlement for disbursement #${disbursementId}`,
      },
    ];

    this.validatePosting(entries);

    return {
      journalType: 'MILESTONE_TRANCHE_DISBURSEMENT',
      referenceId: disbursementId,
      campaignId,
      milestoneId,
      entries,
      createdAt: new Date().toISOString(),
    };
  }

  /* ==========================================================================
     PERSISTENCE METHODS (DATABASE-BACKED DOUBLE-ENTRY ENGINE)
     ========================================================================== */

  /**
   * Ensure a LedgerAccount exists in the database
   */
  async ensureAccount({
    scopeType = 'SYSTEM',
    tenantId = null,
    userId = null,
    ownerType = 'SYSTEM',
    ownerId = null,
    accountNumber,
    name,
    accountType = 'ASSET',
    currency = 'INR',
    parentAccountId = null,
  }, db = prisma) {
    // 1. Try to find by unique name/tenant/currency or accountNumber
    const existing = await db.ledgerAccount.findFirst({
      where: {
        OR: [
          ...(accountNumber ? [{ accountNumber }] : []),
          {
            tenantId: tenantId || null,
            name,
            currency,
          },
          ...(ownerType && ownerId ? [{ ownerType, ownerId, name }] : []),
        ],
      },
      orderBy: [{ balanceCached: 'desc' }, { createdAt: 'desc' }],
    });

    if (existing) {
      return existing;
    }

    // 2. Create the ledger account
    return db.ledgerAccount.create({
      data: {
        scopeType,
        tenantId,
        userId,
        ownerType,
        ownerId,
        accountNumber: accountNumber || `ACC_${Date.now()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        name,
        accountType,
        currency,
        parentAccountId,
        balanceCached: 0.0,
      },
    });
  }

  /**
   * Ensure default system COA accounts exist
   */
  async ensureSystemAccounts(db = prisma) {
    const systemDefinitions = [
      {
        accountNumber: this.accounts.ASSET_GATEWAY_CLEARING,
        name: 'Razorpay Gateway Clearing Pool',
        accountType: 'ASSET',
        scopeType: 'SYSTEM',
        ownerType: 'SYSTEM',
      },
      {
        accountNumber: this.accounts.ASSET_ESCROW_BANK_POOL,
        name: 'DreamXec Escrow Bank Pool',
        accountType: 'ASSET',
        scopeType: 'SYSTEM',
        ownerType: 'SYSTEM',
      },
      {
        accountNumber: this.accounts.REVENUE_PLATFORM_FEE,
        name: 'DreamXec Protocol Revenue (3%)',
        accountType: 'REVENUE',
        scopeType: 'SYSTEM',
        ownerType: 'SYSTEM',
      },
      {
        accountNumber: this.accounts.LIABILITY_WITHDRAWAL_PAYABLE,
        name: 'Withdrawal Payable Clearing',
        accountType: 'LIABILITY',
        scopeType: 'SYSTEM',
        ownerType: 'SYSTEM',
      },
      {
        accountNumber: this.accounts.EXPENSE_GATEWAY_FEE,
        name: 'Payment Gateway Surcharges (2%)',
        accountType: 'EXPENSE',
        scopeType: 'SYSTEM',
        ownerType: 'SYSTEM',
      },
    ];

    const results = {};
    const accountNumbers = systemDefinitions.map((d) => d.accountNumber);
    const existingAccounts = await db.ledgerAccount.findMany({
      where: { accountNumber: { in: accountNumbers } },
    });
    const existingMap = new Map(existingAccounts.map((a) => [a.accountNumber, a]));

    for (const def of systemDefinitions) {
      if (existingMap.has(def.accountNumber)) {
        results[def.accountNumber] = existingMap.get(def.accountNumber);
      } else {
        results[def.accountNumber] = await this.ensureAccount(def, db);
      }
    }
    return results;
  }

  /**
   * Ensure personal user stored-value account exists
   */
  async ensureUserAccount(userId, db = prisma) {
    if (!userId) return null;
    return this.ensureAccount({
      scopeType: 'USER',
      userId,
      ownerType: 'USER',
      ownerId: userId,
      accountNumber: `2030_USER_${userId.replace(/-/g, '').substring(0, 12).toUpperCase()}`,
      name: `User Stored Value (${userId.substring(0, 8)})`,
      accountType: 'LIABILITY',
      currency: 'INR',
    }, db);
  }

  /**
   * Ensure campaign research escrow account exists
   */
  async ensureCampaignAccount(campaignId, tenantId = null, db = prisma) {
    if (!campaignId) return null;
    const campaign = await db.campaign.findUnique({
      where: { id: campaignId },
      include: { escrowAccount: true },
    });

    if (campaign?.escrowAccount) {
      return campaign.escrowAccount;
    }

    if (campaign?.escrowAccountId) {
      const existing = await db.ledgerAccount.findUnique({
        where: { id: campaign.escrowAccountId },
      });
      if (existing) return existing;
    }

    const account = await this.ensureAccount({
      scopeType: tenantId ? 'ORGANIZATION' : 'SYSTEM',
      tenantId: tenantId || campaign?.tenantId || null,
      ownerType: 'CAMPAIGN',
      ownerId: campaignId,
      accountNumber: `2010_CAMP_${campaignId.replace(/-/g, '').substring(0, 12).toUpperCase()}`,
      name: `Campaign Escrow (${campaign?.title?.substring(0, 20) || campaignId.substring(0, 8)})`,
      accountType: 'LIABILITY',
      currency: campaign?.currency || 'INR',
    }, db);

    if (campaign && campaign.escrowAccountId !== account.id) {
      await db.campaign.update({
        where: { id: campaignId },
        data: { escrowAccountId: account.id },
      });
    }

    return account;
  }

  /**
   * Read-only: Get user's available balance from their ledger account
   * Since postWithdrawalReservation debits 2030_USER immediately upon request:
   * - availableBalance = userAccount.balanceCached (unreserved liquid funds)
   * - pendingWithdrawals = SUM(in-flight REQUESTED/PROCESSING withdrawals held in 2025_WITHDRAWAL_PAYABLE)
   * - totalBalance = availableBalance + pendingWithdrawals (total stored claim before settlement)
   */
  async getUserBalance(userId, db = prisma) {
    if (!userId) {
      return { totalBalance: 0, pendingWithdrawals: 0, availableBalance: 0, accountId: null, currency: 'INR' };
    }
    const userAccount = await this.ensureUserAccount(userId, db);
    const liquidBalance = Number(userAccount.balanceCached || 0);

    // Sum of inflight (REQUESTED/PROCESSING) withdrawal amounts held in clearing
    const inflight = await db.withdrawalRequest.aggregate({
      where: {
        userId,
        status: { in: ['REQUESTED', 'PROCESSING'] },
      },
      _sum: { amount: true },
    });
    const pendingWithdrawals = Number(inflight._sum?.amount || 0);

    return {
      totalBalance: this.roundAmount(liquidBalance + pendingWithdrawals),
      pendingWithdrawals,
      availableBalance: liquidBalance,
      accountId: userAccount.id,
      currency: userAccount.currency,
    };
  }

  /**
   * Post an Atomic Multi-Leg Double-Entry Journal Transaction to Database
   * Invariant: Sum(Debits) === Sum(Credits) on every journal posting.
   */
  async postJournalTransaction({
    scopeType = 'SYSTEM',
    tenantId = null,
    userId = null,
    transactionType,
    referenceType,
    referenceId,
    idempotencyKey = null,
    entries = [],
    metadata = {},
  }, externalTx = null) {
    // 1. In-memory validation of double entry invariants
    this.validatePosting(entries);

    const executePosting = async (tx) => {
      // 2. Idempotency Check: check if already posted by idempotency key or composite reference
      if (idempotencyKey) {
        const existingByIdemp = await tx.ledgerTransaction.findUnique({
          where: { idempotencyKey },
          include: { entries: { include: { account: true } } },
        });
        if (existingByIdemp) {
          return existingByIdemp;
        }
      }

      if (referenceType && referenceId && transactionType) {
        const existingByRef = await tx.ledgerTransaction.findFirst({
          where: { referenceType, referenceId, transactionType },
          include: { entries: { include: { account: true } } },
        });
        if (existingByRef) {
          return existingByRef;
        }
      }

      // 3. Resolve Account IDs for each entry leg
      const resolvedEntries = [];
      for (const entry of entries) {
        let accountId = entry.accountId;
        let accountObj = null;

        if (accountId) {
          accountObj = await tx.ledgerAccount.findUnique({ where: { id: accountId } });
        } else if (entry.accountNumber) {
          accountObj = await this.ensureAccount({
            accountNumber: entry.accountNumber,
            name: entry.accountName || entry.accountNumber,
            accountType: entry.accountType || (entry.debitAmount > 0 ? 'ASSET' : 'LIABILITY'),
            scopeType,
            tenantId,
            userId,
          }, tx);
          accountId = accountObj.id;
        }

        if (!accountObj) {
          throw new Error(`Unable to resolve ledger account for entry: ${JSON.stringify(entry)}`);
        }

        const debit = this.roundAmount(entry.debitAmount || 0);
        const credit = this.roundAmount(entry.creditAmount || 0);
        const entryType = debit > 0 ? 'DEBIT' : 'CREDIT';
        const amount = debit > 0 ? debit : credit;

        resolvedEntries.push({
          accountId,
          amount,
          entryType,
          accountObj,
        });
      }

      // 4. Create LedgerTransaction
      const ledgerTx = await tx.ledgerTransaction.create({
        data: {
          scopeType,
          tenantId,
          userId,
          transactionType,
          referenceType,
          referenceId,
          idempotencyKey,
          status: 'POSTED',
          currency: 'INR',
          metadata,
        },
      });

      // 5. Create LedgerEntries and update balanceCached atomically in parallel
      const entryPromises = resolvedEntries.map((item) =>
        tx.ledgerEntry.create({
          data: {
            transactionId: ledgerTx.id,
            accountId: item.accountId,
            amount: item.amount,
            entryType: item.entryType,
            currency: 'INR',
          },
        })
      );

      const balancePromises = resolvedEntries.map((item) => {
        // Balance calculation based on Normal Account Balance rule:
        // ASSET / EXPENSE: Debit (+) / Credit (-)
        // LIABILITY / REVENUE: Credit (+) / Debit (-)
        let delta = 0;
        const acctType = item.accountObj.accountType;
        if (acctType === 'ASSET' || acctType === 'EXPENSE') {
          delta = item.entryType === 'DEBIT' ? item.amount : -item.amount;
        } else {
          // LIABILITY, REVENUE
          delta = item.entryType === 'CREDIT' ? item.amount : -item.amount;
        }

        return tx.ledgerAccount.update({
          where: { id: item.accountId },
          data: {
            balanceCached: { increment: delta },
          },
        });
      });

      const [createdEntries] = await Promise.all([
        Promise.all(entryPromises),
        Promise.all(balancePromises),
      ]);

      return {
        ...ledgerTx,
        entries: createdEntries,
      };
    };

    if (externalTx) {
      return executePosting(externalTx);
    }
    return prisma.$transaction(executePosting, {
      maxWait: 15000,
      timeout: 30000,
    });
  }

  /**
   * Atomically posts a verified donation settlement across all multi-tier accounts
   */
  async postDonationSettlement({
    donationId,
    grossAmount,
    gatewayFee = 0,
    platformFeeRate = 0.03, // 3% DreamXec protocol fee
    donorId = null,
    campaignId = null,
    tenantId = null,
    idempotencyKey = null,
    metadata = {},
  }, externalTx = null) {
    const gross = this.roundAmount(grossAmount);
    const gFee = this.roundAmount(gatewayFee);
    const pFee = this.roundAmount(gross * platformFeeRate);
    const netEscrow = this.roundAmount(gross - gFee - pFee);

    const executeSettlement = async (tx) => {
      // 1. Ensure system & campaign accounts
      const sysAccounts = await this.ensureSystemAccounts(tx);
      const gatewayAccount = sysAccounts[this.accounts.ASSET_GATEWAY_CLEARING];
      const platformFeeAccount = sysAccounts[this.accounts.REVENUE_PLATFORM_FEE];
      const gatewayFeeAccount = sysAccounts[this.accounts.EXPENSE_GATEWAY_FEE];

      let targetAccount;
      if (campaignId) {
        targetAccount = await this.ensureCampaignAccount(campaignId, tenantId, tx);
      } else if (donorId) {
        targetAccount = await this.ensureUserAccount(donorId, tx);
      } else {
        targetAccount = sysAccounts[this.accounts.ASSET_ESCROW_BANK_POOL];
      }

      // 2. Build multi-leg balanced entry lines
      // Leg 1: Debit Gateway Clearing (Total Gross collected from donor)
      const entries = [
        {
          accountId: gatewayAccount.id,
          debitAmount: gross,
          creditAmount: 0,
        },
        // Leg 2: Credit Campaign Escrow (Net held for research)
        {
          accountId: targetAccount.id,
          debitAmount: 0,
          creditAmount: netEscrow,
        },
      ];

      // Leg 3: Credit Platform Fee (DreamXec Protocol Revenue)
      if (pFee > 0) {
        entries.push({
          accountId: platformFeeAccount.id,
          debitAmount: 0,
          creditAmount: pFee,
        });
      }

      // Leg 4: Credit Gateway Fee (Surcharge)
      if (gFee > 0) {
        entries.push({
          accountId: gatewayFeeAccount.id,
          debitAmount: 0,
          creditAmount: gFee,
        });
      }

      // 3. Post journal transaction
      return this.postJournalTransaction({
        scopeType: tenantId ? 'ORGANIZATION' : donorId ? 'USER' : 'SYSTEM',
        tenantId,
        userId: donorId,
        transactionType: 'DONATION_SETTLEMENT',
        referenceType: 'DONATION',
        referenceId: donationId,
        idempotencyKey: idempotencyKey || `idemp_settle_${donationId}`,
        entries,
        metadata: {
          ...metadata,
          grossAmount: gross,
          netEscrowCredited: netEscrow,
          platformFee: pFee,
          gatewayFee: gFee,
        },
      }, tx);
    };

    if (externalTx) {
      return executeSettlement(externalTx);
    }
    return prisma.$transaction(executeSettlement);
  }

  /**
   * Post Milestone Tranche Payout to Researcher Wallet
   * Invariant: Double-entry balanced.
   * DR: Campaign Escrow (Liability 2010 - Reduces research escrow)
   * CR: User Stored Value (Liability 2030 - Credits researcher personal wallet)
   */
  async postMilestoneDisbursement({
    disbursementId = null,
    campaignId,
    milestoneId = null,
    studentUserId,
    amount,
    tenantId = null,
    idempotencyKey = null,
    metadata = {},
  }, externalTx = null) {
    const disbAmount = this.roundAmount(amount);
    if (disbAmount <= 0) {
      throw new Error('Disbursement amount must be greater than zero.');
    }

    if (!campaignId || !studentUserId) {
      throw new Error('Campaign ID and Student User ID are required to post a milestone disbursement.');
    }

    const executeDisbursement = async (tx) => {
      const campaignAccount = await this.ensureCampaignAccount(campaignId, tenantId, tx);
      const userAccount = await this.ensureUserAccount(studentUserId, tx);

      // Check available campaign escrow balance
      const currentEscrow = Number(campaignAccount.balanceCached || 0);
      if (currentEscrow < disbAmount) {
        throw new Error(
          `Insufficient campaign escrow balance. Available: ₹${currentEscrow}, Requested: ₹${disbAmount}`
        );
      }

      // DR: Campaign Escrow (reduces campaign liability)
      // CR: User Stored Value (increases researcher wallet liability)
      const entries = [
        {
          accountId: campaignAccount.id,
          debitAmount: disbAmount,
          creditAmount: 0,
          description: `Disburse milestone tranche #${milestoneId || 'GENERAL'} from campaign #${campaignId}`,
        },
        {
          accountId: userAccount.id,
          debitAmount: 0,
          creditAmount: disbAmount,
          description: `Campaign milestone payout credited to researcher wallet #${userAccount.accountNumber}`,
        },
      ];

      const journalTx = await this.postJournalTransaction({
        scopeType: tenantId ? 'ORGANIZATION' : 'USER',
        tenantId,
        userId: studentUserId,
        transactionType: 'MILESTONE_TRANCHE_DISBURSEMENT',
        referenceType: 'MILESTONE_DISBURSEMENT',
        referenceId: disbursementId || `disb_${milestoneId || Date.now()}`,
        idempotencyKey: idempotencyKey || (disbursementId ? `idemp_disb_${disbursementId}` : null),
        entries,
        metadata: {
          ...metadata,
          disbursementId,
          campaignId,
          milestoneId,
          studentUserId,
          amount: disbAmount,
        },
      }, tx);

      // If a MilestoneDisbursement record exists, link the transaction
      if (disbursementId) {
        await tx.milestoneDisbursement.update({
          where: { id: disbursementId },
          data: {
            ledgerTxId: journalTx.id,
            settledAt: new Date(),
          },
        });
      }

      return journalTx;
    };

    if (externalTx) {
      return executeDisbursement(externalTx);
    }
    return prisma.$transaction(executeDisbursement, {
      maxWait: 15000,
      timeout: 30000,
    });
  }

  /**
   * Post debit hold: DR User Stored Value, CR Withdrawal Payable Clearing
   * Invariant: Double-entry balanced. Locks funds for withdrawal.
   */
  async postWithdrawalReservation({
    userId,
    withdrawalId,
    amount,
    idempotencyKey = null,
    metadata = {},
  }, externalTx = null) {
    const holdAmount = this.roundAmount(amount);
    if (holdAmount <= 0) {
      throw new Error('Withdrawal amount must be greater than zero.');
    }

    const executeReservation = async (tx) => {
      const userAccount = await this.ensureUserAccount(userId, tx);
      const sysAccounts = await this.ensureSystemAccounts(tx);
      const payableAccount = sysAccounts[this.accounts.LIABILITY_WITHDRAWAL_PAYABLE];

      // DR: User Stored Value (Reduces user's liability balance)
      // CR: Withdrawal Payable (Increases clearing liability until paid out)
      const entries = [
        {
          accountId: userAccount.id,
          debitAmount: holdAmount,
          creditAmount: 0,
          description: `Withdrawal debit hold for request #${withdrawalId}`,
        },
        {
          accountId: payableAccount.id,
          debitAmount: 0,
          creditAmount: holdAmount,
          description: `Withdrawal payable clearing credit for request #${withdrawalId}`,
        },
      ];

      return this.postJournalTransaction({
        scopeType: 'USER',
        userId,
        transactionType: 'WITHDRAWAL_RESERVATION',
        referenceType: 'WITHDRAWAL_REQUEST',
        referenceId: withdrawalId,
        idempotencyKey: idempotencyKey || `idemp_withdr_res_${withdrawalId}`,
        entries,
        metadata: {
          ...metadata,
          withdrawalId,
          amount: holdAmount,
        },
      }, tx);
    };

    if (externalTx) {
      return executeReservation(externalTx);
    }
    return prisma.$transaction(executeReservation);
  }

  /**
   * Post final settlement: DR Withdrawal Payable Clearing, CR Escrow Bank Pool
   * Invariant: Double-entry balanced. Money leaves escrow bank pool to student's bank account.
   */
  async postWithdrawalSettlement({
    withdrawalId,
    amount,
    idempotencyKey = null,
    metadata = {},
  }, externalTx = null) {
    const settleAmount = this.roundAmount(amount);
    if (settleAmount <= 0) {
      throw new Error('Settlement amount must be greater than zero.');
    }

    const executeSettlement = async (tx) => {
      const sysAccounts = await this.ensureSystemAccounts(tx);
      const payableAccount = sysAccounts[this.accounts.LIABILITY_WITHDRAWAL_PAYABLE];
      const bankPoolAccount = sysAccounts[this.accounts.ASSET_ESCROW_BANK_POOL];

      // DR: Withdrawal Payable (Reduces clearing liability back down)
      // CR: Escrow Bank Pool (Reduces bank asset balance)
      const entries = [
        {
          accountId: payableAccount.id,
          debitAmount: settleAmount,
          creditAmount: 0,
          description: `Withdrawal settlement debit clearing for request #${withdrawalId}`,
        },
        {
          accountId: bankPoolAccount.id,
          debitAmount: 0,
          creditAmount: settleAmount,
          description: `Bank disbursement credit from Escrow Pool for request #${withdrawalId}`,
        },
      ];

      return this.postJournalTransaction({
        scopeType: 'SYSTEM',
        transactionType: 'WITHDRAWAL_SETTLEMENT',
        referenceType: 'WITHDRAWAL_REQUEST',
        referenceId: withdrawalId,
        idempotencyKey: idempotencyKey || `idemp_withdr_set_${withdrawalId}`,
        entries,
        metadata: {
          ...metadata,
          withdrawalId,
          amount: settleAmount,
        },
      }, tx);
    };

    if (externalTx) {
      return executeSettlement(externalTx);
    }
    return prisma.$transaction(executeSettlement);
  }

  /**
   * Reverse an existing transaction with inverse debit/credit entries
   */
  async reverseTransaction({ transactionId, reason = 'Administrative Reversal', actorUserId = null, idempotencyKey = null }, externalTx = null) {
    const executeReversal = async (tx) => {
      const originalTx = await tx.ledgerTransaction.findUnique({
        where: { id: transactionId },
        include: { entries: { include: { account: true } } },
      });

      if (!originalTx) {
        throw new Error(`Transaction #${transactionId} not found for reversal.`);
      }

      if (originalTx.status === 'REVERSED') {
        throw new Error(`Transaction #${transactionId} is already reversed.`);
      }

      // Invert entries: Debits become Credits, Credits become Debits
      const inverseEntries = originalTx.entries.map((entry) => ({
        accountId: entry.accountId,
        debitAmount: entry.entryType === 'CREDIT' ? Number(entry.amount) : 0,
        creditAmount: entry.entryType === 'DEBIT' ? Number(entry.amount) : 0,
      }));

      // Post the reversal transaction
      const reversalTx = await this.postJournalTransaction({
        scopeType: originalTx.scopeType,
        tenantId: originalTx.tenantId,
        userId: actorUserId || originalTx.userId,
        transactionType: 'TRANSACTION_REVERSAL',
        referenceType: 'LEDGER_TRANSACTION',
        referenceId: originalTx.id,
        idempotencyKey: idempotencyKey || `idemp_rev_${originalTx.id}`,
        entries: inverseEntries,
        metadata: {
          reason,
          reversalOf: originalTx.id,
        },
      }, tx);

      // Link reversal relationship
      await tx.ledgerTransaction.update({
        where: { id: originalTx.id },
        data: {
          status: 'REVERSED',
          reversalOfId: reversalTx.id,
        },
      });

      return reversalTx;
    };

    if (externalTx) {
      return executeReversal(externalTx);
    }
    return prisma.$transaction(executeReversal);
  }

  /**
   * Global Treasury & Financial Overview Aggregator
   */
  async getTreasuryOverview({ tenantId = null, scopeType = null } = {}) {
    const where = {};
    if (tenantId) where.tenantId = tenantId;
    if (scopeType) where.scopeType = scopeType;

    const accounts = await prisma.ledgerAccount.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    let totalGatewayClearing = 0;
    let totalEscrowHeld = 0;
    let totalProtocolRevenue = 0;
    let totalGatewayFees = 0;
    let totalUserStoredValue = 0;

    for (const acc of accounts) {
      const bal = Number(acc.balanceCached || 0);
      if (acc.accountNumber?.startsWith('1010')) totalGatewayClearing += bal;
      else if (acc.accountNumber?.startsWith('2010')) totalEscrowHeld += bal;
      else if (acc.accountNumber?.startsWith('2030')) totalUserStoredValue += bal;
      else if (acc.accountNumber?.startsWith('4010')) totalProtocolRevenue += bal;
      else if (acc.accountNumber?.startsWith('5010')) totalGatewayFees += bal;
    }

    const totalTxCount = await prisma.ledgerTransaction.count({ where });

    return {
      overview: {
        totalGatewayClearing,
        totalEscrowHeld,
        totalUserStoredValue,
        totalProtocolRevenue,
        totalGatewayFees,
        totalAccounts: accounts.length,
        totalTransactions: totalTxCount,
      },
      accounts,
    };
  }

  /**
   * Paginated Transaction & Entry Browser
   */
  async getTransactions({
    page = 1,
    limit = 20,
    scopeType = null,
    tenantId = null,
    userId = null,
    transactionType = null,
    referenceType = null,
    referenceId = null,
  } = {}) {
    const where = {};
    if (scopeType) where.scopeType = scopeType;
    if (tenantId) where.tenantId = tenantId;
    if (userId) where.userId = userId;
    if (transactionType) where.transactionType = transactionType;
    if (referenceType) where.referenceType = referenceType;
    if (referenceId) where.referenceId = referenceId;

    const take = Math.min(Number(limit) || 20, 100);
    const skip = Math.max((Number(page) || 1) - 1, 0) * take;

    const [total, transactions] = await Promise.all([
      prisma.ledgerTransaction.count({ where }),
      prisma.ledgerTransaction.findMany({
        where,
        skip,
        take,
        orderBy: { postedAt: 'desc' },
        include: {
          entries: {
            include: {
              account: true,
            },
          },
          user: {
            select: { id: true, fullName: true, email: true },
          },
          organization: {
            select: { id: true, name: true, slug: true },
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
      transactions,
    };
  }
}

module.exports = new LedgerService();
