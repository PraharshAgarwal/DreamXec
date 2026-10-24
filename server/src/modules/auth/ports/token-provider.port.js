/**
 * Abstract Port defining token operations.
 * @abstract
 */
class TokenProviderPort {
  generateAccessToken(user, orgRoles) {
    throw new Error('Method TokenProviderPort.generateAccessToken() must be implemented.');
  }

  generateVerificationToken(email) {
    throw new Error('Method TokenProviderPort.generateVerificationToken() must be implemented.');
  }

  generateResetToken(email) {
    throw new Error('Method TokenProviderPort.generateResetToken() must be implemented.');
  }

  async verifyToken(token, secret) {
    throw new Error('Method TokenProviderPort.verifyToken() must be implemented.');
  }
}

module.exports = TokenProviderPort;
