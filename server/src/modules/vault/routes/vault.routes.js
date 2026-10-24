const express = require('express');
const vaultController = require('../controllers/vault.controller');
const { protect } = require('../../../middleware/auth.middleware');

const router = express.Router();

// All vault routes require authenticated session
router.use(protect);

// Doc Vault Routes
router.get('/documents', vaultController.getUserDocuments);
router.post('/documents', vaultController.saveDocument);
router.delete('/documents/:id', vaultController.deleteDocument);

// Account Vault Routes
router.get('/accounts', vaultController.getUserAccounts);
router.post('/accounts', vaultController.saveAccount);
router.delete('/accounts/:id', vaultController.deleteAccount);

// IFSC Lookup & ₹1 Reverse Penny Drop KYC Routes
router.get('/ifsc/:ifscCode', vaultController.lookupIfsc);
router.post('/accounts/verify/initiate', vaultController.initiateKycVerification);
router.post('/accounts/verify/confirm', vaultController.confirmKycVerification);

module.exports = router;
