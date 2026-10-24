const prismaRepositoryAdapter = require('./adapters/prisma-governance-repository.adapter');
const mapper = require('./governance.mapper');
const redis = require('../../config/redis');
const razorpayAdapter = require('../donations/adapters/razorpay-payment.adapter');
const { StudentVerificationError } = require('./governance.errors');

class GovernanceService {
  constructor({ repositoryPort = prismaRepositoryAdapter } = {}) {
    this.repositoryPort = repositoryPort;
    this.razorpayGateway = new razorpayAdapter();
  }

  async submitApplication(userId, data) {
    const raw = await this.repositoryPort.createApplication(userId, data);
    return mapper.toApplicationDto(raw);
  }

  async getApplications(userId) {
    const rawApps = await this.repositoryPort.findApplications(userId);
    return rawApps.map((a) => mapper.toApplicationDto(a));
  }

  async getAllMentors() {
    const mentors = await this.repositoryPort.findAllMentors();
    return mentors.map((m) => mapper.toMentorDto(m));
  }

  async createStudentVerificationOrder(params = {}) {
    const { studentEmail, officialEmail, mobileNumber, user, origin, req } = params;
    const { normalizeRecipient, normalizePhone } = require('../platform/platform.service');

    const normalizedStudentEmail = normalizeRecipient(studentEmail, 'email');
    const normalizedOfficialEmail = officialEmail ? normalizeRecipient(officialEmail, 'email') : null;
    const normalizedPhone = normalizeRecipient(mobileNumber, 'phone');
    const rawDigitsPhone = String(mobileNumber || '').replace(/\D/g, '');

    // Check primary student email, or official email fallback
    const studentEmailVerified = normalizedStudentEmail ? await redis.get(`verified:email:${normalizedStudentEmail}`) : null;
    const officialEmailVerified = normalizedOfficialEmail ? await redis.get(`verified:email:${normalizedOfficialEmail}`) : null;
    const emailVerified = studentEmailVerified || officialEmailVerified;

    // Check normalized E.164 phone (+91...) and raw digits fallback
    const phoneVerifiedE164 = normalizedPhone ? await redis.get(`verified:phone:${normalizedPhone}`) : null;
    const phoneVerifiedRaw = rawDigitsPhone ? await redis.get(`verified:phone:${rawDigitsPhone}`) : null;
    const phoneVerified = phoneVerifiedE164 || phoneVerifiedRaw;

    if (!emailVerified || !phoneVerified) {
      throw new StudentVerificationError('Please verify Email and WhatsApp OTPs before proceeding.');
    }

    const order = await this.razorpayGateway.createOrder({
      amount: 500, // 5 INR in paise (500)
      currency: 'INR',
      receipt: `${user.id}`,
      origin: origin || params.origin,
      req: req || params.req,
    });

    return order;
  }

  async getOrganizations() {
    return this.repositoryPort.findAllOrganizations();
  }

  async startWorkflowInstance({ organizationId, role, applicantId, applicantEmail, applicantName, instanceData }) {
    return this.repositoryPort.createWorkflowInstance({
      organizationId,
      role,
      applicantId,
      applicantEmail,
      applicantName,
      instanceData
    });
  }

  async submitStageData({ instanceId, stageId, formData, userId }) {
    return this.repositoryPort.submitStageData(instanceId, stageId, formData, userId);
  }

  async getWorkflowInstance(instanceId) {
    return this.repositoryPort.findWorkflowInstance(instanceId);
  }

  async goToPreviousStage({ instanceId }) {
    return this.repositoryPort.goToPreviousStage(instanceId);
  }
}

module.exports = new GovernanceService();
module.exports.GovernanceService = GovernanceService;

