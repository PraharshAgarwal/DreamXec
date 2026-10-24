import apiRequest from './api';
import type { UserAccountVaultItem } from './vaultService';

export interface WalletEligibility {
  eligible: boolean;
  totalBalance: number;
  pendingWithdrawals: number;
  availableBalance: number;
  minAmount: number;
  inflightCount: number;
  bankAccounts: UserAccountVaultItem[];
  reason: string | null;
}

export type WithdrawalStatus =
  | 'REQUESTED'
  | 'PROCESSING'
  | 'SETTLED'
  | 'FAILED'
  | 'CANCELLED';

export interface WithdrawalRecord {
  id: string;
  userId: string;
  tenantId?: string | null;
  amount: number;
  currency: string;
  status: WithdrawalStatus;
  vaultAccountId?: string | null;
  accountHolderName: string;
  bankAccountNumber: string;
  ifscCode?: string | null;
  upiId?: string | null;
  idempotencyKey?: string | null;
  payoutId?: string | null;
  utr?: string | null;
  failureReason?: string | null;
  metadata?: Record<string, any>;
  requestedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WithdrawalPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface MyWithdrawalsResponse {
  withdrawals: WithdrawalRecord[];
  pagination: WithdrawalPagination;
}

export const walletService = {
  /**
   * Fetches user's current double-entry ledger balance, pending holds,
   * and verified bank accounts in vault.
   */
  async getEligibility(): Promise<WalletEligibility> {
    const res = await apiRequest<WalletEligibility>('/withdrawals/eligibility', {
      skipCache: true,
    });
    return res.data || {
      eligible: false,
      totalBalance: 0,
      pendingWithdrawals: 0,
      availableBalance: 0,
      minAmount: 500,
      inflightCount: 0,
      bankAccounts: [],
      reason: 'Failed to retrieve ledger balance',
    };
  },

  /**
   * Requests a payout from the user's ledger liability account to their verified bank account.
   */
  async requestWithdrawal(payload: {
    amount: number;
    vaultAccountId: string;
    tenantId?: string | null;
  }): Promise<WithdrawalRecord> {
    const idempotencyKey = `withdr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const res = await apiRequest<WithdrawalRecord>('/withdrawals/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-idempotency-key': idempotencyKey,
      },
      body: JSON.stringify({
        ...payload,
        idempotencyKey,
      }),
      skipCache: true,
      invalidatePrefixes: ['/withdrawals', '/donations/my-ledger'],
    });

    if (!res.data) {
      throw new Error(res.message || 'Withdrawal request failed');
    }
    return res.data;
  },

  /**
   * Fetches the user's withdrawal request history.
   */
  async getMyWithdrawals(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<MyWithdrawalsResponse> {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.status && params.status !== 'ALL') query.append('status', params.status);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await apiRequest<WithdrawalRecord[]>(`/withdrawals/my${queryString}`, {
      skipCache: true,
    });

    return {
      withdrawals: res.data || (res as any)?.withdrawals || [],
      pagination: (res as any)?.pagination || {
        page: params?.page || 1,
        limit: params?.limit || 20,
        total: (res.data || []).length,
        pages: 1,
      },
    };
  },

  /**
   * Cancels a pending withdrawal in 'REQUESTED' state and restores held funds.
   */
  async cancelWithdrawal(id: string): Promise<WithdrawalRecord> {
    const res = await apiRequest<WithdrawalRecord>(`/withdrawals/${id}/cancel`, {
      method: 'POST',
      skipCache: true,
      invalidatePrefixes: ['/withdrawals', '/donations/my-ledger'],
    });

    if (!res.data) {
      throw new Error(res.message || 'Failed to cancel withdrawal');
    }
    return res.data;
  },

  /**
   * Fetches specific withdrawal details.
   */
  async getWithdrawalById(id: string): Promise<WithdrawalRecord> {
    const res = await apiRequest<WithdrawalRecord>(`/withdrawals/${id}`, {
      skipCache: true,
    });
    if (!res.data) {
      throw new Error(res.message || 'Withdrawal not found');
    }
    return res.data;
  },
};

export default walletService;
