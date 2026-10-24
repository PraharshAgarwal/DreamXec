import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Header } from '../../sections/Header';
import UnifiedSidebar from './UnifiedSidebar';
import SEO from '../SEO';
import { getUserRoleProfile } from '../../utils/roleUtils';

interface UnifiedDashboardLayoutProps {
  title?: string;
  description?: string;
  headerTitle?: string;
  headerSubtitle?: string;
  headerActions?: React.ReactNode;
  noPadding?: boolean;
  contentClassName?: string;
  children: React.ReactNode;
}

export default function UnifiedDashboardLayout({
  title = "Dashboard | DreamXec",
  description = "DreamXec User Dashboard",
  headerTitle,
  headerSubtitle,
  headerActions,
  noPadding = false,
  contentClassName = '',
  children
}: UnifiedDashboardLayoutProps) {
  const { user, handleLogout, clearActiveProfile } = useAuth();
  const navigate = useNavigate();

  const roleProfile = getUserRoleProfile(user);
  const defaultHeaderTitle = headerTitle || `${user?.name || 'User'} • ${roleProfile.roleLabel} Console`;
  const defaultHeaderSubtitle = headerSubtitle || 'DreamX Dual-Custody Verification & Escrow Infrastructure';

  return (
    <>
      <SEO title={title} description={description} />
      {/* ── GLOBAL HEADER ── */}
      <Header currentUser={user} onLogin={() => navigate('/auth')} onLogout={handleLogout} />

      <div className="flex min-h-[calc(100vh-80px)] bg-[#F8FAFC] text-[#121316]">
        {/* ── UNIFIED SIDEBAR ── */}
        <UnifiedSidebar
          currentUser={user}
          onLogout={handleLogout}
          onSwitchProfile={clearActiveProfile}
        />

        {/* ── MAIN WORKSPACE ── */}
        <main className={`flex-1 flex flex-col min-w-0 overflow-y-auto ${noPadding ? '' : 'p-6 space-y-6'} ${contentClassName}`}>
          {/* ── DYNAMIC CONTENT ── */}
          <div className="flex-1">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
