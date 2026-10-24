const defaultService = require('../governance.service');
const uiSchemaGeneratorService = require('../services/ui-schema-generator.service');
const catchAsync = require('../../../utils/catchAsync');
const orcidService = require('../../../services/orcid.service');
const apisetuService = require('../../../services/apisetu.service');
const digilockerService = require('../../../services/digilocker.service');

class WorkflowController {
  constructor(service = defaultService, schemaGenerator = uiSchemaGeneratorService) {
    this.service = service;
    this.schemaGenerator = schemaGenerator;
  }

  getOrganizations = catchAsync(async (req, res) => {
    const organizations = await this.service.getOrganizations();
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.status(200).json({
      status: 'success',
      results: organizations.length,
      data: { organizations },
    });
  });

  getWorkflows = catchAsync(async (req, res) => {
    const { orgIds, roles } = req.query;
    const organizations = await this.service.repositoryPort.findAllOrganizations({ includeWorkflows: true });

    // Parse roles mapping e.g., "org1:PROFESSOR,org2:STUDENT"
    const roleMap = {};
    if (roles) {
      roles.split(',').forEach((item) => {
        const [oId, rName] = item.split(':');
        if (oId && rName) {
          roleMap[oId] = rName;
        }
      });
    }

    let filtered = organizations;
    if (orgIds) {
      const idsList = orgIds.split(',');
      filtered = organizations.filter((o) => idsList.includes(o.id) || idsList.includes(o.slug));
    }

    const organizationWorkflows = await Promise.all(
      filtered.map(async (org) => {
        const targetRole = roleMap[org.id] || org.allowedRoles?.[0] || 'ORG_ADMIN';

        let template = null;
        if (org.workflowTemplates && org.workflowTemplates.length > 0) {
          const roleUpper = targetRole.toUpperCase();
          const roleNormalized = targetRole.toLowerCase().replace(/_/g, '-');
          const roleClean = targetRole.toLowerCase().replace(/_/g, ' ').replace(/-/g, ' ');
          const roleTokens = roleClean.split(' ').filter(Boolean);

          template = org.workflowTemplates.find((t) => {
            const slug = (t.slug || '').toLowerCase();
            const name = (t.name || '').toLowerCase();
            if (roleUpper === 'STUDENT' || roleUpper === 'USER') {
              return (
                (slug.includes('student') || name.includes('student')) &&
                !slug.includes('president') &&
                !name.includes('president')
              );
            }
            if (roleUpper === 'STUDENT_PRESIDENT') {
              return slug.includes('president') || name.includes('president');
            }
            return (
              slug.includes(roleNormalized) ||
              name.includes(roleNormalized) ||
              roleTokens.some((tok) => tok.length > 3 && (slug.includes(tok) || name.includes(tok)))
            );
          });

          if (!template && roleUpper !== 'STUDENT' && roleUpper !== 'USER') {
            const roleOnlyTemplates = org.workflowTemplates.filter(
              (t) =>
                t.stages && t.stages.length > 0 &&
                !t.slug.toLowerCase().includes('college-onboarding') &&
                !t.slug.toLowerCase().includes('club-onboarding') &&
                !t.slug.toLowerCase().includes('org-onboarding')
            );
            if (roleOnlyTemplates.length > 0) template = roleOnlyTemplates[0];
          }
        }

        if (!template) {
          template = await this.service.repositoryPort.findMatchingWorkflowTemplate(org.id, targetRole);
        }

        const stages = template?.stages || [];
        const formStage = stages.find((s) => s.stageType === 'FORM') || stages[0];
        const docStage = stages.find((s) => s.stageType === 'DOCUMENT_UPLOAD');
        const fields = formStage?.config?.fields || [];
        const requiredDocs = docStage?.config?.requiredDocuments || formStage?.config?.requiredDocuments || [];

        return {
          id: org.id,
          name: org.name,
          slug: org.slug,
          orgType: org.orgType,
          selectedRole: targetRole,
          allowedRoles: org.allowedRoles || [],
          templateName: template?.name || `${org.name} Onboarding Workflow`,
          stages,
          fields,
          verificationRequirements: requiredDocs,
        };
      })
    );

    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
    res.status(200).json({
      status: 'success',
      data: { organizationWorkflows },
    });
  });

  startWorkflowInstance = catchAsync(async (req, res) => {
    const { organizationId, role, applicantEmail, applicantName, applicantId, instanceData } = req.body;
    
    const instance = await this.service.startWorkflowInstance({
      organizationId,
      role,
      applicantId: req.user?.id || applicantId,
      applicantEmail: req.user?.email || applicantEmail,
      applicantName: req.user?.fullName || req.user?.name || applicantName,
      instanceData
    });

    const uiSchema = this.schemaGenerator.generateSchema(instance);

    res.status(201).json({
      status: 'success',
      data: {
        instance: {
          ...instance,
          uiSchema
        }
      },
    });
  });

  submitStageData = catchAsync(async (req, res) => {
    const { id: instanceId } = req.params;
    const { stageId, formData } = req.body;

    const instance = await this.service.submitStageData({
      instanceId,
      stageId,
      formData,
      userId: req.user?.id
    });

    const uiSchema = this.schemaGenerator.generateSchema(instance);

    res.status(200).json({
      status: 'success',
      data: {
        instance: {
          ...instance,
          uiSchema
        }
      },
    });
  });

  goToPreviousStage = catchAsync(async (req, res) => {
    const { id: instanceId } = req.params;

    const instance = await this.service.goToPreviousStage({
      instanceId,
    });

    const uiSchema = this.schemaGenerator.generateSchema(instance);

    res.status(200).json({
      status: 'success',
      data: {
        instance: {
          ...instance,
          uiSchema
        }
      },
    });
  });

  getWorkflowInstance = catchAsync(async (req, res) => {
    const { id: instanceId } = req.params;
    const instance = await this.service.getWorkflowInstance(instanceId);

    if (!instance) {
      return res.status(404).json({
        status: 'fail',
        message: 'Workflow instance not found',
      });
    }

    const uiSchema = this.schemaGenerator.generateSchema(instance);

    res.status(200).json({
      status: 'success',
      data: {
        instance: {
          ...instance,
          uiSchema
        }
      },
    });
  });

  createWorkflow = catchAsync(async (req, res) => {
    res.status(201).json({
      status: 'success',
      message: 'Workflow created successfully',
    });
  });

  verifyOrcid = catchAsync(async (req, res) => {
    const orcidId = req.params.orcidId || req.query.orcidId || req.body?.orcidId;
    const result = await orcidService.verifyOrcidRecord(orcidId);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  getOrcidOAuthUrl = catchAsync(async (req, res) => {
    const { redirectUri } = req.query;
    const authUrl = orcidService.getOAuthUrl(redirectUri);
    res.status(200).json({
      status: 'success',
      data: { authUrl },
    });
  });

  exchangeOrcidCode = catchAsync(async (req, res) => {
    const { code, redirectUri } = req.body;
    const result = await orcidService.exchangeOAuthCode(code, redirectUri);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  verifyApaar = catchAsync(async (req, res) => {
    const apaarId = req.params.apaarId || req.body?.apaarId || req.query.apaarId;
    const studentHint = {
      name: req.body?.name || req.query.name || req.user?.fullName || (req.user?.firstName ? `${req.user.firstName} ${req.user.lastName || ''}`.trim() : null),
      college: req.body?.college || req.query.college || req.user?.college || req.user?.institution,
      dob: req.body?.dob || req.query.dob,
      email: req.user?.email || req.body?.email,
      avatar: req.user?.avatar || req.user?.profilePicture || req.user?.avatarUrl,
    };

    const result = await apisetuService.verifyApaarId(apaarId, studentHint);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  getDigiLockerOAuthUrl = catchAsync(async (req, res) => {
    const { redirectUri } = req.query;
    const { authUrl, state } = await digilockerService.getAuthorizeUrl(redirectUri);
    res.status(200).json({
      status: 'success',
      data: { authUrl, state },
    });
  });

  exchangeDigiLockerCode = catchAsync(async (req, res) => {
    const { code, state, redirectUri } = req.body;
    const tokens = await digilockerService.exchangeCodeForTokens(code, state, redirectUri);
    const profile = await digilockerService.getUserProfile(tokens.access_token, tokens.id_token);
    
    // Auto-save consented documents to user vault if logged in
    const userId = req.user?.id;
    if (userId && profile.documents && profile.documents.length > 0) {
      try {
        await digilockerService.saveConsentedDocumentsToVault(userId, profile.documents, profile, tokens.access_token);
      } catch (saveErr) {
        console.warn('[WorkflowController] Auto vault sync notice:', saveErr.message);
      }
    }

    res.status(200).json({
      status: 'success',
      data: profile,
    });
  });

  syncDigiLockerDocumentsToVault = catchAsync(async (req, res) => {
    const userId = req.user?.id;
    const { documents, apaarData } = req.body;
    if (!userId) {
      throw new AppError('Authentication required to save documents to Document Vault', 401);
    }
    const token = apaarData?._accessToken || req.body?.accessToken || null;
    const saved = await digilockerService.saveConsentedDocumentsToVault(userId, documents, apaarData, token);
    res.status(200).json({
      status: 'success',
      message: `${saved.length} verified government documents secured in your Document Vault.`,
      data: { savedCount: saved.length, documents: saved },
    });
  });
}

module.exports = new WorkflowController();
module.exports.WorkflowController = WorkflowController;

