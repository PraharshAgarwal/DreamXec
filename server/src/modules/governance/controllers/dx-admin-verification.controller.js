const prisma = require('../../../config/prisma');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

/**
 * Helper to compile structured submissions and documents for a verification record
 */
function formatVerificationRecord(v) {
  const inst = v.instance || {};
  const docs = [];
  const seenUrls = new Set();
  const formDetails = {};

  const addDoc = (name, url, fieldName, stageName) => {
    if (!url || typeof url !== 'string' || seenUrls.has(url)) return;
    if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('/')) {
      seenUrls.add(url);
      docs.push({
        name: name || fieldName || 'Uploaded Document',
        url,
        fieldName: fieldName || name,
        stageName: stageName || 'Form Submission',
      });
    }
  };

  // 1. Process explicit verificationData documents
  if (v.verificationData && Array.isArray(v.verificationData.documents)) {
    for (const d of v.verificationData.documents) {
      addDoc(d.name, d.url, d.fieldName, d.stageName);
    }
  }
  if (v.evidenceUrl) addDoc('Primary Evidence', v.evidenceUrl, 'evidenceUrl', 'Primary Evidence');

  // 2. Process stageSubmissions with template stage configuration
  const templateStages = inst.template?.stages || [];
  const submissions = inst.submissions || [];

  const stageSubmissions = submissions.map((sub) => {
    const stage = sub.workflowStage || templateStages.find((s) => s.id === sub.workflowStageId);
    const stageName = stage?.name || `Stage ${stage?.executionOrder || ''}`;
    const stageConfig = stage?.config || {};
    const configuredFields = stageConfig.fields || [];
    const configuredDocs = stageConfig.requiredDocuments || [];
    const rawFormData = sub.formData || {};

    const fields = [];
    for (const [key, val] of Object.entries(rawFormData)) {
      if (val === null || val === undefined || val === '') continue;

      const matchedField = configuredFields.find((f) => f.id === key || f.name === key);
      const matchedDoc = configuredDocs.find((d) => d.id === key || d.name === key);
      const label =
        matchedField?.label ||
        matchedDoc?.name ||
        key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

      if (typeof val === 'object' && val !== null && val.url) {
        addDoc(val.name || label, val.url, key, stageName);
        fields.push({
          key,
          label,
          type: 'FILE',
          name: val.name || label,
          url: val.url,
          size: val.size,
          mimeType: val.type,
        });
      } else if (
        typeof val === 'string' &&
        (val.startsWith('http') || val.startsWith('/uploads') || val.startsWith('data:'))
      ) {
        addDoc(label, val, key, stageName);
        fields.push({
          key,
          label,
          type: 'FILE',
          name: label,
          url: val,
        });
      } else {
        formDetails[label] = val;
        fields.push({
          key,
          label,
          type: typeof val === 'boolean' ? 'BOOLEAN' : typeof val === 'number' ? 'NUMBER' : 'TEXT',
          value: typeof val === 'object' ? JSON.stringify(val) : String(val),
        });
      }
    }

    return {
      id: sub.id,
      stageId: sub.workflowStageId,
      stageName,
      stageType: stage?.stageType || 'FORM',
      executionOrder: stage?.executionOrder,
      status: sub.status,
      createdAt: sub.createdAt,
      fields,
    };
  });

  // 3. Process instanceData (e.g. selected role, org name)
  const instData =
    typeof inst.instanceData === 'string'
      ? JSON.parse(inst.instanceData || '{}')
      : inst.instanceData || {};

  const selectedRole = instData.selectedRole || instData.role || 'ORG_ADMIN';

  return {
    ...v,
    evidenceUrl: v.evidenceUrl || (docs.length > 0 ? docs[0].url : null),
    documents: docs,
    stageSubmissions,
    formDetails,
    verificationData: v.verificationData || null,
    applicant: {
      id: inst.applicantId || v.verificationData?.applicant?.id || null,
      name: inst.applicantName || v.verificationData?.applicant?.name || 'Onboarding User',
      email: inst.applicantEmail || v.verificationData?.applicant?.email || 'onboarding@user.com',
      secondaryEmail: v.verificationData?.applicant?.secondaryEmail || null,
      role: selectedRole,
      organizationName: v.organization?.name || instData.selectedOrgName || 'N/A',
      organizationType: v.organization?.orgType || inst.orgType || 'COLLEGE',
      organizationSlug: v.organization?.slug || '',
    },
    instance: inst.id
      ? {
          id: inst.id,
          applicantName: inst.applicantName || 'Onboarding User',
          applicantEmail: inst.applicantEmail || 'onboarding@user.com',
          status: inst.status,
          completedAt: inst.completedAt,
          currentStage: inst.currentStage,
          instanceData: instData,
          template: inst.template,
          submissions: inst.submissions,
          executions: inst.executions,
        }
      : null,
  };
}

exports.getVerifications = catchAsync(async (req, res, next) => {
  const { status, type } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 25));
  const skip = (page - 1) * limit;

  const whereClause = {};
  if (status) {
    whereClause.status = status;
  }
  if (type) {
    whereClause.verificationType = type;
  }

  const [verifications, total] = await Promise.all([
    prisma.verification.findMany({
      where: whereClause,
      skip,
      take: limit,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true,
            orgType: true,
            lifecycleStatus: true,
          },
        },
        instance: {
          include: {
            template: {
              include: {
                stages: {
                  orderBy: { executionOrder: 'asc' },
                },
              },
            },
            submissions: {
              include: { workflowStage: true },
              orderBy: { createdAt: 'asc' },
            },
            executions: {
              orderBy: { startedAt: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.verification.count({ where: whereClause }),
  ]);

  const formattedVerifications = verifications.map(formatVerificationRecord).filter((v) => {
    const stages = v.instance?.template?.stages || [];
    if (stages.length === 0) return true;
    return stages.some((s) =>
      [
        'MANUAL_REVIEW',
        'MANUAL_APPROVAL',
        'APPROVAL',
        'COMPLIANCE_REVIEW',
        'FRAUD_CHECK',
        'BACKGROUND_CHECK',
      ].includes(s.stageType)
    );
  });

  res.status(200).json({
    status: 'success',
    results: formattedVerifications.length,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
    data: { verifications: formattedVerifications },
  });
});

/**
 * Get details of a single verification task
 */
exports.getVerificationById = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const verification = await prisma.verification.findUnique({
    where: { id },
    include: {
      organization: true,
      instance: {
        include: {
          template: {
            include: {
              stages: {
                orderBy: { executionOrder: 'asc' },
              },
            },
          },
          submissions: {
            include: { workflowStage: true },
            orderBy: { createdAt: 'asc' },
          },
          executions: {
            orderBy: { startedAt: 'asc' },
          },
        },
      },
      riskEvaluations: true,
      trustEvaluations: true,
    },
  });

  if (!verification) {
    return next(new AppError('Verification task not found', 404));
  }

  const formattedVerification = formatVerificationRecord(verification);

  res.status(200).json({
    status: 'success',
    data: { verification: formattedVerification },
  });
});

/**
 * Submit verification decision (Approve, Reject, Request Changes)
 */
exports.submitVerificationDecision = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { decision, reason, comments } = req.body;

  if (
    !decision ||
    !['VERIFIED', 'FAILED', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED'].includes(
      decision.toUpperCase()
    )
  ) {
    return next(
      new AppError(
        'Valid decision (VERIFIED, FAILED, APPROVED, REJECTED, CHANGES_REQUESTED) is required',
        400
      )
    );
  }

  if ((decision.toUpperCase() === 'FAILED' || decision.toUpperCase() === 'REJECTED') && !reason) {
    return next(new AppError('Reason is mandatory for rejection or failure decision', 400));
  }

  const existing = await prisma.verification.findUnique({
    where: { id },
    include: { instance: true },
  });

  if (!existing) {
    return next(new AppError('Verification task not found', 404));
  }

  const statusMap = {
    APPROVED: 'VERIFIED',
    VERIFIED: 'VERIFIED',
    REJECTED: 'FAILED',
    FAILED: 'FAILED',
    CHANGES_REQUESTED: 'PENDING',
  };

  const newStatus = statusMap[decision.toUpperCase()] || 'VERIFIED';
  const isVerified = newStatus === 'VERIFIED';
  const isFailed = newStatus === 'FAILED';

  const updateResult = await prisma.verification.updateMany({
    where: { id, status: { in: ['PENDING', 'IN_PROGRESS'] } },
    data: {
      status: newStatus,
      completedAt: isVerified || isFailed ? new Date() : null,
      evidenceUrl: req.body.evidenceUrl || existing.evidenceUrl,
    },
  });

  if (updateResult.count === 0) {
    return next(new AppError('Verification task has already been decided', 409));
  }

  const updatedVerification = await prisma.verification.findUnique({ where: { id } });

  // Also update linked workflow instance status and activate membership if verified
  if (existing.instanceId) {
    await prisma.workflowInstance.update({
      where: { id: existing.instanceId },
      data: {
        status: isVerified ? 'COMPLETED' : isFailed ? 'FAILED' : 'IN_PROGRESS',
        completedAt: isVerified ? new Date() : null,
        currentStageId: isVerified ? null : undefined,
        instanceData: {
          ...(existing.instance?.instanceData || {}),
          adminDecision: {
            decision,
            reason: reason || comments || null,
            decidedAt: new Date().toISOString(),
            decidedBy: req.user ? req.user.id : null,
          },
        },
      },
    });

    // Mark any remaining IN_PROGRESS executions as COMPLETED
    if (isVerified) {
      await prisma.stageExecution.updateMany({
        where: {
          workflowInstanceId: existing.instanceId,
          executionStatus: 'IN_PROGRESS',
        },
        data: {
          executionStatus: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    // Activate or suspend membership in the organization
    const applicantId = existing.instance?.applicantId;
    const orgId = existing.tenantId;
    if (applicantId && orgId) {
      const instData = existing.instance?.instanceData || {};
      const role = (instData.selectedRole || instData.role || 'ORG_ADMIN').toUpperCase();

      if (isVerified) {
        await prisma.membership.upsert({
          where: {
            userId_organizationId_role: {
              userId: applicantId,
              organizationId: orgId,
              role,
            },
          },
          update: {
            status: 'ACTIVE',
            joinedAt: new Date(),
          },
          create: {
            userId: applicantId,
            organizationId: orgId,
            role,
            status: 'ACTIVE',
            joinedAt: new Date(),
          },
        });
      } else if (isFailed) {
        await prisma.membership.updateMany({
          where: {
            userId: applicantId,
            organizationId: orgId,
            role,
          },
          data: {
            status: 'SUSPENDED',
          },
        });
      }
    }
  }

  res.status(200).json({
    status: 'success',
    message: `Verification marked as ${newStatus} and role permissions activated!`,
    data: { verification: updatedVerification },
  });
});
