const { uploadToS3, generatePresignedUploadUrl } = require('../../../utils/uploadToS3');
const StorageProviderPort = require('../ports/storage-provider.port');

class S3StorageProviderAdapter extends StorageProviderPort {
  async uploadFile(file, folder = 'uploads') {
    if (!file) {
      throw new Error('No file provided for upload.');
    }
    const res = await uploadToS3(file, folder);
    if (!res) return null;
    return typeof res === 'string' ? { url: res } : res;
  }

  async generatePresignedUploadUrl(params) {
    return generatePresignedUploadUrl(params);
  }
}

module.exports = new S3StorageProviderAdapter();
module.exports.S3StorageProviderAdapter = S3StorageProviderAdapter;

