/**
 * 4-Eyes Maker-Checker Milestone Disbursement Governance Engine
 * Rule: makerUserId MUST NOT equal checkerUserId.
 */
const ledgerService = require('./ledger.service');

class DisbursementService {
  /**
   * Maker initiates tranche payout request
   */
  createDisbursementIntent({ milestoneId, campaignId, amount, makerUserId, bankDetails, notes }) {
    if (!milestoneId || !makerUserId || !amount || amount <= 0) {
      throw new Error('Invalid disbursement intent parameters.');
    }

    const disbursement = {
      id: `disb_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      milestoneId,
      campaignId,
      amount: Number(amount),
      status: 'INITIATED',
      makerUserId,
      checkerUserId: null,
      bankDetails: bankDetails || null,
      notes: notes || '',
      initiatedAt: new Date().toISOString(),
      authorizedAt: null,
      settledAt: null,
      ledgerTxId: null,
    };

    return disbursement;
  }

  /**
   * Checker reviews and authorizes/rejects disbursement
   * Strict 4-Eyes Rule (B9): checkerUserId !== makerUserId AND checkerUserId !== verifierUserId
   */
  authorizeDisbursement(disbursement, { checkerUserId, checkerRole, checkerPermissions = [], decision, remarks, verifierUserId = null }) {
    if (!disbursement) {
      throw new Error('Disbursement record not found.');
    }
    if (disbursement.status !== 'INITIATED') {
      throw new Error(`Cannot authorize disbursement in status '${disbursement.status}'.`);
    }
    if (!checkerUserId) {
      throw new Error('Checker user ID is required to authorize disbursement.');
    }

    // ── 4-EYES PRINCIPLE ENFORCEMENT (B9) ──
    if (checkerUserId === disbursement.makerUserId) {
      throw new Error(
        '4-Eyes Governance Violation: The Maker and Checker must be two distinct individuals. A maker cannot authorize their own disbursement.'
      );
    }

    // A milestone proof verifier can never act as the release checker on the same transaction (B9)
    const proofVerifier = verifierUserId || disbursement.verifierUserId;
    if (proofVerifier && checkerUserId === proofVerifier) {
      throw new Error(
        '4-Eyes Governance Violation: The verifier of the milestone proof cannot act as the checker releasing funds for the same milestone transaction.'
      );
    }

    // Enforce role authorization if provided (FINANCE_OFFICER, ADMIN, SUPER_ADMIN)
    if (checkerRole) {
      const allowedRoles = ['FINANCE_OFFICER', 'ADMIN', 'SUPER_ADMIN'];
      const hasPermission = checkerPermissions.includes('finance:disburse:check');
      if (!allowedRoles.includes(checkerRole) && !hasPermission) {
        throw new Error(
          `PBAC Violation: Role '${checkerRole}' is not authorized to act as a financial checker for milestone disbursements.`
        );
      }
    }

    if (decision === 'REJECTED') {
      return {
        ...disbursement,
        status: 'REJECTED',
        checkerUserId,
        rejectionRemarks: remarks || 'Rejected by institutional checker.',
        reviewedAt: new Date().toISOString(),
      };
    }

    if (decision === 'APPROVED') {
      // Generate double-entry ledger journal
      const journal = ledgerService.createMilestoneDisbursementJournal({
        disbursementId: disbursement.id,
        campaignId: disbursement.campaignId,
        milestoneId: disbursement.milestoneId,
        amount: disbursement.amount,
      });

      return {
        ...disbursement,
        status: 'AUTHORIZED',
        checkerUserId,
        authorizedAt: new Date().toISOString(),
        payoutReference: `PAYOUT_SETTLE_${Date.now()}`,
        ledgerTxId: `tx_${Date.now()}`,
        ledgerJournal: journal,
      };
    }

    throw new Error(`Invalid authorization decision '${decision}'. Must be APPROVED or REJECTED.`);
  }
}

module.exports = new DisbursementService();
