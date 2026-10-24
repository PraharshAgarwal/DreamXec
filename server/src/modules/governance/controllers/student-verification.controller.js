const crypto = require('crypto');
const prisma = require('../../../config/prisma');
const defaultService = require('../governance.service');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

const computeRosterHash = (rollNumber, name) => {
  const cleanRoll = String(rollNumber || '').toLowerCase().trim();
  const cleanName = String(name || '').toLowerCase().trim();
  if (!cleanRoll || !cleanName) return null;
  return crypto.createHash('sha256').update(cleanRoll + cleanName).digest('hex');
};

const computeRosterMatchStatus = (item, knownRosterHashes = null) => {
  const email = (item.user?.email || item.studentEmail || '').toLowerCase();
  const rollNumber = String(item.rollNumber || '').trim();
  const name = String(item.user?.name || item.studentName || item.name || '').trim();

  // 1. Check sha256 roster matching against institutional roster master (Annexure 1 X3)
  if (knownRosterHashes) {
    const hash = computeRosterHash(rollNumber, name);
    const hashSet = knownRosterHashes instanceof Set ? knownRosterHashes : new Set(Array.isArray(knownRosterHashes) ? knownRosterHashes : []);
    if (hash && hashSet.has(hash)) {
      if (item) {
        item.rosterMatchSource = 'ROSTER_SHA256_MATCH';
        item.rosterHash = hash;
      }
      return 'AUTO_MATCHED';
    }
  }

  // 2. Academic institution heuristics (.edu, .ac.in, nitkkr, iit, bits)
  const hasAcademicEmail =
    /\.(edu|ac\.in|edu\.in)$/.test(email) ||
    email.includes('nitkkr.ac.in') ||
    email.includes('iit') ||
    email.includes('bits');
  const hasRollNumber = rollNumber && rollNumber !== '—' && rollNumber !== 'null' && rollNumber.length >= 4;
  const hasValidDoc = !!(item.collegeIdCardUrl || item.govtDocUrl);

  if (
    (hasAcademicEmail && hasRollNumber) ||
    (hasRollNumber && hasValidDoc && item.institution && item.institution !== '—')
  ) {
    if (item && !item.rosterMatchSource) {
      item.rosterMatchSource = 'ACADEMIC_CREDENTIALS_MATCH';
    }
    return 'AUTO_MATCHED';
  }

  if (item && !item.rosterMatchSource) {
    item.rosterMatchSource = 'MANUAL_REVIEW_REQUIRED';
  }
  return 'NEEDS_REVIEW';
};

class StudentVerificationController {
  constructor(service = defaultService) {
    this.service = service;
  }

  createStudentVerificationOrder = catchAsync(async (req, res) => {
    const order = await this.service.createStudentVerificationOrder({
      studentEmail: req.body.studentEmail,
      officialEmail: req.body.officialEmail,
      mobileNumber: req.body.mobileNumber,
      user: req.user,
      origin: req.headers.origin || req.headers.referer,
      req,
    });
    res.status(200).json({ order });
  });

  getAllStudentVerifications = catchAsync(async (req, res) => {
    const statusFilter = req.query.status;

    // Fetch all uploaded institutional roster records to match against sha256 hashes (Annexure 1 X3)
    const rosterRecords = await prisma.verification.findMany({
      where: { verificationType: 'ROSTER_RECORD', status: 'VERIFIED' },
      select: { verificationData: true },
    }).catch(() => []);
    const knownRosterHashes = new Set(
      rosterRecords
        .map((r) => (r.verificationData && typeof r.verificationData === 'object' ? r.verificationData.hash : null))
        .filter(Boolean)
    );

    // Fetch verification records from Verification model (excluding internal roster records)
    const verifications = await prisma.verification.findMany({
      where: {
        verificationType: { notIn: ['ROSTER_RECORD', 'CORPORATE_MCA_RECORD'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        instance: true,
        organization: { select: { id: true, name: true, slug: true } },
      },
    }).catch(() => []);

    // Also fetch users who have verification metadata or are students
    const users = await prisma.user.findMany({
      where: {
        accountStatus: { not: 'DELETED' },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        accountStatus: true,
        profileMetadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }).catch(() => []);

    // Combine and build unified verification records list
    const list = [];

    // Map existing verifications
    verifications.forEach((v) => {
      const data = typeof v.verificationData === 'object' && v.verificationData !== null ? v.verificationData : {};
      const status =
        v.status === 'VERIFIED'
          ? 'VERIFIED'
          : v.status === 'REVOKED'
          ? 'REVOKED'
          : v.status === 'FAILED'
          ? 'REJECTED'
          : 'PENDING';

      const item = {
        id: v.id,
        verificationRecordId: v.id,
        userId: data.userId || v.instance?.applicantId || null,
        user: {
          id: data.userId || v.instance?.applicantId || null,
          name: data.studentName || v.instance?.applicantName || 'Student Applicant',
          email: data.studentEmail || v.instance?.applicantEmail || '—',
        },
        rollNumber: data.rollNumber || data.studentId || '—',
        branch: data.branch || data.department || '—',
        year: data.year || data.academicYear || '—',
        institution: v.organization?.name || data.institution || data.college || '—',
        collegeIdCardUrl: v.evidenceUrl || data.collegeIdCardUrl || data.documentUrl || null,
        govtDocType: data.govtDocType || 'Aadhaar Card',
        govtDocNumber: data.govtDocNumber || null,
        govtDocUrl: data.govtDocUrl || null,
        paymentScreenshotUrl: data.paymentScreenshotUrl || null,
        whatsappNumber: data.whatsappNumber || data.mobileNumber || data.phone || null,
        status,
        verificationType: v.verificationType || 'STUDENT_ID',
        createdAt: v.createdAt,
        updatedAt: v.updatedAt,
      };

      item.rosterMatchStatus = computeRosterMatchStatus(item, knownRosterHashes);
      list.push(item);
    });

    // Map users with profileMetadata
    users.forEach((u) => {
      const meta = typeof u.profileMetadata === 'object' && u.profileMetadata !== null ? u.profileMetadata : {};
      const alreadyInList = list.some((item) => item.userId === u.id || (item.user?.email && item.user.email === u.email));

      if (!alreadyInList && (meta.rollNumber || meta.branch || meta.studentVerified !== undefined || meta.govtDocUrl || u.role === 'STUDENT' || u.role === 'STUDENT_PRESIDENT')) {
        const status =
          meta.verificationStatus === 'REVOKED'
            ? 'REVOKED'
            : meta.studentVerified === true || meta.verificationStatus === 'VERIFIED'
            ? 'VERIFIED'
            : meta.verificationStatus === 'REJECTED'
            ? 'REJECTED'
            : 'PENDING';

        const item = {
          id: u.id,
          verificationRecordId: null,
          userId: u.id,
          user: {
            id: u.id,
            name: u.fullName,
            email: u.email,
          },
          rollNumber: meta.rollNumber || '—',
          branch: meta.branch || meta.department || '—',
          year: meta.year || '—',
          institution: meta.institution || meta.college || '—',
          collegeIdCardUrl: meta.collegeIdCardUrl || meta.idCardUrl || null,
          govtDocType: meta.govtDocType || 'Aadhaar Card',
          govtDocNumber: meta.govtDocNumber || null,
          govtDocUrl: meta.govtDocUrl || null,
          paymentScreenshotUrl: meta.paymentScreenshotUrl || null,
          whatsappNumber: meta.whatsappNumber || meta.phone || null,
          status,
          verificationType: 'STUDENT_ID',
          createdAt: u.createdAt,
          updatedAt: u.createdAt,
        };

        item.rosterMatchStatus = computeRosterMatchStatus(item, knownRosterHashes);
        list.push(item);
      }
    });

    // Filter by status if requested
    const filtered = statusFilter && statusFilter !== 'ALL'
      ? list.filter((item) => item.status.toUpperCase() === statusFilter.toUpperCase())
      : list;

    res.status(200).json({
      success: true,
      results: filtered.length,
      data: {
        verifications: filtered,
      },
    });
  });

  approveStudentVerification = catchAsync(async (req, res) => {
    const { id } = req.params;

    await prisma.$transaction(async (tx) => {
      // Try finding Verification record
      const verification = await tx.verification.findUnique({
        where: { id },
        include: { instance: true },
      });

      if (verification) {
        await tx.verification.update({
          where: { id },
          data: {
            status: 'VERIFIED',
            completedAt: new Date(),
          },
        });

        const targetUserId =
          verification.verificationData?.userId || verification.instance?.applicantId;

        if (targetUserId) {
          const user = await tx.user.findUnique({ where: { id: targetUserId } });
          if (user) {
            const currentMeta = typeof user.profileMetadata === 'object' && user.profileMetadata !== null ? user.profileMetadata : {};
            await tx.user.update({
              where: { id: targetUserId },
              data: {
                profileMetadata: {
                  ...currentMeta,
                  studentVerified: true,
                  verificationStatus: 'VERIFIED',
                  verifiedAt: new Date().toISOString(),
                },
              },
            });
          }
        }
      } else {
        // Check if id is a User ID
        const user = await tx.user.findUnique({ where: { id } });
        if (user) {
          const currentMeta = typeof user.profileMetadata === 'object' && user.profileMetadata !== null ? user.profileMetadata : {};
          await tx.user.update({
            where: { id },
            data: {
              profileMetadata: {
                ...currentMeta,
                studentVerified: true,
                verificationStatus: 'VERIFIED',
                verifiedAt: new Date().toISOString(),
              },
            },
          });
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Student verification successfully approved and badge granted.',
    });
  });

  rejectStudentVerification = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    await prisma.$transaction(async (tx) => {
      const verification = await tx.verification.findUnique({
        where: { id },
        include: { instance: true },
      });

      if (verification) {
        await tx.verification.update({
          where: { id },
          data: {
            status: 'FAILED',
            verificationData: {
              ...(typeof verification.verificationData === 'object' ? verification.verificationData : {}),
              rejectionReason: reason || 'Invalid documents',
            },
          },
        });

        const targetUserId =
          verification.verificationData?.userId || verification.instance?.applicantId;

        if (targetUserId) {
          const user = await tx.user.findUnique({ where: { id: targetUserId } });
          if (user) {
            const currentMeta = typeof user.profileMetadata === 'object' && user.profileMetadata !== null ? user.profileMetadata : {};
            await tx.user.update({
              where: { id: targetUserId },
              data: {
                profileMetadata: {
                  ...currentMeta,
                  studentVerified: false,
                  verificationStatus: 'REJECTED',
                  rejectionReason: reason || 'Invalid documents',
                },
              },
            });
          }
        }
      } else {
        const user = await tx.user.findUnique({ where: { id } });
        if (user) {
          const currentMeta = typeof user.profileMetadata === 'object' && user.profileMetadata !== null ? user.profileMetadata : {};
          await tx.user.update({
            where: { id },
            data: {
              profileMetadata: {
                ...currentMeta,
                studentVerified: false,
                verificationStatus: 'REJECTED',
                rejectionReason: reason || 'Invalid documents',
              },
            },
          });
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Student verification rejected.',
    });
  });

  revokeStudentVerification = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    const revocationReason = reason || 'Verification revoked by institutional administrator';

    await prisma.$transaction(async (tx) => {
      const verification = await tx.verification.findUnique({
        where: { id },
        include: { instance: true },
      });

      if (verification) {
        await tx.verification.update({
          where: { id },
          data: {
            status: 'REVOKED',
            verificationData: {
              ...(typeof verification.verificationData === 'object' ? verification.verificationData : {}),
              revocationReason,
              revokedAt: new Date().toISOString(),
            },
          },
        });

        const targetUserId =
          verification.verificationData?.userId || verification.instance?.applicantId;

        if (targetUserId) {
          const user = await tx.user.findUnique({ where: { id: targetUserId } });
          if (user) {
            const currentMeta = typeof user.profileMetadata === 'object' && user.profileMetadata !== null ? user.profileMetadata : {};
            await tx.user.update({
              where: { id: targetUserId },
              data: {
                profileMetadata: {
                  ...currentMeta,
                  studentVerified: false,
                  verificationStatus: 'REVOKED',
                  revokedAt: new Date().toISOString(),
                  revocationReason,
                },
              },
            });
          }
        }
      } else {
        const user = await tx.user.findUnique({ where: { id } });
        if (user) {
          const currentMeta = typeof user.profileMetadata === 'object' && user.profileMetadata !== null ? user.profileMetadata : {};
          await tx.user.update({
            where: { id },
            data: {
              profileMetadata: {
                ...currentMeta,
                studentVerified: false,
                verificationStatus: 'REVOKED',
                revokedAt: new Date().toISOString(),
                revocationReason,
              },
            },
          });
        }
      }
    });

    res.status(200).json({
      success: true,
      message: 'Student verification badge successfully revoked.',
    });
  });

  approveAllMatched = catchAsync(async (req, res) => {
    // 0. Fetch active institutional roster hashes
    const rosterRecords = await prisma.verification.findMany({
      where: { verificationType: 'ROSTER_RECORD', status: 'VERIFIED' },
      select: { verificationData: true },
    }).catch(() => []);
    const knownRosterHashes = new Set(
      rosterRecords
        .map((r) => (r.verificationData && typeof r.verificationData === 'object' ? r.verificationData.hash : null))
        .filter(Boolean)
    );

    // 1. Get all pending verification records
    const pendingVerifications = await prisma.verification.findMany({
      where: {
        status: 'PENDING',
        verificationType: { notIn: ['ROSTER_RECORD', 'CORPORATE_MCA_RECORD'] },
      },
      include: { instance: true, organization: true },
    }).catch(() => []);

    let approvedCount = 0;
    const approvedUserIds = new Set();

    for (const v of pendingVerifications) {
      const data = typeof v.verificationData === 'object' && v.verificationData !== null ? v.verificationData : {};
      const item = {
        user: { email: data.studentEmail || v.instance?.applicantEmail, name: data.studentName || v.instance?.applicantName },
        rollNumber: data.rollNumber || data.studentId,
        institution: v.organization?.name || data.institution,
        collegeIdCardUrl: v.evidenceUrl || data.collegeIdCardUrl,
        govtDocUrl: data.govtDocUrl,
      };

      if (computeRosterMatchStatus(item, knownRosterHashes) === 'AUTO_MATCHED') {
        await prisma.$transaction(async (tx) => {
          await tx.verification.update({
            where: { id: v.id },
            data: { status: 'VERIFIED', completedAt: new Date() },
          });

          const targetUserId = data.userId || v.instance?.applicantId;
          if (targetUserId) {
            approvedUserIds.add(targetUserId);
            const user = await tx.user.findUnique({ where: { id: targetUserId } });
            if (user) {
              const currentMeta = typeof user.profileMetadata === 'object' && user.profileMetadata !== null ? user.profileMetadata : {};
              await tx.user.update({
                where: { id: targetUserId },
                data: {
                  profileMetadata: {
                    ...currentMeta,
                    studentVerified: true,
                    verificationStatus: 'VERIFIED',
                    verifiedAt: new Date().toISOString(),
                    autoMatched: true,
                  },
                },
              });
            }
          }
        });
        approvedCount++;
      }
    }

    // 2. Also check pending users with auto-matched criteria
    const pendingUsers = await prisma.user.findMany({
      where: {
        accountStatus: { not: 'DELETED' },
      },
      select: { id: true, email: true, profileMetadata: true },
    }).catch(() => []);

    for (const u of pendingUsers) {
      if (approvedUserIds.has(u.id)) continue;

      const meta = typeof u.profileMetadata === 'object' && u.profileMetadata !== null ? u.profileMetadata : {};
      const currentStatus = (meta.verificationStatus || '').toUpperCase();
      if (
        meta.studentVerified !== true &&
        currentStatus !== 'VERIFIED' &&
        currentStatus !== 'REJECTED' &&
        currentStatus !== 'REVOKED' &&
        currentStatus !== 'FAILED'
      ) {
        const item = {
          user: { email: u.email, name: u.fullName },
          rollNumber: meta.rollNumber,
          institution: meta.institution || meta.college,
          collegeIdCardUrl: meta.collegeIdCardUrl || meta.idCardUrl,
          govtDocUrl: meta.govtDocUrl,
        };
        if (computeRosterMatchStatus(item, knownRosterHashes) === 'AUTO_MATCHED') {
          await prisma.$transaction(async (tx) => {
            const freshUser = await tx.user.findUnique({ where: { id: u.id } });
            const freshMeta = typeof freshUser?.profileMetadata === 'object' && freshUser.profileMetadata !== null ? freshUser.profileMetadata : {};
            await tx.user.update({
              where: { id: u.id },
              data: {
                profileMetadata: {
                  ...freshMeta,
                  studentVerified: true,
                  verificationStatus: 'VERIFIED',
                  verifiedAt: new Date().toISOString(),
                  autoMatched: true,
                },
              },
            });
          });
          approvedCount++;
          approvedUserIds.add(u.id);
        }
      }
    }

    res.status(200).json({
      success: true,
      message: `Successfully approved ${approvedCount} auto-matched student verification requests.`,
      approvedCount,
    });
  });
}

module.exports = new StudentVerificationController();
module.exports.StudentVerificationController = StudentVerificationController;
module.exports.computeRosterMatchStatus = computeRosterMatchStatus;
