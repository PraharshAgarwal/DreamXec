import apiRequest from "./api";
import { ServiceItem, MockOrderRecord } from "../data/mockResearcherServices";

export interface PayBalanceResponse {
  order: MockOrderRecord;
  deductedAmount: number;
  remainingBalance: number;
}

export interface RazorpayOrderResponse {
  orderId: string;
  orderNumber: string;
  razorpayOrderId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  keyId: string;
  entity: string;
}

export interface PartnerOrganizationOption {
  id: string;
  name: string;
  slug: string;
  orgType: string;
}

export const researchServicesApi = {
  /**
   * Fetch registered partner organizations & labs for admin selection
   */
  async getPartnerOrganizations(): Promise<PartnerOrganizationOption[]> {
    try {
      const res = await apiRequest<{ partners: PartnerOrganizationOption[] }>("/services/partners", {
        skipCache: true,
      });
      if (res?.data?.partners && Array.isArray(res.data.partners)) {
        return res.data.partners;
      }
    } catch (err) {
      console.error("[getPartnerOrganizations] Error:", err);
    }
    return [];
  },
  /**
   * Fetch services catalog from backend database
   */
  async getServices(params?: { category?: string; query?: string }): Promise<ServiceItem[]> {
    try {
      const res = await apiRequest<{ services: ServiceItem[] }>("/services", {
        params,
        skipCache: true,
      });
      if (res?.data?.services && Array.isArray(res.data.services)) {
        return res.data.services;
      }
    } catch (err) {
      console.error("[getServices] Error fetching services catalog:", err);
    }
    return [];
  },

  /**
   * Create a new external lab / research service in PostgreSQL
   */
  async createService(payload: any): Promise<ServiceItem> {
    const res = await apiRequest<{ service: ServiceItem }>("/services", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    if (res?.data?.service) {
      return res.data.service;
    }
    throw new Error(res?.message || "Failed to create external lab service");
  },

  /**
   * Seed / reset mock services in PostgreSQL
   */
  async seedServices(): Promise<ServiceItem[]> {
    const res = await apiRequest<{ services: ServiceItem[] }>("/services/seed", {
      method: "POST",
    });
    return res?.data?.services || [];
  },

  /**
   * Fetch current authenticated user's available account balance from DB ledger
   */
  async getAvailableBalance(): Promise<number> {
    try {
      const res = await apiRequest<{ balance: number }>("/services/balance", {
        skipCache: true,
      });
      if (res?.data?.balance !== undefined) {
        return Number(res.data.balance);
      }
    } catch {
      // Unauthenticated or no ledger account
    }
    return 0;
  },

  /**
   * Fetch current authenticated user's saved and last-used shipping address
   */
  async getUserAddress(): Promise<{ lastUsedAddress: any; savedAddresses: any[]; fullName?: string; email?: string }> {
    try {
      const res = await apiRequest<{ lastUsedAddress: any; savedAddresses: any[]; fullName?: string; email?: string }>("/services/address", {
        skipCache: true,
      });
      if (res?.data) {
        return res.data;
      }
    } catch {
      // Unauthenticated or not found
    }
    return { lastUsedAddress: null, savedAddresses: [] };
  },

  /**
   * Lab Partner Portal: Fetch outsource opportunities
   */
  async getLabOpportunities(): Promise<any[]> {
    try {
      const res = await apiRequest<{ opportunities: any[] }>("/services/lab-opportunities", {
        skipCache: true,
      });
      return res?.data?.opportunities || [];
    } catch (err) {
      console.error("[getLabOpportunities] Error:", err);
      return [];
    }
  },

  /**
   * Submit or update a lab service offering
   */
  async submitLabOffering(payload: any): Promise<any> {
    const res = await apiRequest<{ offering: any }>("/services/lab-offerings", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    if (res?.data?.offering) {
      return res.data.offering;
    }
    throw new Error(res?.message || "Failed to submit lab offering");
  },

  /**
   * Admin: Fetch pending lab offerings for moderation
   */
  async getPendingOfferings(): Promise<any[]> {
    try {
      const res = await apiRequest<{ offerings: any[] }>("/services/admin/pending-offerings", {
        skipCache: true,
      });
      return res?.data?.offerings || [];
    } catch (err) {
      console.error("[getPendingOfferings] Error:", err);
      return [];
    }
  },

  /**
   * Admin: Approve a lab offering
   */
  async approveOffering(id: string): Promise<any> {
    const res = await apiRequest(`/services/admin/offerings/${id}/approve`, {
      method: "POST",
    });
    return res?.data;
  },

  /**
   * Admin: Reject a lab offering with feedback notes
   */
  async rejectOffering(id: string, notes?: string): Promise<any> {
    const res = await apiRequest(`/services/admin/offerings/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ notes }),
      headers: { "Content-Type": "application/json" },
    });
    return res?.data;
  },

  /**
   * Live Order & Shipment Tracking
   */
  async getOrderTracking(orderRef: string): Promise<any> {
    const res = await apiRequest<{ tracking: any }>(`/services/orders/tracking/${orderRef}`, {
      skipCache: true,
    });
    if (res?.data?.tracking) {
      return res.data.tracking;
    }
    throw new Error(res?.message || "Tracking record not found");
  },

  /**
   * Update courier tracking
   */
  async updateOrderCourier(orderId: string, payload: any): Promise<any> {
    const res = await apiRequest(`/services/orders/${orderId}/courier`, {
      method: "PUT",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    return res?.data;
  },

  /**
   * Pay with Available Account Balance directly in PostgreSQL
   */
  async payWithBalance(payload: {
    serviceId: string;
    offeringId?: string;
    quantity: number;
    sampleIdentifier?: string;
    notes?: string;
    intakeData?: Record<string, any>;
    shippingAddress?: any;
    dynamicIntakeResponses?: Record<string, any>;
  }): Promise<PayBalanceResponse> {
    const res = await apiRequest<PayBalanceResponse>("/services/orders/pay-balance", {
      method: "POST",
      body: JSON.stringify(payload),
      headers: { "Content-Type": "application/json" },
    });
    if (res?.data) {
      return res.data;
    }
    throw new Error(res?.message || "Failed to process payment with account balance");
  },

  /**
   * Create Razorpay Payment Order for dreamxec.com commercial account
   */
  async createRazorpayOrder(payload: {
    serviceId: string;
    offeringId?: string;
    quantity: number;
    sampleIdentifier?: string;
    notes?: string;
    appliedFromBalance?: number;
    intakeData?: Record<string, any>;
    shippingAddress?: any;
    dynamicIntakeResponses?: Record<string, any>;
  }): Promise<RazorpayOrderResponse & { appliedFromBalance?: number }> {
    const res = await apiRequest<RazorpayOrderResponse & { appliedFromBalance?: number }>(
      "/services/orders/create-razorpay-order",
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }
    );
    if (res?.data) {
      return res.data;
    }
    throw new Error(res?.message || "Failed to initialize Razorpay checkout");
  },

  /**
   * Verify Razorpay Payment Signature and persist to database
   */
  async verifyRazorpayPayment(payload: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): Promise<any> {
    const res = await apiRequest<{ success: boolean; remainingBalance: number }>(
      "/services/orders/verify-razorpay-payment",
      {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      }
    );
    if (res?.data) {
      return res.data;
    }
    throw new Error(res?.message || "Payment verification failed");
  },

  /**
   * Fetch authenticated user's active orders from PostgreSQL
   */
  async getMyOrders(): Promise<MockOrderRecord[]> {
    try {
      const res = await apiRequest<{ orders: MockOrderRecord[] }>("/services/orders", {
        skipCache: true,
      });
      if (Array.isArray(res?.data?.orders)) {
        return res.data.orders;
      }
    } catch {
      // Unauthenticated or fetch failed
    }
    return [];
  },

  /**
   * Accept deliverable report and release escrow
   */
  async acceptDeliverable(orderId: string): Promise<any> {
    const res = await apiRequest(`/services/orders/${orderId}/accept`, {
      method: "POST",
    });
    return res;
  },
};
