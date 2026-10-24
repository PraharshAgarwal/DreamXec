/**
 * Abstract Port defining password hashing operations.
 * @abstract
 */
class PasswordHasherPort {
  async hash(password) {
    throw new Error('Method PasswordHasherPort.hash() must be implemented.');
  }

  async verify(password, hashedPassword) {
    throw new Error('Method PasswordHasherPort.verify() must be implemented.');
  }
}

module.exports = PasswordHasherPort;
