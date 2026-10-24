const docVaultService = require('../services/doc-vault.service');
const accountVaultService = require('../services/account-vault.service');
const catchAsync = require('../../../utils/catchAsync');

class VaultController {
  // ── DOC VAULT CONTROLLERS ──

  getUserDocuments = catchAsync(async (req, res) => {
    const { documentType, search } = req.query;
    const documents = await docVaultService.getUserDocuments(req.user.id, { documentType, search });
    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: { documents },
    });
  });

  saveDocument = catchAsync(async (req, res) => {
    const document = await docVaultService.saveDocument(req.user.id, req.body);
    res.status(201).json({
      status: 'success',
      message: 'Document saved to Doc Vault successfully.',
      data: { document },
    });
  });

  deleteDocument = catchAsync(async (req, res) => {
    await docVaultService.deleteDocument(req.user.id, req.params.id);
    res.status(200).json({
      status: 'success',
      message: 'Document deleted from Doc Vault.',
    });
  });

  // ── ACCOUNT VAULT CONTROLLERS ──

  getUserAccounts = catchAsync(async (req, res) => {
    const accounts = await accountVaultService.getUserAccounts(req.user.id);
    res.status(200).json({
      status: 'success',
      results: accounts.length,
      data: { accounts },
    });
  });

  saveAccount = catchAsync(async (req, res) => {
    const account = await accountVaultService.saveAccount(req.user.id, req.body);
    res.status(201).json({
      status: 'success',
      message: 'Bank account saved to Account Vault successfully.',
      data: { account },
    });
  });

  deleteAccount = catchAsync(async (req, res) => {
    await accountVaultService.deleteAccount(req.user.id, req.params.id);
    res.status(200).json({
      status: 'success',
      message: 'Account deleted from Account Vault.',
    });
  });

  // ── IFSC & RAPID KYC CONTROLLERS ──

  lookupIfsc = catchAsync(async (req, res) => {
    const { ifscCode } = req.params;
    const result = await accountVaultService.lookupIfsc(ifscCode);
    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  initiateKycVerification = catchAsync(async (req, res) => {
    const session = await accountVaultService.initiateKycVerification(req.user.id, req.body, {
      req,
      origin: req.headers.origin || req.headers.referer,
    });
    res.status(200).json({
      status: 'success',
      data: session,
    });
  });

  confirmKycVerification = catchAsync(async (req, res) => {
    const result = await accountVaultService.confirmKycVerification(req.user.id, req.body, {
      req,
      origin: req.headers.origin || req.headers.referer,
    });
    res.status(200).json({
      status: 'success',
      message: result.message,
      data: result,
    });
  });
}

module.exports = new VaultController();
