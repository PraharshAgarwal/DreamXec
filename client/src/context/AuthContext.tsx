import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import type { User } from "../types";
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getCurrentUser,
  initiateGoogleAuth,
  switchProfile as apiSwitchProfile,
  forgotPassword as apiForgotPassword,
} from "../services/authService";
import { mapBackendRole, mapFrontendRole } from "../services/mappers";
import { getToken, setToken } from "../services/api";
import { getAvatarUrl } from "../utils/avatarHelper";

type BackendRoleType =
  | "USER"
  | "DONOR"
  | "ADMIN"
  | "STUDENT_PRESIDENT"
  | "COMPLIANCE_OFFICER"
  | "INCUBATOR_MANAGER"
  | "PROFESSOR"
  | "RESEARCHER"
  | "MENTOR"
  | "ORG_ADMIN"
  | "CORPORATE_ADMIN";

interface BackendUser {
  id: string;
  email: string;
  role: BackendRoleType | string;
  permissions?: string[];
  emailVerified?: boolean;
  clubIds?: string[];
  createdAt?: string;
  updatedAt?: string;
  isClubPresident?: boolean;
  isClubMember?: boolean;
  clubVerified?: boolean;
  profileComplete?: boolean;
  name?: string;
  fullName?: string;
  username?: string;
  profilePicture?: string;
  avatar?: string;
  speciesId?: string;
  speciesNumber?: number;
  speciesIdentity?: any;
  studentVerified?: boolean;
  accountStatus?: "ACTIVE" | "BLOCKED" | "SUSPENDED" | "UNDER_REVIEW";
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  handleLogout: () => void;
  handleLogin: (
    email: string,
    password: string,
    role?: string,
  ) => Promise<BackendUser | undefined>;
  handleSignup: (
    name: string,
    email: string,
    password: string,
    role?: string,
    institution?: string,
    institutionMeta?: {
      institutionName: string;
      aicteId?: string;
      state?: string;
    },
  ) => Promise<
    { requiresVerification?: boolean; user?: BackendUser } | undefined
  >;
  handleGoogleAuth: (role?: "student" | "donor" | string) => Promise<void>;
  handleOAuthSuccess: (token: string) => Promise<User | null>;
  handleForgotPassword: (email: string) => Promise<void>;
  handleEmailVerificationSuccess: (backendUser: BackendUser) => void;
  handleSwitchProfile: (organizationId?: string | null, role?: string, isIndependent?: boolean) => Promise<void>;
  switchToIndependentMode: () => Promise<void>;
  clearActiveProfile: () => void;
  isIndependentUser: boolean;
  isOrgMember: boolean;
  isOrgAdmin: boolean;
  currentIdentityType: 'USER' | 'ORG_MEMBER' | 'ORG_ADMIN';
  signupEmail: string;
  setSignupEmail: React.Dispatch<React.SetStateAction<string>>;
  showCheckEmail: boolean;
  setShowCheckEmail: React.Dispatch<React.SetStateAction<boolean>>;
  personaMode: 'species' | 'real';
  setPersonaMode: (mode: 'species' | 'real') => void;
  togglePersonaMode: () => void;
}

const CACHED_USER_KEY = 'dx_cached_user';

const getCachedUser = (): User | null => {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setCachedUser = (u: User | null) => {
  try {
    if (u) {
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(u));
    } else {
      localStorage.removeItem(CACHED_USER_KEY);
    }
  } catch {}
};

// Helper to create User object from backend response
export const createUserData = (backendUser: BackendUser): User => {
  const adminRoles = ['ORG_ADMIN', 'CORPORATE_ADMIN', 'INCUBATOR_MANAGER', 'ADMIN', 'DX_ADMIN'];
  
  const rawProfiles = ((backendUser as any).availableProfiles || [])
    .filter((p: any) => !p.status || p.status === 'ACTIVE')
    .map((p: any) => ({
      ...p,
      organizationId: p.organizationId || p.orgId,
    }));

  const activeProfile = (backendUser as any).activeProfile
    ? {
        ...(backendUser as any).activeProfile,
        organizationId: (backendUser as any).activeProfile.organizationId || (backendUser as any).activeProfile.orgId,
      }
    : undefined;

  let activeIdentityType: 'USER' | 'ORG_MEMBER' | 'ORG_ADMIN' = (backendUser as any).activeIdentityType;
  if (!activeIdentityType) {
    if (activeProfile) {
      activeIdentityType = adminRoles.includes((activeProfile.role || '').toUpperCase()) ? 'ORG_ADMIN' : 'ORG_MEMBER';
    } else {
      activeIdentityType = 'USER';
    }
  }

  const memberProfiles = rawProfiles.filter((p: any) => !adminRoles.includes((p.role || '').toUpperCase()));
  const adminProfiles = rawProfiles.filter((p: any) => adminRoles.includes((p.role || '').toUpperCase()));
  const independentProfile = (backendUser as any).independentProfile || {
    role: 'USER',
    label: 'Independent User',
    description: 'Individual platform user with no organization constraints',
    isIndependent: true,
    organizationId: null,
    orgName: 'Independent (No Organization)',
    orgSlug: null,
  };

  return {
    id: backendUser.id,
    email: backendUser.email,
    role: mapBackendRole(backendUser.role as any),
    permissions: backendUser.permissions || [],
    emailVerified: backendUser.emailVerified || false,
    clubIds: backendUser?.clubIds || [],
    profileComplete: backendUser.profileComplete,
    createdAt: backendUser.createdAt || new Date().toISOString(),
    updatedAt: backendUser.updatedAt || new Date().toISOString(),
    isClubPresident: backendUser?.isClubPresident || false,
    isClubMember: backendUser?.isClubMember || false,
    clubVerified: backendUser?.clubVerified || false,
    name: backendUser.name || backendUser.fullName || '',
    username: backendUser.username,
    profilePicture: getAvatarUrl(
      backendUser.profilePicture || backendUser.avatar || backendUser.speciesIdentity?.avatarUrl,
      backendUser.speciesIdentity?.slug,
      backendUser.username
    ),
    avatar: getAvatarUrl(
      backendUser.profilePicture || backendUser.avatar || backendUser.speciesIdentity?.avatarUrl,
      backendUser.speciesIdentity?.slug,
      backendUser.username
    ),
    realAvatar: (backendUser as any).profileMetadata?.avatarUrl || (backendUser as any).profileMetadata?.googleAvatarUrl || backendUser.profilePicture || backendUser.avatar || undefined,
    profileMetadata: (backendUser as any).profileMetadata || {},
    speciesId: backendUser.speciesId,
    speciesNumber: backendUser.speciesNumber,
    speciesIdentity: backendUser.speciesIdentity,
    studentVerified: backendUser?.studentVerified || false,
    accountStatus: backendUser.accountStatus || "ACTIVE",
    activeIdentityType,
    independentProfile,
    memberProfiles,
    adminProfiles,
    availableProfiles: rawProfiles,
    activeProfile,
    organizations: ((backendUser as any).organizations || (backendUser as any).availableProfiles || [])
      .filter((o: any) => !o.status || o.status === 'ACTIVE')
      .map((o: any) => ({
        id: o.id || o.organizationId || o.orgId,
        name: o.name || o.orgName || '',
        slug: o.slug || o.orgSlug || '',
        orgType: o.orgType,
        role: o.role,
        status: o.status,
      })),
    roles: (backendUser as any).roles || [mapBackendRole(backendUser.role as any)],
  };
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUserState] = useState<User | null>(() => getCachedUser());
  const [loading, setLoading] = useState<boolean>(() => !getToken() ? false : !getCachedUser());
  const [signupEmail, setSignupEmail] = useState("");
  const [showCheckEmail, setShowCheckEmail] = useState(false);
  const [personaMode, setPersonaModeState] = useState<'species' | 'real'>(() => {
    try {
      const saved = localStorage.getItem('dx_persona_mode');
      if (saved === 'real' || saved === 'species') return saved;
      return 'species';
    } catch {
      return 'species';
    }
  });

  const setPersonaMode = useCallback((mode: 'species' | 'real') => {
    setPersonaModeState(mode);
    try {
      localStorage.setItem('dx_persona_mode', mode);
    } catch {}
  }, []);

  const togglePersonaMode = useCallback(() => {
    setPersonaModeState((prev) => {
      const next = prev === 'species' ? 'real' : 'species';
      try {
        localStorage.setItem('dx_persona_mode', next);
      } catch {}
      return next;
    });
  }, []);

  const hasLoadedUserRef = useRef(false);
  const navigate = useNavigate();

  const setUser = (u: User | null | ((prev: User | null) => User | null)) => {
    setUserState((prev) => {
      const nextUser = typeof u === 'function' ? u(prev) : u;
      setCachedUser(nextUser);
      return nextUser;
    });
  };

  // Helper to create User object from backend response
  // Load user from token on mount
  useEffect(() => {
    if (hasLoadedUserRef.current) {
      return;
    }

    hasLoadedUserRef.current = true;

    const loadUser = async () => {
      if (!getToken()) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const response = await getCurrentUser();
        if (response.data?.user) {
          setUser(createUserData(response.data.user));
        }
      } catch (error: unknown) {
        apiLogout();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    const handleAuthExpired = () => {
      setUser(null);
    };

    const handleAuthRefresh = async () => {
      if (!getToken()) return;
      try {
        const response = await getCurrentUser();
        if (response.data?.user) {
          setUser(createUserData(response.data.user));
        }
      } catch (err) {
        console.warn("Failed to refresh user auth context:", err);
      }
    };

    window.addEventListener("dx:auth-expired", handleAuthExpired);
    window.addEventListener("auth:refresh", handleAuthRefresh);
    window.addEventListener("dx:auth-refresh", handleAuthRefresh);
    return () => {
      window.removeEventListener("dx:auth-expired", handleAuthExpired);
      window.removeEventListener("auth:refresh", handleAuthRefresh);
      window.removeEventListener("dx:auth-refresh", handleAuthRefresh);
    };
  }, []);


  const handleLogout = useCallback(() => {
    apiLogout();
    setUser(null);
    toast.success("Signed out successfully.");
  }, []);

  const handleLogin = useCallback(
    async (
      email: string,
      password: string,
      _role?: string,
    ): Promise<BackendUser | undefined> => {
      try {
        const response = await apiLogin({ email, password });
        if (response.token) {
          setToken(response.token);
        }
        if (response.data?.user) {
          const backendUser = response.data.user as BackendUser;
          setUser(createUserData(backendUser));
          toast.success(`Welcome back, ${backendUser.fullName || backendUser.name || 'User'}!`);
          return backendUser;
        }
        return undefined;
      } catch (error: any) {
        console.error("Login failed:", error);
        toast.error(error?.message || "Login failed. Please check credentials.");
        throw error;
      }
    },
    [],
  );

  const handleSignup = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      _role?: string,
      institution?: string,
      institutionMeta?: {
        institutionName: string;
        aicteId?: string;
        state?: string;
      },
    ): Promise<
      { requiresVerification?: boolean; user?: BackendUser } | undefined
    > => {
      try {
        const response = await apiRegister({
          name,
          email,
          password,
        });

        if (
          response.message &&
          response.message.includes("verification email")
        ) {
          setSignupEmail(email);
          setShowCheckEmail(true);
          toast.success("Registration successful! Check your email for verification link.");
          return { requiresVerification: true };
        } else if (response.data?.user) {
          setUser(createUserData(response.data.user as BackendUser));
          toast.success("Account created successfully!");
          return { user: response.data.user as BackendUser };
        }
        return undefined;
      } catch (error: any) {
        console.error("Signup failed:", error);
        toast.error(error?.message || "Registration failed.");
        throw error;
      }
    },
    [],
  );

  const handleGoogleAuth = useCallback(async (role?: "student" | "donor" | string) => {
    try {
      const backendRole = role ? (role === "donor" ? "DONOR" : mapFrontendRole(role as any)) : "USER";
      initiateGoogleAuth(backendRole);
    } catch (error) {
      console.error("Google auth error:", error);
      toast.error("Google authentication failed.");
      throw new Error("Google authentication failed");
    }
  }, []);

  const handleOAuthSuccess = useCallback(async (token: string): Promise<User | null> => {
    try {
      setToken(token);
      const response = await getCurrentUser();
      if (response.data?.user) {
        const userData = createUserData(response.data.user as BackendUser);
        setUser(userData);
        toast.success(`Welcome, ${userData.name || 'User'}!`);
        return userData;
      }
      return null;
    } catch (err: any) {
      console.error("[AuthContext] Error in handleOAuthSuccess:", err);
      toast.error(err?.message || "Failed to load user profile.");
      return null;
    }
  }, []);

  const handleForgotPassword = useCallback(async (email: string) => {
    try {
      const res = await apiForgotPassword(email);
      console.log(`✅ Password reset link requested for ${email}:`, res);
      toast.success("Password reset instructions have been sent to your email!");
      if (res?.data?.resetUrl || (res as any)?.resetUrl) {
        const link = res?.data?.resetUrl || (res as any)?.resetUrl;
        console.log(`🔗 Password Reset Link: ${link}`);
      }
    } catch (error: any) {
      console.error("Forgot password error:", error);
      toast.error(error?.message || "Failed to send password reset email.");
      throw new Error(error?.message || "Failed to send password reset email");
    }
  }, []);

  const handleEmailVerificationSuccess = useCallback(
    (backendUser: BackendUser) => {
      setUser(createUserData(backendUser));
      toast.success("Email verified successfully!");
    },
    [],
  );

  const handleSwitchProfile = useCallback(
    async (organizationId?: string | null, role?: string, isIndependent?: boolean) => {
      try {
        console.log("[AuthContext] Switching profile:", { organizationId, role, isIndependent });
        const response = await apiSwitchProfile(organizationId, role, isIndependent);
        console.log("[AuthContext] Switch response:", response);
        
        if (response.data?.user) {
          const userData = createUserData(response.data.user as BackendUser);
          console.log("[AuthContext] Setting user with activeProfile:", userData.activeProfile, "activeIdentityType:", userData.activeIdentityType);
          setUser(userData);
          const identityLabel = userData.activeIdentityType === 'USER' ? 'Independent User' : (userData.activeProfile?.role || role || 'Selected Profile');
          toast.success(`Switched active profile to ${identityLabel}`);
        } else if (response.status === 'error') {
          throw new Error(response.message || 'Profile switch failed');
        } else {
          throw new Error('No user data in switch-profile response');
        }
      } catch (error: any) {
        console.error("Switch profile failed:", error);
        toast.error(error?.message || "Failed to switch profile.");
        throw error;
      }
    },
    [],
  );

  const switchToIndependentMode = useCallback(async () => {
    await handleSwitchProfile(null, 'USER', true);
  }, [handleSwitchProfile]);

  const clearActiveProfile = useCallback(() => {
    setUser(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        activeProfile: undefined,
        activeIdentityType: 'USER',
      };
    });
    if (window.location.pathname !== '/dashboard') {
      navigate('/dashboard');
    }
  }, [navigate]);

  const isIndependentUser = Boolean(!user?.activeProfile || user?.activeIdentityType === 'USER');
  const isOrgMember = Boolean(user?.activeIdentityType === 'ORG_MEMBER');
  const isOrgAdmin = Boolean(user?.activeIdentityType === 'ORG_ADMIN');
  const currentIdentityType = user?.activeIdentityType || (user?.activeProfile ? 'ORG_MEMBER' : 'USER');

  const contextValue = useMemo(() => ({
    user,
    loading,
    setUser,
    handleLogout,
    handleLogin,
    handleSignup,
    handleGoogleAuth,
    handleOAuthSuccess,
    handleForgotPassword,
    handleEmailVerificationSuccess,
    handleSwitchProfile,
    switchToIndependentMode,
    clearActiveProfile,
    isIndependentUser,
    isOrgMember,
    isOrgAdmin,
    currentIdentityType,
    signupEmail,
    setSignupEmail,
    showCheckEmail,
    setShowCheckEmail,
    personaMode,
    setPersonaMode,
    togglePersonaMode,
  }), [
    user,
    loading,
    setUser,
    handleLogout,
    handleLogin,
    handleSignup,
    handleGoogleAuth,
    handleOAuthSuccess,
    handleForgotPassword,
    handleEmailVerificationSuccess,
    handleSwitchProfile,
    switchToIndependentMode,
    clearActiveProfile,
    isIndependentUser,
    isOrgMember,
    isOrgAdmin,
    currentIdentityType,
    signupEmail,
    setSignupEmail,
    showCheckEmail,
    setShowCheckEmail,
    personaMode,
    setPersonaMode,
    togglePersonaMode,
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};
