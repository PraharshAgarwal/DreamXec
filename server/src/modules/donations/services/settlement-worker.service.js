const donationRepository = require('../donation.repository');
const EVENTS = require('../../../config/events');

class SettlementWorkerService {
  constructor({
    repository = donationRepository,
    maxRetries = 3,
    retryDelays = [1000, 3000, 5000],
  } = {}) {
    this.repository = repository;
    this.maxRetries = maxRetries;
    this.retryDelays = retryDelays;
    this.jobQueue = [];
    this.isProcessing = false;
    this.activeJobs = new Map();
  }

  /**
   * Enqueue a payment settlement job to run asynchronously
   * @param {Object} jobData
   * @param {string} jobData.orderId
   * @param {string} jobData.paymentId
   * @param {Object} [jobData.eventPublisher]
   * @param {Object} [jobData.milestoneSubscriber]
   * @returns {Object} Job reference with jobId and initial status
   */
  enqueueSettlement({ orderId, paymentId, eventPublisher = null, milestoneSubscriber = null }) {
    const jobId = `job_settle_${orderId}_${Date.now()}`;
    const job = {
      jobId,
      orderId,
      paymentId,
      eventPublisher,
      milestoneSubscriber,
      attempts: 0,
      enqueuedAt: new Date(),
      status: 'QUEUED',
      error: null,
    };

    this.activeJobs.set(orderId, job);
    this.jobQueue.push(job);

    // Trigger async processing loop without blocking caller
    setImmediate(() => this.processNextJob());

    return {
      jobId,
      orderId,
      paymentId,
      status: 'QUEUED',
    };
  }

  /**
   * Worker loop to process queued jobs
   */
  async processNextJob() {
    if (this.isProcessing || this.jobQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const job = this.jobQueue.shift();

    if (!job) {
      this.isProcessing = false;
      return;
    }

    job.status = 'PROCESSING';
    this.activeJobs.set(job.orderId, job);

    try {
      await this.executeJobWithRetry(job);
    } catch (err) {
      console.error(`[SettlementWorker] Permanent failure for order ${job.orderId}:`, err);
    } finally {
      this.isProcessing = false;
      if (this.jobQueue.length > 0) {
        setImmediate(() => this.processNextJob());
      }
    }
  }

  /**
   * Executes settlement with exponential backoff retries
   */
  async executeJobWithRetry(job) {
    while (job.attempts < this.maxRetries) {
      job.attempts += 1;
      try {
        const result = await this.executeSettlement(job);
        job.status = 'SUCCEEDED';
        job.settledAt = new Date();
        job.result = result;
        this.activeJobs.set(job.orderId, job);
        return result;
      } catch (error) {
        job.error = error.message;
        console.warn(
          `[SettlementWorker] Attempt ${job.attempts}/${this.maxRetries} failed for order ${job.orderId}: ${error.message}`
        );

        if (job.attempts < this.maxRetries) {
          const delay = this.retryDelays[job.attempts - 1] || 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        } else {
          // All retries exhausted - record failure in DB
          job.status = 'FAILED';
          this.activeJobs.set(job.orderId, job);
          await this.recordSettlementFailure(job, error);
          throw error;
        }
      }
    }
  }

  /**
   * Core settlement execution unit
   */
  async executeSettlement(job) {
    const { orderId, paymentId, eventPublisher, milestoneSubscriber } = job;

    // 1. Execute repository settlement (idempotent double-entry ledger posting + campaign updates)
    const settlementData = await this.repository.processVerifiedPayment({
      orderId,
      paymentId,
    });

    // 2. Publish post-settlement notification & milestone events if publishers available
    if (settlementData && eventPublisher) {
      try {
        const { donation, campaign } = settlementData;
        const amount = Number(donation?.amount || 0);

        if (amount >= 10000) {
          await eventPublisher.publishEvent(EVENTS.HIGH_VALUE_DONATION, {
            amount,
            currency: 'INR',
            transactionId: paymentId,
            donorEmail: donation?.donor?.email || 'N/A',
            campaignTitle: campaign?.title || 'Research Campaign',
          });
        }

        const operatingEntity = settlementData.intent?.metadata?.operatingEntity || settlementData.attempt?.rawResponse?.operatingEntity || 'DAF';
        const merchantDomain = settlementData.intent?.metadata?.merchantDomain || settlementData.attempt?.rawResponse?.merchantDomain || 'dreamxec.org';

        if (donation?.donor?.email) {
          await eventPublisher.publishEvent(EVENTS.DONATION_SUCCESS, {
            email: donation.donor.email,
            amount,
            currency: 'INR',
            transactionId: paymentId,
            campaignTitle: campaign?.title || 'Research Campaign',
            donorName: donation.donorDisplayName || 'Valued Donor',
            operatingEntity,
            merchantDomain,
          });
        }

        const campaignOwner = campaign?.student || campaign?.beneficiary || campaign?.user;
        if (campaignOwner?.email) {
          await eventPublisher.publishEvent(EVENTS.DONATION_RECEIVED, {
            email: campaignOwner.email,
            amount,
            currency: 'INR',
            donorName: donation?.isAnonymous ? 'Anonymous' : (donation?.donorDisplayName || 'A Supporter'),
            campaignTitle: campaign.title,
          });
        }

        if (milestoneSubscriber && campaign) {
          await milestoneSubscriber.evaluateMilestones({
            project: {
              ...campaign,
              goalAmount: Number(campaign.targetAmount || campaign.goalAmount || 0),
              amountRaised: Number(campaign.currentRaisedAmount || campaign.amountRaised || 0),
              user: campaignOwner,
            },
            amount,
            currency: 'INR',
          });
        }
      } catch (pubErr) {
        console.warn(`[SettlementWorker] Event emission notice:`, pubErr.message);
      }
    }

    return settlementData;
  }

  /**
   * Persists failure state in PaymentIntent metadata and logs diagnostic trace
   */
  async recordSettlementFailure(job, error) {
    try {
      const prisma = require('../../../config/prisma');
      const attempt = await prisma.paymentAttempt.findFirst({
        where: { gatewayTransactionId: job.orderId },
      });

      if (attempt?.paymentIntentId) {
        await prisma.paymentIntent.update({
          where: { id: attempt.paymentIntentId },
          data: {
            metadata: {
              settlementFailed: true,
              settlementError: error.message,
              failedAt: new Date().toISOString(),
              attempts: job.attempts,
            },
          },
        });
      }
    } catch (dbErr) {
      console.error(`[SettlementWorker] Failed to write error audit to database:`, dbErr.message);
    }
  }

  /**
   * Check status of a job from active memory or database
   */
  async getSettlementStatus(orderId) {
    if (this.activeJobs.has(orderId)) {
      const job = this.activeJobs.get(orderId);
      return {
        orderId: job.orderId,
        paymentId: job.paymentId,
        status: job.status,
        isSettled: job.status === 'SUCCEEDED',
        attempts: job.attempts,
        error: job.error,
        settledAt: job.settledAt || null,
        campaign: job.result?.campaign || null,
      };
    }

    // Fallback query to repository
    return this.repository.findDonationStatusByOrderId(orderId);
  }
}

module.exports = new SettlementWorkerService();
module.exports.SettlementWorkerService = SettlementWorkerService;
