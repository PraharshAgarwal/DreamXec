const defaultBcryptAdapter = require('../adapters/bcrypt-password.adapter');

class PasswordService {
  constructor({ passwordHasher = defaultBcryptAdapter } = {}) {
    this.passwordHasher = passwordHasher;
  }

  async hash(password) {
    return this.passwordHasher.hash(password);
  }

  async verify(password, hashedPassword) {
    return this.passwordHasher.verify(password, hashedPassword);
  }
}

module.exports = new PasswordService();
module.exports.PasswordService = PasswordService;
