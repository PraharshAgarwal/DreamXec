const express = require('express');
const workflowController = require('../controllers/workflow.controller');
const { protect, optionalAuth } = require('../../../middleware/auth.middleware');
const { redisCacheMiddleware } = require('../../../middleware/cache.middleware');

const router = express.Router();

// Public routes for organization catalog & workflow initialization (cached via L1+L2)
router.get('/organizations', optionalAuth, redisCacheMiddleware(120, { prefix: 'dx:wf:orgs:' }), workflowController.getOrganizations);
router.get('/', optionalAuth, redisCacheMiddleware(120, { prefix: 'dx:wf:catalog:' }), workflowController.getWorkflows);
router.post('/instances', optionalAuth, workflowController.startWorkflowInstance);
router.get('/instances/:id', optionalAuth, workflowController.getWorkflowInstance);
router.post('/instances/:id/submit-stage', optionalAuth, workflowController.submitStageData);
router.post('/instances/:id/stages', optionalAuth, workflowController.submitStageData);
router.post('/instances/:id/previous-stage', optionalAuth, workflowController.goToPreviousStage);
// Identity Verification Routes (ORCID & API Setu APAAR)
router.get('/orcid/verify/:orcidId', optionalAuth, workflowController.verifyOrcid);
router.post('/orcid/verify', optionalAuth, workflowController.verifyOrcid);
router.get('/orcid/oauth/url', optionalAuth, workflowController.getOrcidOAuthUrl);
router.post('/orcid/oauth/callback', optionalAuth, workflowController.exchangeOrcidCode);

router.get('/apaar/verify/:apaarId', optionalAuth, workflowController.verifyApaar);
router.post('/apaar/verify', optionalAuth, workflowController.verifyApaar);
router.get('/digilocker/oauth/url', optionalAuth, workflowController.getDigiLockerOAuthUrl);
router.post('/digilocker/oauth/callback', optionalAuth, workflowController.exchangeDigiLockerCode);
router.post('/digilocker/vault/sync', optionalAuth, workflowController.syncDigiLockerDocumentsToVault);

// Protected template creation
router.post('/', protect, workflowController.createWorkflow);

module.exports = router;

