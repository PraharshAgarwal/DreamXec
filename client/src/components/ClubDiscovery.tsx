import { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getPublicClubs, type PublicClub } from "../services/clubService";
import { FooterContent } from "../sections/Footer/components/FooterContent";
import { useAuth } from "@/context/AuthContext";
import SEO from "./SEO";

type SortOption = "newest" | "oldest" | "most-campaigns" | "highest-raised" | "most-members";
type FilterScope = "all" | "campus" | "independent";

/* ─────────────────────────────────────────────
   TECHNICAL DOMAINS SPECIFICATION
───────────────────────────────────────────── */
interface DomainChip {
  id: string;
  label: string;
  icon: string;
  keywords: string[];
}

const DOMAINS: DomainChip[] = [
  { id: "all", label: "All Domains", icon: "✦", keywords: [] },
  { id: "ev", label: "Clean Mobility & EV", icon: "⚡", keywords: ["mobility", "ev", "powertrain", "electric vehicle", "battery pack", "bms", "automotive"] },
  { id: "robotics", label: "Robotics & Autonomy", icon: "🤖", keywords: ["robotics", "autonomy", "autonomous", "rover", "mechatronics", "ros2"] },
  { id: "aerospace", label: "Aerospace & Space", icon: "🚀", keywords: ["aerospace", "propulsion", "rocketry", "rocket", "space", "cansat", "orbital"] },
  { id: "biotech", label: "Biotech & Health", icon: "🧬", keywords: ["biotech", "bioengineering", "biomedical", "assistive", "circular materials", "biomaterials"] },
  { id: "ai", label: "AI & DeepTech", icon: "💻", keywords: ["ai", "quantum", "compiler", "deep learning", "tinyml", "edge", "neural", "qiskit", "gpu"] },
  { id: "climate", label: "Climate & CleanTech", icon: "🌿", keywords: ["climate", "iot", "cleantech", "telemetry", "environmental", "lorawan", "water"] },
];

/* ─────────────────────────────────────────────
   NEOBRUTALIST ICONS
───────────────────────────────────────────── */
const TrophyIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V18H7v2h10v-2h-4v-2.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
  </svg>
);

const BuildingIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 2.7L19 12v7H5v-7l7-6.3z M10 17v-3h4v3h-4z" />
  </svg>
);

const GlobeIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
  </svg>
);

const CampaignIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
  </svg>
);

const FundsIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z" />
  </svg>
);

const UsersIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);

const SortIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18M7 12h10M11 18h2" />
  </svg>
);

const FilterIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

/* ─────────────────────────────────────────────
   CAMPUS NAME FORMATTER
───────────────────────────────────────────── */
function formatCollegeDisplayName(name?: string | null): string {
  if (!name) return "Campus Guild";
  const trimmed = name.trim();
  if (trimmed.toUpperCase() === "NITKKR" || trimmed.toUpperCase() === "NIT-KKR") {
    return "VIT Chennai";
  }
  if (trimmed.toUpperCase() === "VIT" || trimmed.toUpperCase() === "VIT CHENNAI") {
    return "VIT Chennai";
  }
  return trimmed;
}

/* ─────────────────────────────────────────────
   CLUB GUILD CARD COMPONENT
───────────────────────────────────────────── */
function ClubCard({
  club,
  isUserCampusClub,
  index,
}: {
  club: PublicClub;
  isUserCampusClub: boolean;
  index: number;
}) {
  const isTopRaiser = (club.totalRaised || 0) > 100000;
  const isIndependent = Boolean(club.isIndependent || !club.parentId);

  const raisedDisplay =
    (club.totalRaised || 0) >= 100000
      ? `₹${((club.totalRaised || 0) / 100000).toFixed(1)}L`
      : `₹${(club.totalRaised || 0).toLocaleString("en-IN")}`;

  // Theme accent colors based on card classification adhering to AGENTS.md
  const stripeColor = isUserCampusClub
    ? "#0F534A" // Forest Green for User Campus
    : isIndependent
    ? "#FE4E1A" // Orange for Open / Independent
    : "#4717AE"; // Deep Purple for other institutions

  const collegeName = formatCollegeDisplayName(club.parent?.name || club.college);

  // Extract top tech stack chips
  const techPills = useMemo(() => {
    if (!Array.isArray(club.technicalStacks) || club.technicalStacks.length === 0) {
      return [];
    }
    return club.technicalStacks.slice(0, 3).map((item) => {
      if (typeof item === "string") return item;
      return item.tag || item.name || "";
    }).filter(Boolean);
  }, [club.technicalStacks]);

  return (
    <Link
      to={`/clubs/${club.slug || club.id}`}
      className="group relative flex flex-col bg-white transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1"
      style={{
        border: "3px solid #121316",
        boxShadow: `5px 5px 0 ${stripeColor}`,
        animationDelay: `${index * 40}ms`,
      }}
    >
      {/* Top color stripe */}
      <div className="h-2.5 w-full" style={{ background: stripeColor }} />

      <div className="flex flex-col flex-1 p-5 sm:p-6">
        {/* Badges Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          {/* Classification Badge */}
          {isIndependent ? (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white"
              style={{ background: "#FE4E1A", border: "2px solid #121316" }}
            >
              <GlobeIcon />
              <span>Open Collective</span>
            </div>
          ) : (
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white"
              style={{
                background: isUserCampusClub ? "#0F534A" : "#4717AE",
                border: "2px solid #121316",
              }}
            >
              <BuildingIcon />
              <span className="truncate max-w-[170px]">{collegeName}</span>
            </div>
          )}

          {/* Right badges: Category Pill or User Campus flag */}
          <div className="flex items-center gap-1.5">
            {isUserCampusClub ? (
              <span
                className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-dreamx-forest bg-dreamx-yellow"
                style={{ border: "2px solid #121316" }}
              >
                ★ Your Campus
              </span>
            ) : isTopRaiser ? (
              <span
                className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white bg-dreamx-red flex items-center gap-1"
                style={{ border: "2px solid #121316" }}
              >
                <TrophyIcon />
                Top Raiser
              </span>
            ) : null}

            {club.category && (
              <span
                className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[#121316] bg-[#FCFBF7]"
                style={{ border: "1.5px solid #121316" }}
              >
                {club.category}
              </span>
            )}
          </div>
        </div>

        {/* Club Name */}
        <h2 className="text-lg sm:text-xl font-black text-[#121316] uppercase tracking-tight leading-snug group-hover:text-dreamx-orange transition-colors duration-150 line-clamp-2 min-h-[50px]">
          {club.name}
        </h2>

        {/* Tagline / Subline */}
        <p className="text-xs font-medium text-[#121316]/70 truncate mt-1 min-h-[18px]">
          {club.tagline || club.motto || (isIndependent ? "Decentralized Builder Collective" : `${collegeName} Student Chapter`)}
        </p>

        {/* Technical Stacks Pills */}
        {techPills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            {techPills.map((tech, i) => (
              <span
                key={i}
                className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-gray-100 text-[#121316] border border-[#121316]/30"
              >
                {tech}
              </span>
            ))}
          </div>
        )}

        {/* Dashed divider */}
        <div className="my-4 border-t-2 border-dashed border-[#121316]/15" />

        {/* Description */}
        <p className="text-xs sm:text-sm text-[#121316]/75 font-normal leading-relaxed mb-4 line-clamp-2 min-h-[36px]">
          {club.description ||
            (isIndependent
              ? "Open innovation collective accepting student builders, researchers, and mentors from any institution."
              : `Official student-led innovation and technology guild at ${collegeName}.`)}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-auto">
          {/* Campaigns */}
          <div
            className="flex flex-col gap-0.5 p-2 bg-emerald-50/60"
            style={{ border: "2px solid #0F534A" }}
          >
            <div className="flex items-center gap-1 text-dreamx-forest">
              <CampaignIcon />
              <span className="text-[9px] font-black uppercase tracking-wider">
                Campaigns
              </span>
            </div>
            <span className="text-xl font-black text-dreamx-forest leading-none">
              {club.totalCampaigns || 0}
            </span>
          </div>

          {/* Total Raised */}
          <div
            className="flex flex-col gap-0.5 p-2 bg-orange-50/60"
            style={{ border: "2px solid #FE4E1A" }}
          >
            <div className="flex items-center gap-1 text-dreamx-orange">
              <FundsIcon />
              <span className="text-[9px] font-black uppercase tracking-wider">
                Raised
              </span>
            </div>
            <span className="text-lg font-black text-dreamx-forest leading-none truncate">
              {raisedDisplay}
            </span>
          </div>

          {/* Members */}
          <div
            className="flex flex-col gap-0.5 p-2 bg-purple-50/60"
            style={{ border: "2px solid #4717AE" }}
          >
            <div className="flex items-center gap-1 text-dreamx-purple">
              <UsersIcon />
              <span className="text-[9px] font-black uppercase tracking-wider">
                Guild Size
              </span>
            </div>
            <span className="text-xl font-black text-dreamx-forest leading-none">
              {club.membersCount || 0}
            </span>
          </div>
        </div>

        {/* Action button */}
        <div
          className="mt-4 flex items-center justify-between px-3.5 py-2.5 bg-white group-hover:bg-dreamx-forest transition-colors duration-150"
          style={{ border: "2px solid #121316" }}
        >
          <span className="text-[11px] font-black uppercase tracking-widest text-[#121316] group-hover:text-white transition-colors">
            View Club Initiatives
          </span>
          <span className="font-black text-[#121316] group-hover:text-white transition-all group-hover:translate-x-1 duration-150">
            →
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ─────────────────────────────────────────────
   SKELETON CARD
───────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div
      className="bg-white animate-pulse"
      style={{ border: "3px solid #121316", boxShadow: "5px 5px 0 #e5e7eb" }}
    >
      <div className="h-2.5 bg-gray-200" />
      <div className="p-5 sm:p-6 space-y-4">
        <div className="h-5 bg-gray-200 rounded w-1/3" />
        <div className="h-6 bg-gray-200 rounded w-3/4" />
        <div className="h-3 bg-gray-100 rounded w-1/2" />
        <div className="h-10 bg-gray-50 rounded w-full" />
        <div className="grid grid-cols-3 gap-2 pt-2">
          <div className="h-14 bg-emerald-50/50 rounded" />
          <div className="h-14 bg-orange-50/50 rounded" />
          <div className="h-14 bg-purple-50/50 rounded" />
        </div>
        <div className="h-9 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN CLUB DISCOVERY COMPONENT
───────────────────────────────────────────── */
export default function ClubDiscovery() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Primary discovery filters
  const [activeScope, setActiveScope] = useState<FilterScope>("all");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest");

  // Clubs state
  const [clubs, setClubs] = useState<PublicClub[]>([]);
  const [loading, setLoading] = useState(true);

  // Campus switcher dropdown toggle (when user has multiple institutions)
  const [isCampusDropdownOpen, setIsCampusDropdownOpen] = useState(false);

  // Fetch all public clubs on mount using explore_all scope
  const fetchClubs = async () => {
    try {
      setLoading(true);
      const res = await getPublicClubs({
        page: 1,
        limit: 100,
        scope: "explore_all",
      });

      if (res.success) {
        const fetched = res.data || (res as any).clubs || [];
        setClubs(fetched);
      }
    } catch (err) {
      console.error("Fetch Clubs Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClubs();
  }, []);

  /* ─────────────────────────────────────────────
     ROBUST ENROLLED CAMPUS RESOLUTION
     Fixes defect where club profiles were treated as parent institutions.
  ───────────────────────────────────────────── */
  const enrolledColleges = useMemo(() => {
    if (!user) return [];
    const collegesMap = new Map<string, { id: string; name: string; slug?: string }>();

    const addCollege = (id: string, rawName: string, slug?: string) => {
      if (!id || !rawName) return;
      const formattedName = formatCollegeDisplayName(rawName);
      if (!collegesMap.has(id)) {
        collegesMap.set(id, { id, name: formattedName, slug: slug || "" });
      }
    };

    // 1. Direct colleges in user.organizations with orgType === 'COLLEGE'
    if (Array.isArray(user.organizations)) {
      for (const org of user.organizations) {
        if (!org) continue;
        if (org.orgType === "COLLEGE") {
          addCollege(org.id, org.name, org.slug);
        } else if ((org as any).parentOrgId && (org as any).parentOrgName) {
          addCollege((org as any).parentOrgId, (org as any).parentOrgName, (org as any).parentOrgSlug);
        }
      }
    }

    // 2. Colleges in availableProfiles
    if (Array.isArray((user as any).availableProfiles)) {
      for (const p of (user as any).availableProfiles) {
        if (!p) continue;
        const orgType = (p.orgType || "").toUpperCase();
        if (orgType === "COLLEGE") {
          addCollege(p.organizationId || p.orgId, p.orgName || p.name, p.orgSlug || p.slug);
        } else if (p.parentOrgId && p.parentOrgName) {
          addCollege(p.parentOrgId, p.parentOrgName, p.parentOrgSlug);
        }
      }
    }

    // 3. User active profile
    if (user.activeProfile) {
      const ap = user.activeProfile as any;
      if (ap.orgType === "COLLEGE" && ap.organizationId) {
        addCollege(ap.organizationId, ap.orgName, ap.orgSlug);
      } else if (ap.parentOrgId && ap.parentOrgName) {
        addCollege(ap.parentOrgId, ap.parentOrgName, ap.parentOrgSlug);
      }
    }

    // 4. Resolve via loaded clubs list:
    // If the user's activeProfile or memberships match a club's ID, extract that club's parent college!
    const userOrgIds = new Set<string>();
    if (user.activeProfile?.organizationId) userOrgIds.add(user.activeProfile.organizationId);
    if (Array.isArray(user.organizations)) {
      user.organizations.forEach((o) => o?.id && userOrgIds.add(o.id));
    }
    if (Array.isArray((user as any).availableProfiles)) {
      (user as any).availableProfiles.forEach((p: any) => {
        const id = p.organizationId || p.orgId;
        if (id) userOrgIds.add(id);
      });
    }

    for (const orgId of userOrgIds) {
      const matchingClub = clubs.find((c) => c.id === orgId);
      if (matchingClub && matchingClub.parentId && matchingClub.parent) {
        addCollege(matchingClub.parentId, matchingClub.parent.name, matchingClub.parent.slug);
      } else if (matchingClub && matchingClub.college && matchingClub.parentId) {
        addCollege(matchingClub.parentId, matchingClub.college);
      }
    }

    // 5. Fallback: Check user.college / institutionName if not yet matched
    const fallbackCollegeName = (user as any).college || (user as any).institutionName || (user as any).tenant?.name;
    if (fallbackCollegeName && collegesMap.size === 0) {
      // Find matching college from public clubs
      const matchingClubByCollege = clubs.find(
        (c) =>
          c.parent?.name &&
          fallbackCollegeName.toLowerCase().includes(c.parent.name.toLowerCase())
      );
      if (matchingClubByCollege && matchingClubByCollege.parentId) {
        addCollege(matchingClubByCollege.parentId, matchingClubByCollege.parent?.name || fallbackCollegeName);
      } else {
        addCollege("fallback-campus", fallbackCollegeName);
      }
    }

    return Array.from(collegesMap.values());
  }, [user, clubs]);

  // Selected campus ID (defaults to first enrolled college)
  const [selectedCampusId, setSelectedCampusId] = useState<string | null>(null);

  useEffect(() => {
    if (enrolledColleges.length > 0 && !selectedCampusId) {
      setSelectedCampusId(enrolledColleges[0].id);
    }
  }, [enrolledColleges, selectedCampusId]);

  const currentEnrolledCampus = useMemo(() => {
    if (enrolledColleges.length === 0) return null;
    return enrolledColleges.find((c) => c.id === selectedCampusId) || enrolledColleges[0];
  }, [enrolledColleges, selectedCampusId]);

  // Distinct list of colleges from all public clubs for the college filter dropdown
  const allDistinctColleges = useMemo(() => {
    const list: Array<{ id: string; name: string }> = [];
    clubs.forEach((c) => {
      if (!c.isIndependent && c.parentId && (c.parent?.name || c.college)) {
        const name = formatCollegeDisplayName(c.parent?.name || c.college);
        if (!list.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
          list.push({ id: c.parentId, name });
        }
      }
    });
    return list;
  }, [clubs]);

  const handleReferClick = () => {
    if (!user) {
      navigate("/login", { state: { from: "/refer-club" } });
    } else {
      navigate("/refer-club");
    }
  };

  /* ─────────────────────────────────────────────
     SPLIT CLUBS BY CAMPUS VS INDEPENDENT
  ───────────────────────────────────────────── */
  const campusClubs = useMemo(() => {
    if (!currentEnrolledCampus) return [];
    return clubs.filter((c) => {
      if (c.isIndependent || !c.parentId) return false;
      const matchesId = c.parentId === currentEnrolledCampus.id || (c.parent && c.parent.id === currentEnrolledCampus.id);
      const matchesName =
        (c.parent?.name && c.parent.name.toLowerCase() === currentEnrolledCampus.name.toLowerCase()) ||
        (c.college && c.college.toLowerCase().includes(currentEnrolledCampus.name.toLowerCase())) ||
        (currentEnrolledCampus.name.toLowerCase().includes("kurukshetra") &&
          (c.name.toLowerCase().includes("nitkkr") || (c.college && c.college.toLowerCase().includes("nitkkr"))));
      return Boolean(matchesId || matchesName);
    });
  }, [clubs, currentEnrolledCampus]);

  const independentClubs = useMemo(() => {
    return clubs.filter((c) => c.isIndependent || !c.parentId);
  }, [clubs]);

  /* ─────────────────────────────────────────────
     DOMAIN MATCH HELPER
  ───────────────────────────────────────────── */
  const matchesDomain = (club: PublicClub, domainId: string): boolean => {
    if (domainId === "all") return true;
    const domainDef = DOMAINS.find((d) => d.id === domainId);
    if (!domainDef) return true;

    const searchable = [
      club.name,
      club.category || "",
      club.tagline || "",
      club.motto || "",
      club.description || "",
      ...(Array.isArray(club.technicalStacks)
        ? club.technicalStacks.map((s) => `${s.tag || ""} ${s.name || ""} ${s.description || ""}`)
        : []),
    ]
      .join(" ")
      .toLowerCase();

    return domainDef.keywords.some((kw) => {
      if (kw.length <= 3) {
        return new RegExp(`\\b${kw}\\b`, "i").test(searchable);
      }
      return searchable.includes(kw);
    });
  };

  // Domain counts for the chips based on current active scope
  const domainCounts = useMemo(() => {
    const scopePool =
      activeScope === "campus"
        ? campusClubs
        : activeScope === "independent"
        ? independentClubs
        : clubs;

    const counts: Record<string, number> = {};
    DOMAINS.forEach((domain) => {
      counts[domain.id] = scopePool.filter((c) => matchesDomain(c, domain.id)).length;
    });
    return counts;
  }, [activeScope, campusClubs, independentClubs, clubs]);

  /* ─────────────────────────────────────────────
     FINAL FILTERED & SORTED CLUBS
  ───────────────────────────────────────────── */
  const displayedClubs = useMemo(() => {
    let list: PublicClub[] = [];

    // 1. Scope filter
    if (activeScope === "campus") {
      list = campusClubs;
    } else if (activeScope === "independent") {
      list = independentClubs;
    } else {
      list = clubs;
    }

    // 2. Technical Domain filter
    if (selectedDomain !== "all") {
      list = list.filter((c) => matchesDomain(c, selectedDomain));
    }

    // 3. Optional College dropdown filter
    if (selectedCollegeFilter !== "all") {
      list = list.filter((c) => {
        const cName = formatCollegeDisplayName(c.parent?.name || c.college);
        return cName.toLowerCase() === selectedCollegeFilter.toLowerCase();
      });
    }

    // 4. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((c) => {
        const inTech =
          Array.isArray(c.technicalStacks) &&
          c.technicalStacks.some((t) =>
            `${t.tag || ""} ${t.name || ""} ${t.description || ""}`.toLowerCase().includes(q)
          );

        return (
          c.name.toLowerCase().includes(q) ||
          (c.college && c.college.toLowerCase().includes(q)) ||
          (c.parent?.name && c.parent.name.toLowerCase().includes(q)) ||
          (c.category && c.category.toLowerCase().includes(q)) ||
          (c.tagline && c.tagline.toLowerCase().includes(q)) ||
          (c.motto && c.motto.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          inTech
        );
      });
    }

    // 5. Sorting
    return [...list].sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      }
      if (sortBy === "most-campaigns") {
        return (b.totalCampaigns || 0) - (a.totalCampaigns || 0);
      }
      if (sortBy === "highest-raised") {
        return (b.totalRaised || 0) - (a.totalRaised || 0);
      }
      if (sortBy === "most-members") {
        return (b.membersCount || 0) - (a.membersCount || 0);
      }
      // default "newest"
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });
  }, [
    clubs,
    campusClubs,
    independentClubs,
    activeScope,
    selectedDomain,
    selectedCollegeFilter,
    searchQuery,
    sortBy,
  ]);

  return (
    <>
      <SEO
        title="College Innovation Guilds & Research Labs | DreamXec"
        description="Explore student innovation chapters, college research clubs, and independent collectives raising capital and launching breakthrough science and technology across India."
        url="https://dreamxec.com/clubs"
      />

      <div className="min-h-screen bg-[#FCFBF7] font-sans">
        {/* ─────────────────────────────────────────────
           HERO SECTION: Strictly adhering to AGENTS.md
        ───────────────────────────────────────────── */}
        <section
          className="relative bg-dreamx-forest overflow-hidden"
          style={{ borderBottom: "5px solid #FE4E1A" }}
        >
          {/* Subtle Grid texture */}
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
              backgroundSize: "44px 44px",
            }}
          />

          {/* Tricolor Tag */}
          <div className="absolute top-0 right-0 flex flex-col w-3.5 h-full">
            <div className="flex-1 bg-dreamx-orange" />
            <div className="flex-1 bg-white" />
            <div className="flex-1 bg-dreamx-bright-green" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 md:py-20">
            {/* Eyebrow badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 mb-5 text-[10px] sm:text-xs font-black uppercase tracking-widest text-dreamx-forest bg-dreamx-yellow"
              style={{ border: "2px solid #fff", boxShadow: "2px 2px 0 #FE4E1A" }}
            >
              <span>★</span> DreamXec Dual-Custody Innovation Network
            </div>

            {/* Headline in Poppins Black */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight leading-none mb-4">
              Explore{" "}
              <span
                className="inline-block px-2 sm:px-3 text-white"
                style={{ background: "#FE4E1A" }}
              >
                Innovation
              </span>{" "}
              Guilds
            </h1>

            {/* Subline in Poppins Medium */}
            <p className="text-white/85 text-sm sm:text-base md:text-lg font-medium max-w-2xl leading-relaxed">
              Explore university clubs affiliated with your enrolled campus and discover open,
              cross-institutional collectives driving breakthrough science and tech across India.
            </p>

            {/* Annotation in Badlooking Brush */}
            <div className="mt-3 font-brush text-dreamx-yellow text-xl sm:text-2xl tracking-wide">
              Empowering next-gen student builders, researchers & presidents ✨
            </div>

            {/* Stats strip */}
            <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
              <div
                className="flex items-center gap-3 px-4 py-2.5 bg-white/10"
                style={{ border: "2px solid rgba(255,255,255,0.25)" }}
              >
                <span className="text-2xl sm:text-3xl font-black text-dreamx-yellow">
                  {clubs.length}
                </span>
                <span className="text-xs sm:text-sm font-black text-white/80 uppercase tracking-widest">
                  Verified Guilds
                </span>
              </div>

              {currentEnrolledCampus && (
                <div
                  className="flex items-center gap-3 px-4 py-2.5 bg-white/10"
                  style={{ border: "2px solid #FE4E1A" }}
                >
                  <span className="text-2xl sm:text-3xl font-black text-dreamx-orange">
                    {campusClubs.length}
                  </span>
                  <span className="text-xs sm:text-sm font-black text-white/80 uppercase tracking-widest">
                    Chapters at {currentEnrolledCampus.name}
                  </span>
                </div>
              )}

              <div
                className="flex items-center gap-3 px-4 py-2.5 bg-white/10"
                style={{ border: "2px solid rgba(255,255,255,0.25)" }}
              >
                <span className="text-2xl sm:text-3xl font-black text-dreamx-blue">
                  {independentClubs.length}
                </span>
                <span className="text-xs sm:text-sm font-black text-white/80 uppercase tracking-widest">
                  Open Collectives
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────
           3-TIER NEOBRUTALIST EXPLORATION CONSOLE
        ───────────────────────────────────────────── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 -mt-6 sm:-mt-8 relative z-10">
          <div
            className="p-4 sm:p-6 bg-white space-y-5"
            style={{
              border: "3px solid #121316",
              boxShadow: "6px 6px 0 #121316",
            }}
          >
            {/* ── TIER 1: PERSPECTIVE SCOPE BAR & REFER ACTION ── */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 pb-4 border-b-2 border-dashed border-[#121316]/15">
              {/* Left: Perspective Scope Tabs */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                {/* 1. All Chapters */}
                <button
                  onClick={() => setActiveScope("all")}
                  className={`px-3.5 sm:px-4 py-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    activeScope === "all"
                      ? "bg-dreamx-forest text-white shadow-[2px_2px_0_#121316]"
                      : "bg-[#FCFBF7] text-[#121316] hover:bg-gray-100"
                  }`}
                  style={{ border: "2px solid #121316" }}
                >
                  <span>All Chapters</span>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-black ${
                      activeScope === "all" ? "bg-white text-dreamx-forest" : "bg-gray-200 text-[#121316]"
                    }`}
                  >
                    {clubs.length}
                  </span>
                </button>

                {/* 2. Campus Affiliated Tab */}
                {currentEnrolledCampus && (
                  <div className="relative inline-flex items-stretch">
                    <button
                      onClick={() => setActiveScope("campus")}
                      className={`px-3.5 sm:px-4 py-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                        activeScope === "campus"
                          ? "bg-dreamx-forest text-white shadow-[2px_2px_0_#121316]"
                          : "bg-emerald-50/70 text-[#121316] hover:bg-emerald-100"
                      }`}
                      style={{
                        border: "2px solid #121316",
                        borderRight: enrolledColleges.length > 1 ? "none" : "2px solid #121316",
                      }}
                    >
                      <BuildingIcon />
                      <span className="truncate max-w-[170px] sm:max-w-[220px]">
                        {currentEnrolledCampus.name}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-black ${
                          activeScope === "campus"
                            ? "bg-dreamx-yellow text-dreamx-forest"
                            : "bg-emerald-200 text-[#121316]"
                        }`}
                      >
                        {campusClubs.length}
                      </span>
                    </button>

                    {/* Multi-campus selector toggle if user has multiple affiliations */}
                    {enrolledColleges.length > 1 && (
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsCampusDropdownOpen((prev) => !prev)}
                          className={`h-full px-2 text-[11px] font-black uppercase tracking-wider cursor-pointer flex items-center justify-center ${
                            activeScope === "campus"
                              ? "bg-dreamx-forest text-white hover:bg-emerald-950"
                              : "bg-emerald-100 text-[#121316] hover:bg-emerald-200"
                          }`}
                          style={{ border: "2px solid #121316" }}
                          title="Switch Campus Affiliation"
                        >
                          ▾
                        </button>
                        {isCampusDropdownOpen && (
                          <div
                            className="absolute left-0 top-full mt-1 w-56 bg-white z-50 p-1 space-y-1"
                            style={{ border: "2px solid #121316", boxShadow: "3px 3px 0 #121316" }}
                          >
                            <div className="px-2 py-1 text-[9px] font-black uppercase text-gray-500">
                              Select Campus
                            </div>
                            {enrolledColleges.map((col) => (
                              <button
                                key={col.id}
                                onClick={() => {
                                  setSelectedCampusId(col.id);
                                  setActiveScope("campus");
                                  setIsCampusDropdownOpen(false);
                                }}
                                className={`w-full text-left px-2.5 py-1.5 text-xs font-black uppercase truncate ${
                                  selectedCampusId === col.id
                                    ? "bg-dreamx-forest text-white"
                                    : "text-[#121316] hover:bg-gray-100"
                                }`}
                              >
                                {col.name}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Open & Independent Collectives */}
                <button
                  onClick={() => setActiveScope("independent")}
                  className={`px-3.5 sm:px-4 py-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
                    activeScope === "independent"
                      ? "bg-dreamx-orange text-white shadow-[2px_2px_0_#121316]"
                      : "bg-orange-50/60 text-[#121316] hover:bg-orange-100"
                  }`}
                  style={{ border: "2px solid #121316" }}
                >
                  <GlobeIcon />
                  <span>Open Collectives</span>
                  <span
                    className={`px-1.5 py-0.5 text-[10px] font-black ${
                      activeScope === "independent"
                        ? "bg-white text-dreamx-orange"
                        : "bg-orange-200 text-dreamx-orange"
                    }`}
                  >
                    {independentClubs.length}
                  </span>
                </button>
              </div>

              {/* Right: High-Visibility Refer Action (Locked to prevent wrapping) */}
              <div className="flex items-center shrink-0 self-end lg:self-auto">
                <button
                  onClick={handleReferClick}
                  className="px-4 py-2 text-xs font-black uppercase tracking-wider text-[#121316] bg-dreamx-yellow hover:bg-yellow-300 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shadow-[3px_3px_0_#121316] hover:shadow-[4px_4px_0_#121316] hover:-translate-x-0.5 hover:-translate-y-0.5"
                  style={{ border: "2px solid #121316" }}
                  title="Propose or Refer a Club"
                >
                  <span className="text-base font-black leading-none">+</span>
                  <span>Propose / Refer Club ↗</span>
                </button>
              </div>
            </div>

            {/* ── TIER 2: TECHNICAL DOMAIN FILTER CHIPS ── */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#121316]/60">
                  Filter By Technical Domain
                </span>
                {selectedDomain !== "all" && (
                  <button
                    onClick={() => setSelectedDomain("all")}
                    className="text-[10px] font-black uppercase text-dreamx-orange hover:underline cursor-pointer"
                  >
                    Reset Domain
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {DOMAINS.map((domain) => {
                  const isSelected = selectedDomain === domain.id;
                  const count = domainCounts[domain.id] || 0;

                  return (
                    <button
                      key={domain.id}
                      onClick={() => setSelectedDomain(domain.id)}
                      className={`px-3 py-1.5 text-xs font-black uppercase tracking-wide transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? "bg-dreamx-orange text-white shadow-[2px_2px_0_#121316]"
                          : "bg-white text-[#121316] hover:bg-amber-50/60"
                      }`}
                      style={{
                        border: isSelected ? "2px solid #121316" : "2px solid #121316",
                      }}
                    >
                      <span>{domain.icon}</span>
                      <span>{domain.label}</span>
                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-black rounded ${
                          isSelected ? "bg-white text-dreamx-orange" : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── TIER 3: SEARCH, COLLEGE FILTER & SORT CONTROLS ── */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 pt-3 border-t-2 border-dashed border-[#121316]/15">
              {/* Search Bar */}
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#121316]/50 pointer-events-none">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search clubs by name, campus, or tech (ROS2, CanSat, Battery, Qiskit)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs font-medium text-[#121316] bg-white placeholder:text-[#121316]/40 focus:outline-none transition-all shadow-[2px_2px_0_#121316]"
                  style={{ border: "2px solid #121316" }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-500 hover:text-dreamx-orange cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* College Filter Dropdown */}
              <div className="relative md:w-56">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#121316]/50 pointer-events-none">
                  <FilterIcon />
                </div>
                <select
                  value={selectedCollegeFilter}
                  onChange={(e) => setSelectedCollegeFilter(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 text-xs font-black uppercase text-[#121316] bg-white focus:outline-none appearance-none cursor-pointer shadow-[2px_2px_0_#121316]"
                  style={{ border: "2px solid #121316" }}
                >
                  <option value="all">All Institutions</option>
                  {allDistinctColleges.map((col) => (
                    <option key={col.id} value={col.name}>
                      {col.name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#121316]/50">
                  ▼
                </div>
              </div>

              {/* Sort Dropdown */}
              <div className="relative md:w-52">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#121316]/50 pointer-events-none">
                  <SortIcon />
                </div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="w-full pl-8 pr-7 py-2 text-xs font-black uppercase text-[#121316] bg-white focus:outline-none appearance-none cursor-pointer shadow-[2px_2px_0_#121316]"
                  style={{ border: "2px solid #121316" }}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="most-campaigns">Most Campaigns</option>
                  <option value="highest-raised">Highest Raised</option>
                  <option value="most-members">Most Members</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#121316]/50">
                  ▼
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────────────────────────────────────
           MAIN CONTENT LISTING
        ───────────────────────────────────────────── */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-12">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : displayedClubs.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white"
              style={{ border: "3px solid #121316", boxShadow: "5px 5px 0 #FE4E1A" }}
            >
              <div
                className="w-16 h-16 flex items-center justify-center mb-4 bg-orange-100 text-3xl"
                style={{ border: "2px solid #FE4E1A" }}
              >
                🔍
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-dreamx-forest uppercase tracking-tight mb-2">
                No Clubs Found
              </h2>
              <p className="text-xs sm:text-sm text-[#121316]/70 font-medium max-w-md mb-5">
                {activeScope === "campus" && currentEnrolledCampus
                  ? `No student innovation clubs are currently listed under ${currentEnrolledCampus.name}. Be the first to establish or refer your campus chapter!`
                  : "We couldn't find any clubs matching your current filter or search criteria."}
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                {(searchQuery || selectedDomain !== "all" || selectedCollegeFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedDomain("all");
                      setSelectedCollegeFilter("all");
                    }}
                    className="px-4 py-2 text-xs font-black uppercase text-[#121316] bg-gray-100 hover:bg-gray-200 cursor-pointer"
                    style={{ border: "2px solid #121316" }}
                  >
                    Clear All Filters
                  </button>
                )}
                <button
                  onClick={handleReferClick}
                  className="px-5 py-2 text-xs font-black uppercase text-white bg-dreamx-forest hover:bg-emerald-950 cursor-pointer"
                  style={{ border: "2px solid #121316", boxShadow: "2px 2px 0 #FE4E1A" }}
                >
                  Refer Your Club →
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header Status Row */}
              <div className="flex items-center justify-between pb-3 mb-6 border-b-2 border-[#121316]/15">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-black uppercase tracking-widest text-[#121316]/60">
                    Showing
                  </span>
                  <span
                    className="px-2.5 py-0.5 text-xs font-black uppercase text-white bg-dreamx-forest"
                    style={{ border: "2px solid #121316" }}
                  >
                    {displayedClubs.length} Guild{displayedClubs.length !== 1 ? "s" : ""}
                  </span>
                  {selectedDomain !== "all" && (
                    <span className="text-xs font-bold text-dreamx-orange">
                      in {DOMAINS.find((d) => d.id === selectedDomain)?.label}
                    </span>
                  )}
                  {searchQuery && (
                    <span className="text-xs font-bold text-[#121316]/60 truncate max-w-xs">
                      matching "{searchQuery}"
                    </span>
                  )}
                </div>

                {/* Scope Label Badge */}
                <span className="hidden sm:inline-block text-[11px] font-black uppercase tracking-wider text-[#121316]/50">
                  {activeScope === "campus" && currentEnrolledCampus
                    ? `Campus Chapters at ${currentEnrolledCampus.name}`
                    : activeScope === "independent"
                    ? "Open Collectives Across India"
                    : "National Dual-Custody Network"}
                </span>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedClubs.map((club, index) => {
                  const isUserCampusClub = Boolean(
                    currentEnrolledCampus &&
                      (club.parentId === currentEnrolledCampus.id ||
                        (club.parent && club.parent.id === currentEnrolledCampus.id) ||
                        (club.parent?.name &&
                          club.parent.name.toLowerCase() === currentEnrolledCampus.name.toLowerCase()) ||
                        (club.college &&
                          club.college.toLowerCase().includes(currentEnrolledCampus.name.toLowerCase())) ||
                        (currentEnrolledCampus.name.toLowerCase().includes("kurukshetra") &&
                          (club.name.toLowerCase().includes("nitkkr") ||
                            (club.college && club.college.toLowerCase().includes("nitkkr")))))
                  );

                  return (
                    <ClubCard
                      key={club.id}
                      club={club}
                      isUserCampusClub={isUserCampusClub}
                      index={index}
                    />
                  );
                })}
              </div>
            </>
          )}

          {/* ─────────────────────────────────────────────
             REFER YOUR CLUB NEOBRUTALIST BANNER
          ───────────────────────────────────────────── */}
          <section className="mt-14 sm:mt-20">
            <div
              className="p-6 sm:p-8 bg-white flex flex-col md:flex-row items-center justify-between gap-6"
              style={{
                border: "3px solid #121316",
                boxShadow: "7px 7px 0 #FE4E1A",
              }}
            >
              <div className="space-y-1.5 text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-dreamx-yellow text-dreamx-forest border border-[#121316]">
                  ★ Institutional Expansion
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-dreamx-forest uppercase tracking-tight">
                  Don't see your college club?
                </h3>
                <p className="text-xs sm:text-sm font-normal text-[#121316]/75 max-w-xl leading-relaxed">
                  Refer your club or student society to the DreamXec Dual-Custody Network. Gain verified institutional backing, escrow disbursement pipelines, and donor transparency.
                </p>
              </div>

              <button
                onClick={handleReferClick}
                className="px-7 py-3 text-xs sm:text-sm font-black uppercase tracking-widest text-[#121316] bg-dreamx-yellow hover:bg-yellow-300 transition-all flex items-center gap-2 whitespace-nowrap shadow-[3px_3px_0_#121316] hover:shadow-[4px_4px_0_#121316] hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer"
                style={{ border: "2px solid #121316" }}
              >
                <span>Refer Your Club</span>
                <span>→</span>
              </button>
            </div>
          </section>
        </main>

        <FooterContent />
      </div>
    </>
  );
}
