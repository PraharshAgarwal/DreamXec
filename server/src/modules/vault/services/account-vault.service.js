const prisma = require('../../../config/prisma');
const AppError = require('../../../utils/AppError');
const ifscService = require('../../../services/ifsc.service');
const RazorpayPaymentAdapter = require('../../donations/adapters/razorpay-payment.adapter');
const ledgerService = require('../../../services/ledger.service');

class AccountVaultService {
  constructor() {
    this.razorpayGateway = new RazorpayPaymentAdapter();
  }

  /**
   * Retrieves all saved bank & payout accounts for the user.
   */
  async getUserAccounts(userId) {
    if (!userId) throw new AppError('User ID is required', 400);

    return prisma.userAccountVault.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Validates and fetches bank branch details for an IFSC code.
   */
  async lookupIfsc(ifscCode) {
    return ifscService.lookup(ifscCode);
  }

  /**
   * Initiates ₹1 Reverse Penny Drop KYC via Razorpay.
   * User pays ₹1.00 (100 paise) to verify bank account ownership.
   */
  async initiateKycVerification(userId, accountData, context = {}) {
    if (!userId) throw new AppError('User ID is required', 400);
    const { accountHolderName, bankAccountNumber, ifscCode } = accountData || {};

    if (!accountHolderName || !bankAccountNumber || !ifscCode) {
      throw new AppError('Account holder name, bank account number, and IFSC are required', 400);
    }

    const cleanAcc = bankAccountNumber.replace(/\s+/g, '');
    const cleanIfsc = ifscCode.trim().toUpperCase();

    // Verify IFSC format and details
    const ifscInfo = await ifscService.lookup(cleanIfsc);

    const order = await this.razorpayGateway.createOrder({
      amount: 100, // 100 paise = ₹1.00 INR
      currency: 'INR',
      receipt: `kyc_${Date.now()}_${userId.slice(0, 8)}`,
      notes: {
        userId,
        purpose: 'REVERSE_PENNY_DROP_KYC',
        accountHolderName: accountHolderName.trim(),
        ifscCode: cleanIfsc,
        last4: cleanAcc.slice(-4),
      },
      origin: context.origin,
      req: context.req,
    });

    return {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: order.key || process.env.RAZORPAY_KEY_ID,
      accountData: {
        ...accountData,
        bankName: accountData.bankName || ifscInfo?.bank || null,
        bankAccountNumber: cleanAcc,
        ifscCode: cleanIfsc,
      },
      ifscInfo,
    };
  }

  /**
   * Confirms ₹1 Reverse Penny Drop KYC payment:
   * 1. Verifies HMAC payment signature
   * 2. Persists verified bank account with isVerified = true
   * 3. Posts ₹1 transaction to immutable double-entry ledger
   */
  async confirmKycVerification(userId, { orderId, paymentId, signature, accountData }, context = {}) {
    if (!userId) throw new AppError('User ID is required', 400);
    if (!orderId || !paymentId) {
      throw new AppError('Razorpay order ID and payment ID are required', 400);
    }

    // 1. Verify Gateway Signature
    const isValidSignature = this.razorpayGateway.verifySignature({
      orderId,
      paymentId,
      signature,
      origin: context.origin,
      req: context.req,
    });

    if (!isValidSignature) {
      throw new AppError('Invalid payment gateway signature for ₹1 KYC verification', 400);
    }

    // 2. Lookup IFSC to enrich bank details
    const cleanAccNum = accountData.bankAccountNumber.replace(/\s+/g, '');
    const cleanIfsc = accountData.ifscCode.trim().toUpperCase();
    const ifscDetails = await ifscService.lookup(cleanIfsc);

    const enrichedMetadata = {
      ...(accountData.metadata || {}),
      kycVerification: {
        method: 'REVERSE_PENNY_DROP_INR_1',
        status: 'VERIFIED',
        orderId,
        paymentId,
        verifiedAt: new Date().toISOString(),
        rails: ifscDetails.rails || null,
        branch: ifscDetails.branch || null,
      },
    };

    // 3. Save or update bank account with isVerified = true
    const savedAccount = await prisma.$transaction(async (tx) => {
      const existing = await tx.userAccountVault.findFirst({
        where: {
          userId,
          bankAccountNumber: cleanAccNum,
          ifscCode: cleanIfsc,
          deletedAt: null,
        },
      });

      if (accountData.isPrimary) {
        await tx.userAccountVault.updateMany({
          where: { userId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      if (existing) {
        return tx.userAccountVault.update({
          where: { id: existing.id },
          data: {
            accountNickname: accountData.accountNickname?.trim() || existing.accountNickname,
            accountHolderName: accountData.accountHolderName.trim(),
            bankName: accountData.bankName?.trim() || ifscDetails.bank || existing.bankName,
            upiId: accountData.upiId?.trim() || existing.upiId,
            accountType: accountData.accountType || existing.accountType,
            isPrimary: accountData.isPrimary !== undefined ? accountData.isPrimary : existing.isPrimary,
            isVerified: true,
            metadata: enrichedMetadata,
            updatedAt: new Date(),
          },
        });
      }

      return tx.userAccountVault.create({
        data: {
          userId,
          accountNickname: accountData.accountNickname?.trim() || null,
          accountHolderName: accountData.accountHolderName.trim(),
          bankAccountNumber: cleanAccNum,
          ifscCode: cleanIfsc,
          bankName: accountData.bankName?.trim() || ifscDetails.bank || null,
          upiId: accountData.upiId?.trim() || null,
          accountType: accountData.accountType || 'INDIVIDUAL_SAVINGS',
          isPrimary: accountData.isPrimary || false,
          isVerified: true,
          metadata: enrichedMetadata,
        },
      });
    });

    // 4. Record ₹1 in Double-Entry Ledger
    try {
      await ledgerService.ensureSystemAccounts();

      await ledgerService.postJournalTransaction({
        scopeType: 'SYSTEM',
        userId,
        transactionType: 'FEE',
        referenceType: 'RAPID_KYC_VERIFICATION',
        referenceId: savedAccount.id,
        idempotencyKey: `kyc_ledger_${paymentId}`,
        entries: [
          {
            accountNumber: ledgerService.accounts.ASSET_GATEWAY_CLEARING,
            debitAmount: 1.0,
            creditAmount: 0.0,
            description: `₹1 KYC verification deposit collected via Razorpay (${paymentId})`,
          },
          {
            accountNumber: ledgerService.accounts.REVENUE_PLATFORM_FEE,
            debitAmount: 0.0,
            creditAmount: 1.0,
            description: `₹1 Reverse penny-drop identity verification fee for vault account #${savedAccount.id}`,
          },
        ],
        metadata: {
          accountId: savedAccount.id,
          orderId,
          paymentId,
          last4: cleanAccNum.slice(-4),
        },
      });
    } catch (ledgerErr) {
      console.warn('[AccountVaultService] Ledger journal entry warning:', ledgerErr.message);
    }

    return {
      verified: true,
      account: savedAccount,
      message: '₹1 Reverse Penny Drop KYC verified and account secured in vault.',
    };
  }

  /**
   * Saves a new bank / settlement account into the user's Account Vault.
   */
  async saveAccount(userId, accountData) {
    if (!userId) throw new AppError('User ID is required', 400);
    const {
      accountNickname,
      accountHolderName,
      bankAccountNumber,
      ifscCode,
      bankName,
      upiId,
      accountType = 'INDIVIDUAL_SAVINGS',
      isPrimary = false,
      isVerified = false,
      metadata = {},
    } = accountData;

    if (!accountHolderName || !bankAccountNumber || !ifscCode) {
      throw new AppError('Account holder name, account number, and IFSC code are required', 400);
    }

    const cleanAccNum = bankAccountNumber.replace(/\s+/g, '');
    const cleanIfsc = ifscCode.trim().toUpperCase();

    // Auto-fetch bank name if missing
    let resolvedBankName = bankName?.trim();
    if (!resolvedBankName) {
      try {
        const ifscInfo = await ifscService.lookup(cleanIfsc);
        if (ifscInfo && ifscInfo.bank) {
          resolvedBankName = ifscInfo.bank;
        }
      } catch {
        // non-fatal
      }
    }

    return prisma.$transaction(async (tx) => {
      // Check if duplicate account exists
      const existing = await tx.userAccountVault.findFirst({
        where: {
          userId,
          bankAccountNumber: cleanAccNum,
          ifscCode: cleanIfsc,
          deletedAt: null,
        },
      });

      // If marked primary, unset other primaries
      if (isPrimary || (existing && !existing.isPrimary && isPrimary)) {
        await tx.userAccountVault.updateMany({
          where: { userId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      if (existing) {
        // Update existing
        return tx.userAccountVault.update({
          where: { id: existing.id },
          data: {
            accountNickname: accountNickname?.trim() || existing.accountNickname,
            accountHolderName: accountHolderName.trim(),
            bankName: resolvedBankName || existing.bankName,
            upiId: upiId?.trim() || existing.upiId,
            accountType,
            isPrimary: isPrimary || existing.isPrimary,
            isVerified: isVerified || existing.isVerified,
            metadata: { ...(existing.metadata || {}), ...metadata },
            updatedAt: new Date(),
          },
        });
      }

      return tx.userAccountVault.create({
        data: {
          userId,
          accountNickname: accountNickname?.trim() || null,
          accountHolderName: accountHolderName.trim(),
          bankAccountNumber: cleanAccNum,
          ifscCode: cleanIfsc,
          bankName: resolvedBankName || null,
          upiId: upiId?.trim() || null,
          accountType,
          isPrimary,
          isVerified,
          metadata,
        },
      });
    });
  }

  /**
   * Soft-deletes an account owned by the user.
   */
  async deleteAccount(userId, accountId) {
    if (!userId) throw new AppError('User ID is required', 400);
    if (!accountId) throw new AppError('Account ID is required', 400);

    const result = await prisma.userAccountVault.updateMany({
      where: {
        id: accountId,
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
        isPrimary: false,
      },
    });

    if (result.count === 0) {
      throw new AppError('Account not found or unauthorized', 404);
    }

    return { success: true };
  }
}

module.exports = new AccountVaultService();
module.exports.AccountVaultService = AccountVaultService;
