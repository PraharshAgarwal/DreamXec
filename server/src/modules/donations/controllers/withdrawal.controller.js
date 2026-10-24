const withdrawalService = require('../services/withdrawal.service');
const catchAsync = require('../../../utils/catchAsync');

class WithdrawalController {
  constructor(service = withdrawalService) {
    this.service = service;
  }

  getEligibility = catchAsync(async (req, res) => {
    const data = await this.service.getWithdrawalEligibility(req.user.id);
    res.status(200).json({
      success: true,
      data,
    });
  });

  requestWithdrawal = catchAsync(async (req, res) => {
    const { amount, vaultAccountId, tenantId } = req.body;
    const idempotencyKey = req.headers['x-idempotency-key'] || req.body.idempotencyKey;

    const withdrawal = await this.service.requestWithdrawal(req.user.id, {
      amount,
      vaultAccountId,
      tenantId,
      idempotencyKey,
      req,
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully.',
      data: withdrawal,
    });
  });

  getMyWithdrawals = catchAsync(async (req, res) => {
    const { page, limit, status } = req.query;
    const result = await this.service.getMyWithdrawals(req.user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
      status,
    });

    res.status(200).json({
      success: true,
      data: result.withdrawals,
      pagination: result.pagination,
    });
  });

  getWithdrawalById = catchAsync(async (req, res) => {
    const withdrawal = await this.service.getWithdrawalById(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      data: withdrawal,
    });
  });

  cancelWithdrawal = catchAsync(async (req, res) => {
    const result = await this.service.cancelWithdrawal(req.params.id, req.user.id);
    res.status(200).json({
      success: true,
      message: 'Withdrawal request cancelled successfully. Funds restored to balance.',
      data: result,
    });
  });

  handlePayoutWebhook = catchAsync(async (req, res) => {
    const result = await this.service.handlePayoutWebhook({
      headers: req.headers,
      body: req.body,
      rawBody: req.rawBody,
    });

    res.status(200).json({
      success: true,
      received: true,
      data: result,
    });
  });
}

module.exports = new WithdrawalController();
