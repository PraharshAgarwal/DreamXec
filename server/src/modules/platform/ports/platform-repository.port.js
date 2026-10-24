/**
 * Abstract Port defining database persistence contract for Platform services.
 * @abstract
 */
class PlatformRepositoryPort {
  async findAllColleges(searchQuery) {
    throw new Error('Method PlatformRepositoryPort.findAllColleges() must be implemented.');
  }

  async subscribeNewsletter(email) {
    throw new Error('Method PlatformRepositoryPort.subscribeNewsletter() must be implemented.');
  }

  async findSitemapEntries() {
    throw new Error('Method PlatformRepositoryPort.findSitemapEntries() must be implemented.');
  }
}

module.exports = PlatformRepositoryPort;
