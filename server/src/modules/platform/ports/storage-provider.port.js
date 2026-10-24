/**
 * Abstract Port defining file upload storage contract.
 * @abstract
 */
class StorageProviderPort {
  async uploadFile(file, folder) {
    throw new Error('Method StorageProviderPort.uploadFile() must be implemented.');
  }

  async generatePresignedUploadUrl(params) {
    throw new Error('Method StorageProviderPort.generatePresignedUploadUrl() must be implemented.');
  }
}

module.exports = StorageProviderPort;

