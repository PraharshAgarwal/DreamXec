/**
 * Port (Interface) for Account Vault & Doc Vault Data Access operations.
 * Adheres to Dependency Inversion Principle (DIP) and Interface Segregation Principle (ISP).
 */
class VaultRepositoryPort {
  async findUserAccounts(userId) {
    throw new Error('Method VaultRepositoryPort.findUserAccounts() must be implemented.');
  }

  async findAccountById(id, userId) {
    throw new Error('Method VaultRepositoryPort.findAccountById() must be implemented.');
  }

  async saveUserAccount(userId, accountData) {
    throw new Error('Method VaultRepositoryPort.saveUserAccount() must be implemented.');
  }

  async deleteUserAccount(userId, accountId) {
    throw new Error('Method VaultRepositoryPort.deleteUserAccount() must be implemented.');
  }

  async findUserDocuments(userId, filters = {}) {
    throw new Error('Method VaultRepositoryPort.findUserDocuments() must be implemented.');
  }

  async findDocumentById(id, userId) {
    throw new Error('Method VaultRepositoryPort.findDocumentById() must be implemented.');
  }

  async saveUserDocument(userId, docData) {
    throw new Error('Method VaultRepositoryPort.saveUserDocument() must be implemented.');
  }

  async deleteUserDocument(userId, documentId) {
    throw new Error('Method VaultRepositoryPort.deleteUserDocument() must be implemented.');
  }
}

module.exports = VaultRepositoryPort;
