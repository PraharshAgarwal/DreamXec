const express = require('express');
const { protect } = require('../../../middleware/auth.middleware');
const { requirePermission } = require('../../../middleware/permission.middleware');
const { PERMISSIONS } = require('../../../permissions/matrix');

const verificationController = require('../controllers/dx-admin-verification.controller');
const onboardingController = require('../controllers/dx-admin-onboarding.controller');
const workflowController = require('../controllers/dx-admin-workflow.controller');
const ledgerController = require('../controllers/ledger.controller');

const router = express.Router();

// All DX Admin routes require authentication
router.use(protect);

/* ==========================================================================
   1. Manual Verification Task Queue APIs
   ========================================================================== */
router.get(
  '/verifications',
  requirePermission(PERMISSIONS.DX_VERIFICATION_TASK_MANAGE),
  verificationController.getVerifications
);

router.get(
  '/verifications/:id',
  requirePermission(PERMISSIONS.DX_VERIFICATION_TASK_MANAGE),
  verificationController.getVerificationById
);

router.post(
  '/verifications/:id/decision',
  requirePermission(PERMISSIONS.DX_VERIFICATION_TASK_MANAGE),
  verificationController.submitVerificationDecision
);

/* ==========================================================================
   2. Organization Onboarding Governance APIs
   ========================================================================== */
router.get(
  '/onboarding/orgs',
  requirePermission(PERMISSIONS.DX_ONBOARDING_MANAGE),
  onboardingController.getOrganizations
);

router.get(
  '/onboarding/orgs/:id',
  requirePermission(PERMISSIONS.DX_ONBOARDING_MANAGE),
  onboardingController.getOrganizationById
);

router.post(
  '/onboarding/orgs',
  requirePermission(PERMISSIONS.DX_ONBOARDING_MANAGE),
  onboardingController.createOrganization
);

router.put(
  '/onboarding/orgs/:id/config',
  requirePermission(PERMISSIONS.DX_ONBOARDING_MANAGE),
  onboardingController.updateOrganizationConfig
);

router.post(
  '/onboarding/orgs/:id/status',
  requirePermission(PERMISSIONS.DX_ONBOARDING_MANAGE),
  onboardingController.updateOrganizationStatus
);

router.get(
  '/onboarding/external-orgs',
  requirePermission(PERMISSIONS.DX_ONBOARDING_MANAGE),
  onboardingController.getExternalOrganizations
);

router.post(
  '/onboarding/external-orgs',
  requirePermission(PERMISSIONS.EXTERNAL_ORG_ONBOARD),
  onboardingController.onboardExternalOrg
);


/* ==========================================================================
   3. Dynamic Workflow Designer APIs
   ========================================================================== */
router.get(
  '/workflows/templates',
  requirePermission(PERMISSIONS.DX_WORKFLOW_DESIGN),
  workflowController.getWorkflowTemplates
);

router.post(
  '/workflows/templates',
  requirePermission(PERMISSIONS.DX_WORKFLOW_DESIGN),
  workflowController.createWorkflowTemplate
);

router.put(
  '/workflows/templates/:id',
  requirePermission(PERMISSIONS.DX_WORKFLOW_DESIGN),
  workflowController.updateWorkflowTemplate
);

router.post(
  '/workflows/templates/:id/stages',
  requirePermission(PERMISSIONS.DX_WORKFLOW_DESIGN),
  workflowController.addWorkflowStage
);

router.delete(
  '/workflows/stages/:stageId',
  requirePermission(PERMISSIONS.DX_WORKFLOW_DESIGN),
  workflowController.deleteWorkflowStage
);

router.put(
  '/workflows/stages/:stageId',
  requirePermission(PERMISSIONS.DX_WORKFLOW_DESIGN),
  workflowController.updateWorkflowStage
);

/* ==========================================================================
   4. Global Double-Entry Ledger & Sandbox Payments APIs
   ========================================================================== */
router.get(
  '/ledger/overview',
  requirePermission(PERMISSIONS.FINANCE_LEDGER_VIEW),
  ledgerController.getGlobalLedger
);

router.get(
  '/ledger/transactions',
  requirePermission(PERMISSIONS.FINANCE_LEDGER_VIEW),
  ledgerController.getLedgerTransactions
);

router.post(
  '/ledger/simulate-payment',
  requirePermission(PERMISSIONS.FINANCE_LEDGER_VIEW),
  ledgerController.simulateSandboxPayment
);

router.post(
  '/ledger/transactions/:id/reverse',
  requirePermission(PERMISSIONS.FINANCE_LEDGER_VIEW),
  ledgerController.reverseTransaction
);

module.exports = router;
