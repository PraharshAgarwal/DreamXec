import React, { useState, useEffect, useRef, useMemo } from 'react';
import { uploadProfilePicture } from '../services/profileService';
import { VerificationModal } from './VerificationModal';
import { RestrictionModal } from './RestrictionModal';
import type { Campaign, User } from '../types';
import { useNavigate, useSearchParams } from "react-router-dom";
import UnifiedDashboardLayout from './layout/UnifiedDashboardLayout';
import TransactionLedgerView from './common/TransactionLedgerView';
import PresidentDashboard from "./president/PresidentDashboard";
import PresidentMembers from "./president/PresidentMembers";
import PresidentCampaigns from "./president/PresidentCampaigns";
import UploadMembers from "./president/UploadMembers";
import AddMemberManually from "./president/AddMemberManually";
import UserWalletView from './wallet/UserWalletView';
import { ResearcherOrdersPage } from '../pages/ResearcherOrdersPage';
import { X } from 'lucide-react';

/* ─────────────────────────────────────────────
   ICONS
───────────────────────────────────────────── */
const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M3 12h18M3 6h18M3 18h18" />
  </svg>
);
const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
);
const DashboardIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const FolderIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);
const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const TrendingUpIcon = ({ className }: { className?: string , style?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
  </svg>
);
const ClockIcon = ({ className }: { className?: string , style?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
  </svg>
);
const CheckCircleIcon = ({ className }: { className?: string, style?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><path d="M9 12l2 2 4-4" />
  </svg>
);
const XCircleIcon = ({ className }: { className?: string, style?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
  </svg>
);
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
  </svg>
);
const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);
const UsersIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const AwardIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <circle cx="12" cy="8" r="7" /><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
  </svg>
);
const FilterIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const ArrowUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
    <path d="M12 19V5m-7 7l7-7 7 7" />
  </svg>
);

const ShieldClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <circle cx="12" cy="12" r="3" />
    <polyline points="12 10.5 12 12 13 13" />
  </svg>
);

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface StudentDashboardProps {
  studentName: string;
  campaigns: Campaign[];
  onCreateCampaign: () => void;
  onViewCampaign: (id: string) => void;
  isClubPresident: boolean;
  isClubMember: boolean;
  clubVerified: boolean;
  user?: User | null;
  studentVerified?: boolean;
}

type PresidentTab = 'dashboard' | 'members' | 'campaigns' | 'upload' | 'manual';

/* ─────────────────────────────────────────────
   NAV ITEM
───────────────────────────────────────────── */
function NavItem({
  icon,
  label,
  active,
  badge,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-black uppercase tracking-widest transition-all duration-150"
      style={
        active
          ? {
              background: '#FF7F00',
              color: '#003366',
              border: '3px solid #003366',
              boxShadow: '4px 4px 0 #003366',
              transform: 'translate(-2px,-2px)',
            }
          : {
              background: 'transparent',
              color: '#fed7aa',
              border: '3px solid transparent',
            }
      }
      onMouseEnter={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,127,0,0.15)';
          (e.currentTarget as HTMLButtonElement).style.color = '#FF7F00';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.color = '#fed7aa';
        }
      }}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          className="px-2 py-0.5 text-xs font-black"
          style={{ background: '#003366', color: '#FF7F00', border: '2px solid #FF7F00' }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

/* ─────────────────────────────────────────────
   KPI CARD
───────────────────────────────────────────── */
function KpiCard({
  label,
  value,
  sub,
  icon,
  badgeBg,
  badgeText,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactNode;
  borderColor?: string;
  badgeBg: string;
  badgeText: string;
}) {
  return (
    <div
      className="bg-white flex flex-col justify-between p-5 border-3 border-[#0F534A] shadow-[4px_4px_0px_#0F534A] transition-all duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[5px_5px_0px_#FE4E1A]"
    >
      <div className="flex items-start justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-[#0F534A] font-headline">{label}</p>
        <div
          className={`w-9 h-9 border-2 border-[#121316] flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_#121316] ${badgeBg} ${badgeText}`}
        >
          {icon}
        </div>
      </div>
      <div className="my-3">
        <p className="text-3xl font-black text-[#121316] leading-none font-headline tracking-tight">{value}</p>
      </div>
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{sub}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   STATUS BADGE
───────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const normalized = (status || 'pending').toLowerCase();
  const config: Record<string, { bg: string; color: string; border: string; label: string; icon?: string }> = {
    live: { bg: '#f0fdf4', color: '#166534', border: '#0B9C2C', label: 'Live' },
    approved: { bg: '#f0fdf4', color: '#166534', border: '#0B9C2C', label: 'Live' },
    fully_funded: { bg: '#f0fdf4', color: '#166534', border: '#0B9C2C', label: 'Fully Funded' },
    disbursing: { bg: '#eff6ff', color: '#1e40af', border: '#3b82f6', label: 'Disbursing' },
    completed: { bg: '#f0fdf4', color: '#166534', border: '#0B9C2C', label: 'Completed' },
    pending_verification: { bg: '#fffbeb', color: '#92400e', border: '#FF7F00', label: 'Pending Admin Approval' },
    pending_endorsement: { bg: '#fffbeb', color: '#92400e', border: '#FF7F00', label: 'Pending Faculty Endorsement' },
    submitted: { bg: '#fffbeb', color: '#92400e', border: '#FF7F00', label: 'Pending Admin Approval' },
    pending: { bg: '#fffbeb', color: '#92400e', border: '#FF7F00', label: 'Pending Admin Approval' },
    draft: { bg: '#f3f4f6', color: '#374151', border: '#9ca3af', label: 'Draft' },
    rejected: { bg: '#fef2f2', color: '#991b1b', border: '#dc2626', label: 'Rejected' },
  };
  const s = config[normalized] ?? config.pending;
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest"
      style={{ background: s.bg, color: s.color, border: `2px solid ${s.border}` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: s.border }}
      />
      {s.label}
    </span>
  );
}

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
export default function StudentDashboard({
  studentName = 'User',
  campaigns = [],
  onCreateCampaign,
  user = null,
  onViewCampaign,
  studentVerified = false,
  isClubPresident = false,
  isClubMember = false,
  clubVerified = false,
}: StudentDashboardProps) {
  const [searchParams] = useSearchParams();
  const selectedTab = searchParams.get('tab') || 'overview';
  const [sidebarOpen, setSidebarOpen] = useState(false); // Kept for compatibility if used elsewhere, but ideally remove
  const [searchQuery, setSearchQuery] = useState('');
  const [profilePic, setProfilePic] = useState<string | null>(user?.profilePicture || null);
  const [isUploadingPic, setIsUploadingPic] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [presidentTab, setPresidentTab] = useState<PresidentTab>('dashboard');
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [isPresidentRestrictionOpen, setIsPresidentRestrictionOpen] = useState(false);
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const isPartOfClub = isClubPresident || isClubMember;
  const canCreateCampaign = studentVerified;

  useEffect(() => {
    if (selectedTab === 'campaigns') {
      navigate('/my-campaigns', { replace: true });
    }
  }, [selectedTab, navigate]);

  const analytics = useMemo(() => {
    const normalized = campaigns.map(c => ({
      status: (c.status || '').toLowerCase(),
      currentAmount: Number((c as any).currentRaisedAmount || (c as any).raisedAmount || c.currentAmount || 0),
      goalAmount: Number(c.goalAmount || 0),
    }));
    const approved = normalized.filter(c => ['approved', 'live', 'fully_funded', 'disbursing', 'completed'].includes(c.status));
    const pending = normalized.filter(c => ['pending', 'pending_verification', 'pending_endorsement', 'submitted', 'draft'].includes(c.status));
    const rejected = normalized.filter(c => c.status === 'rejected');
    return {
      totalRaised: approved.reduce((sum, c) => sum + c.currentAmount, 0),
      approvedCount: approved.length,
      pendingCount: pending.length,
      rejectedCount: rejected.length,
    };
  }, [campaigns]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  useEffect(() => {
    document.body.style.overflow = sidebarOpen && window.innerWidth < 1024 ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [sidebarOpen]);

  const handlePresidentClick = () => {
    if (studentVerified) {
      window.location.href = '/verify-president';
    } else {
      setIsPresidentRestrictionOpen(true);
    }
  };

  const handleCreateCampaign = () => {
    if (studentVerified) {
      onCreateCampaign();
    } else {
      setIsVerificationModalOpen(true);
    }
  };

  const tabLabel = (t: string) => {
    if (t === 'overview') return 'Overview';
    if (t === 'milestones') return 'Milestones';
    if (t === 'wallet') return 'Wallet & Payouts';
    if (t === 'ledger') return 'Transaction Ledger';
    if (t === 'orders') return 'External Lab Orders';
    if (t === 'president') return 'President Panel';
    return '';
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploadingPic(true);
    try {
      const response = await uploadProfilePicture(file);
      if (response.success && response.data?.profilePicture) {
        setProfilePic(response.data.profilePicture);
      } else {
        alert(response.message || 'Failed to upload profile picture.');
      }
    } catch (err: any) {
      alert(err.message || 'Error occurred while uploading.');
    } finally {
      setIsUploadingPic(false);
    }
  };

  const headerActions = (
    <div className="flex items-center gap-2">
      <div
        className="hidden md:flex items-center gap-2 px-3 py-2"
        style={{ border: '2px solid #003366', background: '#fffbf5' }}
      >
        <SearchIcon className="w-4 h-4 text-[#003366]/40" />
        <input
          type="text"
          placeholder="Quick search..."
          className="bg-transparent border-none outline-none text-xs font-bold text-[#003366] placeholder:text-[#003366]/40 w-40 uppercase tracking-wide"
        />
      </div>
      <button
        className="relative p-2.5 transition-all"
        style={{ border: '2px solid #003366', color: '#003366' }}
        aria-label="Notifications"
      >
        <BellIcon className="w-4 h-4" />
        {analytics.pendingCount > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center text-[9px] font-black text-white"
            style={{ background: '#FF7F00', border: '2px solid #003366' }}
          >
            {analytics.pendingCount}
          </span>
        )}
      </button>
    </div>
  );

  return (
    <UnifiedDashboardLayout
      title="Student Portal | DreamXec"
      headerTitle={tabLabel(selectedTab)}
      headerSubtitle={
        selectedTab === 'overview'
          ? 'Monitor your performance'
          : selectedTab === 'orders'
          ? 'Track lab test results, courier dispatch, and report releases'
          : 'Manage your campaigns'
      }
      headerActions={headerActions}
    >
        {/* ── CONTENT ── */}
        <div className="flex-1 p-5 sm:p-6 lg:p-8 space-y-6">

          {/* ── PRESIDENT SUB NAV ── */}
          {selectedTab === 'president' && isClubPresident && (
            <div className="flex flex-wrap gap-2" style={{ borderBottom: '3px solid #003366', paddingBottom: '16px' }}>
              {([
                ['dashboard', 'Overview'],
                ['campaigns', 'Campaigns'],
                ['members', 'Members'],
                ['manual', 'Add Member'],
                ['upload', 'Upload CSV'],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setPresidentTab(key as PresidentTab)}
                  className="px-4 py-2 text-xs font-black uppercase tracking-widest transition-all"
                  style={
                    presidentTab === key
                      ? { background: '#003366', color: '#FF7F00', border: '3px solid #003366', boxShadow: '3px 3px 0 #FF7F00' }
                      : { background: '#fff', color: '#003366', border: '3px solid #003366' }
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* ════════════════════════
              OVERVIEW TAB
          ════════════════════════ */}
          {selectedTab === 'overview' && (
            <div className="space-y-6">
              {/* Verification alert */}
              {!studentVerified && (
                <div className="bg-white rounded-2xl p-5 border border-amber-300/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-orange-50 border border-orange-200 text-[#FE4E1A] flex items-center justify-center flex-shrink-0 shadow-sm">
                      <ShieldClockIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-headline font-black text-sm text-[#002B49] uppercase tracking-wide">
                        Action Required: Verify Your Account
                      </p>
                      <p className="text-xs font-medium text-gray-600 mt-0.5">
                        Complete student verification to unlock campaign creation and full platform access.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsVerificationModalOpen(true)}
                    className="flex-shrink-0 px-5 py-2.5 text-xs font-headline font-black uppercase tracking-wider text-white bg-[#0F534A] hover:bg-[#0b3d36] border-2 border-[#121316] shadow-[3px_3px_0px_#FE4E1A] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    Verify Now →
                  </button>
                </div>
              )}

              {/* KPI Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
                <KpiCard
                  label="Total Raised"
                  value={`₹${analytics.totalRaised > 0 ? (analytics.totalRaised / 1000).toFixed(1) + 'K' : '0'}`}
                  sub="From approved campaigns"
                  icon={<TrendingUpIcon className="w-5 h-5" />}
                  borderColor="border-emerald-500"
                  badgeBg="bg-emerald-50 border border-emerald-200"
                  badgeText="text-emerald-600"
                />
                <KpiCard
                  label="Active"
                  value={analytics.approvedCount}
                  sub="Running campaigns"
                  icon={<CheckCircleIcon className="w-5 h-5" />}
                  borderColor="border-blue-500"
                  badgeBg="bg-blue-50 border border-blue-200"
                  badgeText="text-blue-600"
                />
                <KpiCard
                  label="Pending"
                  value={analytics.pendingCount}
                  sub="Under review"
                  icon={<ClockIcon className="w-5 h-5" />}
                  borderColor="border-orange-400"
                  badgeBg="bg-orange-50 border border-orange-200"
                  badgeText="text-orange-500"
                />
                <KpiCard
                  label="Rejected"
                  value={analytics.rejectedCount}
                  sub="Needs attention"
                  icon={<XCircleIcon className="w-5 h-5" />}
                  borderColor="border-rose-400"
                  badgeBg="bg-rose-50 border border-rose-200"
                  badgeText="text-rose-500"
                />
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Create Campaign */}
                <button
                  onClick={handleCreateCampaign}
                  className={`group relative overflow-hidden flex flex-col justify-between min-h-[140px] p-6 text-left border-3 border-[#0F534A] shadow-[4px_4px_0px_#FE4E1A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#FE4E1A] transition-all duration-200 cursor-pointer ${
                    canCreateCampaign ? 'bg-white' : 'bg-amber-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="w-11 h-11 border-2 border-[#121316] bg-[#9EFC5F] text-[#0F534A] flex items-center justify-center shadow-[2px_2px_0px_#121316]">
                      <PlusIcon className="w-6 h-6 stroke-[3]" />
                    </div>
                    {!canCreateCampaign && (
                      <span className="px-2.5 py-1 text-[10px] font-headline font-black uppercase tracking-wider bg-[#FFDD33] text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                        Verification Required
                      </span>
                    )}
                  </div>
                  <div className="mt-4 z-10">
                    <p className="font-headline font-black text-sm text-[#0F534A] uppercase tracking-wide">
                      Create New Campaign
                    </p>
                    <p className="text-xs font-medium text-gray-600 mt-1">
                      {canCreateCampaign ? 'Launch a project or club fundraising campaign' : 'Verify student profile to start a campaign'}
                    </p>
                  </div>
                </button>

                {/* View All */}
                <button
                  onClick={() => navigate('/my-campaigns')}
                  className="group relative overflow-hidden flex flex-col justify-between min-h-[140px] p-6 text-left bg-white border-3 border-[#0F534A] shadow-[4px_4px_0px_#4717AE] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_#4717AE] transition-all duration-200 cursor-pointer"
                >
                  <div className="flex items-start justify-between w-full">
                    <div className="w-11 h-11 border-2 border-[#121316] bg-[#18D7E8] text-[#121316] flex items-center justify-center shadow-[2px_2px_0px_#121316]">
                      <FolderIcon className="w-5 h-5 stroke-[2.5]" />
                    </div>
                  </div>
                  <div className="mt-4 z-10">
                    <p className="font-headline font-black text-sm text-[#0F534A] uppercase tracking-wide">
                      View All Campaigns
                    </p>
                    <p className="text-xs font-medium text-gray-600 mt-1">
                      Access and manage your active proposals and project portfolio
                    </p>
                  </div>
                </button>
              </div>

              {/* ── EMPTY STATE: QUICK-START ROADMAP FOR FIRST-TIME STUDENTS ── */}
              {campaigns.length === 0 && (
                <div className="p-6 sm:p-8 bg-white border-3 border-[#0F534A] shadow-[6px_6px_0px_#0F534A]">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-[#FFDD33] text-[#0F534A] border-2 border-[#121316] shadow-[2px_2px_0px_#121316] flex items-center justify-center text-lg font-black">
                      🚀
                    </div>
                    <div>
                      <h3 className="font-headline font-black text-base sm:text-lg text-[#0F534A] uppercase tracking-tight">
                        Launch Your First Innovation Project
                      </h3>
                      <p className="text-xs text-gray-600 font-medium">
                        Follow this 4-step roadmap to turn your prototype or research idea into a funded initiative
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-[#FCFBF7] border-2 border-[#0F534A] space-y-2">
                      <div className="w-6 h-6 bg-[#FE4E1A] text-white font-headline font-black text-xs flex items-center justify-center">
                        1
                      </div>
                      <h4 className="font-headline font-black text-xs uppercase text-[#0F534A]">
                        Verify Enrollment
                      </h4>
                      <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                        Verify your college ID or club leadership to unlock creator permissions.
                      </p>
                    </div>

                    <div className="p-4 bg-[#FCFBF7] border-2 border-[#0F534A] space-y-2">
                      <div className="w-6 h-6 bg-[#FFDD33] text-[#121316] font-headline font-black text-xs flex items-center justify-center border border-[#121316]">
                        2
                      </div>
                      <h4 className="font-headline font-black text-xs uppercase text-[#0F534A]">
                        Pitch Your Project
                      </h4>
                      <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                        Detail your problem statement, hardware bill of materials, and target budget.
                      </p>
                    </div>

                    <div className="p-4 bg-[#FCFBF7] border-2 border-[#0F534A] space-y-2">
                      <div className="w-6 h-6 bg-[#18D7E8] text-[#121316] font-headline font-black text-xs flex items-center justify-center border border-[#121316]">
                        3
                      </div>
                      <h4 className="font-headline font-black text-xs uppercase text-[#0F534A]">
                        Set Milestones
                      </h4>
                      <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                        Break your timeline into deliverable tranches for dual-custody escrow protection.
                      </p>
                    </div>

                    <div className="p-4 bg-[#FCFBF7] border-2 border-[#0F534A] space-y-2">
                      <div className="w-6 h-6 bg-[#9EFC5F] text-[#0F534A] font-headline font-black text-xs flex items-center justify-center border border-[#121316]">
                        4
                      </div>
                      <h4 className="font-headline font-black text-xs uppercase text-[#0F534A]">
                        Launch &amp; Fund
                      </h4>
                      <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                        Obtain faculty mentor endorsement and start receiving grants from alumni and donors.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════
              UPCOMING MILESTONES TAB
          ════════════════════════ */}
          {selectedTab === 'milestones' && (
            <div className="space-y-6">
              <div className="bg-[#0F534A] text-white p-6 border-4 border-[#121316] shadow-[4px_4px_0_#FFDD33] flex items-center justify-between">
                <div>
                  <h3 className="font-headline font-black text-xl uppercase tracking-tight text-[#FFDD33]">
                    Upcoming Project Milestones
                  </h3>
                  <p className="text-xs text-gray-200 font-medium mt-1">
                    Track deliverable deadlines, mentor evaluations, and dual-custody escrow release conditions
                  </p>
                </div>
                <span className="bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] px-3 py-1 text-xs font-headline font-black uppercase">
                  Escrow Protocol Active
                </span>
              </div>

              {campaigns.length === 0 ? (
                <div className="p-12 text-center bg-[#FCFBF7] border-4 border-[#121316] space-y-3">
                  <div className="w-14 h-14 bg-[#FFDD33] text-[#121316] border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] flex items-center justify-center mx-auto">
                    <ClockIcon className="w-8 h-8 text-[#0F534A]" />
                  </div>
                  <h4 className="font-headline font-black text-xl text-[#121316] uppercase">
                    No Upcoming Milestones Scheduled
                  </h4>
                  <p className="text-xs text-gray-600 font-medium max-w-md mx-auto">
                    Create your first campaign or project proposal to initialize milestone disbursement tracking.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {campaigns.map((c) => {
                    const campaignMilestones = c.milestones || [];
                    const escrowFunded = Number(c.currentRaisedAmount || (c as any).raisedAmount || c.currentAmount || 0);

                    return (
                      <div key={c.id} className="p-6 bg-white border-4 border-[#121316] shadow-[4px_4px_0_#121316] space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <span className="bg-[#18D7E8] border-2 border-[#121316] px-2.5 py-0.5 text-[9px] font-headline font-black uppercase">
                              {campaignMilestones.length > 0 ? `${campaignMilestones.length} Milestone Tranche(s)` : 'Standard Protocol'}
                            </span>
                            <h4 className="font-headline font-black text-lg uppercase text-[#121316] mt-1">
                              {c.title}
                            </h4>
                          </div>
                          <span className="font-headline font-black text-sm text-[#0F534A] bg-[#9EFC5F] border-2 border-[#121316] px-3 py-1 self-start sm:self-auto">
                            Escrow Funded: ₹{escrowFunded.toLocaleString('en-IN')} / ₹{Number(c.goalAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </div>

                        {campaignMilestones.length === 0 ? (
                          <div className="p-4 bg-[#FCFBF7] border-2 border-[#121316] text-xs text-gray-600 font-medium">
                            <p className="font-bold text-[#121316] uppercase mb-1">Standard 3-Stage Escrow Lock Active</p>
                            <p>Tranches are unlocked upon faculty / mentor deliverable review and vote approvals.</p>
                          </div>
                        ) : (
                          <div className="space-y-2.5">
                            {campaignMilestones.map((m, idx) => (
                              <div key={m.id || idx} className="p-3 bg-[#FCFBF7] border-2 border-[#121316] flex items-center justify-between gap-4">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 bg-[#FFDD33] border-2 border-[#121316] flex items-center justify-center text-[10px] font-headline font-black">
                                      {idx + 1}
                                    </span>
                                    <span className="font-headline font-black text-xs text-[#121316] uppercase">
                                      {m.title}
                                    </span>
                                    <span className="text-[9px] font-black uppercase px-2 py-0.5 border border-[#121316] bg-white text-gray-700">
                                      {m.status || 'PENDING'}
                                    </span>
                                  </div>
                                  {m.description && (
                                    <p className="text-[11px] text-gray-600 font-medium pl-7 line-clamp-1">
                                      {m.description}
                                    </p>
                                  )}
                                </div>
                                <span className="font-headline font-black text-xs text-[#0F534A] whitespace-nowrap">
                                  ₹{Number(m.budget || 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════
              PRESIDENT PANEL
          ════════════════════════ */}
          {selectedTab === 'president' && isClubPresident && (
            <div className="space-y-6">
              {presidentTab === 'dashboard' && <PresidentDashboard />}
              {presidentTab === 'campaigns' && user?.clubIds?.[0] && <PresidentCampaigns clubId={user.clubIds[0]} />}
              {presidentTab === 'members' && <PresidentMembers clubId={user?.clubIds?.[0] || ''} currentUserId={user?.id || ''} />}
              {presidentTab === 'manual' && <AddMemberManually clubId={user?.clubIds?.[0] || ''} />}
              {presidentTab === 'upload' && <UploadMembers />}
            </div>
          )}

          {/* ════════════════════════
              USER WALLET & PAYOUTS TAB
          ════════════════════════ */}
          {selectedTab === 'wallet' && (
            <UserWalletView onOpenLedgerTab={() => navigate('/dashboard?tab=ledger')} />
          )}

          {/* Transaction Ledger Tab */}
          {selectedTab === 'ledger' && (
            <div className="space-y-6">
              <TransactionLedgerView
                title="Student Project & Payout Ledger"
                subtitle="Transparent audit trail of your campaign donations, lab booking receipts, and grant payouts"
              />
            </div>
          )}

          {/* ════════════════════════
              EXTERNAL LAB ORDERS TAB
          ════════════════════════ */}
          {selectedTab === 'orders' && (
            <div className="space-y-6">
              <ResearcherOrdersPage currentUser={user} embedded={true} />
            </div>
          )}
        </div>


      {/* Modals */}
      <VerificationModal isOpen={isVerificationModalOpen} onClose={() => setIsVerificationModalOpen(false)} />
      <RestrictionModal
        isOpen={isPresidentRestrictionOpen}
        onClose={() => setIsPresidentRestrictionOpen(false)}
        onVerify={() => setIsVerificationModalOpen(true)}
      />
    </UnifiedDashboardLayout>
  );
}