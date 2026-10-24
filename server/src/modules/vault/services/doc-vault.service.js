const AppError = require('../../../utils/AppError');
const PrismaVaultRepositoryAdapter = require('../adapters/prisma-vault-repository.adapter');

const defaultRepository = new PrismaVaultRepositoryAdapter();

class DocVaultService {
  constructor({ repository = defaultRepository } = {}) {
    this.repository = repository;
  }

  /**
   * Retrieves all non-deleted documents belonging strictly to the user.
   */
  async getUserDocuments(userId, { documentType, search } = {}) {
    if (!userId) throw new AppError('User ID is required', 400);
    return this.repository.findUserDocuments(userId, { documentType, search });
  }

  /**
   * Stores a new document in the user's Doc Vault.
   */
  async saveDocument(userId, docData) {
    if (!userId) throw new AppError('User ID is required', 400);
    const { fileUrl } = docData;

    if (!fileUrl) {
      throw new AppError('File URL is required to save document in Doc Vault', 400);
    }

    return this.repository.saveUserDocument(userId, docData);
  }

  /**
   * Soft-deletes a document owned by the user.
   */
  async deleteDocument(userId, documentId) {
    if (!userId) throw new AppError('User ID is required', 400);
    if (!documentId) throw new AppError('Document ID is required', 400);

    const result = await this.repository.deleteUserDocument(userId, documentId);

    if (result.count === 0) {
      throw new AppError('Document not found or unauthorized', 404);
    }

    return { success: true };
  }

  /**
   * Fetches document details by ID.
   */
  async getDocumentById(userId, documentId) {
    if (!userId) throw new AppError('User ID is required', 400);
    const doc = await this.repository.findDocumentById(documentId, userId);

    if (!doc) {
      throw new AppError('Document not found', 404);
    }

    return doc;
  }
}

module.exports = new DocVaultService();
module.exports.DocVaultService = DocVaultService;
