import React, { Suspense, useEffect } from "react";
import { Routes, Route, useNavigate, useLocation, Navigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { useCurrentUser } from "../features/auth/hooks/useCurrentUser";
import { useCampaigns } from "../features/campaigns/hooks/useCampaigns";

import { Header } from "../sections/Header";
import LoadingAnimation from "../components/LoadingAnimation";
import { ProtectedRoute, GuestGuard, OrgAdminGuard, DxAdminGuard, StudentGuard } from "./route-guards";
import { useLoader } from "../context/LoaderContext";
import ProfileSelector from "../components/ProfileSelector";

import { API_BASE_URL } from "../utils/apiConfig";
import { loadRazorpayScript, setupRazorpaySandboxFallback } from "../utils/loadRazorpay";
import { clearApiCache } from "../services/api";
import { verifyPayment } from "../services/donationService";
import { isFoundationDomain, navigateToCampaign } from "../utils/campaignRouting";

import UnifiedDashboardLayout from "../components/layout/UnifiedDashboardLayout";

// Lazy-loaded page components for route-level code splitting
const Main = React.lazy(() => import("../components/Main").then((m) => ({ default: m.Main })));
const BrowseCampaigns = React.lazy(() => import("../components/BrowseCampaigns"));
const CampaignDetails = React.lazy(() => import("../components/CampaignDetails"));
const StudentDashboard = React.lazy(() => import("../components/StudentDashboard"));
const CreateCampaign = React.lazy(() => import("../components/CreateCampaign"));
const EditCampaign = React.lazy(() => import("../components/EditCampaign"));
const MyCampaigns = React.lazy(() => import("../components/MyCampaigns"));
const DonorDashboard = React.lazy(() => import("../components/DonorDashboard"));
const AuthPage = React.lazy(() => import("../components/AuthPage"));
const RegisterPage = React.lazy(() => import("../components/RegisterPage"));
const ProfileSetup = React.lazy(() => import("../components/ProfileSetup"));
const OrgOnboardingPage = React.lazy(() => import("../components/OrgOnboardingPage"));
const AuthCallback = React.lazy(() => import("../components/AuthCallback"));
const CheckEmail = React.lazy(() => import("../components/CheckEmail"));
const ReferClub = React.lazy(() => import("../components/ReferClub"));
const ClubDiscovery = React.lazy(() => import("../components/ClubDiscovery"));
const ClubDetails = React.lazy(() => import("../components/ClubDetails"));
const DxAdminDashboard = React.lazy(() => import("../components/dx-admin/DxAdminDashboard"));
const OrgAdminDashboard = React.lazy(() => import("../components/org-admin/OrgAdminDashboard"));
const MentorDashboard = React.lazy(() => import("../components/mentor/MentorDashboard"));
const ComplianceDashboard = React.lazy(() => import("../components/compliance/ComplianceDashboard"));
const GrantOfficerDashboard = React.lazy(() => import("../components/grants/GrantOfficerDashboard"));
const FinanceOfficerDashboard = React.lazy(() => import("../components/finance/FinanceOfficerDashboard"));
const ProfessorDashboard = React.lazy(() => import("../components/professor/ProfessorDashboard"));
const IncubatorDashboard = React.lazy(() => import("../components/incubator/IncubatorDashboard"));
const GovOfficerDashboard = React.lazy(() => import("../components/gov/GovOfficerDashboard"));
const SponsorDashboard = React.lazy(() => import("../components/sponsor/SponsorDashboard"));
const UserProfile = React.lazy(() => import("../components/UserProfile"));
const SettingsPage = React.lazy(() => import("../components/SettingsPage"));
const ResetPasswordPage = React.lazy(() => import("../components/ResetPasswordPage"));
const VaultSection = React.lazy(() => import("../components/vault/VaultSection").then((m) => ({ default: m.VaultSection })));
const EndangeredSpeciesView = React.lazy(() => import("../components/species/EndangeredSpeciesView").then((m) => ({ default: m.EndangeredSpeciesView })));
const NotFoundPage = React.lazy(() => import("../components/NotFoundPage"));
const TermsAndConditionsPage = React.lazy(() => import("../pages/TermsAndConditionsPage"));
const PrivacyPolicyPage = React.lazy(() => import("../pages/PrivacyPolicyPage"));
const DonationPolicyPage = React.lazy(() => import("../pages/DonationPolicyPage"));
const ResearcherServicesPage = React.lazy(() => import("../pages/ResearcherServicesPage").then((m) => ({ default: m.ResearcherServicesPage })));
const ResearcherOrdersPage = React.lazy(() => import("../pages/ResearcherOrdersPage").then((m) => ({ default: m.ResearcherOrdersPage })));


// Canonical campaign view wrapper enforcing dreamxec.org hosting in production
function CanonicalCampaignRoute({
  currentUser,
  onDonate,
  onLogin,
  onLogout,
}: {
  currentUser: any;
  onDonate: (campaignId: string, amount: number) => void;
  onLogin: () => void;
  onLogout: () => void;
}) {
  const { id } = useParams<{ id: string }>();
  const isOrg = isFoundationDomain();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  useEffect(() => {
    if (!isOrg && !isLocal && id) {
      // In production, all campaign pages strictly redirect to dreamxec.org
      const targetUrl = `https://dreamxec.org/campaign/${encodeURIComponent(id)}${window.location.search}`;
      window.location.replace(targetUrl);
    }
  }, [id, isOrg, isLocal]);

  if (!isOrg && !isLocal) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F2EC]">
        <div className="text-center p-8 bg-white border-4 border-[#121316] shadow-[6px_6px_0px_#0F534A] max-w-md">
          <div className="w-12 h-12 border-4 border-[#0F534A] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="font-headline font-black text-lg text-[#0F534A] mb-1 uppercase tracking-tight">
            Connecting to DreamXec Foundation...
          </p>
          <p className="font-body text-xs text-gray-600">
            Student research grants and backer contributions are hosted on dreamxec.org
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header currentUser={currentUser} onLogin={onLogin} onLogout={onLogout} />
      <CampaignDetails currentUser={currentUser} onDonate={onDonate} />
    </>
  );
}

// Decoupled route wrappers that fetch campaigns only on relevant pages
function StudentDashboardWrapper({ user, navigate }: { user: any; navigate: any }) {
  const { userCampaigns } = useCampaigns(user, { fetchUser: true });
  return (
    <StudentDashboard
      studentName={user?.name || "User"}
      campaigns={userCampaigns}
      onCreateCampaign={() => navigate("/create")}
      onViewCampaign={(id) => navigateToCampaign(id, navigate)}
      isClubPresident={user?.role === "STUDENT_PRESIDENT"}
      isClubMember={user?.isClubMember || false}
      clubVerified={user?.role === "STUDENT_PRESIDENT"}
      user={user!}
      studentVerified={user?.studentVerified}
    />
  );
}

function CreateCampaignWrapper({
  user,
  navigate,
  onLogin,
  onLogout,
}: {
  user: any;
  navigate: any;
  onLogin: () => void;
  onLogout: () => void;
}) {
  const { handleCreateCampaign } = useCampaigns(user);
  return (
    <>
      <Header currentUser={user} onLogin={onLogin} onLogout={onLogout} />
      <CreateCampaign
        onBack={() => navigate("/my-campaigns")}
        onSubmit={async (data) => {
          await handleCreateCampaign(data);
          navigate("/my-campaigns");
        }}
      />
    </>
  );
}

export function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showLoader, hideLoader } = useLoader();

  const auth = useCurrentUser();
  const {
    user,
    handleLogout,
    handleLogin,
    handleSignup,
    handleGoogleAuth,
    handleForgotPassword,
  } = auth;

  const handleLoginClick = () => {
    navigate("/auth");
  };

  const handleDonate = async (campaignId: string, amount: number) => {
    showLoader();
    try {
      const activeClientDomain =
        localStorage.getItem("dx_client_domain") ||
        (typeof import.meta !== "undefined" && import.meta.env?.VITE_CLIENT_DOMAIN) ||
        (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
          ? window.location.hostname
          : undefined);

      const res = await fetch(
        `${API_BASE_URL}/donations/create-order`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            ...(activeClientDomain ? { "x-client-domain": activeClientDomain } : {}),
          },
          body: JSON.stringify({
            projectId: campaignId,
            amount,
          }),
        }
      );

      const data = await res.json();

      const isOrgDomain =
        typeof window !== "undefined" &&
        (window.location.hostname.endsWith("dreamxec.org") ||
         new URLSearchParams(window.location.search).get("domain") === "dreamxec.org" ||
         localStorage.getItem("dx_client_domain") === "dreamxec.org");

      const options = {
        key: data.key,
        amount: data.amount,
        currency: "INR",
        name: "DreamXec Academic Foundation (DAF)",
        description: "Research Grant Contribution",
        order_id: data.orderId,
        handler: async (response: any) => {
          hideLoader();
          clearApiCache('/campaigns');
          clearApiCache('campaign');
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success("🎉 Donation pledged and verified in Escrow!");
          } catch (err: any) {
            console.error("Payment verification failed:", err);
            toast.error(err?.message || "Donation verification failed.");
          }
        },
        modal: {
          ondismiss: () => {
            hideLoader();
          },
        },
        theme: { color: "#0F534A" },
      };

      await loadRazorpayScript();

      // If order is simulated or test fallback, route to built-in simulator rather than crashing official checkout.js with 400
      const isSimulatedOrder = !data.orderId?.match(/^order_[a-zA-Z0-9]{14,}$/) || data.key?.includes('dummy');
      if (isSimulatedOrder) {
        setupRazorpaySandboxFallback();
      }

      if (typeof (window as any).Razorpay === 'function') {
        new (window as any).Razorpay(options).open();
      } else {
        hideLoader();
        toast.error("Payment gateway could not be loaded. Please try again.");
      }
    } catch (err) {
      console.error(err);
      hideLoader();
      toast.error("❌ Donation failed");
    }
  };

  // Profile Selector Intercept — show Netflix-style picker when no active profile is set.
  // Exempt auth flows, public browsing pages, and read-only routes so users without
  // an org membership can still browse campaigns, view profiles, etc.
  const profileExemptPaths = [
    // Auth flows
    "/org-onboarding",
    "/onboarding",
    "/auth/callback",
    "/select-profile",
    "/switch-profile",
    "/auth",
    // Public / read-only pages — no org required
    "/campaigns",
    "/campaign/",
    "/browse",
    "/impact",
    "/impact-dashboard",
    "/refer-club",
    "/clubs",
    "/profile",
    "/vault",
    "/species-profile",
    "/reset-password",
    "/my-campaigns",
    "/campaigns/my",
    // Services, Lab Inventory & Order Fulfillment — fully open to independent users
    "/services",
    "/services/orders",
    "/orders",
    "/inventory",
    "/catalog",
    "/research-services",
    "/researcher-services",
    // Guarded dashboards — each has its own route guard that handles auth;
    // exempt them so page refresh doesn't redirect through ProfileSelector.
    "/admin",
    "/org-admin",
    "/dx-admin",
    "/mentor",
    "/donor",
    "/donor/dashboard",
    "/dashboard",
    "/create",
    "/create-campaign",
  ];
  const isExemptFromProfileSelector =
    location.pathname === "/" ||
    profileExemptPaths.some((p) => location.pathname.startsWith(p));

  // Only intercept with ProfileSelector on routes that genuinely require an org context
  // (institutional admin panels, college governance, etc.).
  // Pure-browsing, services catalog, and open inventory ordering paths allow independent users through.
  const isExplicitIndependent =
    user?.activeIdentityType === "USER" ||
    (user as any)?.isIndependent === true ||
    (user?.activeProfile as any)?.role === "USER" ||
    (user?.activeProfile as any)?.isIndependent === true;

  if (user && !user.activeProfile && !isExemptFromProfileSelector && !isExplicitIndependent) {
    return <ProfileSelector />;
  }

  return (
    <Suspense fallback={<LoadingAnimation fullScreen={false} showDarkModeToggle={false} />}>
      <Routes>
        {/* Explicit Profile Selector Routes */}
        <Route path="/select-profile" element={<ProfileSelector />} />
        <Route path="/switch-profile" element={<ProfileSelector />} />

        {/* OAuth Callback */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Homepage */}
        <Route
          path="/"
          element={
            <>
              <Header currentUser={user} onLogin={handleLoginClick} onLogout={handleLogout} />
              <Main />
            </>
          }
        />

        {/* Impact redirects */}
        <Route path="/impact" element={<Navigate to="/campaigns" replace />} />
        <Route path="/impact-dashboard" element={<Navigate to="/campaigns" replace />} />

        {/* Browse Campaigns (Canonical: /campaigns) */}
        <Route
          path="/campaigns"
          element={
            <>
              <Header currentUser={user} onLogin={handleLoginClick} onLogout={handleLogout} />
              <BrowseCampaigns onViewCampaign={(id) => navigateToCampaign(id, navigate)} />
            </>
          }
        />
        <Route path="/browse" element={<Navigate to="/campaigns" replace />} />

        {/* Campaign Details (Canonical: /campaign/:id) */}
        <Route
          path="/campaign/:id"
          element={
            <CanonicalCampaignRoute
              currentUser={user}
              onDonate={handleDonate}
              onLogin={handleLoginClick}
              onLogout={handleLogout}
            />
          }
        />
        <Route path="/campaigns/:id" element={<Navigate to="/campaign/:id" replace />} />

        <Route path="/refer-club" element={<ReferClub />} />

        {/* Clubs Routes */}
        <Route
          path="/clubs"
          element={
            <>
              <Header currentUser={user} onLogin={handleLoginClick} onLogout={handleLogout} />
              <ClubDiscovery />
            </>
          }
        />
        <Route
          path="/clubs/:id"
          element={
            <>
              <Header currentUser={user} onLogin={handleLoginClick} onLogout={handleLogout} />
              <ClubDetails />
            </>
          }
        />

        {/* Researcher External Services Hub */}
        <Route
          path="/services"
          element={
            <>
              <Header currentUser={user} onLogin={handleLoginClick} onLogout={handleLogout} />
              <ResearcherServicesPage currentUser={user} onLogin={handleLoginClick} />
            </>
          }
        />
        <Route path="/research-services" element={<Navigate to="/services" replace />} />
        <Route path="/researcher-services" element={<Navigate to="/services" replace />} />

        {/* Researcher Orders Management Page */}
        <Route
          path="/services/orders"
          element={
            <>
              <Header currentUser={user} onLogin={handleLoginClick} onLogout={handleLogout} />
              <ResearcherOrdersPage currentUser={user} onLogin={handleLoginClick} />
            </>
          }
        />
        <Route path="/orders" element={<Navigate to="/services/orders" replace />} />
        <Route path="/inventory" element={<Navigate to="/services" replace />} />
        <Route path="/catalog" element={<Navigate to="/services" replace />} />
        <Route path="/inventory/orders" element={<Navigate to="/services/orders" replace />} />

        {/* My Campaigns Management Page (Canonical: /my-campaigns) */}
        <Route
          path="/my-campaigns"
          element={
            <ProtectedRoute user={user}>
              <UnifiedDashboardLayout title="My Campaigns | DreamXec" headerTitle="Campaign Portfolio" noPadding>
                <MyCampaigns currentUser={user} onLogin={handleLoginClick} />
              </UnifiedDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route path="/campaigns/my" element={<Navigate to="/my-campaigns" replace />} />

        {/* Donor Dashboard Routes (Canonical: /donor/dashboard) */}
        <Route
          path="/donor/dashboard"
          element={
            <ProtectedRoute user={user}>
              <Header currentUser={user} onLogin={handleLoginClick} onLogout={handleLogout} />
              <DonorDashboard currentUser={user} onLogin={handleLoginClick} />
            </ProtectedRoute>
          }
        />
        <Route path="/donor" element={<Navigate to="/donor/dashboard" replace />} />

        {/* Student Dashboard */}
        <Route
          path="/dashboard"
          element={
            <StudentGuard user={user}>
              <StudentDashboardWrapper user={user} navigate={navigate} />
            </StudentGuard>
          }
        />

        {/* Create Campaign */}
        <Route
          path="/create"
          element={
            <ProtectedRoute user={user}>
              <CreateCampaignWrapper
                user={user}
                navigate={navigate}
                onLogin={handleLoginClick}
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          }
        />
        <Route path="/create-campaign" element={<Navigate to="/create" replace />} />

        <Route
          path="/mentor/dashboard"
          element={
            <StudentGuard user={user}>
              <MentorDashboard />
            </StudentGuard>
          }
        />
        <Route path="/mentor" element={<Navigate to="/mentor/dashboard" replace />} />

        {/* Role-Specific Dashboards */}
        <Route
          path="/compliance/dashboard"
          element={
            <ProtectedRoute user={user}>
              <ComplianceDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/compliance" element={<Navigate to="/compliance/dashboard" replace />} />

        <Route
          path="/grants/dashboard"
          element={
            <ProtectedRoute user={user}>
              <GrantOfficerDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/grants" element={<Navigate to="/grants/dashboard" replace />} />

        <Route
          path="/finance/dashboard"
          element={
            <ProtectedRoute user={user}>
              <FinanceOfficerDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/finance" element={<Navigate to="/finance/dashboard" replace />} />

        <Route
          path="/professor/dashboard"
          element={
            <ProtectedRoute user={user}>
              <ProfessorDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/professor" element={<Navigate to="/professor/dashboard" replace />} />

        <Route
          path="/incubator/dashboard"
          element={
            <ProtectedRoute user={user}>
              <IncubatorDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/incubator" element={<Navigate to="/incubator/dashboard" replace />} />

        <Route
          path="/gov/dashboard"
          element={
            <ProtectedRoute user={user}>
              <GovOfficerDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/gov" element={<Navigate to="/gov/dashboard" replace />} />

        <Route
          path="/sponsor/dashboard"
          element={
            <ProtectedRoute user={user}>
              <SponsorDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/sponsor" element={<Navigate to="/sponsor/dashboard" replace />} />

        <Route path="/donor-dashboard" element={<Navigate to="/donor/dashboard" replace />} />

        <Route path="/campaign/:id/edit" element={<EditCampaign />} />

        {/* Org Admin Routes (For all institutional / organization admins) */}
        <Route
          path="/admin"
          element={
            <OrgAdminGuard user={user}>
              <OrgAdminDashboard />
            </OrgAdminGuard>
          }
        />
        <Route
          path="/admin/*"
          element={
            <OrgAdminGuard user={user}>
              <OrgAdminDashboard />
            </OrgAdminGuard>
          }
        />
        <Route
          path="/org-admin"
          element={
            <OrgAdminGuard user={user}>
              <OrgAdminDashboard />
            </OrgAdminGuard>
          }
        />
        <Route
          path="/org-admin/*"
          element={
            <OrgAdminGuard user={user}>
              <OrgAdminDashboard />
            </OrgAdminGuard>
          }
        />

        {/* DX Platform Admin Routes (Strictly for DreamXec root super admins) */}
        <Route
          path="/dx-admin"
          element={
            <DxAdminGuard user={user}>
              <DxAdminDashboard />
            </DxAdminGuard>
          }
        />
        <Route
          path="/dx-admin/*"
          element={
            <DxAdminGuard user={user}>
              <DxAdminDashboard />
            </DxAdminGuard>
          }
        />

        {/* Auth Routes */}
        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />
        <Route
          path="/auth"
          element={
            <GuestGuard user={user}>
              <AuthPage
                onLogin={handleLogin}
                onSignup={(name, email, password) => handleSignup({ name, email, password })}
                onGoogleAuth={handleGoogleAuth}
                onForgotPassword={handleForgotPassword}
                currentUser={user}
                onHeaderLogin={handleLoginClick}
                onLogout={handleLogout}
              />
            </GuestGuard>
          }
        />
        <Route
          path="/login"
          element={
            <GuestGuard user={user}>
              <AuthPage
                onLogin={handleLogin}
                onSignup={(name, email, password) => handleSignup({ name, email, password })}
                onGoogleAuth={handleGoogleAuth}
                onForgotPassword={handleForgotPassword}
                currentUser={user}
                onHeaderLogin={handleLoginClick}
                onLogout={handleLogout}
              />
            </GuestGuard>
          }
        />

        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile-setup" element={<ProtectedRoute user={user}><ProfileSetup /></ProtectedRoute>} />
        <Route path="/onboarding" element={<ProtectedRoute user={user}><OrgOnboardingPage /></ProtectedRoute>} />
        <Route path="/onboarding/existing-org" element={<ProtectedRoute user={user}><OrgOnboardingPage /></ProtectedRoute>} />
        <Route path="/onboarding/:orgSlug" element={<ProtectedRoute user={user}><OrgOnboardingPage /></ProtectedRoute>} />
        
        <Route
          path="/profile/setup"
          element={
            <ProtectedRoute user={user}>
              <UserProfile user={user!} onBack={() => navigate(-1)} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={<Navigate to="/profile/setup" replace />}
        />
        <Route
          path="/profile/*"
          element={
            <ProtectedRoute user={user}>
              <UserProfile user={user!} onBack={() => navigate(-1)} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Vault Routes */}
        <Route
          path="/vault"
          element={
            <ProtectedRoute user={user}>
              <UnifiedDashboardLayout title="Secure Vault | DreamXec" headerTitle="Dual-Custody Secure Vault">
                <VaultSection />
              </UnifiedDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vault/*"
          element={
            <ProtectedRoute user={user}>
              <UnifiedDashboardLayout title="Secure Vault | DreamXec" headerTitle="Dual-Custody Secure Vault">
                <VaultSection />
              </UnifiedDashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Endangered Species Profile Route */}
        <Route
          path="/species-profile"
          element={
            <ProtectedRoute user={user}>
              <UnifiedDashboardLayout title="Endangered Species Profile | DreamXec" headerTitle="Species Identity Profile">
                <EndangeredSpeciesView user={user} />
              </UnifiedDashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute user={user}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/check-email"
          element={
            <CheckEmail email={auth.signupEmail} onBackToLogin={() => navigate("/auth")} />
          }
        />

        {/* Legal & Statutory Compliance Routes */}
        <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />
        <Route path="/terms" element={<TermsAndConditionsPage />} />
        <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/donation-policy" element={<DonationPolicyPage />} />
        <Route path="/grant-terms" element={<DonationPolicyPage />} />

        {/* 404 Catch-All Route */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>

  );
}
