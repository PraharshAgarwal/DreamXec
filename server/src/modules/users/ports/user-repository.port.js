/**
 * Abstract Port defining database persistence contract for Users.
 * @abstract
 */
class UserRepositoryPort {
  async findById(id) {
    throw new Error('Method UserRepositoryPort.findById() must be implemented.');
  }

  async findAllUsers() {
    throw new Error('Method UserRepositoryPort.findAllUsers() must be implemented.');
  }

  async updateUser(id, updateData) {
    throw new Error('Method UserRepositoryPort.updateUser() must be implemented.');
  }

  async suspendUser(id) {
    throw new Error('Method UserRepositoryPort.suspendUser() must be implemented.');
  }
}

module.exports = UserRepositoryPort;
