function toDashboardStatsDto(stats = {}) {
  return {
    totalUsers: stats.totalUsers || 0,
    totalProjects: stats.totalCampaigns || stats.totalProjects || 0,
    totalCampaigns: stats.totalCampaigns || 0,
    pendingCampaigns: stats.pendingCampaigns || 0,
    liveCampaigns: stats.liveCampaigns || 0,
    pendingMilestones: stats.pendingMilestones || 0,
    pendingVerifications: stats.pendingVerifications || 0,
    totalDonations: stats.totalDonations || 0,
    totalAmountRaised: stats.totalAmountRaised || 0,
    totalTargetGoal: stats.totalTargetGoal || 0,
    pendingWithdrawals: stats.pendingWithdrawals || 0,
  };
}

function toAuditLogDto(log) {
  if (!log) return null;
  return {
    id: log.id,
    action: log.action,
    details: log.details || null,
    ipAddress: log.ipAddress || null,
    createdAt: log.createdAt,
    user: log.user ? { id: log.user.id, name: log.user.name, email: log.user.email } : null,
  };
}

module.exports = {
  toDashboardStatsDto,
  toAuditLogDto,
};
