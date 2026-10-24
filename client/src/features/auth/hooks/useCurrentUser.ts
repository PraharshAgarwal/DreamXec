import { useCallback, useMemo } from "react";
import type { SignupParams } from "../auth.types";
import { useAuth } from "../../../context/AuthContext";

export function useCurrentUser() {
  const auth = useAuth();

  const handleSignupAdapter = useCallback(
    async (params: SignupParams) => {
      return auth.handleSignup(
        params.name,
        params.email,
        params.password,
        params.role,
        params.institution,
        params.institutionMeta
      );
    },
    [auth]
  );

  return useMemo(() => ({
    user: auth.user,
    setUser: auth.setUser,
    loading: auth.loading,
    isSubmitting: false,
    signupEmail: auth.signupEmail,
    showCheckEmail: auth.showCheckEmail,
    handleLogin: auth.handleLogin,
    handleSignup: handleSignupAdapter,
    handleGoogleAuth: auth.handleGoogleAuth,
    handleOAuthSuccess: auth.handleOAuthSuccess,
    handleForgotPassword: auth.handleForgotPassword,
    handleLogout: auth.handleLogout,
    handleSwitchProfile: auth.handleSwitchProfile,
    clearActiveProfile: auth.clearActiveProfile,
  }), [auth, handleSignupAdapter]);
}
