import React from "react";
import { OrganizationItem } from "./OrganizationSelector";
import { prefetchWorkflowTemplate, initiateWorkflowInstance } from "../engine/workflowCache";

interface RoleSelectorProps {
  organization: OrganizationItem;
  selectedRole: string;
  onSelectRole: (role: string) => void;
  onProceed: () => void;
  onBack: () => void;
  currentUser?: any;
}

export const RoleSelector: React.FC<RoleSelectorProps> = ({
  organization,
  selectedRole,
  onSelectRole,
  onProceed,
  onBack,
  currentUser,
}) => {
  const allowedRoles = organization.allowedRoles || [];

  const triggerRoleInitiation = (r: string) => {
    const userId = currentUser?.id || currentUser?.email || "";
    // Pre-fetch template metadata
    prefetchWorkflowTemplate(organization.id || organization.slug, r);
    // Pre-initiate DB Workflow Instance upon role selection
    initiateWorkflowInstance(
      organization.id || organization.slug,
      r,
      organization.name,
      organization.orgType,
      userId
    );
  };

  const handleRoleClick = (r: string) => {
    triggerRoleInitiation(r);
    onSelectRole(r);
  };

  const getRoleMembership = (r: string) => {
    if (!currentUser) return null;
    const orgId = organization.id || organization.slug;
    const orgSlug = (organization.slug || '').toLowerCase();

    const profiles = [
      ...(currentUser.availableProfiles || []),
      ...(currentUser.organizations || []),
      ...(currentUser.orgRoles || []),
    ];

    return profiles.find((p: any) => {
      const matchOrg =
        p.organizationId === orgId ||
        p.orgId === orgId ||
        p.id === orgId ||
        (p.orgSlug && p.orgSlug.toLowerCase() === orgSlug) ||
        (p.slug && p.slug.toLowerCase() === orgSlug);

      const matchRole = (p.role || '').toUpperCase() === r.toUpperCase();
      return matchOrg && matchRole;
    });
  };

  const getRoleMetadata = (r: string) => {
    const roleUpper = r.toUpperCase();
    const map: Record<string, { icon: string; title: string; desc: string }> = {
      STUDENT: {
        icon: "🎓",
        title: "Student Member / Researcher",
        desc: "Enrolled student participating in project divisions, laboratory research, and campus campaigns.",
      },
      STUDENT_PRESIDENT: {
        icon: "🏛️",
        title: "Student President / Chapter Lead",
        desc: "Club or council leader authorized with executive governance and faculty advisor endorsement.",
      },
      PROFESSOR: {
        icon: "👨‍🏫",
        title: "Professor & Faculty Advisor",
        desc: "Tenured or affiliated faculty providing academic oversight, milestone signs-off, and lab authorization.",
      },
      RESEARCHER: {
        icon: "🔬",
        title: "Research Scientist / Grant Investigator",
        desc: "Principal investigator or researcher conducting specialized experiments with verified ORCID.",
      },
      MENTOR: {
        icon: "💡",
        title: "Technical Mentor & Advisor",
        desc: "Industry veteran or alumni providing technical architecture advisory and venture guidance.",
      },
      INCUBATOR_MANAGER: {
        icon: "🚀",
        title: "Incubation Manager / Program Lead",
        desc: "Cohort director managing incubation portfolios, acceleration grants, and compliance.",
      },
      COMPLIANCE_OFFICER: {
        icon: "🛡️",
        title: "Institutional Compliance Officer",
        desc: "Authorized officer evaluating ethics, institutional IP agreements, and statutory clearance.",
      },
      ORG_ADMIN: {
        icon: "🏢",
        title: "Organization Administrator",
        desc: "Primary administrative authority overseeing institutional rosters, departments, and verifications.",
      },
      CORPORATE_ADMIN: {
        icon: "💼",
        title: "Corporate Partner Administrator",
        desc: "Corporate representative allocating sponsored research grants and CSR funding.",
      },
      DONOR: {
        icon: "🤝",
        title: "Impact Philanthropist / Donor",
        desc: "Donor or foundation allocating non-dilutive capital and charitable grants to researchers.",
      },
    };
    return (
      map[roleUpper] || {
        icon: "🪪",
        title: roleUpper.replace(/_/g, " "),
        desc: `Execute role-specific verification and onboarding workflow for ${roleUpper.replace(/_/g, " ")}.`,
      }
    );
  };

  return (
    <div className="space-y-5">
      <div className="p-4 bg-[#FFDD33]/20 border-2 border-dashed border-[#121316]">
        <span className="text-[10px] font-headline font-black uppercase text-[#FE4E1A] tracking-widest block">
          SELECTED ORGANIZATION / CLUB
        </span>
        <h2 className="text-sm font-headline font-black text-[#0F534A] uppercase tracking-wider mb-1">
          {organization.name}
        </h2>
        <p className="text-xs font-medium text-gray-600">
          Select your exact role at {organization.name} to trigger its role-specific verification workflow.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {allowedRoles.map((role) => {
          const isSelected = selectedRole === role;
          const membership = getRoleMembership(role);
          const isActive = membership?.status === "ACTIVE";
          const isPending = membership?.status === "PENDING";
          const meta = getRoleMetadata(role);

          return (
            <div
              key={role}
              onClick={() => handleRoleClick(role)}
              className={`p-4 cursor-pointer space-y-2.5 transition-all border-2 ${
                isSelected
                  ? "bg-[#FFDD33]/20 border-[#121316] shadow-[4px_4px_0_#121316]"
                  : "bg-white border-gray-300 hover:border-[#121316] hover:shadow-[2px_2px_0_#121316]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{meta.icon}</span>
                <div className="flex items-center gap-2">
                  {isActive && (
                    <span className="bg-[#0F534A] text-white px-2 py-0.5 text-[9px] font-headline font-black uppercase border border-[#121316]">
                      ✓ Active
                    </span>
                  )}
                  {isPending && (
                    <span className="bg-[#FFDD33] text-[#121316] px-2 py-0.5 text-[9px] font-headline font-black uppercase border border-[#121316]">
                      ⏳ Pending Verification
                    </span>
                  )}
                  <div
                    className={`w-5 h-5 flex items-center justify-center text-xs font-headline font-black border-2 border-[#121316] ${
                      isSelected ? "bg-[#FE4E1A] text-white" : "bg-white text-gray-400"
                    }`}
                  >
                    {isSelected ? "✓" : ""}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-headline font-black text-xs text-[#0F534A] uppercase">{meta.title}</h3>
                <span className="text-[9px] font-mono font-bold text-gray-400 uppercase">
                  ROLE ENUM: {role}
                </span>
              </div>
              <p className="text-[11px] font-medium text-gray-600 leading-relaxed">
                {isActive
                  ? `Your ${role.replace(/_/g, " ")} profile is already active and verified in this organization.`
                  : isPending
                  ? `Your verification is currently pending review by administrators.`
                  : meta.desc}
              </p>
            </div>
          );
        })}
      </div>

      <div className="pt-3 flex justify-between">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 font-headline font-black text-[#0F534A] bg-white uppercase tracking-wider text-xs border-2 border-[#121316] hover:bg-gray-50 cursor-pointer"
        >
          ← Back
        </button>

        <button
          type="button"
          onClick={onProceed}
          disabled={!selectedRole}
          className={`px-7 py-3 font-headline font-black text-white uppercase tracking-wider text-xs transition-all border-2 border-[#121316] cursor-pointer ${
            selectedRole ? "bg-[#FE4E1A] hover:bg-[#0F534A] shadow-[3px_3px_0_#121316]" : "bg-gray-400 cursor-not-allowed"
          }`}
        >
          Start Role Onboarding →
        </button>
      </div>
    </div>
  );
};
