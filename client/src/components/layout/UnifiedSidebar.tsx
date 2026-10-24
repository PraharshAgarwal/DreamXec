import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import {
  ShieldCheck,
  Rocket,
  Users,
  Settings,
  DollarSign,
  TrendingUp,
  Award,
  LogOut,
  Repeat,
  Home,
  CheckCircle2,
  Receipt,
  Calendar,
  Building2,
  UserCheck,
  FileText,
  FolderLock,
  Sparkles,
  ShieldAlert,
  Globe,
  Compass,
  HeartHandshake,
  Wallet,
  Package,
  FlaskConical,
  Menu,
  X,
} from 'lucide-react';
import type { User } from '../../types';
import UserAvatar from '../common/UserAvatar';
import { useAuth } from '../../context/AuthContext';
import { getUserRoleProfile, getUserDisplayPersona } from '../../utils/roleUtils';

interface SidebarNavProps {
  label: string;
  icon: React.ReactNode;
  to?: string;
  isActive: boolean;
  onClick?: () => void;
  badge?: number;
}

const SidebarNav = ({ label, icon, to, isActive, onClick, badge }: SidebarNavProps) => {
  const content = (
    <>
      <span className="flex-shrink-0">{icon}</span>
      <span className="flex-1 font-headline font-bold uppercase tracking-wider text-xs">
        {label}
      </span>
      {badge !== undefined && badge > 0 && (
        <span className="bg-[#FFDD33] text-[#121316] px-1.5 py-0.5 text-[10px] font-black rounded border border-[#121316]">
          {badge}
        </span>
      )}
    </>
  );

  const activeStyles = 'bg-[#0F534A] text-white rounded-r-xl font-headline font-bold shadow-sm';
  const inactiveStyles =
    'bg-transparent text-gray-700 hover:bg-gray-100/80 hover:text-gray-900 rounded-r-xl';
  const baseClass = `flex items-center gap-3 px-4 py-3 text-xs transition-all cursor-pointer ${isActive ? activeStyles : inactiveStyles}`;

  if (to) {
    return (
      <Link to={to} className={baseClass} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={`w-full ${baseClass}`}>
      {content}
    </button>
  );
};

interface UnifiedSidebarProps {
  currentUser?: User | null;
  onLogout?: () => void;
  onSwitchProfile?: () => void;
  activePath?: string;
}

export default function UnifiedSidebar({
  currentUser,
  onLogout,
  onSwitchProfile,
  activePath,
}: UnifiedSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = activePath || location.pathname + location.search;
  const { personaMode } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  // Resolve identity type and active role using unified role utility
  const roleProfile = getUserRoleProfile(currentUser);
  const displayPersona = getUserDisplayPersona(currentUser, personaMode);
  const isIndependent = roleProfile.isIndependent;
  const activeRole = roleProfile.roleRaw;
  const orgSlug = (currentUser?.activeProfile as any)?.orgSlug || '';
  const isDreamXecRoot = ['dreamxec', 'dx-platform-org'].includes(orgSlug.toLowerCase());
  const identityType = roleProfile.identityType;

  const isExternalOrg =
    activeRole === 'EXTERNAL_ORG_MEMBER' ||
    activeRole === 'EXTERNAL_ORG' ||
    (currentUser?.role as any) === 'EXTERNAL_ORG_MEMBER' ||
    roleProfile.orgType === 'EXTERNAL_ORG';

  // Define navigation based on identity & role
  const getRoleNav = () => {
    if (isExternalOrg) {
      return [
        {
          label: 'Services',
          icon: <FlaskConical className="w-4 h-4" />,
          to: '/services',
          match: '/services',
        },
        {
          label: 'Orders',
          icon: <Package className="w-4 h-4" />,
          to: '/services/orders',
          match: '/services/orders',
        },
      ];
    }

    if (isIndependent) {
      return [
        {
          label: 'Platform Overview',
          icon: <Home className="w-4 h-4" />,
          to: '/dashboard',
          match: '/dashboard',
        },
        {
          label: 'Discover Campaigns',
          icon: <Compass className="w-4 h-4" />,
          to: '/campaigns',
          match: '/campaigns',
        },
        {
          label: 'My Campaigns',
          icon: <Rocket className="w-4 h-4" />,
          to: '/my-campaigns',
          match: '/my-campaigns',
        },
        {
          label: 'Backed Campaigns',
          icon: <HeartHandshake className="w-4 h-4" />,
          to: '/donor/dashboard',
          match: '/donor/dashboard',
        },
        {
          label: 'Wallet & Payouts',
          icon: <Wallet className="w-4 h-4" />,
          to: '/dashboard?tab=wallet',
          match: 'tab=wallet',
        },
        {
          label: 'Transaction Ledger',
          icon: <Receipt className="w-4 h-4" />,
          to: '/dashboard?tab=ledger',
          match: 'tab=ledger',
        },
        {
          label: 'Orders',
          icon: <Package className="w-4 h-4" />,
          to: '/dashboard?tab=orders',
          match: 'tab=orders',
        },
      ];
    }

    switch (activeRole.toUpperCase()) {
      case 'ORG_ADMIN':
      case 'ADMIN':
      case 'DX_ADMIN':
      case 'CORPORATE_ADMIN':
        if (isDreamXecRoot) {
          return [
            {
              label: 'Platform Overview',
              icon: <Home className="w-4 h-4" />,
              to: '/dx-admin/platform-overview',
              match: 'platform-overview',
            },
            {
              label: 'Campus Onboarding',
              icon: <Building2 className="w-4 h-4" />,
              to: '/dx-admin/org-control',
              match: 'org-control',
            },
            {
              label: 'User Approvals',
              icon: <UserCheck className="w-4 h-4" />,
              to: '/dx-admin/users-approvals',
              match: 'users-approvals',
            },
            {
              label: 'Campaign Approvals',
              icon: <Rocket className="w-4 h-4" />,
              to: '/dx-admin/campaigns-approvals',
              match: 'campaigns-approvals',
            },
            {
              label: 'Global Ledger',
              icon: <Receipt className="w-4 h-4" />,
              to: '/dx-admin/ledger',
              match: 'ledger',
            },
          ];
        }
        return [
          {
            label: 'Org Overview',
            icon: <Home className="w-4 h-4" />,
            to: '/admin?tab=overview',
            match: 'tab=overview',
          },
          {
            label: 'Campaign Portfolio',
            icon: <Rocket className="w-4 h-4" />,
            to: '/admin?tab=campaigns',
            match: 'campaigns',
          },
          {
            label: 'Member Directory',
            icon: <Users className="w-4 h-4" />,
            to: '/admin?tab=members',
            match: 'tab=members',
          },
          {
            label: 'Child Orgs & Clubs',
            icon: <Building2 className="w-4 h-4" />,
            to: '/admin?tab=child-orgs',
            match: 'tab=child-orgs',
          },
          {
            label: 'Org Ledger',
            icon: <Receipt className="w-4 h-4" />,
            to: '/admin?tab=ledger',
            match: 'tab=ledger',
          },
          {
            label: 'Org Settings',
            icon: <Settings className="w-4 h-4" />,
            to: '/admin?tab=settings',
            match: 'tab=settings',
          },
        ];
      case 'COMPLIANCE_OFFICER':
        return [
          {
            label: 'Overview',
            icon: <Home className="w-4 h-4" />,
            to: '/compliance/dashboard',
            match: '/compliance/dashboard',
          },
          {
            label: 'Verification Queue',
            icon: <UserCheck className="w-4 h-4" />,
            to: '/compliance/dashboard?tab=verifications',
            match: 'tab=verifications',
          },
          {
            label: 'IRB Ethics Reviews',
            icon: <ShieldCheck className="w-4 h-4" />,
            to: '/compliance/dashboard?tab=irb',
            match: 'tab=irb',
          },
          {
            label: 'Fraud Cases',
            icon: <ShieldAlert className="w-4 h-4" />,
            to: '/compliance/dashboard?tab=fraud',
            match: 'tab=fraud',
          },
          {
            label: 'Workflow Templates',
            icon: <FileText className="w-4 h-4" />,
            to: '/compliance/dashboard?tab=workflows',
            match: 'tab=workflows',
          },
          {
            label: 'Stage Reviews',
            icon: <CheckCircle2 className="w-4 h-4" />,
            to: '/compliance/dashboard?tab=stage-reviews',
            match: 'tab=stage-reviews',
          },
        ];
      case 'GRANT_OFFICER':
        return [
          {
            label: 'Overview',
            icon: <Home className="w-4 h-4" />,
            to: '/grants/dashboard',
            match: '/grants/dashboard',
          },
          {
            label: 'Post Grants',
            icon: <Award className="w-4 h-4" />,
            to: '/grants/dashboard?tab=post',
            match: 'tab=post',
          },
          {
            label: 'Allocate Funds',
            icon: <DollarSign className="w-4 h-4" />,
            to: '/grants/dashboard?tab=allocate',
            match: 'tab=allocate',
          },
          {
            label: 'Applications',
            icon: <FileText className="w-4 h-4" />,
            to: '/grants/dashboard?tab=applications',
            match: 'tab=applications',
          },
          {
            label: 'Milestone Tracking',
            icon: <TrendingUp className="w-4 h-4" />,
            to: '/grants/dashboard?tab=milestones',
            match: 'tab=milestones',
          },
        ];
      case 'FINANCE_OFFICER':
        return [
          {
            label: 'Overview',
            icon: <Home className="w-4 h-4" />,
            to: '/finance/dashboard',
            match: '/finance/dashboard',
          },
          {
            label: 'Transaction Ledger',
            icon: <Receipt className="w-4 h-4" />,
            to: '/finance/dashboard?tab=ledger',
            match: 'tab=ledger',
          },
          {
            label: 'Disbursements',
            icon: <DollarSign className="w-4 h-4" />,
            to: '/finance/dashboard?tab=disburse',
            match: 'tab=disburse',
          },
          {
            label: 'Reconciliation',
            icon: <CheckCircle2 className="w-4 h-4" />,
            to: '/finance/dashboard?tab=reconcile',
            match: 'tab=reconcile',
          },
          {
            label: 'Refunds',
            icon: <Repeat className="w-4 h-4" />,
            to: '/finance/dashboard?tab=refunds',
            match: 'tab=refunds',
          },
          {
            label: 'UC Export',
            icon: <FileText className="w-4 h-4" />,
            to: '/finance/dashboard?tab=uc',
            match: 'tab=uc',
          },
        ];
      case 'PROFESSOR':
        return [
          {
            label: 'Overview',
            icon: <Home className="w-4 h-4" />,
            to: '/professor/dashboard',
            match: '/professor/dashboard',
          },
          {
            label: 'Research Projects',
            icon: <Rocket className="w-4 h-4" />,
            to: '/professor/dashboard?tab=projects',
            match: 'tab=projects',
          },
          {
            label: 'Milestone Reviews',
            icon: <CheckCircle2 className="w-4 h-4" />,
            to: '/professor/dashboard?tab=milestones',
            match: 'tab=milestones',
          },
          {
            label: 'Stage Gate Approvals',
            icon: <Award className="w-4 h-4" />,
            to: '/professor/dashboard?tab=stagegate',
            match: 'tab=stagegate',
          },
          {
            label: 'Lab Bookings',
            icon: <Calendar className="w-4 h-4" />,
            to: '/professor/dashboard?tab=labs',
            match: 'tab=labs',
          },
          {
            label: 'Workflow Reviews',
            icon: <FileText className="w-4 h-4" />,
            to: '/professor/dashboard?tab=workflows',
            match: 'tab=workflows',
          },
        ];
      case 'INCUBATOR_MANAGER':
        return [
          {
            label: 'Overview',
            icon: <Home className="w-4 h-4" />,
            to: '/incubator/dashboard',
            match: '/incubator/dashboard',
          },
          {
            label: 'Startup Pipeline',
            icon: <Rocket className="w-4 h-4" />,
            to: '/incubator/dashboard?tab=pipeline',
            match: 'tab=pipeline',
          },
          {
            label: 'Stage Gate Reviews',
            icon: <Award className="w-4 h-4" />,
            to: '/incubator/dashboard?tab=stagegate',
            match: 'tab=stagegate',
          },
          {
            label: 'Milestones',
            icon: <TrendingUp className="w-4 h-4" />,
            to: '/incubator/dashboard?tab=milestones',
            match: 'tab=milestones',
          },
          {
            label: 'Workflow Reviews',
            icon: <CheckCircle2 className="w-4 h-4" />,
            to: '/incubator/dashboard?tab=workflows',
            match: 'tab=workflows',
          },
        ];
      case 'GOV_OFFICER':
      case 'GOV_OFFICIAL':
        return [
          {
            label: 'Overview',
            icon: <Home className="w-4 h-4" />,
            to: '/gov/dashboard',
            match: '/gov/dashboard',
          },
          {
            label: 'Problem Statements',
            icon: <FileText className="w-4 h-4" />,
            to: '/gov/dashboard?tab=problems',
            match: 'tab=problems',
          },
          {
            label: 'Grant Schemes',
            icon: <Award className="w-4 h-4" />,
            to: '/gov/dashboard?tab=schemes',
            match: 'tab=schemes',
          },
          {
            label: 'UC Export',
            icon: <Receipt className="w-4 h-4" />,
            to: '/gov/dashboard?tab=uc',
            match: 'tab=uc',
          },
        ];
      case 'SPONSOR':
        return [
          {
            label: 'Overview',
            icon: <Home className="w-4 h-4" />,
            to: '/sponsor/dashboard',
            match: '/sponsor/dashboard',
          },
          {
            label: 'Funded Projects',
            icon: <TrendingUp className="w-4 h-4" />,
            to: '/sponsor/dashboard?tab=funded',
            match: 'tab=funded',
          },
          {
            label: 'Financial Ledger',
            icon: <Receipt className="w-4 h-4" />,
            to: '/sponsor/dashboard?tab=ledger',
            match: 'tab=ledger',
          },
          {
            label: 'Post Grants',
            icon: <Award className="w-4 h-4" />,
            to: '/sponsor/dashboard?tab=post-grants',
            match: 'tab=post-grants',
          },
        ];
      case 'MENTOR':
        return [
          {
            label: 'Assigned Startups',
            icon: <Rocket className="w-4 h-4" />,
            to: '/mentor/dashboard?tab=startups',
            match: 'tab=startups',
          },
          {
            label: 'Milestone Approvals',
            icon: <CheckCircle2 className="w-4 h-4" />,
            to: '/mentor/dashboard?tab=milestones',
            match: 'tab=milestones',
          },
          {
            label: 'Schedule Session',
            icon: <Calendar className="w-4 h-4" />,
            to: '/mentor/dashboard?tab=schedule',
            match: 'tab=schedule',
          },
        ];
      case 'DONOR':
        return [
          {
            label: 'Impact Portfolio',
            icon: <Home className="w-4 h-4" />,
            to: '/donor/dashboard',
            match: '/donor/dashboard',
          },
          {
            label: 'Invested Projects',
            icon: <TrendingUp className="w-4 h-4" />,
            to: '/donor/dashboard?tab=invested',
            match: 'tab=invested',
          },
          {
            label: 'Transaction Ledger',
            icon: <Receipt className="w-4 h-4" />,
            to: '/donor/dashboard?tab=ledger',
            match: 'tab=ledger',
          },
          {
            label: 'Tax Receipts',
            icon: <FileText className="w-4 h-4" />,
            to: '/donor/dashboard?tab=tax',
            match: 'tab=tax',
          },
        ];
      case 'EXTERNAL_ORG_MEMBER':
      case 'EXTERNAL_ORG':
        return [
          {
            label: 'Services',
            icon: <FlaskConical className="w-4 h-4" />,
            to: '/services',
            match: '/services',
          },
          {
            label: 'Orders',
            icon: <Package className="w-4 h-4" />,
            to: '/services/orders',
            match: '/services/orders',
          },
        ];
      case 'STUDENT':
      case 'STUDENT_PRESIDENT':
      default:
        return [
          {
            label: 'Overview',
            icon: <Home className="w-4 h-4" />,
            to: '/dashboard',
            match: '/dashboard',
          },
          {
            label: 'My Campaigns',
            icon: <Rocket className="w-4 h-4" />,
            to: '/my-campaigns',
            match: '/my-campaigns',
          },
          {
            label: 'Upcoming Milestones',
            icon: <TrendingUp className="w-4 h-4" />,
            to: '/dashboard?tab=milestones',
            match: 'tab=milestones',
          },
          {
            label: 'Wallet & Payouts',
            icon: <Wallet className="w-4 h-4" />,
            to: '/dashboard?tab=wallet',
            match: 'tab=wallet',
          },
          {
            label: 'Transaction Ledger',
            icon: <Receipt className="w-4 h-4" />,
            to: '/dashboard?tab=ledger',
            match: 'tab=ledger',
          },
          {
            label: 'Orders',
            icon: <Package className="w-4 h-4" />,
            to: '/dashboard?tab=orders',
            match: 'tab=orders',
          },
        ];
    }
  };

  const navLinks = getRoleNav();

  const renderNavContent = (onItemClick?: () => void) => (
    <>
      {/* ── PROFILE CARD ── */}
      <div className="p-5 border-b border-gray-200 bg-white">
        <div className="flex items-start gap-3">
          <UserAvatar
            user={currentUser}
            src={displayPersona.avatarUrl}
            name={displayPersona.displayName}
            size="lg"
            shape="neo"
            className="flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-headline font-black text-gray-900 text-sm uppercase truncate">
              {displayPersona.displayName}
            </p>
            <p className="text-[10px] text-[#4717AE] font-bold uppercase tracking-wider truncate">
              {roleProfile.orgName}
            </p>

            {/* Identity Badge */}
            <div
              className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-headline font-black uppercase tracking-wider border ${
                isIndependent
                  ? 'bg-[#FE4E1A]/15 text-[#FE4E1A] border-[#FE4E1A]/40'
                  : identityType === 'ORG_ADMIN'
                    ? 'bg-[#4717AE]/15 text-[#4717AE] border-[#4717AE]/40'
                    : 'bg-[#9EFC5F]/30 text-[#0F534A] border-[#0F534A]/30'
              }`}
            >
              {isIndependent ? (
                <>
                  <Globe className="w-3 h-3 text-[#FE4E1A]" /> Active · {roleProfile.badgeLabel}
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3 h-3" /> Active · {roleProfile.badgeLabel}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2">
          <button
            onClick={() => {
              if (onItemClick) onItemClick();
              if (onSwitchProfile) onSwitchProfile();
              navigate('/select-profile');
            }}
            className="w-full flex items-center justify-center gap-2 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg shadow-sm transition-all text-xs font-headline font-bold uppercase tracking-wider cursor-pointer"
          >
            <Repeat className="w-3.5 h-3.5" /> Manage Identities
          </button>
        </div>
      </div>

      {/* ── NAVIGATION ── */}
      <nav className="flex-1 p-3 pr-4 space-y-1.5 overflow-y-auto">
        {navLinks.map((nav, index) => {
          // Precise active check: exact path match OR the currentPath ends with / contains the
          // match string as a full segment (e.g. '?tab=ledger' not just 'ledger' which could
          // match '/my-campaigns' when match='campaigns').
          const isActive =
            currentPath === nav.to ||
            currentPath === nav.match ||
            (nav.match.startsWith('tab=') && currentPath.includes(`?${nav.match}`)) ||
            (nav.match.startsWith('tab=') && currentPath.includes(`&${nav.match}`)) ||
            (!nav.match.startsWith('tab=') && currentPath === nav.match) ||
            (nav.to === '/dashboard?tab=orders' && (currentPath.startsWith('/services/orders') || currentPath.startsWith('/orders')));
          return (
            <SidebarNav
              key={index}
              label={nav.label}
              icon={nav.icon}
              to={nav.to}
              isActive={isActive}
              onClick={onItemClick}
            />
          );
        })}

        {!isExternalOrg && (
          <>
            <div className="my-3 border-t border-gray-200"></div>

            <SidebarNav
              label="Profile & KYC Settings"
              icon={<UserCheck className="w-4 h-4" />}
              to="/profile/personal"
              isActive={currentPath.includes('/profile')}
              onClick={onItemClick}
            />

            <SidebarNav
              label="Secure Vault"
              icon={<FolderLock className="w-4 h-4" />}
              to="/vault/bank"
              isActive={currentPath.includes('/vault')}
              onClick={onItemClick}
            />

            <SidebarNav
              label="Species Profile"
              icon={<Sparkles className="w-4 h-4 text-[#0F534A]" />}
              to="/species-profile"
              isActive={currentPath.includes('/species-profile')}
              onClick={onItemClick}
            />

            <SidebarNav
              label="Settings"
              icon={<Settings className="w-4 h-4" />}
              to="/settings"
              isActive={currentPath.includes('/settings')}
              onClick={onItemClick}
            />
          </>
        )}
      </nav>

      {/* ── LOGOUT ── */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <SidebarNav
          label="Logout Session"
          icon={<LogOut className="w-4 h-4" />}
          isActive={false}
          onClick={() => {
            if (onItemClick) onItemClick();
            if (onLogout) onLogout();
          }}
        />
      </div>
    </>
  );

  return (
    <>
      {/* ── MOBILE TRIGGER FLOATING BUTTON ── */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed bottom-6 left-6 z-40 bg-[#0F534A] text-white px-3.5 py-2.5 border-3 border-[#121316] shadow-[3px_3px_0_#121316] hover:bg-[#FE4E1A] active:translate-x-0.5 active:translate-y-0.5 transition-all flex items-center gap-2 font-headline font-black text-xs uppercase cursor-pointer"
        aria-label="Open Workspace Navigation"
      >
        <Menu className="w-4 h-4 text-[#9EFC5F]" />
        <span>Menu</span>
      </button>

      {/* ── MOBILE DRAWER OVERLAY & PANEL ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col border-r-3 border-[#121316] z-10 animate-in slide-in-from-left duration-200">
            <div className="p-3.5 bg-[#0F534A] text-white flex items-center justify-between border-b-3 border-[#121316]">
              <span className="font-headline font-black text-xs uppercase tracking-wider text-[#9EFC5F]">
                Workspace Menu
              </span>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="p-1 text-white hover:text-[#FE4E1A] transition-colors cursor-pointer"
                aria-label="Close Navigation Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {renderNavContent(() => setMobileOpen(false))}
          </div>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden md:flex flex-col w-72 bg-white border-r border-gray-200 h-[calc(100vh-65px)] sticky top-[65px]">
        {renderNavContent()}
      </aside>
    </>
  );
}
