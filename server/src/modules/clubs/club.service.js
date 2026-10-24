const defaultRepositoryAdapter = require('./adapters/prisma-club-repository.adapter');
const defaultNotificationAdapter = require('./adapters/email-club-notification.adapter');
const { publishEvent: defaultEventPublisher } = require('../../config/eventPublisher');
const EVENTS = require('../../config/events');
const { ClubNotFoundError } = require('./club.errors');
const { toPaginatedClubsDto, toClubDto } = require('./club.mapper');
const { getClientUrl } = require('../../utils/urlConfig');

class ClubService {
  /**
   * @param {Object} options
   * @param {import('./ports/club-repository.port')} [options.repositoryPort]
   * @param {import('./ports/club-notification.port')} [options.notificationPort]
   * @param {Function} [options.eventPublisher]
   */
  constructor({
    repositoryPort = defaultRepositoryAdapter,
    notificationPort = defaultNotificationAdapter,
    eventPublisher = defaultEventPublisher,
  } = {}) {
    this.repositoryPort = repositoryPort;
    this.notificationPort = notificationPort;
    this.eventPublisher = eventPublisher;
  }

  async getPublicClubs(query = {}) {
    const result = await this.repositoryPort.findPublicClubs(query);
    return toPaginatedClubsDto(result.clubs, result.pagination);
  }

  async getClubById(id) {
    const club = await this.repositoryPort.findById(id);
    if (!club) {
      throw new ClubNotFoundError(`Club with ID '${id}' not found.`);
    }
    return {
      success: true,
      data: toClubDto(club),
    };
  }

  async joinClub(clubId, userId, role = 'STUDENT') {
    const result = await this.repositoryPort.joinClub(clubId, userId, role);
    return {
      success: true,
      data: result,
      message: result.message || 'Successfully processed club join request',
    };
  }

  async referClub(data) {
    const referral = await this.repositoryPort.createReferral(data);
    await this.notificationPort.sendReferralNotification(data);

    return {
      status: 'success',
      data: referral,
    };
  }

  async uploadMembers(clubId, membersList) {
    const club = await this.repositoryPort.findById(clubId);
    return this.repositoryPort.addMembers(clubId, membersList);
  }

  async transferPresidency(clubId, callerUserId, data) {
    return this.repositoryPort.transferPresidency(clubId, callerUserId, data);
  }

  async updateClubProfile(clubId, userId, profileData) {
    return this.repositoryPort.updateProfile(clubId, userId, profileData);
  }

  async listVerifications(query = {}) {
    return this.repositoryPort.findVerifications(query);
  }

  async getVerification(id) {
    const item = await this.repositoryPort.findVerificationById(id);
    if (!item) {
      const AppError = require('../../utils/AppError');
      throw new AppError('Verification not found', 404);
    }
    return item;
  }

  async approveVerification(id) {
    const result = await this.repositoryPort.approveVerificationTransaction(id);
    try {
      if (result?.presidentEmail && typeof this.eventPublisher === 'function') {
        await this.eventPublisher(EVENTS.CLUB_VERIFICATION_STATUS, {
          email: result.presidentEmail,
          clubName: result.name,
          status: 'APPROVED',
          dashboardUrl: `${getClientUrl()}/dashboard`,
        });
      }
    } catch (err) {
      console.error('[ClubService] Event publish error:', err.message);
    }
    return result;
  }

  async rejectVerification(id, reason, reviewedBy) {
    const updated = await this.repositoryPort.rejectVerification(id, { reason, reviewedBy });
    try {
      if (updated?.studentEmail && typeof this.eventPublisher === 'function') {
        await this.eventPublisher(EVENTS.CLUB_VERIFICATION_STATUS, {
          email: updated.studentEmail,
          clubName: updated.clubName || 'Your Club',
          status: 'REJECTED',
          reason: reason || 'No reason specified',
          dashboardUrl: `${getClientUrl()}/dashboard`,
        });
      }
    } catch (err) {
      console.error('[ClubService] Event publish error:', err.message);
    }
    return updated;
  }

  async listReferrals(query = {}) {
    return this.repositoryPort.findReferralRequests(query);
  }

  async getReferral(id) {
    const referral = await this.repositoryPort.findReferralRequestById(id);
    if (!referral) {
      const AppError = require('../../utils/AppError');
      throw new AppError('Referral not found', 404);
    }
    return referral;
  }

  async updateReferralStatus(id, { status, notes }) {
    const AppError = require('../../utils/AppError');
    if (!['APPROVED', 'REJECTED', 'DISABLED'].includes(status)) {
      throw new AppError('Invalid status', 400);
    }
    const data = { status };
    if (notes) data.adminNotes = notes;
    return this.repositoryPort.updateReferralRequest(id, data);
  }

  async approveReferral(id) {
    return this.repositoryPort.updateReferralRequest(id, { status: 'APPROVED' });
  }

  async rejectReferral(id, reason) {
    return this.repositoryPort.updateReferralRequest(id, {
      status: 'REJECTED',
      rejectionReason: reason || null,
    });
  }
}

module.exports = new ClubService();
module.exports.ClubService = ClubService;
