const defaultPrisma = require('../../../config/prisma');
const defaultLedgerService = require('../../../services/ledger.service');
const DonationRepositoryPort = require('../ports/donation-repository.port');

/**
 * Concrete Prisma ORM Adapter implementing DonationRepositoryPort.
 * Adheres to Liskov Substitution Principle (LSP) and Dependency Inversion Principle (DIP).
 */
class PrismaDonationRepositoryAdapter extends DonationRepositoryPort {
  constructor({ prismaClient = defaultPrisma, ledgerService = defaultLedgerService } = {}) {
    super();
    this.prisma = prismaClient;
    this.ledgerService = ledgerService;
  }

  /**
   * Create a donation record
   */
  async createDonation(data) {
    const rawTarget = data.campaignId || data.projectId || data.userProjectId || '';
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawTarget);

    // 1. Resolve Target Campaign
    let campaign = null;
    if (rawTarget) {
      campaign = await this.prisma.campaign.findFirst({
        where: isUuid
          ? { OR: [{ id: rawTarget }, { slug: rawTarget }] }
          : { slug: rawTarget },
        include: { tenant: true, department: true },
      });
    }

    // 2. Resolve Tenant and Recipient Organizations
    let tenantId = campaign?.tenantId;
    let recipientOrgId = campaign?.organizationId || tenantId;

    if (!tenantId || !recipientOrgId) {
      const defaultOrg = await this.prisma.organization.findFirst({
        where: { lifecycleStatus: 'ACTIVE' },
      });
      tenantId = tenantId || defaultOrg?.id;
      recipientOrgId = recipientOrgId || defaultOrg?.id;
    }

    if (!tenantId || !recipientOrgId) {
      throw new Error('No active organization found to route donation');
    }

    // 3. Create Donation Record
    return this.prisma.donation.create({
      data: {
        tenantId,
        recipientOrgId,
        campaignId: campaign?.id || null,
        donorId: data.userId || data.donorId || null,
        amount: data.amount,
        currency: 'INR',
        isAnonymous: !!data.anonymous,
        donorDisplayName: data.name || (data.guestEmail ? data.guestEmail.split('@')[0] : 'Supporter'),
        donorMessage: data.message || null,
      },
    });
  }

  /**
   * Update donation by ID
   */
  async updateDonation(id, data) {
    return this.prisma.donation.update({
      where: { id },
      data: {
        donorMessage: data.message || undefined,
        isAnonymous: data.anonymous !== undefined ? data.anonymous : undefined,
      },
    });
  }

  /**
   * Find donation by ID
   */
  async findDonationById(id) {
    return this.prisma.donation.findUnique({
      where: { id },
      include: {
        donor: true,
        campaign: true,
        paymentIntents: {
          include: { attempts: true },
        },
      },
    });
  }

  /**
   * Find donation by payment provider order ID
   */
  async findDonationByProviderOrderId(orderId) {
    const attempt = await this.prisma.paymentAttempt.findFirst({
      where: { gatewayTransactionId: orderId },
      include: {
        intent: {
          include: {
            donation: {
              include: { donor: true, campaign: true },
            },
          },
        },
      },
    });

    return attempt?.intent?.donation || null;
  }

  /**
   * Find user by email
   */
  async findUserByEmail(email) {
    if (!email) return null;
    return this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
  }

  /**
   * Create guest donor user account
   */
  async createDonorUser({ email, name }) {
    return this.prisma.user.create({
      data: {
        email: email.trim().toLowerCase(),
        fullName: name || 'Supporter',
        role: 'USER',
        accountStatus: 'ACTIVE',
      },
    });
  }

  /**
   * Fast-path: records that payment attempt was cryptographically verified and is in PROCESSING state (<15ms)
   */
  async fastRecordAttemptVerification({ orderId, paymentId, signature }) {
    try {
      const attempt = await this.prisma.paymentAttempt.findFirst({
        where: { gatewayTransactionId: orderId },
        include: {
          intent: {
            include: {
              donation: {
                include: { campaign: true, donor: true },
              },
            },
          },
        },
      });

      if (attempt) {
        await this.prisma.paymentAttempt.update({
          where: { id: attempt.id },
          data: {
            gatewayPaymentId: paymentId || attempt.gatewayPaymentId,
            gatewaySignature: signature || attempt.gatewaySignature,
            status: 'PROCESSING',
          },
        });

        if (attempt.intent && attempt.intent.status === 'PENDING') {
          await this.prisma.paymentIntent.update({
            where: { id: attempt.intent.id },
            data: { status: 'PROCESSING' },
          });
        }
      }

      return attempt;
    } catch (err) {
      console.warn('[PrismaDonationRepositoryAdapter.fastRecordAttemptVerification] Warning:', err.message);
      return null;
    }
  }

  /**
   * Fast-path: records that a payment attempt or verification has failed
   */
  async markPaymentFailed({ orderId, paymentId, errorMessage, rawResponse } = {}) {
    try {
      if (!orderId) return null;
      const attempt = await this.prisma.paymentAttempt.findFirst({
        where: { gatewayTransactionId: orderId },
        include: { intent: { include: { donation: true } } },
      });

      if (!attempt) return null;

      await this.prisma.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'FAILED',
          gatewayPaymentId: paymentId || attempt.gatewayPaymentId,
          errorMessage: errorMessage || 'Payment verification failed',
          rawResponse: {
            ...(typeof attempt.rawResponse === 'object' && attempt.rawResponse ? attempt.rawResponse : {}),
            ...(rawResponse || {}),
            failedAt: new Date().toISOString(),
          },
        },
      });

      if (attempt.intent) {
        await this.prisma.paymentIntent.update({
          where: { id: attempt.intent.id },
          data: {
            status: 'FAILED',
            metadata: {
              ...(typeof attempt.intent.metadata === 'object' && attempt.intent.metadata ? attempt.intent.metadata : {}),
              settlementError: errorMessage || 'Payment verification failed',
            },
          },
        });

      }

      return attempt;
    } catch (err) {
      console.error('[PrismaDonationRepositoryAdapter.markPaymentFailed] Error marking payment as failed:', err);
      return null;
    }
  }

  /**
   * Sweeps and automatically marks stale/timed-out payment transactions as FAILED.
   * If a transaction is created but never confirmed by Razorpay within the timeout threshold
   * (30 minutes), Razorpay will no longer send webhook events or allow capture.
   * This ensures abandoned or timed-out orders without incoming webhooks are definitively marked as FAILED in the DB.
   */
  async autoExpireStaleTransactions(timeoutMinutes = 30) {
    try {
      const thresholdDate = new Date(Date.now() - timeoutMinutes * 60 * 1000);

      const staleAttempts = await this.prisma.paymentAttempt.findMany({
        where: {
          status: { in: ['PENDING', 'PROCESSING'] },
          createdAt: { lt: thresholdDate },
        },
        include: {
          intent: true,
        },
        take: 100,
      });

      if (!staleAttempts || staleAttempts.length === 0) return 0;

      let expiredCount = 0;
      for (const attempt of staleAttempts) {
        await this.prisma.paymentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'FAILED',
            errorMessage: `Transaction timed out: exceeded ${timeoutMinutes} minutes without gateway payment confirmation`,
            rawResponse: {
              ...(typeof attempt.rawResponse === 'object' && attempt.rawResponse ? attempt.rawResponse : {}),
              autoExpired: true,
              timeoutMinutes,
              expiredAt: new Date().toISOString(),
            },
          },
        });

        if (attempt.intent && attempt.intent.status !== 'SUCCEEDED') {
          await this.prisma.paymentIntent.update({
            where: { id: attempt.intent.id },
            data: {
              status: 'FAILED',
              metadata: {
                ...(typeof attempt.intent.metadata === 'object' && attempt.intent.metadata ? attempt.intent.metadata : {}),
                settlementError: `Transaction timed out: exceeded ${timeoutMinutes} minutes without gateway payment confirmation`,
              },
            },
          });
        }
        expiredCount++;
      }

      if (expiredCount > 0) {
        console.log(`[PrismaDonationRepositoryAdapter] ⏱️ Automatically expired ${expiredCount} stale payment transaction(s) (> ${timeoutMinutes}m old).`);
      }
      return expiredCount;
    } catch (err) {
      console.error('[PrismaDonationRepositoryAdapter.autoExpireStaleTransactions] Error expiring stale transactions:', err);
      return 0;
    }
  }

  /**
   * Atomically process payment verification update & multi-tier ledger settlement
   */
  async processVerifiedPayment({ orderId, paymentId, amount }) {
    const attempt = await this.prisma.paymentAttempt.findFirst({
      where: { gatewayTransactionId: orderId },
      include: {
        intent: {
          include: {
            donation: {
              include: {
                campaign: {
                  include: {
                    student: true,
                    beneficiary: true,
                  },
                },
                donor: true,
              },
            },
          },
        },
      },
    });

    if (!attempt || !attempt.intent?.donation) {
      throw new Error(`Payment order not found in database: ${orderId}`);
    }

    const { intent } = attempt;
    const { donation } = intent;
    const campaign = donation.campaign;

    // 0. Verify Payload Consistency: Check that paymentId and amount match across client verification and webhook
    const expectedAmount = Number(intent.totalAmount || donation.amount);
    const hasAmountMismatch =
      amount !== undefined &&
      amount !== null &&
      !isNaN(Number(amount)) &&
      Math.abs(Number(amount) - expectedAmount) > 0.01;
    const hasPaymentIdMismatch =
      Boolean(attempt.gatewayPaymentId) &&
      Boolean(paymentId) &&
      attempt.gatewayPaymentId !== paymentId;

    if (hasAmountMismatch || hasPaymentIdMismatch) {
      const mismatchDetails = {
        orderId,
        recordedPaymentId: attempt.gatewayPaymentId || null,
        incomingPaymentId: paymentId || null,
        expectedAmount,
        incomingAmount: amount !== undefined && amount !== null ? Number(amount) : null,
        mismatchType:
          hasPaymentIdMismatch && hasAmountMismatch
            ? 'PAYMENT_ID_AND_AMOUNT'
            : hasPaymentIdMismatch
            ? 'PAYMENT_ID'
            : 'AMOUNT',
        detectedAt: new Date().toISOString(),
      };

      console.error(
        '[PrismaDonationRepositoryAdapter] 🚨 CRITICAL PAYMENT MISMATCH DETECTED:',
        mismatchDetails
      );

      // Flag the payment attempt in database for admin quarantine AND record FAILED status
      await this.prisma.paymentAttempt.update({
        where: { id: attempt.id },
        data: {
          status: 'FAILED',
          errorMessage: `FLAGGED FOR ADMIN REVIEW: Mismatch detected in ${mismatchDetails.mismatchType}`,
          rawResponse: {
            ...(typeof attempt.rawResponse === 'object' && attempt.rawResponse ? attempt.rawResponse : {}),
            flaggedForAdminReview: true,
            mismatchDetails,
            failedAt: new Date().toISOString(),
          },
        },
      });

      if (intent?.id) {
        await this.prisma.paymentIntent.update({
          where: { id: intent.id },
          data: {
            status: 'FAILED',
            metadata: {
              ...(typeof intent.metadata === 'object' && intent.metadata ? intent.metadata : {}),
              settlementError: `Mismatch detected in ${mismatchDetails.mismatchType}`,
            },
          },
        });
      }

      // Record immutable compliance audit event
      try {
        await this.prisma.auditEvent.create({
          data: {
            tenantId: donation.tenantId || campaign?.tenantId || attempt.id,
            action: 'PAYMENT_MISMATCH_DETECTED',
            entityType: 'PAYMENT_ATTEMPT',
            entityId: attempt.id,
            newValue: mismatchDetails,
          },
        });
      } catch (auditErr) {
        console.warn(
          '[PrismaDonationRepositoryAdapter] Audit event logging notice:',
          auditErr.message
        );
      }

      throw new Error(
        `Security verification mismatch detected for order ${orderId}. Transaction has been quarantined for administrative review.`
      );
    }

    // 1. Idempotency check: if intent is already SUCCEEDED, return cleanly with fresh campaign data
    if (intent.status === 'SUCCEEDED') {
      const fullCampaign = await this.prisma.campaign.findUnique({
        where: { id: donation.campaignId || campaign?.id },
        include: {
          student: true,
          beneficiary: true,
          tenant: true,
          department: true,
          escrowAccount: true,
          milestones: { orderBy: { sequenceOrder: 'asc' } },
          members: { include: { user: true } },
          endorsements: { include: { endorser: true } },
          comments: { include: { user: true } },
        },
      });
      return {
        donation,
        campaign: fullCampaign || campaign,
        alreadySettled: true,
        verifiedMatched: true,
      };
    }

    let settledInThisTx = false;

    await this.prisma.$transaction(
      async (tx) => {
        // 1. Atomic Compare-And-Swap on PaymentIntent: prevents concurrent double settlement
        const updatedIntent = await tx.paymentIntent.updateMany({
          where: {
            id: intent.id,
            status: { not: 'SUCCEEDED' },
          },
          data: { status: 'SUCCEEDED' },
        });

        if (updatedIntent.count === 0) {
          return;
        }

        settledInThisTx = true;

        // 2. Mark attempt successful and ensure gatewayPaymentId is recorded
        await tx.paymentAttempt.update({
          where: { id: attempt.id },
          data: {
            status: 'SUCCEEDED',
            gatewayPaymentId: paymentId || attempt.gatewayPaymentId,
            rawResponse: {
              ...(typeof attempt.rawResponse === 'object' && attempt.rawResponse ? attempt.rawResponse : {}),
              settledAt: new Date().toISOString(),
              settlementMatchVerified: true,
            },
          },
        });

        // 3. Increment Campaign Raised Amount and accurately compute Unique Backers without full-table scan
        if (donation.campaignId) {
          let isNewBacker = true;
          if (donation.donorId) {
            const priorDonation = await tx.donation.findFirst({
              where: {
                campaignId: donation.campaignId,
                donorId: donation.donorId,
                id: { not: donation.id },
                paymentIntents: {
                  some: { status: 'SUCCEEDED' },
                },
              },
              select: { id: true },
            });
            if (priorDonation) {
              isNewBacker = false;
            }
          }

          await tx.campaign.update({
            where: { id: donation.campaignId },
            data: {
              currentRaisedAmount: { increment: donation.amount },
              ...(isNewBacker ? { donorCount: { increment: 1 } } : {}),
            },
          });
        }

        // 4. Post Atomic Double-Entry Ledger Journal
        const gross = Number(donation.amount);
        const gatewayFee = Math.round(gross * 0.02 * 100) / 100;
        await this.ledgerService.postDonationSettlement(
          {
            donationId: donation.id,
            grossAmount: gross,
            gatewayFee,
            platformFeeRate: 0.03,
            donorId: donation.donorId,
            campaignId: donation.campaignId,
            tenantId: donation.tenantId,
            idempotencyKey: intent.idempotencyKey || `idemp_settle_${donation.id}`,
            metadata: {
              orderId,
              paymentId,
              paymentIntentId: intent.id,
            },
          },
          tx
        );
      },
      {
        maxWait: 15000,
        timeout: 30000,
      }
    );

    if (!settledInThisTx) {
      const fullCampaign = await this.prisma.campaign.findUnique({
        where: { id: donation.campaignId || campaign?.id },
        include: {
          student: true,
          beneficiary: true,
          tenant: true,
          department: true,
          escrowAccount: true,
          milestones: { orderBy: { sequenceOrder: 'asc' } },
          members: { include: { user: true } },
          endorsements: { include: { endorser: true } },
          comments: { include: { user: true } },
        },
      });
      return {
        donation,
        campaign: fullCampaign || campaign,
        alreadySettled: true,
        verifiedMatched: true,
      };
    }

    // Invalidate Redis/L1 campaign caches so UI gets fresh raised amount & donorCount immediately
    let freshCampaign = campaign;
    const targetCampaignId = donation.campaignId || campaign?.id;
    if (targetCampaignId) {
      try {
        const redisCampaignCache = require('../../campaigns/adapters/redis-campaign-cache.adapter');
        if (campaign?.id) await redisCampaignCache.invalidateCampaign(campaign.id, campaign?.tenantId);
        if (campaign?.slug) await redisCampaignCache.invalidateCampaign(campaign.slug, campaign?.tenantId);
        if (donation.campaignId && donation.campaignId !== campaign?.id) {
          await redisCampaignCache.invalidateCampaign(donation.campaignId, donation.tenantId);
        }

        const fullCampaign = await this.prisma.campaign.findUnique({
          where: { id: targetCampaignId },
          include: {
            student: true,
            beneficiary: true,
            tenant: true,
            department: true,
            escrowAccount: true,
            milestones: { orderBy: { sequenceOrder: 'asc' } },
            members: { include: { user: true } },
            endorsements: { include: { endorser: true } },
            comments: { include: { user: true } },
          },
        });
        if (fullCampaign) freshCampaign = fullCampaign;
      } catch (cacheErr) {
        console.warn('[PrismaDonationRepositoryAdapter] Cache invalidation notice:', cacheErr.message);
      }
    }

    return { donation, campaign: freshCampaign, alreadySettled: false, verifiedMatched: true };
  }

  /**
   * Atomically process webhook payment capture transaction
   */
  async processWebhookPaymentCaptured({ orderId, paymentId, amount, projectId }) {
    const result = await this.processVerifiedPayment({ orderId, paymentId, amount });
    if (!result || result.status === 'completed') {
      return {
        donationsCount: 1,
        project: { id: projectId || 'proj_unknown', title: 'Research Campaign' },
        donationRecord: { id: orderId },
        alreadySettled: false,
      };
    }
    const { donation, campaign, alreadySettled } = result;
    return {
      donationsCount: alreadySettled ? 0 : 1,
      project: campaign,
      donationRecord: donation,
      alreadySettled: Boolean(alreadySettled),
    };
  }

  /**
   * Query status of a donation order for frontend and admin polling
   */
  async findDonationStatusByOrderId(orderId) {
    const attempt = await this.prisma.paymentAttempt.findFirst({
      where: { gatewayTransactionId: orderId },
      include: {
        intent: {
          include: {
            donation: {
              include: { campaign: true },
            },
          },
        },
      },
    });

    if (!attempt || !attempt.intent) {
      return {
        found: false,
        orderId,
        status: 'UNKNOWN',
        message: 'Order not found',
      };
    }

    const { intent } = attempt;
    const { donation } = intent || {};

    let campaignDto = null;
    if (donation?.campaign) {
      try {
        const CampaignMapper = require('../../campaigns/campaign.mapper');
        campaignDto = CampaignMapper.toCampaignDTO(donation.campaign);
      } catch {
        campaignDto = donation.campaign;
      }
    }

    // Automatic timeout detection: if Razorpay has not confirmed and elapsed time > timeout window (30 minutes)
    const timeoutMinutes = parseInt(process.env.PAYMENT_TIMEOUT_MINUTES || '30', 10);
    const orderCreatedAt = intent.createdAt || attempt.createdAt;
    const elapsedMinutes = (Date.now() - new Date(orderCreatedAt).getTime()) / (1000 * 60);

    let isTimedOut = false;
    if (
      (intent.status === 'PENDING' || intent.status === 'PROCESSING') &&
      attempt.status !== 'SUCCEEDED' &&
      elapsedMinutes >= timeoutMinutes
    ) {
      isTimedOut = true;
      await this.markPaymentFailed({
        orderId,
        paymentId: attempt.gatewayPaymentId,
        errorMessage: `Transaction timed out: exceeded ${timeoutMinutes} minutes without gateway payment confirmation`,
        rawResponse: {
          timedOut: true,
          timeoutMinutes,
          elapsedMinutes: Math.round(elapsedMinutes),
          failedAt: new Date().toISOString(),
        },
      });
      intent.status = 'FAILED';
      attempt.status = 'FAILED';
    }

    const isFailed =
      isTimedOut ||
      attempt.status === 'FAILED' ||
      intent.status === 'FAILED';

    const isSettled =
      intent.status === 'SUCCEEDED' && attempt.status === 'SUCCEEDED';

    const effectiveStatus = isSettled
      ? 'SUCCEEDED'
      : isFailed
      ? 'FAILED'
      : intent.status || attempt.status || 'PROCESSING';

    return {
      found: true,
      orderId,
      paymentId: attempt.gatewayPaymentId || null,
      status: effectiveStatus,
      isSettled,
      waitingForWebhook: !isSettled && !isFailed,
      timeoutMinutes,
      elapsedMinutes: Math.round(elapsedMinutes),
      amount: donation ? Number(donation.amount) : Number(intent.totalAmount),
      currency: intent.currency || 'INR',
      campaignTitle: donation?.campaign?.title || null,
      campaignId: donation?.campaignId || null,
      campaign: campaignDto,
      createdAt: intent.createdAt,
      error: intent.metadata?.settlementError || attempt.errorMessage || null,
    };
  }

  /**
   * Get user donations list, optionally scoped to active organization profile
   */
  async findUserDonations(userId, orgId = null, { page = 1, limit = 50 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * take;

    const where = {
      donorId: userId,
      paymentIntents: {
        none: { status: { in: ['PENDING', 'PROCESSING'] } },
      },
    };
    if (orgId) {
      where.OR = [
        { tenantId: orgId },
        { recipientOrgId: orgId },
        { campaign: { tenantId: orgId } },
      ];
    }
    return this.prisma.donation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        campaign: {
          select: {
            id: true,
            slug: true,
            title: true,
            coverImageUrl: true,
            category: true,
            stage: true,
            status: true,
            targetAmount: true,
            currentRaisedAmount: true,
            tenant: {
              select: { id: true, name: true, slug: true },
            },
            milestones: {
              orderBy: { sequenceOrder: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                targetAmount: true,
                status: true,
                sequenceOrder: true,
              },
            },
          },
        },
        paymentIntents: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            attempts: {
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });
  }

  /**
   * Get total donation analytics for user (only settled & completed payments)
   */
  async getDonationAnalytics(userId, orgId = null) {
    const where = {
      donorId: userId,
      paymentIntents: {
        none: { status: { in: ['PENDING', 'PROCESSING', 'FAILED', 'CANCELLED'] } },
      },
    };
    if (orgId) {
      where.OR = [
        { tenantId: orgId },
        { recipientOrgId: orgId },
        { campaign: { tenantId: orgId } },
      ];
    }

    const donations = await this.prisma.donation.findMany({
      where,
      include: {
        campaign: {
          select: { id: true, category: true },
        },
      },
    });

    const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount), 0);
    const uniqueCampaigns = new Set(donations.map((d) => d.campaignId).filter(Boolean)).size;
    const categoriesSupported = new Set(donations.map((d) => d.campaign?.category).filter(Boolean)).size;

    return {
      totalAmount,
      totalDonated: totalAmount,
      donationsCount: donations.length,
      projectsSupported: uniqueCampaigns,
      campaignsBacked: uniqueCampaigns,
      categoriesSupported,
    };
  }

  async findUserDonationSummary(userId, orgId = null) {
    return this.getDonationAnalytics(userId, orgId);
  }

  /**
   * Get all donations for a project (excludes pending / abandoned checkouts)
   */
  async findProjectDonations({ projectId, limit = 50, cursor = null }) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(projectId || '');
    return this.prisma.donation.findMany({
      where: {
        ...(isUuid
          ? { OR: [{ campaignId: projectId }, { campaign: { slug: projectId } }] }
          : { campaign: { slug: projectId } }),
        paymentIntents: {
          none: { status: { in: ['PENDING', 'PROCESSING'] } },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        donor: {
          select: { id: true, fullName: true },
        },
      },
    });
  }

  /**
   * Get all financial transactions for a user
   */
  async findUserLedgerTransactions(userId, orgId = null) {
    const outgoingWhere = {
      donorId: userId,
      paymentIntents: {
        none: { status: { in: ['PENDING', 'PROCESSING'] } },
      },
    };
    if (orgId) {
      outgoingWhere.OR = [
        { tenantId: orgId },
        { campaign: { tenantId: orgId } },
      ];
    }

    const outgoingDonations = await this.prisma.donation.findMany({
      where: outgoingWhere,
      include: {
        campaign: { select: { id: true, title: true, slug: true } },
        recipient: { select: { id: true, name: true } },
        paymentIntents: {
          include: {
            attempts: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const incomingWhere = {
      campaign: {
        studentUserId: userId,
        ...(orgId ? { tenantId: orgId } : {}),
      },
      NOT: { donorId: userId },
      paymentIntents: {
        none: { status: { in: ['PENDING', 'PROCESSING'] } },
      },
    };

    const incomingDonations = await this.prisma.donation.findMany({
      where: incomingWhere,
      include: {
        donor: { select: { id: true, fullName: true, email: true } },
        campaign: { select: { id: true, title: true, slug: true } },
        paymentIntents: {
          include: {
            attempts: { orderBy: { createdAt: 'desc' }, take: 1 },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const ledgerTxs = await this.prisma.ledgerTransaction.findMany({
      where: {
        OR: [
          { userId },
          { entries: { some: { account: { userId } } } },
          ...(orgId ? [{ tenantId: orgId }] : []),
        ],
      },
      include: {
        entries: { include: { account: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: { postedAt: 'desc' },
      take: 100,
    });

    const records = [];
    const seenDonationIds = new Set();

    for (const d of outgoingDonations) {
      seenDonationIds.add(d.id);
      const latestIntent = d.paymentIntents?.[0];
      const latestAttempt = latestIntent?.attempts?.[0];
      const status =
        latestIntent?.status === 'SUCCEEDED'
          ? 'COMPLETED'
          : latestIntent?.status === 'FAILED'
          ? 'FAILED'
          : 'PENDING';

      if (status === 'PENDING') continue;

      const txHash =
        latestAttempt?.gatewayPaymentId ||
        latestAttempt?.gatewayTransactionId ||
        latestIntent?.idempotencyKey ||
        `TXN-${d.id.replace(/-/g, '').slice(0, 12).toUpperCase()}`;

      records.push({
        id: `out_${d.id}`,
        donationId: d.id,
        transactionHash: txHash,
        date: new Date(d.createdAt).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        rawDate: d.createdAt,
        source: `You (${d.donorDisplayName || 'Donor'})`,
        recipient: d.campaign?.title || d.recipient?.name || 'Project Escrow',
        type: 'DONATION',
        amount: Number(d.amount),
        currency: d.currency || 'INR',
        status,
        receiptUrl: `/api/donations/${d.id}/receipt`,
        direction: 'OUTGOING',
      });
    }

    for (const d of incomingDonations) {
      seenDonationIds.add(d.id);
      const latestIntent = d.paymentIntents?.[0];
      const latestAttempt = latestIntent?.attempts?.[0];
      const status =
        latestIntent?.status === 'SUCCEEDED'
          ? 'COMPLETED'
          : latestIntent?.status === 'FAILED'
          ? 'FAILED'
          : 'PENDING';

      if (status === 'PENDING') continue;

      const txHash =
        latestAttempt?.gatewayPaymentId ||
        latestAttempt?.gatewayTransactionId ||
        latestIntent?.idempotencyKey ||
        `TXN-${d.id.replace(/-/g, '').slice(0, 12).toUpperCase()}`;

      const sourceName = d.isAnonymous
        ? 'Anonymous Backer'
        : d.donor?.fullName || d.donorDisplayName || 'Verified Backer';

      records.push({
        id: `in_${d.id}`,
        donationId: d.id,
        transactionHash: txHash,
        date: new Date(d.createdAt).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        rawDate: d.createdAt,
        source: sourceName,
        recipient: d.campaign?.title || 'Your Student Project',
        type: 'DONATION',
        amount: Number(d.amount),
        currency: d.currency || 'INR',
        status,
        receiptUrl: `/api/donations/${d.id}/receipt`,
        direction: 'INCOMING',
      });
    }

    for (const tx of ledgerTxs) {
      if (tx.referenceType === 'DONATION' && seenDonationIds.has(tx.referenceId)) {
        continue;
      }

      let txType = 'DONATION';
      let direction = 'INCOMING';
      let source = tx.organization?.name || 'DreamXec Escrow Clearing';
      let recipient = 'You';

      if (tx.transactionType.includes('WITHDRAWAL')) {
        txType = 'WITHDRAWAL';
        direction = 'OUTGOING';
        source = 'Your Wallet (Stored Value)';
        recipient = 'Verified Bank Account';
      } else if (tx.transactionType.includes('DISBURSEMENT') || tx.transactionType.includes('MILESTONE')) {
        txType = 'GRANT_PAYOUT';
        direction = 'INCOMING';
        source = 'Campaign Escrow (Milestone Payout)';
        recipient = 'Your Wallet (Stored Value)';
      } else if (tx.transactionType.includes('PAYOUT') || tx.transactionType.includes('GRANT')) {
        txType = 'GRANT_PAYOUT';
        direction = 'INCOMING';
        source = 'Research Grant / Campaign Escrow';
        recipient = 'You';
      } else if (tx.transactionType.includes('ESCROW') || tx.transactionType.includes('RELEASE')) {
        txType = 'ESCROW_RELEASE';
      } else if (tx.transactionType.includes('REFUND')) {
        txType = 'REFUND';
      }

      const amount = tx.entries.reduce((sum, e) => {
        return Math.max(sum, Number(e.amount || 0));
      }, 0);

      const status = tx.status === 'POSTED' ? 'COMPLETED' : tx.status;
      const txHash = tx.idempotencyKey || `LTX-${tx.id.replace(/-/g, '').slice(0, 12).toUpperCase()}`;

      records.push({
        id: `ltx_${tx.id}`,
        transactionHash: txHash,
        date: new Date(tx.postedAt || tx.createdAt).toLocaleString('en-IN', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }),
        rawDate: tx.postedAt || tx.createdAt,
        source,
        recipient,
        type: txType,
        amount,
        currency: tx.currency || 'INR',
        status,
        direction,
      });
    }

    records.sort((a, b) => new Date(b.rawDate).getTime() - new Date(a.rawDate).getTime());
    return records;
  }
}

module.exports = PrismaDonationRepositoryAdapter;
