/**
 * Centralized Dependency Injection Container & Composition Root.
 * Enforces SOLID (Dependency Inversion Principle) by assembling ports,
 * adapters, and domain services in one single, declarative registry.
 */
const prisma = require('../config/prisma');
const redisClient = require('../config/redis');

// Adapters
const prismaCampaignRepositoryAdapter = require('../modules/campaigns/adapters/prisma-campaign-repository.adapter');
const prismaMilestoneRepositoryAdapter = require('../modules/campaigns/adapters/prisma-milestone-repository.adapter');
const redisCampaignCacheAdapter = require('../modules/campaigns/adapters/redis-campaign-cache.adapter');
const PrismaDonationRepositoryAdapter = require('../modules/donations/adapters/prisma-donation-repository.adapter');
const RazorpayPaymentAdapter = require('../modules/donations/adapters/razorpay-payment.adapter');
const RazorpayPayoutAdapter = require('../modules/donations/adapters/razorpay-payout.adapter');
const PrismaVaultRepositoryAdapter = require('../modules/vault/adapters/prisma-vault-repository.adapter');
const prismaUserRepositoryAdapter = require('../modules/users/adapters/prisma-user-repository.adapter');
const prismaGovernanceRepositoryAdapter = require('../modules/governance/adapters/prisma-governance-repository.adapter');
const sendgridEmailAdapter = require('../modules/email/adapters/sendgrid-email.adapter');

// Services
const { CampaignService } = require('../modules/campaigns/services/campaign.service');
const { MilestoneService } = require('../modules/campaigns/services/milestone.service');
const { DonationService } = require('../modules/donations/donation.service');
const { AccountVaultService } = require('../modules/vault/services/account-vault.service');
const { DocVaultService } = require('../modules/vault/services/doc-vault.service');
const { WithdrawalService } = require('../modules/donations/services/withdrawal.service');

class ServiceContainer {
  constructor() {
    this._instances = new Map();
    this._registerCore();
  }

  _registerCore() {
    // Infrastructure
    this.register('prisma', () => prisma);
    this.register('redisClient', () => redisClient);

    // Repository Adapters
    this.register('campaignRepository', () => prismaCampaignRepositoryAdapter);
    this.register('milestoneRepository', () => prismaMilestoneRepositoryAdapter);
    this.register('campaignCache', () => redisCampaignCacheAdapter);
    this.register('donationRepository', () => new PrismaDonationRepositoryAdapter({ prismaClient: this.get('prisma') }));
    this.register('vaultRepository', () => new PrismaVaultRepositoryAdapter(this.get('prisma')));
    this.register('userRepository', () => prismaUserRepositoryAdapter);
    this.register('governanceRepository', () => prismaGovernanceRepositoryAdapter);

    // External Integration Adapters
    this.register('emailProvider', () => sendgridEmailAdapter);
    this.register('paymentGateway', () => new RazorpayPaymentAdapter());
    this.register('payoutAdapter', () => new RazorpayPayoutAdapter());

    // Domain Services
    this.register('campaignService', () => new CampaignService({
      repository: this.get('campaignRepository'),
      milestoneRepository: this.get('milestoneRepository'),
      cache: this.get('campaignCache'),
    }));

    this.register('milestoneService', () => new MilestoneService({
      milestoneRepository: this.get('milestoneRepository'),
      campaignRepository: this.get('campaignRepository'),
    }));

    this.register('donationService', () => new DonationService({
      repository: this.get('donationRepository'),
      paymentGateway: this.get('paymentGateway'),
    }));

    this.register('accountVaultService', () => new AccountVaultService({
      repository: this.get('vaultRepository'),
    }));

    this.register('docVaultService', () => new DocVaultService({
      repository: this.get('vaultRepository'),
    }));

    this.register('withdrawalService', () => new WithdrawalService(this.get('payoutAdapter')));
  }

  /**
   * Register a dependency factory function.
   * @param {string} key
   * @param {Function} factory
   * @param {boolean} isSingleton
   */
  register(key, factory, isSingleton = true) {
    this._instances.set(key, { factory, isSingleton, instance: null });
  }

  /**
   * Resolve a dependency from the container.
   * @param {string} key
   * @returns {*}
   */
  get(key) {
    const entry = this._instances.get(key);
    if (!entry) {
      throw new Error(`[ServiceContainer] Service '${key}' is not registered.`);
    }

    if (entry.isSingleton) {
      if (!entry.instance) {
        entry.instance = entry.factory();
      }
      return entry.instance;
    }

    return entry.factory();
  }

  /**
   * Override a dependency (useful for tests or mock injection)
   * @param {string} key
   * @param {*} value
   */
  override(key, value) {
    this._instances.set(key, {
      factory: () => value,
      isSingleton: true,
      instance: value,
    });
  }

  /**
   * Clear all instantiated singletons (useful between test runs)
   */
  reset() {
    this._instances.forEach((entry) => {
      entry.instance = null;
    });
  }
}

const container = new ServiceContainer();
module.exports = container;
module.exports.ServiceContainer = ServiceContainer;
