const PrismaDonationRepositoryAdapter = require('./adapters/prisma-donation-repository.adapter');

// Export singleton instance of the adapter to maintain backward compatibility
module.exports = new PrismaDonationRepositoryAdapter();
