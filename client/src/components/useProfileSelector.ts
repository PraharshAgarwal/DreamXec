import { useState, useMemo, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import type { UserProfile } from "../services/authService";
import toast from "react-hot-toast";

export interface ProfileCardItem {
  id: string;
  type: "independent" | "org" | "add";
  label: string;
  sublabel: string;
  role: string;
  isCurrent: boolean;
  status?: string;
  rawProfile?: UserProfile;
}

export function getDashboardPath(role: string): string {
  const r = role?.toUpperCase();
  if (r === "COMPLIANCE_OFFICER") return "/compliance/dashboard";
  if (r === "GRANT_OFFICER") return "/grants/dashboard";
  if (r === "FINANCE_OFFICER") return "/finance/dashboard";
  if (r === "PROFESSOR") return "/professor/dashboard";
  if (r === "INCUBATOR_MANAGER") return "/incubator/dashboard";
  if (r === "GOV_OFFICER" || r === "GOV_OFFICIAL") return "/gov/dashboard";
  if (r === "SPONSOR") return "/sponsor/dashboard";
  if (r === "MENTOR") return "/mentor/dashboard";
  if (r === "DONOR") return "/donor/dashboard";
  if (r === "ADMIN" || r === "ORG_ADMIN" || r === "CORPORATE_ADMIN" || r === "DX_ADMIN") return "/dx-admin";
  return "/dashboard";
}

/**
 * Custom Hook encapsulating Profile Selection state and workspace switching operations.
 * Adheres to Single Responsibility Principle (SRP).
 */
export function useProfileSelector() {
  const { user, handleSwitchProfile, switchToIndependentMode, handleLogout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as any)?.from;

  const [switchingProfileId, setSwitchingProfileId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const activeProfile = (user as any)?.activeProfile;
  const isIndependentActive =
    !activeProfile ||
    (user as any)?.activeIdentityType === "USER" ||
    activeProfile.role === "USER";

  const rawProfiles: UserProfile[] = (user as any)?.availableProfiles || [];

  const memberProfiles = useMemo(() => {
    const list = rawProfiles.filter((p) => (p.role || "").toUpperCase() !== "USER");
    if (
      user?.activeProfile &&
      user.activeProfile.role?.toUpperCase() !== "USER" &&
      !list.some(
        (p) =>
          String(p.organizationId || (p as any).orgId) ===
            String(user.activeProfile?.organizationId || (user.activeProfile as any)?.orgId) &&
          p.role?.toUpperCase() === user.activeProfile?.role?.toUpperCase()
      )
    ) {
      list.unshift(user.activeProfile as UserProfile);
    }
    return list;
  }, [rawProfiles, user?.activeProfile]);

  const isProfileCurrent = useCallback((profile: UserProfile) => {
    if (isIndependentActive) return false;
    const curOrgId = activeProfile?.organizationId || activeProfile?.orgId;
    const cardOrgId = profile.organizationId || (profile as any).orgId;
    return (
      String(curOrgId) === String(cardOrgId) &&
      activeProfile?.role?.toUpperCase() === profile.role?.toUpperCase()
    );
  }, [isIndependentActive, activeProfile]);

  const handleSelectIndependent = useCallback(async () => {
    const targetDestination = returnTo && returnTo !== "/select-profile" && returnTo !== "/switch-profile" ? returnTo : "/services";
    if (isIndependentActive) {
      navigate(targetDestination);
      return;
    }
    setSwitchingProfileId("independent-citizen");
    try {
      await switchToIndependentMode();
      navigate(targetDestination);
    } catch (err: any) {
      console.error("[useProfileSelector] Switch independent failed:", err);
      toast.error(err?.message || "Failed to switch to Independent User workspace.");
    } finally {
      setSwitchingProfileId(null);
    }
  }, [isIndependentActive, navigate, returnTo, switchToIndependentMode]);

  const handleSelectOrgProfile = useCallback(async (profile: UserProfile) => {
    const orgId = profile.organizationId || (profile as any).orgId;
    const profileKey = `${orgId}-${profile.role}`;

    if (profile.status === "PENDING") {
      toast("This profile is currently pending verification. You can access it once approved.", {
        icon: "⏳",
      });
      return;
    }

    if (isProfileCurrent(profile)) {
      navigate(returnTo || getDashboardPath(profile.role));
      return;
    }

    setSwitchingProfileId(profileKey);
    try {
      await handleSwitchProfile(orgId, profile.role);
      navigate(returnTo || getDashboardPath(profile.role));
    } catch (err: any) {
      console.error("[useProfileSelector] Profile switch error:", err);
      toast.error(err?.message || "Failed to switch profile. Please try again.");
    } finally {
      setSwitchingProfileId(null);
    }
  }, [isProfileCurrent, navigate, returnTo, handleSwitchProfile]);

  const allCards = useMemo<ProfileCardItem[]>(() => {
    const cards: ProfileCardItem[] = [
      {
        id: "independent-citizen",
        type: "independent",
        label: "Personal Account",
        sublabel: "Individual Citizen Workspace",
        role: "USER",
        isCurrent: isIndependentActive,
      },
    ];

    for (const p of memberProfiles) {
      const pOrgId = p.organizationId || (p as any).orgId;
      const key = `${pOrgId}-${p.role}`;
      cards.push({
        id: key,
        type: "org",
        label: (p as any).organizationName || (p as any).orgName || "Campus Club",
        sublabel: (p as any).parentOrgName || p.role.replace(/_/g, " "),
        role: p.role,
        isCurrent: isProfileCurrent(p),
        status: p.status,
        rawProfile: p,
      });
    }

    cards.push({
      id: "add-new-role",
      type: "add",
      label: "Join New Organization",
      sublabel: "Apply for a club, college, or team role",
      role: "ADD",
      isCurrent: false,
    });

    return cards;
  }, [isIndependentActive, memberProfiles, isProfileCurrent]);

  return {
    user,
    allCards,
    hoveredId,
    setHoveredId,
    switchingProfileId,
    handleSelectIndependent,
    handleSelectOrgProfile,
    handleLogout,
    navigate,
    returnTo,
  };
}
