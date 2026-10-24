/**
 * UI Schema Generator Service
 * Converts raw backend WorkflowInstance & WorkflowStages into a declarative UI Schema JSON.
 */
class UiSchemaGeneratorService {
  /**
   * Generates the complete UI Schema for a workflow instance.
   * @param {Object} instance - Hydrated WorkflowInstance from Prisma
   * @returns {Object} UI Schema Contract
   */
  generateSchema(instance) {
    if (!instance) return null;

    const template = instance.template || {};
    const stages = template.stages || [];
    const currentStageId = instance.currentStageId;
    const currentStage = instance.currentStage || stages.find((s) => s.id === currentStageId) || stages[0];

    const currentOrder = currentStage?.executionOrder || 1;
    const totalStages = stages.length || 1;
    const completionPercentage = Math.round(((currentOrder - 1) / totalStages) * 100);

    const organization = instance.organization || {};
    const selectedRole = instance.instanceData?.selectedRole || 'USER';

    // Map current stage to UI section & components (Step-by-Step Wizard)
    const sections = [];
    
    if (currentStage) {
      const stage = currentStage;
      const idx = (currentStage.executionOrder || 1) - 1;
      const stageConfig = stage.config || {};
      const components = [];

      // 1. FORM STAGE (or stage with fields)
      if (stage.stageType === 'FORM' || (stageConfig.fields && Array.isArray(stageConfig.fields))) {
        const fields = stageConfig.fields && Array.isArray(stageConfig.fields) ? stageConfig.fields : [];

        fields.forEach((field) => {
          const defaultVal = field.defaultValue !== undefined
            ? field.defaultValue
            : (field.type === 'select' && Array.isArray(field.options) && field.options.length > 0
                ? field.options[0]
                : undefined);

          components.push({
            id: field.id,
            type: this.mapFieldTypeToComponent(field),
            props: {
              label: field.label,
              placeholder: field.placeholder || '',
              required: Boolean(field.required),
              options: field.options || [],
              helpText: field.helpText || '',
              defaultValue: defaultVal,
            },
            validation: { required: Boolean(field.required) },
          });
        });
      }

      // 2. APAAR ID VERIFICATION STAGE
      if (stage.stageType === 'APAAR_VERIFICATION') {
        components.push({
          id: stageConfig.fieldId || 'apaarId',
          type: 'APAAR_INPUT',
          props: {
            label: 'DigiLocker / APAAR ID (12-Digit)',
            placeholder: '1234-5678-9012',
            required: true,
            helpText: stage.description || 'Enter your 12-digit One Nation One Student ID. We verify your active student status and institution in real time with Government API Setu & DigiLocker.',
          },
          validation: { required: true },
        });
      }

      // 3. ORCID REGISTRY VERIFICATION STAGE
      if (stage.stageType === 'ORCID_VERIFICATION') {
        components.push({
          id: stageConfig.fieldId || 'orcidId',
          type: 'ORCID_INPUT',
          props: {
            label: 'Researcher ORCID iD',
            placeholder: '0000-0002-1825-0097',
            required: true,
            helpText: stage.description || 'Verify your official 16-character ORCID identifier directly against the official public ORCID Registry.',
          },
          validation: { required: true },
        });
      }

      // 4. EMAIL VERIFICATION STAGE
      if (stage.stageType === 'EMAIL_VERIFICATION' || stageConfig.emailField) {
        components.push({
          id: stageConfig.emailField || `academicEmail_${stage.id}`,
          type: 'EMAIL_VERIFICATION',
          props: {
            label: `Official ${selectedRole.replace(/_/g, ' ')} Email Verification`,
            placeholder: `user@${stageConfig.requiredDomain || 'domain.com'}`,
            requiredDomain: stageConfig.requiredDomain || '',
            required: true,
          },
          validation: { required: true },
        });
      }

      // 5. DOCUMENT UPLOAD STAGE
      if (stage.stageType === 'DOCUMENT_UPLOAD' || (stageConfig.requiredDocuments && Array.isArray(stageConfig.requiredDocuments))) {
        const docs = stageConfig.requiredDocuments && Array.isArray(stageConfig.requiredDocuments) ? stageConfig.requiredDocuments : [];

        docs.forEach((doc) => {
          components.push({
            id: doc.id,
            type: 'FILE_UPLOAD',
            props: {
              label: doc.name || doc.label || 'Verification Document Upload',
              accept: doc.accept || 'application/pdf,image/*',
              maxSizeMB: doc.maxSizeMB || 5,
              required: Boolean(doc.required),
            },
            validation: { required: Boolean(doc.required) },
          });
        });
      }

      // 4. MANUAL REVIEW / COMPLIANCE / BACKGROUND CHECK STAGES (ALWAYS ASSIGNED TO DREAMX ADMIN)
      if (['MANUAL_REVIEW', 'MANUAL_APPROVAL', 'APPROVAL', 'BACKGROUND_CHECK', 'COMPLIANCE_REVIEW', 'FRAUD_CHECK'].includes(stage.stageType)) {
        components.push({
          id: `info_${stage.id}`,
          type: 'INFO_NOTE',
          props: {
            label: `${stage.name} (DreamX Admin Review Step)`,
            helpText: stage.description || 'This verification step will be evaluated, audited, and approved directly by DreamX Platform Administrators after submission.',
          },
          validation: { required: false },
        });
      }

      // Fallback: If components still empty for custom stage type, add default text input
      if (components.length === 0) {
        components.push({
          id: `field_${stage.id}`,
          type: 'TEXT_INPUT',
          props: {
            label: stage.name,
            placeholder: `Enter details for ${stage.name}`,
            required: false,
          },
          validation: { required: false },
        });
      }

      sections.push({
        id: `sec-${stage.id}`,
        stageId: stage.id,
        stageName: stage.name,
        stageType: stage.stageType,
        title: `Step ${idx + 1} of ${totalStages}: ${stage.name}`,
        description: stage.description || '',
        components,
      });
    }

    const isLastStep = currentOrder === totalStages || ['MANUAL_REVIEW', 'MANUAL_APPROVAL', 'APPROVAL', 'BACKGROUND_CHECK', 'COMPLIANCE_REVIEW', 'FRAUD_CHECK'].includes(currentStage?.stageType);

    const hasManualReview = stages.some((s) =>
      ['MANUAL_REVIEW', 'MANUAL_APPROVAL', 'APPROVAL', 'BACKGROUND_CHECK', 'COMPLIANCE_REVIEW', 'FRAUD_CHECK'].includes(s.stageType)
    );

    const isReviewSubmission = hasManualReview && (
      currentOrder >= totalStages - 1 ||
      ['MANUAL_REVIEW', 'MANUAL_APPROVAL', 'APPROVAL', 'BACKGROUND_CHECK', 'COMPLIANCE_REVIEW', 'FRAUD_CHECK'].includes(currentStage?.stageType)
    );

    const buttonLabel = isReviewSubmission
      ? 'Submit for Approval →'
      : isLastStep
      ? 'Complete & Submit Role Onboarding ✓'
      : 'Proceed to Next Step →';

    return {
      instanceId: instance.id,
      workflowId: template.id,
      status: instance.status,
      completionPercentage,
      currentStage: {
        id: currentStage?.id,
        name: currentStage?.name,
        description: currentStage?.description,
        executionOrder: currentOrder,
        totalStages,
      },
      ui: {
        header: {
          title: `${selectedRole.replace(/_/g, ' ')} ONBOARDING FORM`,
          subtitle: organization.name || 'Organization Onboarding',
          badge: selectedRole,
          statusBanner: {
            type: 'SUCCESS',
            title: 'Organization Details Pre-Filled & Verified in Database',
            description: `Type: ${organization.orgType || 'COLLEGE'} • Status: ${organization.lifecycleStatus || 'ACTIVE'}`,
          },
        },
        sections,
        actions: {
          primary: {
            id: 'submit-workflow',
            label: buttonLabel,
            actionType: 'SUBMIT_WORKFLOW',
            style: 'PRIMARY',
          },
          secondary: [
            {
              id: 'change-role',
              label: '← Change Role',
              actionType: 'NAVIGATE_ROLE_SELECT',
            },
          ],
        },
      },
    };
  }

  mapFieldTypeToComponent(field) {
    if (typeof field === 'string') {
      return this.mapTypeString(field);
    }
    const fieldType = field?.type;
    const fieldId = (field?.id || '').toLowerCase();
    const fieldLabel = (field?.label || '').toLowerCase();

    if (fieldId.includes('orcid') || fieldLabel.includes('orcid')) {
      return 'ORCID_INPUT';
    }

    if (fieldId.includes('apaar') || fieldLabel.includes('apaar') || fieldId.includes('abc_id')) {
      return 'APAAR_INPUT';
    }

    return this.mapTypeString(fieldType);
  }

  mapTypeString(fieldType) {
    switch (fieldType) {
      case 'select':
        return 'SELECT';
      case 'date':
        return 'DATE_PICKER';
      case 'file':
        return 'FILE_UPLOAD';
      case 'number':
        return 'NUMBER_INPUT';
      case 'email':
        return 'EMAIL_INPUT';
      default:
        return 'TEXT_INPUT';
    }
  }
}

module.exports = new UiSchemaGeneratorService();
module.exports.UiSchemaGeneratorService = UiSchemaGeneratorService;
