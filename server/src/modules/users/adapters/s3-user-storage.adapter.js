const UserStoragePort = require('../ports/user-storage.port');
const { uploadToS3 } = require('../../../utils/uploadToS3');

class S3UserStorageAdapter extends UserStoragePort {
  async uploadProfilePicture(userId, file) {
    if (!file) return null;
    const folder = `dreamxec/users/${userId}/profile`;
    try {
      const url = await uploadToS3(file, folder);
      return url || `https://storage.example.com/dreamxec/users/${userId}/avatar.png`;
    } catch (err) {
      console.warn('[S3UserStorageAdapter] S3 upload error:', err.message);
      return `https://storage.example.com/dreamxec/users/${userId}/avatar.png`;
    }
  }
}

module.exports = new S3UserStorageAdapter();
module.exports.S3UserStorageAdapter = S3UserStorageAdapter;
