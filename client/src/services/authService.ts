import apiRequest, { setToken, removeToken, type ApiResponse } from "./api";
import { getApiBaseUrl } from "../utils/apiConfig";

export interface UserProfile {
  organizationId?: string | null;
  role: string;
  status?: string;
  orgName?: string;
  orgSlug?: string;
  orgType?: string;
  isIndependent?: boolean;
  label?: string;
  description?: string;
}

export type IdentityType = "USER" | "ORG_MEMBER" | "ORG_ADMIN";

export interface User {
  clubVerified: boolean;
  isClubMember: boolean;
  isClubPresident: boolean;
  updatedAt: string;
  createdAt: string;
  clubIds: any[];
  emailVerified: boolean;
  id: string;
  name: string;
  email: string;
  role: string;
  permissions?: string[];
  organizationName?: string;
  studentVerified?: boolean;
  accountStatus?: "ACTIVE" | "BLOCKED" | "SUSPENDED" | "UNDER_REVIEW";
  profileComplete: boolean;
  activeIdentityType?: IdentityType;
  independentProfile?: UserProfile;
  memberProfiles?: UserProfile[];
  adminProfiles?: UserProfile[];
  availableProfiles?: UserProfile[];
  activeProfile?: UserProfile;
  organizations?: UserProfile[];
  roles?: string[];
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: string;
  organizationName?: string;
  institutionName?: string;
  institutionAicteId?: string;
  institutionState?: string;
  isMinor?: boolean;
  guardianEmail?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

// Check Email Availability
export const checkEmailAvailability = async (email: string): Promise<{ available: boolean; message: string }> => {
  try {
    const res = await apiRequest<{ available: boolean; message: string }>("/auth/check-email", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
    return {
      available: res.data?.available ?? true,
      message: res.data?.message || "Email check complete",
    };
  } catch (err: any) {
    return {
      available: false,
      message: err?.message || "Failed to check email availability",
    };
  }
};

// Send Email OTP
export const sendOTP = async (email: string): Promise<ApiResponse<any>> => {
  return apiRequest("/auth/send-otp", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

// Verify Email OTP
export const verifyOTP = async (email: string, otp: string): Promise<ApiResponse<any>> => {
  return apiRequest("/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp }),
  });
};
// Claim and activate verified role after workflow completion
export const claimRole = async (
  organizationId: string,
  role: string,
  workflowInstanceId?: string
): Promise<ApiResponse<AuthResponse>> => {
  const payload: any = { organizationId, role };
  if (workflowInstanceId) {
    payload.workflowInstanceId = workflowInstanceId;
  }
  const response = await apiRequest<AuthResponse>("/auth/claim-role", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.token) {
    setToken(response.token);
    try {
      window.dispatchEvent(new CustomEvent("auth:refresh", { detail: response }));
      window.dispatchEvent(new CustomEvent("dx:auth-refresh", { detail: response }));
    } catch {}
  }

  return response;
};

// Register a new user
export const register = async (
  data: RegisterData,
): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiRequest<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: data.name,
      email: data.email,
      password: data.password,
    }),
  });

  if (response.token) {
    setToken(response.token);
  }

  return response;
};

// Login user
export const login = async (
  data: LoginData,
): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });

  if (response.token) {
    setToken(response.token);
  }

  return response;
};

// Get current user
export const getCurrentUser = async (): Promise<ApiResponse<AuthResponse>> => {
  return apiRequest<AuthResponse>("/auth/me", {
    method: "GET",
  });
};

// Switch active profile
export const switchProfile = async (
  organizationId?: string | null,
  role?: string,
  isIndependent?: boolean,
): Promise<ApiResponse<AuthResponse>> => {
  const response = await apiRequest<AuthResponse>("/auth/switch-profile", {
    method: "POST",
    body: JSON.stringify({
      organizationId: organizationId || null,
      role: role || "USER",
      isIndependent: Boolean(isIndependent || !organizationId || role === "USER"),
    }),
  });

  if (response.token) {
    setToken(response.token);
  }

  return response;
};

// Logout
export const logout = (): void => {
  removeToken();
};

// Forgot password
export const forgotPassword = async (
  email: string,
): Promise<ApiResponse<any>> => {
  return apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
};

// Verify reset token validity
export const verifyResetToken = async (
  token: string,
): Promise<ApiResponse<{ valid: boolean; email?: string; expiresAt?: string }>> => {
  return apiRequest(`/auth/verify-reset-token?token=${encodeURIComponent(token)}`, {
    method: "GET",
    skipCache: true,
  });
};

// Reset password
export const resetPassword = async (
  token: string,
  password: string,
): Promise<ApiResponse<any>> => {
  return apiRequest(`/auth/reset-password?token=${encodeURIComponent(token)}`, {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
};

// Google OAuth - Initiate authentication
export const initiateGoogleAuth = (
  role: string,
): void => {
  const API_URL = getApiBaseUrl();
  const clientOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const clientParam = clientOrigin ? `&clientUrl=${encodeURIComponent(clientOrigin)}` : "";

  const authUrl = `${API_URL}/auth/google?role=${role}${clientParam}`;
  console.log("🔗 Redirecting to Google OAuth:", authUrl);

  window.location.href = authUrl;
};

// Google OAuth - Handle callback (called after redirect from Google)
export const handleGoogleCallback = async (): Promise<
  ApiResponse<AuthResponse>
> => {
  // Get token from URL params (backend should redirect with token)
  const urlParams = new URLSearchParams(window.location.search);
  let token = urlParams.get("token");

  if (!token && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    token = hashParams.get("token");
  }

  if (token) {
    setToken(token);
  }

  // Fetch user data
  return getCurrentUser();
};
