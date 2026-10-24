/**
 * Abstract Port defining file storage contract for Users.
 * @abstract
 */
class UserStoragePort {
  async uploadProfilePicture(userId, file) {
    throw new Error('Method UserStoragePort.uploadProfilePicture() must be implemented.');
  }
}

module.exports = UserStoragePort;
