import React from "react";
import type { UserProfile } from "../services/authService";
import { useProfileSelector } from "./useProfileSelector";
import {
  GraduationCap,
  FlaskConical,
  Users,
  Building2,
  Globe,
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Heart,
  Loader2,
  ShieldCheck,
  Briefcase,
  Award,
  DollarSign,
  HeartHandshake,
} from "lucide-react";

/* ─────────────────────────────────────────────
   ROLE ICON & ACCENT CONFIGURATION
───────────────────────────────────────────── */
const ROLE_BADGE_CONFIG: Record<
  string,
  {
    icon: React.ReactNode;
    emoji: string;
    bg: string;
    text: string;
    border: string;
    label: string;
    color: string;
  }
> = {
  USER: {
    icon: <Globe className="w-7 h-7" />,
    emoji: "🌐",
    bg: "bg-[#FE4E1A]/10",
    text: "text-[#FE4E1A]",
    border: "border-[#FE4E1A]/30",
    label: "Independent",
    color: "#FE4E1A",
  },
  STUDENT: {
    icon: <GraduationCap className="w-7 h-7" />,
    emoji: "🎓",
    bg: "bg-[#0F534A]/10",
    text: "text-[#0F534A]",
    border: "border-[#0F534A]/30",
    label: "Student",
    color: "#9EFC5F",
  },
  STUDENT_PRESIDENT: {
    icon: <Users className="w-7 h-7" />,
    emoji: "🏛️",
    bg: "bg-[#9EFC5F]/25",
    text: "text-[#0F534A]",
    border: "border-[#0F534A]/30",
    label: "Club President",
    color: "#18D7E8",
  },
  ORG_ADMIN: {
    icon: <Building2 className="w-7 h-7" />,
    emoji: "🏢",
    bg: "bg-[#FE4E1A]/10",
    text: "text-[#FE4E1A]",
    border: "border-[#FE4E1A]/30",
    label: "Club Admin",
    color: "#FE4E1A",
  },
  RESEARCHER: {
    icon: <FlaskConical className="w-7 h-7" />,
    emoji: "🔬",
    bg: "bg-[#4717AE]/10",
    text: "text-[#4717AE]",
    border: "border-[#4717AE]/30",
    label: "Research Lead",
    color: "#A78BFA",
  },
  PROFESSOR: {
    icon: <FlaskConical className="w-7 h-7" />,
    emoji: "👨‍🏫",
    bg: "bg-[#0F534A]/10",
    text: "text-[#0F534A]",
    border: "border-[#0F534A]/30",
    label: "Professor",
    color: "#9EFC5F",
  },
  MENTOR: {
    icon: <GraduationCap className="w-7 h-7" />,
    emoji: "💡",
    bg: "bg-[#18D7E8]/10",
    text: "text-[#0F534A]",
    border: "border-[#18D7E8]/30",
    label: "Faculty Mentor",
    color: "#18D7E8",
  },
  DONOR: {
    icon: <Heart className="w-7 h-7" />,
    emoji: "❤️",
    bg: "bg-[#FFDD33]/30",
    text: "text-[#FE4E1A]",
    border: "border-[#FE4E1A]/30",
    label: "Donor",
    color: "#FFDD33",
  },
  ADMIN: {
    icon: <ShieldCheck className="w-7 h-7" />,
    emoji: "🛡️",
    bg: "bg-[#4717AE]/10",
    text: "text-[#4717AE]",
    border: "border-[#4717AE]/30",
    label: "Platform Admin",
    color: "#A78BFA",
  },
  CORPORATE_ADMIN: {
    icon: <Building2 className="w-7 h-7" />,
    emoji: "🏢",
    bg: "bg-[#0F534A]/10",
    text: "text-[#0F534A]",
    border: "border-[#0F534A]/30",
    label: "Corporate Admin",
    color: "#9EFC5F",
  },
  INCUBATOR_MANAGER: {
    icon: <Briefcase className="w-7 h-7" />,
    emoji: "💼",
    bg: "bg-[#FFDD33]/30",
    text: "text-[#FE4E1A]",
    border: "border-[#FE4E1A]/30",
    label: "Incubator Manager",
    color: "#FFDD33",
  },
  COMPLIANCE_OFFICER: {
    icon: <ShieldCheck className="w-7 h-7" />,
    emoji: "🛡️",
    bg: "bg-[#F4002C]/10",
    text: "text-[#F4002C]",
    border: "border-[#F4002C]/30",
    label: "Compliance Officer",
    color: "#F4002C",
  },
  GRANT_OFFICER: {
    icon: <Award className="w-7 h-7" />,
    emoji: "🏆",
    bg: "bg-[#FFDD33]/25",
    text: "text-[#FE4E1A]",
    border: "border-[#FE4E1A]/30",
    label: "Grant Officer",
    color: "#FFDD33",
  },
  FINANCE_OFFICER: {
    icon: <DollarSign className="w-7 h-7" />,
    emoji: "💰",
    bg: "bg-[#9EFC5F]/20",
    text: "text-[#0F534A]",
    border: "border-[#0F534A]/30",
    label: "Finance Officer",
    color: "#9EFC5F",
  },
  GOV_OFFICER: {
    icon: <Building2 className="w-7 h-7" />,
    emoji: "🏛️",
    bg: "bg-[#0F534A]/15",
    text: "text-[#0F534A]",
    border: "border-[#0F534A]/30",
    label: "Government Officer",
    color: "#0F534A",
  },
  GOV_OFFICIAL: {
    icon: <Building2 className="w-7 h-7" />,
    emoji: "🏛️",
    bg: "bg-[#0F534A]/15",
    text: "text-[#0F534A]",
    border: "border-[#0F534A]/30",
    label: "Government Official",
    color: "#0F534A",
  },
  SPONSOR: {
    icon: <HeartHandshake className="w-7 h-7" />,
    emoji: "🤝",
    bg: "bg-[#FE4E1A]/10",
    text: "text-[#FE4E1A]",
    border: "border-[#FE4E1A]/30",
    label: "Corporate Sponsor",
    color: "#FE4E1A",
  },
};

function getBadgeConfig(role: string) {
  return (
    ROLE_BADGE_CONFIG[role?.toUpperCase()] || {
      icon: <Users className="w-7 h-7" />,
      emoji: "👤",
      bg: "bg-[#0F534A]/10",
      text: "text-[#0F534A]",
      border: "border-[#0F534A]/30",
      label: role?.replace(/_/g, " ") || "Member",
      color: "#9EFC5F",
    }
  );
}

/* ─────────────────────────────────────────────
   INLINE STYLES (scoped to this page only)
───────────────────────────────────────────── */
const styles = {
  page: {
    minHeight: "100vh",
    background: "#141414",
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    position: "relative" as const,
    overflow: "hidden",
  },
  heroContainer: {
    width: "100%",
    maxHeight: "340px",
    position: "relative" as const,
    overflow: "hidden",
    flexShrink: 0,
  },
  heroImage: {
    width: "100%",
    height: "340px",
    objectFit: "cover" as const,
    objectPosition: "center 25%",
    display: "block",
    filter: "brightness(0.65)",
  },
  heroOverlay: {
    position: "absolute" as const,
    inset: 0,
    background: "linear-gradient(to bottom, rgba(20,20,20,0.05) 0%, rgba(20,20,20,0.35) 50%, #141414 100%)",
    pointerEvents: "none" as const,
  },
  content: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    padding: "0 24px 60px",
    marginTop: "-60px",
    position: "relative" as const,
    zIndex: 10,
    width: "100%",
    maxWidth: "960px",
  },
  headingContainer: {
    textAlign: "center" as const,
    marginBottom: "48px",
  },
  heading: {
    color: "#FFFFFF",
    fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
    fontWeight: 300,
    letterSpacing: "-0.03em",
    textAlign: "center" as const,
    marginBottom: "12px",
    lineHeight: 1.15,
  },
  headingAccent: {
    fontWeight: 600,
    background: "linear-gradient(90deg, #FFFFFF 0%, #9EFC5F 50%, #18D7E8 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
  } as React.CSSProperties,
  headingSub: {
    color: "#777",
    fontSize: "14px",
    fontWeight: 400,
    letterSpacing: "0.04em",
    textAlign: "center" as const,
  },
  profilesGrid: {
    display: "flex",
    flexWrap: "wrap" as const,
    justifyContent: "center",
    gap: "24px",
    marginBottom: "48px",
  },
  manageRow: {
    display: "flex",
    justifyContent: "center",
    gap: "16px",
    flexWrap: "wrap" as const,
  },
} as const;

/* ─────────────────────────────────────────────
   MAIN COMPONENT: ProfileSelector
───────────────────────────────────────────── */
const ProfileSelector: React.FC = () => {
  const {
    user,
    hoveredId,
    setHoveredId,
    switchingProfileId,
    handleSelectIndependent,
    handleSelectOrgProfile,
    navigate,
    returnTo,
  } = useProfileSelector();

  if (!user) {
    return null;
  }

  // Active Profile Resolution
  const activeProfile = (user as any)?.activeProfile;
  const isIndependentActive =
    !activeProfile ||
    (user as any)?.activeIdentityType === "USER" ||
    activeProfile.role === "USER";

  const rawProfiles: UserProfile[] = (user as any)?.availableProfiles || [];

  // All club and institutional profiles (excluding standalone public USER)
  const memberProfiles = rawProfiles.filter((p) => (p.role || "").toUpperCase() !== "USER");
  if (
    user?.activeProfile &&
    user.activeProfile.role?.toUpperCase() !== "USER" &&
    !memberProfiles.some(
      (p) =>
        String(p.organizationId || (p as any).orgId) ===
          String(user.activeProfile?.organizationId || (user.activeProfile as any)?.orgId) &&
        p.role?.toUpperCase() === user.activeProfile?.role?.toUpperCase()
    )
  ) {
    memberProfiles.unshift(user.activeProfile as UserProfile);
  }

  const isProfileCurrent = (profile: UserProfile) => {
    if (isIndependentActive) return false;
    const curOrgId = activeProfile?.organizationId || activeProfile?.orgId;
    const cardOrgId = profile.organizationId || (profile as any).orgId;
    return (
      String(curOrgId) === String(cardOrgId) &&
      activeProfile?.role?.toUpperCase() === profile.role?.toUpperCase()
    );
  };

  // Build the unified profile card list
  const allCards: {
    id: string;
    type: "independent" | "org" | "add";
    label: string;
    sublabel: string;
    icon: React.ReactNode;
    emoji: string;
    color: string;
    isCurrent: boolean;
    isPending: boolean;
    isSwitching: boolean;
    profile?: UserProfile;
  }[] = [];

  // 1. Independent User card
  allCards.push({
    id: "independent-citizen",
    type: "independent",
    label: "Independent",
    sublabel: "Public Workspace",
    icon: <Globe className="w-7 h-7" />,
    emoji: "🌐",
    color: "#FE4E1A",
    isCurrent: isIndependentActive,
    isPending: false,
    isSwitching: switchingProfileId === "independent-citizen",
  });

  // 2. Enrolled campus / club profiles
  memberProfiles.forEach((profile) => {
    const orgId = profile.organizationId || (profile as any).orgId;
    const profileKey = `${orgId}-${profile.role}`;
    const badgeCfg = getBadgeConfig(profile.role);
    const displayOrgName = profile.orgName || "Campus Lab";

    allCards.push({
      id: profileKey,
      type: "org",
      label: badgeCfg.label,
      sublabel: displayOrgName,
      icon: badgeCfg.icon,
      emoji: badgeCfg.emoji,
      color: badgeCfg.color,
      isCurrent: isProfileCurrent(profile),
      isPending: profile.status === "PENDING",
      isSwitching: switchingProfileId === profileKey,
      profile,
    });
  });

  // 3. "+ Add New Role" card (always last)
  allCards.push({
    id: "add-new-role",
    type: "add",
    label: "Add New Role",
    sublabel: "Join a Club or Lab",
    icon: <Plus className="w-7 h-7" />,
    emoji: "➕",
    color: "#666",
    isCurrent: false,
    isPending: false,
    isSwitching: false,
  });

  const handleCardClick = (card: (typeof allCards)[0]) => {
    if (card.type === "independent") {
      handleSelectIndependent();
    } else if (card.type === "org" && card.profile) {
      handleSelectOrgProfile(card.profile);
    } else if (card.type === "add") {
      navigate("/onboarding/existing-org");
    }
  };

  return (
    <div style={styles.page}>
      {/* ── Return to Caller Banner (e.g. Campaign Creation) ── */}
      {returnTo && (
        <div
          style={{
            width: "100%",
            background: "rgba(255, 221, 51, 0.12)",
            borderBottom: "1px solid rgba(255, 221, 51, 0.3)",
            padding: "10px 16px",
            zIndex: 50,
            position: "relative",
          }}
        >
          <div
            style={{
              maxWidth: "960px",
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <ArrowLeft className="w-4 h-4" style={{ color: "#FFDD33" }} />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#FFDD33",
                }}
              >
                Select Identity For Campaign Creation
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate(returnTo)}
              style={{
                background: "#FFDD33",
                color: "#141414",
                padding: "6px 14px",
                fontSize: "11px",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return</span>
            </button>
          </div>
        </div>
      )}

      {/* ── Hero Image Banner ── */}
      <div style={styles.heroContainer}>
        <img
          src="/assets/identity_hero_students.webp"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/identity_hero_students.jpg';
          }}
          alt="DreamXec Campus Student Innovators"
          style={styles.heroImage}
        />
        <div style={styles.heroOverlay} />
      </div>

      {/* ── Main Content ── */}
      <div style={styles.content}>
        {/* Heading */}
        <div style={styles.headingContainer}>
          <h1 style={styles.heading}>
            Who is{" "}
            <span style={styles.headingAccent}>building</span>?
          </h1>
          <p style={styles.headingSub}>Select a profile to continue</p>
        </div>

        {/* Profile Cards Grid */}
        <div style={styles.profilesGrid}>
          {allCards.map((card) => {
            const isHovered = hoveredId === card.id;
            const isAdd = card.type === "add";

            return (
              <div
                key={card.id}
                onClick={() => !card.isSwitching && handleCardClick(card)}
                onMouseEnter={() => setHoveredId(card.id)}
                onMouseLeave={() => setHoveredId(null)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === "Enter" || e.key === " ") &&
                  !card.isSwitching &&
                  handleCardClick(card)
                }
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                  cursor: card.isSwitching ? "wait" : "pointer",
                  opacity: card.isSwitching ? 0.5 : 1,
                  transition: "transform 0.2s ease, opacity 0.2s ease",
                  transform: isHovered && !card.isSwitching ? "scale(1.08)" : "scale(1)",
                  outline: "none",
                  width: "84px",
                }}
              >
                {/* Compact Square Avatar */}
                <div
                  style={{
                    width: "84px",
                    height: "84px",
                    borderRadius: "10px",
                    background: isAdd
                      ? "rgba(255,255,255,0.04)"
                      : `linear-gradient(145deg, ${card.color}22 0%, ${card.color}0A 100%)`,
                    border: isAdd
                      ? "1.5px dashed rgba(255,255,255,0.18)"
                      : card.isCurrent
                        ? `2px solid ${card.color}`
                        : isHovered
                          ? `2px solid ${card.color}70`
                          : "2px solid rgba(255,255,255,0.07)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s ease",
                    boxShadow: card.isCurrent
                      ? `0 0 16px ${card.color}30`
                      : isHovered
                        ? `0 4px 20px rgba(0,0,0,0.4)`
                        : "0 2px 8px rgba(0,0,0,0.25)",
                    position: "relative",
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {/* Current check */}
                  {card.isCurrent && (
                    <div
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: card.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2,
                      }}
                    >
                      <Check className="w-2.5 h-2.5" style={{ color: "#141414", strokeWidth: 3 }} />
                    </div>
                  )}

                  {/* Pending */}
                  {card.isPending && (
                    <div
                      style={{
                        position: "absolute",
                        top: "4px",
                        right: "4px",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        background: "rgba(180,83,9,0.9)",
                        fontSize: "7px",
                        fontWeight: 700,
                        color: "#FFF",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        zIndex: 2,
                      }}
                    >
                      Pending
                    </div>
                  )}

                  {/* Real Lucide Icon */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "filter 0.2s ease, transform 0.2s ease",
                      filter: isHovered && !isAdd ? `drop-shadow(0 0 4px ${card.color}50)` : "none",
                      transform: isHovered ? "scale(1.08)" : "scale(1)",
                      color: card.color,
                    }}
                  >
                    {card.isSwitching ? (
                      <Loader2
                        className="w-6 h-6 animate-spin"
                        style={{ color: card.color }}
                      />
                    ) : (
                      <div className="flex items-center justify-center p-2 rounded-xl" style={{ backgroundColor: `${card.color}15`, border: `1.5px solid ${card.color}35` }}>
                        {card.icon}
                      </div>
                    )}
                  </div>
                </div>

                {/* Label */}
                <div style={{ textAlign: "center", width: "84px" }}>
                  <div
                    style={{
                      color: isHovered ? "#FFFFFF" : "#CCC",
                      fontSize: "11px",
                      fontWeight: 500,
                      lineHeight: 1.2,
                      transition: "color 0.2s ease",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {card.label}
                  </div>
                  <div
                    style={{
                      color: "#666",
                      fontSize: "9px",
                      fontWeight: 400,
                      marginTop: "2px",
                      lineHeight: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {card.sublabel}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Explore Clubs link */}
        <div style={styles.manageRow}>
          <button
            onClick={() => navigate("/clubs")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 24px",
              background: "transparent",
              border: "1px solid #444",
              borderRadius: "6px",
              color: "#AAA",
              fontSize: "13px",
              fontWeight: 500,
              letterSpacing: "0.03em",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#9EFC5F";
              e.currentTarget.style.color = "#FFF";
              e.currentTarget.style.background = "rgba(158, 252, 95, 0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#444";
              e.currentTarget.style.color = "#AAA";
              e.currentTarget.style.background = "transparent";
            }}
          >
            <Users className="w-4 h-4" />
            <span>Explore Clubs</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSelector;
