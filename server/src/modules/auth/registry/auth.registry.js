const googleProvider = require('../providers/google.provider');
const orcidProvider = require('../providers/orcid.provider');
const { AppError } = require('../auth.errors');

class AuthRegistry {
  constructor() {
    this.providers = new Map();
    // Register default providers
    this.register('google', googleProvider);
    this.register('orcid', orcidProvider);
  }

  /**
   * Register a new OAuth provider dynamically
   */
  register(name, provider) {
    if (!name || !provider) {
      throw new Error('Provider name and provider instance are required.');
    }
    this.providers.set(String(name).trim().toLowerCase(), provider);
  }

  /**
   * Retrieve a registered provider by name
   */
  getProvider(name) {
    const normalizedName = String(name || '').trim().toLowerCase();
    const provider = this.providers.get(normalizedName);

    if (!provider) {
      throw new AppError(
        `OAuth provider '${normalizedName || 'unknown'}' is not supported.`,
        400
      );
    }

    return provider;
  }
}

const authRegistry = new AuthRegistry();

module.exports = {
  authRegistry,
  AuthRegistry,
  getProvider: (name) => authRegistry.getProvider(name),
  registerProvider: (name, provider) => authRegistry.register(name, provider),
  googleProvider,
  orcidProvider,
};
