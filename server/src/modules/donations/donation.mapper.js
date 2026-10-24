class DonationMapper {
  /**
   * Map raw Prisma donation entity to public DTO for donor dashboard.
   */
  static toDonationDto(donation) {
    if (!donation) return null;

    const latestIntent = donation.paymentIntents?.[0];
    const latestAttempt = latestIntent?.attempts?.[0];

    return {
      id: donation.id,
      amount: Number(donation.amount),
      currency: donation.currency || 'INR',
      message: donation.message || null,
      anonymous: Boolean(donation.anonymous),
      paymentStatus: latestIntent?.status || 'SUCCEEDED',
      paymentId: latestAttempt?.gatewayPaymentId || latestAttempt?.gatewayTransactionId || latestAttempt?.id || donation.razorpayPaymentId || null,
      orderId: latestAttempt?.gatewayTransactionId || latestIntent?.idempotencyKey || latestIntent?.id || donation.razorpayOrderId || null,
      createdAt: donation.createdAt,
      campaign: donation.campaign
        ? {
            id: donation.campaign.id,
            slug: donation.campaign.slug,
            title: donation.campaign.title,
            imageUrl: donation.campaign.coverImageUrl,
            coverImageUrl: donation.campaign.coverImageUrl,
            category: donation.campaign.category,
            stage: donation.campaign.stage,
            status: donation.campaign.status,
            currentRaisedAmount: Number(donation.campaign.currentRaisedAmount || 0),
            targetAmount: Number(donation.campaign.targetAmount || 0),
            tenant: donation.campaign.tenant || null,
            milestones: (donation.campaign.milestones || []).map((m) => ({
              id: m.id,
              title: m.title,
              description: m.description,
              targetAmount: Number(m.targetAmount || 0),
              status: m.status,
              sequenceOrder: m.sequenceOrder,
            })),
          }
        : null,
      userProject: donation.campaign
        ? {
            id: donation.campaign.id,
            title: donation.campaign.title,
            imageUrl: donation.campaign.coverImageUrl,
            amountRaised: Number(donation.campaign.currentRaisedAmount || 0),
            goalAmount: Number(donation.campaign.targetAmount || 0),
          }
        : null,
    };
  }

  /**
   * Map raw donation list to project owner donation DTO.
   */
  static toProjectDonationDto(donation) {
    if (!donation) return null;

    const donorName = donation.anonymous
      ? 'Anonymous'
      : (donation.donor?.name || donation.donor?.fullName || donation.user?.name || 'Valued Donor');

    const donorEmail = donation.anonymous
      ? undefined
      : (donation.donor?.email || donation.user?.email || donation.guestEmail || undefined);

    return {
      id: donation.id,
      amount: Number(donation.amount),
      currency: donation.currency || 'INR',
      message: donation.message || null,
      anonymous: Boolean(donation.anonymous),
      donorName,
      donorEmail,
      user: donation.user ? { name: donation.user.fullName || donation.user.name, email: donation.user.email } : null,
      donor: donation.donor ? { name: donation.donor.fullName || donation.donor.name, email: donation.donor.email } : null,
      createdAt: donation.createdAt,
    };
  }

  /**
   * Map donation summary stats object to clean DTO.
   */
  static toDonationSummaryDto(analytics = {}) {
    return {
      totalAmount: Number(analytics.totalAmount || analytics.totalDonated || 0),
      totalDonated: Number(analytics.totalDonated || analytics.totalAmount || 0),
      projectsSupported: Number(analytics.projectsSupported || analytics.campaignsBacked || 0),
      campaignsBacked: Number(analytics.campaignsBacked || analytics.projectsSupported || 0),
      donationsCount: Number(analytics.donationsCount || 0),
      categoriesSupported: Number(analytics.categoriesSupported || 0),
    };
  }
}

module.exports = DonationMapper;
