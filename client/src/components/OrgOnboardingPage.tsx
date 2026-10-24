import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Header } from "../sections/Header";
import { FooterContent } from "../sections/Footer/components/FooterContent";
import apiRequest from "../services/api";
import { getCurrentUser, type User } from "../services/authService";
import { OrganizationSelector, OrganizationItem } from "./workflow/selectors/OrganizationSelector";
import { RoleSelector } from "./workflow/selectors/RoleSelector";
import { WorkflowRunner } from "./workflow/engine/WorkflowRunner";
import { prefetchWorkflowTemplate, initiateWorkflowInstance } from "./workflow/engine/workflowCache";
import toast from "react-hot-toast";

/* ── ICONS ── */
const CheckIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const BuildingIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
    <path d="M9 22v-4h6v4" />
    <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" />
  </svg>
);

export default function OrgOnboardingPage() {
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const [searchParams] = useSearchParams();
  const roleQueryParam = searchParams.get("role");
  const navigate = useNavigate();

  /* ── STEP STATE ── */
  const [step, setStep] = useState<1 | 2 | 3>(1);

  /* ── ORGANIZATIONS CATALOG STATE ── */
  const [organizations, setOrganizations] = useState<OrganizationItem[]>([]);
  const [loadingOrgs, setLoadingOrgs] = useState(true);
  const [selectedOrg, setSelectedOrg] = useState<OrganizationItem | null>(null);

  /* ── ROLE STATE ── */
  const [selectedRole, setSelectedRole] = useState<string>("");

  /* ── USER STATE ── */
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  /* ── ALERTS ── */
  const [error, setError] = useState("");

  useEffect(() => {
    getCurrentUser()
      .then((res) => {
        if (res?.data?.user) setCurrentUser(res.data.user as any);
      })
      .catch((err) => console.error("Failed to load user for onboarding:", err));
  }, []);

  /* ── FETCH ORGANIZATIONS CATALOG ── */
  const fetchOrgs = async () => {
    setLoadingOrgs(true);
    setError("");
    try {
      const res = await apiRequest<any>("/workflows/organizations", { method: "GET", skipCache: true });
      const list = res?.data?.organizations || (res as any)?.organizations || [];
      setOrganizations(list);
      if (list.length === 0) {
        setError("No organizations found in database. Please run database seed script.");
      }
    } catch (err: any) {
      console.error("Failed to fetch organizations from backend:", err);
      setError(err?.message || "Failed to fetch organizations from backend database.");
      setOrganizations([]);
    } finally {
      setLoadingOrgs(false);
    }
  };

  useEffect(() => {
    fetchOrgs();
  }, []);

  /* ── DYNAMIC URL PRE-SELECTION (e.g. /onboarding/nit-kurukshetra or /onboarding/nitkkr-robotics-mechatronics?role=STUDENT) ── */
  useEffect(() => {
    if (!orgSlug || organizations.length === 0) return;
    const cleanSlug = orgSlug.toLowerCase();
    const matched = organizations.find(
      (o) => o.slug?.toLowerCase() === cleanSlug || o.id === orgSlug
    );
    if (matched) {
      setSelectedOrg(matched);
      const availableRoles = matched.allowedRoles || [];
      
      // Check if a role was explicitly passed via query parameter
      let chosenRole = "";
      if (roleQueryParam) {
        const found = availableRoles.find(
          (r) => r.toUpperCase() === roleQueryParam.toUpperCase()
        );
        if (found) {
          chosenRole = found;
        }
      }

      if (chosenRole) {
        setSelectedRole(chosenRole);
        setStep(3); // Jump straight to role workflow steps!
        initiateWorkflowInstance(
          matched.id || matched.slug,
          chosenRole,
          matched.name,
          matched.orgType,
          currentUser?.id || currentUser?.email
        );
      } else {
        const defaultRole = availableRoles.length > 0 ? availableRoles[0] : "";
        setSelectedRole(defaultRole);
        setStep(2); // Jump to Role Selection step!
      }
    }
  }, [orgSlug, roleQueryParam, organizations, currentUser]);

  const handleSelectOrg = (org: OrganizationItem) => {
    setSelectedOrg(org);
    const availableRoles = org.allowedRoles || [];
    const defaultRole = availableRoles.length > 0 ? availableRoles[0] : "";
    setSelectedRole(defaultRole);
    setError("");
    setStep(2);
    if (defaultRole) {
      prefetchWorkflowTemplate(org.id || org.slug, defaultRole);
    }
  };

  return (
    <>
      <Header />

      <div className="min-h-screen bg-[#FDFBF7] py-8 px-4 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="w-full max-w-4xl my-6">
          <div
            className="bg-white relative p-6 sm:p-9"
            style={{
              border: "4px solid #121316",
              boxShadow: "8px 8px 0 #0F534A",
            }}
          >
            {/* Header */}
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-headline font-black text-[#0F534A] uppercase tracking-tight flex items-center justify-center gap-2">
                <BuildingIcon className="w-7 h-7 text-[#FE4E1A]" />
                Hi {currentUser ? currentUser.name : "User"}, welcome!
              </h1>
              <p className="text-xs sm:text-sm font-subline font-medium text-gray-600 mt-1">
                Select an organization, pick your allowed role, and complete your verification workflow.
              </p>
            </div>

            {/* Stepper Bar */}
            <div className="mb-8">
              <div className="flex items-center justify-between relative max-w-xl mx-auto">
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 -z-0" />
                {[
                  { num: 1, label: "Select Organization" },
                  { num: 2, label: "Select Role" },
                  { num: 3, label: "Role Workflow Steps" },
                ].map((s) => {
                  const isActive = step === s.num;
                  const isCompleted = step > s.num;
                  return (
                    <div key={s.num} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-10 h-10 flex items-center justify-center font-headline font-black text-sm transition-all ${
                          isCompleted ? "bg-[#0B9C2C] text-white" : isActive ? "bg-[#FE4E1A] text-white scale-110" : "bg-white text-[#0F534A]"
                        }`}
                        style={{ border: "3px solid #121316" }}
                      >
                        {isCompleted ? <CheckIcon className="w-5 h-5" /> : s.num}
                      </div>
                      <span className={`text-xs font-headline font-black uppercase tracking-wider mt-2 ${isActive ? "text-[#FE4E1A]" : "text-[#0F534A]"}`}>
                        {s.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 1: ORGANIZATION SELECTOR */}
            {step === 1 && (
              <OrganizationSelector
                organizations={organizations}
                selectedOrg={selectedOrg}
                onSelectOrg={handleSelectOrg}
                onProceed={() => setStep(2)}
                loading={loadingOrgs}
              />
            )}

            {/* STEP 2: ROLE SELECTOR */}
            {step === 2 && selectedOrg && (
              <RoleSelector
                organization={selectedOrg}
                selectedRole={selectedRole}
                onSelectRole={(r) => setSelectedRole(r)}
                onProceed={() => setStep(3)}
                onBack={() => setStep(1)}
                currentUser={currentUser}
              />
            )}

            {/* STEP 3: HEADLESS BACKEND-DRIVEN WORKFLOW RUNNER */}
            {step === 3 && selectedOrg && selectedRole && (
              <WorkflowRunner
                organizationId={selectedOrg.id || selectedOrg.slug}
                role={selectedRole}
                organizationName={selectedOrg.name}
                organizationType={selectedOrg.orgType}
                onNavigateRoleSelect={() => setStep(2)}
              />
            )}
          </div>
        </div>
      </div>

      <FooterContent />
    </>
  );
}
