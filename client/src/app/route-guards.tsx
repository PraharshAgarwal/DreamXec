import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import type { User } from "../types";
import { getToken } from "../services/api";
import DxAdminSkeletonLayout from "../components/common/DxAdminSkeletonLayout";

interface RouteGuardProps {
  user: User | null;
  children: React.ReactNode;
  allowedRoles?: string[];
  fallbackUrl?: string;
  restrictedMessage?: string;
}

export function ProtectedRoute({
  user,
  children,
  allowedRoles,
  fallbackUrl = "/auth",
  restrictedMessage,
}: RouteGuardProps) {
  const location = useLocation();

  if (!user) {
    // If token exists, user profile is being fetched in the background — show full skeleton layout instead of flashing errors
    if (getToken()) {
      return <DxAdminSkeletonLayout />;
    }
    return <Navigate to={fallbackUrl} state={{ from: location.pathname }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const activeRole = user.activeProfile?.role?.toLowerCase();
    const globalRole = user.role?.toLowerCase();
    const backendProfiles = (user.availableProfiles || []).map((p) => p.role?.toLowerCase());

    const userRoles = Array.from(
      new Set([activeRole, globalRole, ...backendProfiles].filter(Boolean))
    ) as string[];

    const hasRole = allowedRoles.some((r) =>
      userRoles.includes(r.toLowerCase())
    );

    if (!hasRole) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-dreamxec-cream">
          <div className="card-pastel-offwhite rounded-xl border-5 border-dreamxec-navy shadow-pastel-card p-12 text-center max-w-md">
            <div className="card-tricolor-tag"></div>
            <p className="text-dreamxec-navy text-xl font-sans mt-4">
              {restrictedMessage || "Access Restricted"}
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}

export function GuestGuard({ user, children }: { user: User | null; children: React.ReactNode }) {
  if (user) {
    return <Navigate to="/select-profile" replace />;
  }
  return <>{children}</>;
}

export function AdminGuard({ user, children }: { user: User | null; children: React.ReactNode }) {
  return (
    <ProtectedRoute user={user} allowedRoles={["admin", "org_admin", "compliance_officer", "corporate_admin"]} restrictedMessage="Please log in as an admin to access the admin dashboard.">
      {children}
    </ProtectedRoute>
  );
}

export function OrgAdminGuard({ user, children }: { user: User | null; children: React.ReactNode }) {
  return (
    <ProtectedRoute user={user} allowedRoles={["org_admin", "admin", "corporate_admin", "compliance_officer"]} restrictedMessage="Please log in as an authorized organization admin to access this panel.">
      {children}
    </ProtectedRoute>
  );
}

export function DxAdminGuard({ user, children }: { user: User | null; children: React.ReactNode }) {
  if (!user) {
    if (getToken()) {
      return <DxAdminSkeletonLayout />;
    }
    return <Navigate to="/auth" replace />;
  }

  const orgSlug = (user?.activeProfile as any)?.orgSlug || '';
  const isDxAdmin = ['dreamxec', 'dx-platform-org'].includes(orgSlug.toLowerCase()) || user?.role?.toLowerCase() === "admin";

  if (!isDxAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFBF7]">
        <div className="bg-white rounded-xl border-4 border-[#121316] shadow-[6px_6px_0_#FE4E1A] p-12 text-center max-w-md">
          <h2 className="font-headline font-black text-2xl text-[#121316] uppercase">Access Restricted</h2>
          <p className="font-medium text-gray-600 text-sm mt-2">
            Global site administration is restricted exclusively to DreamXec Root Community Admins.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export function StudentGuard({ user, children }: { user: User | null; children: React.ReactNode }) {
  return (
    <ProtectedRoute user={user} allowedRoles={["student", "student_president", "researcher", "professor", "incubator_manager", "mentor"]} restrictedMessage="Please log in with an authorized institutional profile to access this dashboard.">
      {children}
    </ProtectedRoute>
  );
}
