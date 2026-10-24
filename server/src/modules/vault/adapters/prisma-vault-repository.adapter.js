const defaultPrisma = require('../../../config/prisma');
const VaultRepositoryPort = require('../ports/vault-repository.port');

/**
 * Concrete Prisma ORM Adapter implementing VaultRepositoryPort.
 * Adheres to Liskov Substitution Principle (LSP) and Dependency Inversion Principle (DIP).
 */
class PrismaVaultRepositoryAdapter extends VaultRepositoryPort {
  constructor(prismaClient = defaultPrisma) {
    super();
    this.prisma = prismaClient;
  }

  /**
   * Account Vault: Retrieves all saved accounts for user
   */
  async findUserAccounts(userId) {
    return this.prisma.userAccountVault.findMany({
      where: {
        userId,
        deletedAt: null,
      },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /**
   * Account Vault: Finds account by ID and user ID
   */
  async findAccountById(id, userId) {
    return this.prisma.userAccountVault.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });
  }

  /**
   * Account Vault: Upserts user bank / payout account transactionally
   */
  async saveUserAccount(userId, accountData) {
    const {
      accountNickname,
      accountHolderName,
      bankAccountNumber,
      ifscCode,
      bankName,
      upiId,
      accountType = 'INDIVIDUAL_SAVINGS',
      isPrimary = false,
      metadata = {},
    } = accountData;

    const cleanAccNum = bankAccountNumber.replace(/\s+/g, '');
    const cleanIfsc = ifscCode.trim().toUpperCase();

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.userAccountVault.findFirst({
        where: {
          userId,
          bankAccountNumber: cleanAccNum,
          ifscCode: cleanIfsc,
          deletedAt: null,
        },
      });

      if (isPrimary || (existing && !existing.isPrimary && isPrimary)) {
        await tx.userAccountVault.updateMany({
          where: { userId, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      if (existing) {
        return tx.userAccountVault.update({
          where: { id: existing.id },
          data: {
            accountNickname: accountNickname?.trim() || existing.accountNickname,
            accountHolderName: accountHolderName.trim(),
            bankName: bankName?.trim() || existing.bankName,
            upiId: upiId?.trim() || existing.upiId,
            accountType,
            isPrimary: isPrimary ?? existing.isPrimary,
            metadata: {
              ...(existing.metadata || {}),
              ...metadata,
              lastUpdatedAt: new Date().toISOString(),
            },
          },
        });
      }

      return tx.userAccountVault.create({
        data: {
          userId,
          accountNickname: accountNickname?.trim() || `${bankName || 'Bank'} Account`,
          accountHolderName: accountHolderName.trim(),
          bankAccountNumber: cleanAccNum,
          ifscCode: cleanIfsc,
          bankName: bankName?.trim() || 'Bank',
          upiId: upiId?.trim() || null,
          accountType,
          isPrimary,
          metadata: {
            ...metadata,
            source: 'USER_VAULT',
          },
        },
      });
    });
  }

  /**
   * Account Vault: Soft deletes account
   */
  async deleteUserAccount(userId, accountId) {
    return this.prisma.userAccountVault.updateMany({
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
  }

  /**
   * Doc Vault: Retrieves user documents with filtering
   */
  async findUserDocuments(userId, { documentType, search } = {}) {
    const where = {
      userId,
      deletedAt: null,
      ...(documentType ? { documentType } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { fileName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const docs = await this.prisma.userDocVault.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return docs.map((d) => ({
      ...d,
      fileSizeBytes: d.fileSizeBytes ? Number(d.fileSizeBytes) : 0,
    }));
  }

  /**
   * Doc Vault: Finds document by ID and user ID
   */
  async findDocumentById(id, userId) {
    const doc = await this.prisma.userDocVault.findFirst({
      where: {
        id,
        userId,
        deletedAt: null,
      },
    });

    if (!doc) return null;
    return {
      ...doc,
      fileSizeBytes: doc.fileSizeBytes ? Number(doc.fileSizeBytes) : 0,
    };
  }

  /**
   * Doc Vault: Stores new document
   */
  async saveUserDocument(userId, docData) {
    const { title, fileName, fileUrl, documentType = 'OTHER', fileSizeBytes = 0, mimeType = null, metadata = {} } = docData;

    const docTitle = (title || fileName || 'Untitled Document').trim();
    const docName = (fileName || title || 'document.pdf').trim();

    const created = await this.prisma.userDocVault.create({
      data: {
        userId,
        documentType,
        title: docTitle,
        fileName: docName,
        fileUrl,
        fileSizeBytes: BigInt(fileSizeBytes || 0),
        mimeType,
        metadata,
      },
    });

    return {
      ...created,
      fileSizeBytes: Number(created.fileSizeBytes || 0),
    };
  }

  /**
   * Doc Vault: Soft-deletes user document
   */
  async deleteUserDocument(userId, documentId) {
    return this.prisma.userDocVault.updateMany({
      where: {
        id: documentId,
        userId,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

module.exports = PrismaVaultRepositoryAdapter;
