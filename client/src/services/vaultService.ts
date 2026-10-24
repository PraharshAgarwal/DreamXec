import apiRequest from './api';

export type VaultDocumentType =
  | 'GOVT_ID'
  | 'STUDENT_ID'
  | 'UNIVERSITY_ENDORSEMENT'
  | 'BANK_PASSBOOK'
  | 'INVOICE'
  | 'PROJECT_PROPOSAL'
  | 'ORGANIZATION_REGISTRATION'
  | 'OTHER';

export type VaultAccountType =
  | 'INDIVIDUAL_SAVINGS'
  | 'INDIVIDUAL_CURRENT'
  | 'INSTITUTIONAL_CURRENT'
  | 'STUDENT_CLUB';

export interface UserDocVaultItem {
  id: string;
  userId: string;
  documentType: VaultDocumentType;
  title: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType?: string;
  isVerified: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccountVaultItem {
  id: string;
  userId: string;
  accountNickname?: string;
  accountHolderName: string;
  bankAccountNumber: string;
  ifscCode: string;
  bankName?: string;
  upiId?: string;
  accountType: VaultAccountType;
  isPrimary: boolean;
  isVerified: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const vaultService = {
  // ── DOC VAULT METHODS ──

  async getDocuments(documentType?: string, search?: string): Promise<UserDocVaultItem[]> {
    const params = new URLSearchParams();
    if (documentType && documentType !== 'ALL') params.append('documentType', documentType);
    if (search) params.append('search', search);

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const res = await apiRequest<{ documents: UserDocVaultItem[] }>(`/vault/documents${queryString}`);
    return res.data?.documents || (res as any)?.documents || [];
  },

  async saveDocument(data: {
    title?: string;
    fileName?: string;
    fileUrl: string;
    documentType?: VaultDocumentType | string;
    fileSizeBytes?: number;
    mimeType?: string;
    metadata?: Record<string, any>;
  }): Promise<UserDocVaultItem> {
    const res = await apiRequest<{ document: UserDocVaultItem }>('/vault/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data?.document || (res as any)?.document;
  },

  async deleteDocument(id: string): Promise<void> {
    await apiRequest(`/vault/documents/${id}`, {
      method: 'DELETE',
    });
  },

  // ── ACCOUNT VAULT METHODS ──

  async getAccounts(): Promise<UserAccountVaultItem[]> {
    const res = await apiRequest<{ accounts: UserAccountVaultItem[] }>('/vault/accounts');
    return res.data?.accounts || (res as any)?.accounts || [];
  },

  async saveAccount(data: {
    accountNickname?: string;
    accountHolderName: string;
    bankAccountNumber: string;
    ifscCode: string;
    bankName?: string;
    upiId?: string;
    accountType?: VaultAccountType | string;
    isPrimary?: boolean;
    metadata?: Record<string, any>;
  }): Promise<UserAccountVaultItem> {
    const res = await apiRequest<{ account: UserAccountVaultItem }>('/vault/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.data?.account || (res as any)?.account;
  },

  async deleteAccount(id: string): Promise<void> {
    await apiRequest(`/vault/accounts/${id}`, {
      method: 'DELETE',
    });
  },

  // ── IFSC & RAPID KYC METHODS ──

  async lookupIfsc(ifscCode: string): Promise<IfscLookupResult> {
    const clean = ifscCode.trim().toUpperCase();
    const res = await apiRequest<{ valid: boolean; data?: any }>(`/vault/ifsc/${clean}`);
    return (res.data?.data || res.data || res) as IfscLookupResult;
  },

  async initiateKycVerification(accountData: {
    accountNickname?: string;
    accountHolderName: string;
    bankAccountNumber: string;
    ifscCode: string;
    bankName?: string;
    upiId?: string;
    accountType?: VaultAccountType | string;
    isPrimary?: boolean;
  }): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    key: string;
    accountData: any;
    ifscInfo?: IfscLookupResult;
  }> {
    const res = await apiRequest<any>('/vault/accounts/verify/initiate', {
      method: 'POST',
      body: JSON.stringify(accountData),
    });
    return (res.data?.data || res.data || res);
  },

  async confirmKycVerification(payload: {
    orderId: string;
    paymentId: string;
    signature: string;
    accountData: any;
  }): Promise<{
    verified: boolean;
    account: UserAccountVaultItem;
    message?: string;
  }> {
    const res = await apiRequest<any>('/vault/accounts/verify/confirm', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return (res.data?.data || res.data || res);
  },
};

export interface IfscLookupResult {
  valid: boolean;
  ifsc?: string;
  bank?: string;
  bankCode?: string;
  branch?: string;
  address?: string;
  city?: string;
  district?: string;
  state?: string;
  micr?: string | null;
  rails?: {
    upi: boolean;
    neft: boolean;
    imps: boolean;
    rtgs: boolean;
  };
  message?: string;
}
