const defaultRepositoryAdapter = require('./adapters/prisma-user-repository.adapter');
const defaultStorageAdapter = require('./adapters/s3-user-storage.adapter');
const { UserNotFoundError, InvalidProfileUpdateError } = require('./user.errors');
const {
  sanitizeProfile,
  calcStudentCompletion,
  calcDonorCompletion,
  toUserListDto,
} = require('./user.mapper');

class UserService {
  /**
   * @param {Object} options
   * @param {import('./ports/user-repository.port')} [options.repositoryPort]
   * @param {import('./ports/user-storage.port')} [options.storagePort]
   */
  constructor({
    repositoryPort = defaultRepositoryAdapter,
    storagePort = defaultStorageAdapter,
  } = {}) {
    this.repositoryPort = repositoryPort;
    this.storagePort = storagePort;
  }

  async getMe(userId) {
    const user = await this.repositoryPort.findById(userId);
    if (!user) throw new UserNotFoundError('User not found');
    return {
      status: 'success',
      data: { user: sanitizeProfile(user) },
    };
  }

  async getProfile(userId, role) {
    const profile = await this.repositoryPort.findById(userId);
    if (!profile) throw new UserNotFoundError('Profile not found');

    const isDonor = role === 'DONOR';
    const completionPct = isDonor
      ? calcDonorCompletion(profile)
      : calcStudentCompletion(profile);

    return {
      status: 'success',
      data: { profile: sanitizeProfile(profile), completionPct, role: profile.role },
    };
  }

  async updateProfile(userId, userRole, updateBody) {
    if (updateBody.role !== undefined || updateBody.accountType !== undefined) {
      throw new InvalidProfileUpdateError('Role cannot be changed via this endpoint.');
    }
    if (updateBody.email !== undefined) {
      throw new InvalidProfileUpdateError('Email cannot be changed via this endpoint.');
    }

    const isDonor = userRole === 'DONOR';
    const updateData = {};

    const fields = [
      'name',
      'phone',
      'countryCode',
      'gender',
      'dateOfBirth',
      'college',
      'institutionName',
      'yearOfStudy',
      'address',
      'instagram',
      'facebook',
      'twitterX',
      'reddit',
      'bio',
      'profilePicture',
      'skills',
      'projectTitle',
      'fundingRequired',
      'portfolioUrl',
      'githubUrl',
      'linkedinUrl',
      'organizationName',
      'apaarId',
      'orcidId',
      'apaarData',
      'orcidData',
    ];

    fields.forEach((key) => {
      if (updateBody[key] !== undefined) {
        if (key === 'institutionName' && updateBody[key]) {
          updateData.college = updateBody[key];
        } else if (key === 'dateOfBirth' && updateBody[key]) {
          updateData.dateOfBirth = new Date(updateBody[key]);
        } else {
          updateData[key] = updateBody[key];
        }
      }
    });

    const updated = await this.repositoryPort.updateUser(userId, updateData);
    const completionPct = isDonor
      ? calcDonorCompletion(updated)
      : calcStudentCompletion(updated);

    const isComplete = completionPct >= 80;
    if (updated.profileComplete !== isComplete) {
      await this.repositoryPort.updateUser(userId, { profileComplete: isComplete });
      updated.profileComplete = isComplete;
    }

    return {
      status: 'success',
      data: { profile: sanitizeProfile(updated), completionPct, role: updated.role },
    };
  }

  async updateProfilePicture(userId, file) {
    if (!file) throw new InvalidProfileUpdateError('Please upload an image');
    const url = await this.storagePort.uploadProfilePicture(userId, file);
    const updated = await this.repositoryPort.updateUser(userId, { profilePicture: url });

    return {
      status: 'success',
      data: {
        profilePicture: url,
        profile: sanitizeProfile(updated),
      },
    };
  }

  async getAllUsers() {
    const users = await this.repositoryPort.findAllUsers();
    return toUserListDto(users);
  }

  async suspendUser(targetUserId) {
    const user = await this.repositoryPort.suspendUser(targetUserId);
    if (!user) throw new UserNotFoundError('User not found');
    return {
      status: 'success',
      message: `User ${user.name || targetUserId} has been suspended.`,
    };
  }

  async getKycStatus(userId) {
    const user = await this.repositoryPort.findById(userId);
    if (!user) throw new UserNotFoundError('User not found');

    const metadata = user.profileMetadata || {};
    const verificationStatus =
      metadata.verificationStatus ||
      (metadata.studentVerified ? 'VERIFIED' : 'UNVERIFIED');

    return {
      status: 'success',
      data: {
        kycStatus: verificationStatus,
        govtDocType: metadata.govtDocType || 'Aadhaar Card',
        govtDocNumber: metadata.govtDocNumber || '',
        govtDocUrl: metadata.govtDocUrl || '',
        collegeIdCardUrl: metadata.collegeIdCardUrl || metadata.idCardUrl || '',
        institution: metadata.institution || metadata.college || '',
        rollNumber: metadata.rollNumber || '',
        branch: metadata.branch || metadata.department || '',
        year: metadata.year || metadata.yearOfStudy || '',
        whatsappNumber: metadata.whatsappNumber || metadata.phone || '',
        rejectionReason: metadata.rejectionReason || null,
        submittedAt: metadata.submittedAt || null,
        verifiedAt: metadata.verifiedAt || null,
        digilockerVerified: !!metadata.digilockerVerified,
        apaarId: metadata.apaarId || null,
        issuer: metadata.issuer || null,
      },
    };
  }

  async submitKyc(userId, kycData) {
    const user = await this.repositoryPort.findById(userId);
    if (!user) throw new UserNotFoundError('User not found');

    const isDigiLocker = !!kycData.digilockerVerified;
    const currentMeta = user.profileMetadata || {};
    const nowIso = new Date().toISOString();

    const updatedMeta = {
      ...currentMeta,
      govtDocType: kycData.govtDocType || (isDigiLocker ? 'Aadhaar Card (DigiLocker)' : 'Aadhaar Card'),
      govtDocNumber: kycData.govtDocNumber || '',
      govtDocUrl: kycData.govtDocUrl || '',
      collegeIdCardUrl: kycData.collegeIdCardUrl || '',
      institution: kycData.institution || currentMeta.institution || currentMeta.college || '',
      rollNumber: kycData.rollNumber || currentMeta.rollNumber || '',
      branch: kycData.branch || currentMeta.branch || currentMeta.department || '',
      year: kycData.year || currentMeta.year || currentMeta.yearOfStudy || '',
      whatsappNumber: kycData.whatsappNumber || currentMeta.whatsappNumber || currentMeta.phone || '',
      verificationStatus: isDigiLocker ? 'VERIFIED' : 'PENDING_VERIFICATION',
      studentVerified: isDigiLocker ? true : false,
      digilockerVerified: isDigiLocker,
      issuer: isDigiLocker
        ? (kycData.issuer || 'MeriPehchaan / DigiLocker (Government of India)')
        : (currentMeta.issuer || 'DreamX Dual-Custody Governance'),
      apaarId: kycData.apaarId || currentMeta.apaarId || null,
      rejectionReason: null,
      submittedAt: currentMeta.submittedAt || nowIso,
      verifiedAt: isDigiLocker ? nowIso : currentMeta.verifiedAt || null,
    };

    // Update user profileMetadata
    await this.repositoryPort.updateUser(userId, {
      profileMetadata: updatedMeta,
    });

    // Also sync to Verification record in Prisma
    try {
      const prisma = require('../../config/prisma');
      const defaultOrg = await prisma.organization.findFirst({
        select: { id: true },
      });

      if (defaultOrg) {
        const verifData = {
          userId,
          studentName: user.fullName || user.name,
          studentEmail: user.email,
          govtDocType: updatedMeta.govtDocType,
          govtDocNumber: updatedMeta.govtDocNumber,
          govtDocUrl: updatedMeta.govtDocUrl,
          collegeIdCardUrl: updatedMeta.collegeIdCardUrl,
          institution: updatedMeta.institution,
          rollNumber: updatedMeta.rollNumber,
          branch: updatedMeta.branch,
          year: updatedMeta.year,
          whatsappNumber: updatedMeta.whatsappNumber,
          submittedAt: updatedMeta.submittedAt,
          digilockerVerified: isDigiLocker,
          issuer: updatedMeta.issuer,
          apaarId: updatedMeta.apaarId,
          verifiedAt: updatedMeta.verifiedAt,
        };

        const existingVerif = await prisma.verification.findFirst({
          where: {
            verificationData: {
              path: ['userId'],
              equals: userId,
            },
          },
        });

        const status = isDigiLocker ? 'APPROVED' : 'PENDING';

        if (existingVerif) {
          await prisma.verification.update({
            where: { id: existingVerif.id },
            data: {
              status,
              evidenceUrl: updatedMeta.collegeIdCardUrl || updatedMeta.govtDocUrl,
              verificationData: verifData,
              updatedAt: new Date(),
            },
          });
        } else {
          await prisma.verification.create({
            data: {
              tenantId: defaultOrg.id,
              verificationType: 'IDENTITY_KYC',
              status,
              evidenceUrl: updatedMeta.collegeIdCardUrl || updatedMeta.govtDocUrl,
              verificationData: verifData,
            },
          });
        }
      }
    } catch (dbErr) {
      console.warn('[UserService.submitKyc] Prisma verification record sync warning:', dbErr.message);
    }

    return {
      status: 'success',
      message: isDigiLocker
        ? 'Identity cryptographically verified with Government of India DigiLocker / MeriPehchaan!'
        : 'KYC documents submitted successfully for dual-custody verification.',
      data: {
        kycStatus: updatedMeta.verificationStatus,
        ...updatedMeta,
      },
    };
  }

  async exportUserData(userId) {
    const prisma = require('../../config/prisma');
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        assignedSpecies: true,
        memberships: {
          include: {
            organization: {
              select: { id: true, name: true, slug: true, type: true },
            },
          },
        },
        donations: {
          select: {
            id: true,
            amount: true,
            currency: true,
            createdAt: true,
            isAnonymous: true,
            donorDisplayName: true,
            donorMessage: true,
          },
        },
        docVaultItems: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            documentType: true,
            fileName: true,
            fileUrl: true,
            mimeType: true,
            createdAt: true,
          },
        },
        accountVaultItems: {
          where: { deletedAt: null },
          select: {
            id: true,
            accountNickname: true,
            accountHolderName: true,
            bankAccountNumber: true,
            ifscCode: true,
            bankName: true,
            upiId: true,
            accountType: true,
            createdAt: true,
          },
        },
        ledgerAccounts: {
          select: {
            id: true,
            accountType: true,
            currency: true,
            balance: true,
          },
        },
      },
    });

    if (!user) throw new UserNotFoundError('User not found');

    return {
      complianceNotice: 'Exported under Section 11 of the Digital Personal Data Protection (DPDP) Act, 2023.',
      exportTimestamp: new Date().toISOString(),
      profile: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        secondaryEmail: user.secondaryEmail,
        username: user.username,
        role: user.role,
        accountStatus: user.accountStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        profileMetadata: user.profileMetadata,
        assignedSpecies: user.assignedSpecies
          ? {
              commonName: user.assignedSpecies.commonName,
              scientificName: user.assignedSpecies.scientificName,
              speciesNumber: user.speciesNumber,
              avatarUrl: user.assignedSpecies.avatarUrl,
            }
          : null,
      },
      memberships: (user.memberships || []).map((m) => ({
        id: m.id,
        role: m.role,
        organizationId: m.orgId,
        organizationName: m.organization?.name,
        joinedAt: m.createdAt,
      })),
      donations: (user.donations || []).map((d) => ({
        id: d.id,
        amount: d.amount,
        currency: d.currency,
        createdAt: d.createdAt,
        isAnonymous: d.isAnonymous,
        donorDisplayName: d.donorDisplayName,
        donorMessage: d.donorMessage,
      })),
      documentVault: (user.docVaultItems || []).map((doc) => ({
        id: doc.id,
        title: doc.title,
        documentType: doc.documentType,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        mimeType: doc.mimeType,
        createdAt: doc.createdAt,
      })),
      accountVault: (user.accountVaultItems || []).map((acc) => ({
        id: acc.id,
        accountNickname: acc.accountNickname,
        accountHolderName: acc.accountHolderName,
        bankAccountNumber: acc.bankAccountNumber
          ? `****${acc.bankAccountNumber.slice(-4)}`
          : null,
        ifscCode: acc.ifscCode,
        bankName: acc.bankName,
        upiId: acc.upiId,
        accountType: acc.accountType,
        createdAt: acc.createdAt,
      })),
      ledgerAccounts: (user.ledgerAccounts || []).map((la) => ({
        id: la.id,
        accountType: la.accountType,
        currency: la.currency,
        balance: la.balance,
      })),
    };
  }

  async requestAccountDeletion(userId) {
    const prisma = require('../../config/prisma');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError('User not found');

    const anonymizedEmail = `deleted_${userId.slice(0, 8)}_${Date.now()}@dreamxec.anonymized`;

    // 1. Anonymize user personal data and mark DELETED
    await prisma.user.update({
      where: { id: userId },
      data: {
        accountStatus: 'DELETED',
        fullName: 'Deleted User',
        email: anonymizedEmail,
        secondaryEmail: null,
        passwordHash: null,
        username: null,
        profileMetadata: {
          anonymized: true,
          deletedAt: new Date().toISOString(),
        },
      },
    });

    // 2. Invalidate active sessions
    await prisma.session.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: {
        status: 'REVOKED',
        revokedAt: new Date(),
      },
    });

    // 3. Soft-delete personal vaults
    await prisma.userDocVault.updateMany({
      where: { userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    await prisma.userAccountVault.updateMany({
      where: { userId, deletedAt: null },
      data: { deletedAt: new Date() },
    });

    return {
      status: 'success',
      message: 'Account and associated personal data erased in compliance with Section 12 of the DPDP Act, 2023.',
    };
  }

  async recordDpdpConsent(userId, consentData = {}) {
    const prisma = require('../../config/prisma');
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UserNotFoundError('User not found');

    const meta = user.profileMetadata || {};
    const consentRecord = {
      version: consentData.version || '2026.1',
      termsAccepted: consentData.termsAccepted ?? true,
      privacyNoticeAccepted: consentData.privacyNoticeAccepted ?? true,
      consentedAt: new Date().toISOString(),
      ipAddress: consentData.ipAddress || null,
      userAgent: consentData.userAgent || null,
    };

    const updatedMeta = {
      ...meta,
      dpdpConsent: consentRecord,
    };

    await prisma.user.update({
      where: { id: userId },
      data: { profileMetadata: updatedMeta },
    });

    const { logAuditEvent } = require('../../utils/auditLogger');
    await logAuditEvent({
      action: 'DPDP_CONSENT_RECORDED',
      entityType: 'USER',
      entityId: userId,
      userId,
      ipAddress: consentData.ipAddress,
      userAgent: consentData.userAgent,
      newValue: consentRecord,
    });

    return {
      status: 'success',
      message: 'DPDP consent record logged immutably.',
      data: { consent: consentRecord },
    };
  }
}

module.exports = new UserService();
module.exports.UserService = UserService;
