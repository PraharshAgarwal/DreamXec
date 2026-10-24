import apiRequest, { clearApiCache, type ApiResponse } from './api';

/* =======================
   TYPES - FIXED!
======================= */
export interface DonorEligibility {
  totalDonated: number;
  perProjectCost: number;
  allowedProjects: number;
  createdProjects: number;
  remainingProjects: number;
  canCreateOpportunity: boolean;
}



export interface DonationMilestone {
  id: string;
  title: string;
  description?: string;
  targetAmount?: number;
  status?: string;
  sequenceOrder?: number;
}

export interface DonationCampaign {
  id: string;
  slug?: string;
  title: string;
  imageUrl?: string;
  coverImageUrl?: string;
  category?: string;
  stage?: string;
  status?: string;
  currentRaisedAmount?: number;
  targetAmount?: number;
  tenant?: {
    id: string;
    name: string;
    slug?: string;
  };
  milestones?: DonationMilestone[];
}

// Donation response
export interface Donation {
  id: string;
  amount: number;
  currency?: string;
  message?: string;
  anonymous: boolean;
  paymentStatus: string;
  paymentId?: string;
  orderId?: string;
  donor?: {
    id: string;
    name: string;
    organizationName?: string;
  };
  guestEmail?: string;
  campaign?: DonationCampaign;
  userProject?: {
    id: string;
    title: string;
    imageUrl?: string;
    amountRaised?: number;
    goalAmount?: number;
  };
  createdAt: string;
}

// ✅ FIXED: SPLIT INTO 3 CLEAR TYPES
export interface AuthenticatedDonationData {
  amount: number;
  projectId: string;
  message?: string;
  anonymous?: boolean;
}

export interface GuestDonationData {
  amount: number;
  projectId: string;
  email: string;        // REQUIRED for guests
  name?: string;
  message?: string;
  anonymous?: boolean;
}

// Backend still accepts old format for compatibility
export interface CreateOrderData {
  amount: number;
  projectId: string;
  email?: string;
  name?: string;
  message?: string;
  anonymous?: boolean;
}

export interface VerifyPaymentData {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  projectId?: string;
}

export interface DonationSummary {
  totalAmount: number;
  totalDonated?: number;
  donationsCount: number;
  projectsSupported: number;
  campaignsBacked?: number;
  categoriesSupported?: number;
  studentsSupported?: number;
}

/* =======================
   API CALLS - FIXED!
======================= */

/**
 * Google/Auth users ONLY - NO EMAIL!
 */
export const createRazorpayOrderAuthenticated = async ({
  amount,
  projectId,
  email,
  name,
  message,
  anonymous,
}: {
  amount: number;
  projectId: string;
  email?: string;
  name?: string;
  message?: string;
  anonymous?: boolean;
}) => {
  return apiRequest('/donations/create-order', {
    method: 'POST',
    body: JSON.stringify({
      amount,
      projectId,
      email: email || undefined,
      name,
      message,
      anonymous,
    }),
  });
};


/**
 * Guest users ONLY - WITH EMAIL!
 */
export const createRazorpayOrderGuest = async (
  data: GuestDonationData
): Promise<ApiResponse<{
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  key: string;
}>> => {
  return apiRequest('/donations/create-order', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Backward compatibility
export const createRazorpayOrder = async (
  data: CreateOrderData
): Promise<ApiResponse<{
  success: boolean;
  orderId: string;
  amount: number;
  currency: string;
  key: string;
}>> => {
  return apiRequest('/donations/create-order', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export interface VerifyPaymentResponse {
  success: boolean;
  message: string;
  status?: string;
  orderId?: string;
  paymentId?: string;
  campaign?: any;
}

export interface DonationStatusResponse {
  found: boolean;
  orderId: string;
  paymentId: string | null;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'UNKNOWN';
  isSettled: boolean;
  amount: number;
  currency: string;
  campaignTitle: string | null;
  campaignId: string | null;
  campaign?: any;
  createdAt: string;
  error?: string | null;
}

export const verifyPayment = async (
  data: VerifyPaymentData
): Promise<ApiResponse<VerifyPaymentResponse>> => {
  const res = await apiRequest<VerifyPaymentResponse>('/donations/verify', {
    method: 'POST',
    body: JSON.stringify(data),
    skipCache: true,
  });
  clearApiCache('/campaigns');
  clearApiCache('campaign');
  clearApiCache('/donations');
  clearApiCache('donations');

  const resolvedCampaign = res.data?.campaign || (res as any)?.campaign;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('dx:campaign_updated', {
        detail: {
          campaign: resolvedCampaign,
          orderId: data.razorpay_order_id,
        },
      })
    );
    window.dispatchEvent(
      new CustomEvent('dx:transaction_updated', {
        detail: {
          campaign: resolvedCampaign,
          orderId: data.razorpay_order_id,
          paymentId: data.razorpay_payment_id,
          timestamp: Date.now(),
        },
      })
    );
    window.dispatchEvent(
      new CustomEvent('dx:ledger_updated', {
        detail: {
          orderId: data.razorpay_order_id,
          paymentId: data.razorpay_payment_id,
          timestamp: Date.now(),
        },
      })
    );
  }

  return res;
};

export const getDonationStatus = async (
  orderId: string
): Promise<ApiResponse<DonationStatusResponse>> => {
  return apiRequest(`/donations/status/${orderId}`, {
    method: 'GET',
    skipCache: true,
  });
};

export const getMyDonations = async (
  orgId?: string | null
): Promise<ApiResponse<{ donations: Donation[] }>> => {
  const query = orgId ? `?orgId=${encodeURIComponent(orgId)}` : '';
  const headers: Record<string, string> = {};
  if (orgId) {
    headers['x-organization-id'] = orgId;
  }
  return apiRequest(`/donations/my${query}`, {
    method: 'GET',
    headers,
  });
};

export const getMyLedger = async (
  orgId?: string | null
): Promise<ApiResponse<{ transactions: any[] }>> => {
  const query = orgId ? `?orgId=${encodeURIComponent(orgId)}` : '';
  const headers: Record<string, string> = {};
  if (orgId) {
    headers['x-organization-id'] = orgId;
  }
  return apiRequest(`/donations/my-ledger${query}`, {
    method: 'GET',
    headers,
    skipCache: true,
  });
};

export const getProjectDonations = async (
  projectId: string
): Promise<ApiResponse<{ donations: Donation[] }>> => {
  return apiRequest(`/donations/project/${projectId}`, {
    method: 'GET',
  });
};

export const getDonationSummary = async (
  orgId?: string | null
): Promise<ApiResponse<{ summary: DonationSummary }>> => {
  const query = orgId ? `?orgId=${encodeURIComponent(orgId)}` : '';
  const headers: Record<string, string> = {};
  if (orgId) {
    headers['x-organization-id'] = orgId;
  }
  return apiRequest(`/donations/summary${query}`, {
    method: 'GET',
    headers,
  });
};

export const getMyDonorEligibility = async (): Promise<
  ApiResponse<DonorEligibility>
> => {
  return apiRequest('/donations/me/eligibility', {
    method: 'GET',
  });
};

/* =========================================================
   STATUTORY 80G TAX EXEMPTION & CSR UTILISATION EXPORTS (K6, K7, O2)
========================================================= */

export interface Receipt80G {
  receiptNumber: string;
  approvalRegistrationNumber: string;
  date: string;
  financialYear: string;
  institutionName: string;
  institutionSubtitle?: string;
  institutionAddress?: string;
  institutionPan: string;
  institutionTan?: string;
  institutionCin?: string;
  section12AReg?: string;
  statutoryOrder: string;
  statutoryStandard?: string;
  deductionPercentage?: string | number;
  assessmentYear?: string;
  donor: {
    name: string;
    email: string;
    pan: string;
    identificationType?: string;
  };
  campaignTitle: string;
  amount: number;
  amountInWords: string;
  currency: string;
  modeOfPayment?: string;
  paymentReference: string;
  exemptionNote: string;
  form10BeNotice?: string;
  eligibleDeductionAmount?: number;
  authorizedSignatory?: string;
  qrVerificationPayload?: string;
}

export interface CSRUtilisationReport {
  campaignId: string;
  campaignTitle: string;
  institution: string;
  studentLead: string;
  totalGrantBudget: number;
  totalContributionsReceived: number;
  totalDisbursedToDate: number;
  escrowBalanceHeld: number;
  disbursementPercentage: number;
  tranches: Array<{
    sequenceOrder: number;
    title: string;
    targetAmount: number;
    releasedAmount: number;
    status: string;
    makerSignoff: string;
    checkerSignoff: string;
    payoutReference: string;
    ledgerTxId: string;
    settledAt: string | null;
  }>;
  donorsCount: number;
  statutoryDeclaration: string;
}

export const get80GReceipt = async (
  donationId: string
): Promise<ApiResponse<{ receipt: Receipt80G }>> => {
  return apiRequest(`/donations/${donationId}/receipt-80g`, {
    method: 'GET',
  });
};

export const getCSRUtilisationReport = async (
  campaignId: string
): Promise<ApiResponse<{ utilisationReport: CSRUtilisationReport }>> => {
  return apiRequest(`/donations/campaign/${campaignId}/utilisation-report`, {
    method: 'GET',
  });
};

