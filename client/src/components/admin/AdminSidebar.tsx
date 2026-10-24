import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  Rocket,
  ShieldCheck,
  UserCheck,
  Users,
  Landmark,
  Layers,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2,
  FileText,
  Award,
} from 'lucide-react';
import type { User } from '../../types';

interface AdminSidebarProps {
  activeTab?: string;
  onSelectTab?: (tab: string) => void;
  stats?: {
    pendingCampaigns?: number;
    pendingMilestones?: number;
    pendingVerifications?: number;
  };
  currentUser?: User | null;
  onLogout?: () => void;
}

export default function AdminSidebar({
  activeTab,
  onSelectTab,
  stats,
  currentUser,
  onLogout,
}: AdminSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isSuperAdmin =
    (currentUser?.role || '').toUpperCase() === 'ADMIN' ||
    (currentUser?.email || '').includes('dreamxec.com');

  const menuItems = [
    {
      key: 'overview',
      label: 'Command Center',
      path: '/admin',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      key: 'campaign-approvals',
      label: 'Campaign Approvals',
      path: '/admin/campaigns?status=PENDING',
      icon: Clock,
      badge: stats?.pendingCampaigns || 0,
      badgeColor: 'bg-[#FE4E1A] text-white',
    },
    {
      key: 'campaigns',
      label: 'Marketplace Campaigns',
      path: '/admin/campaigns',
      icon: Rocket,
      badge: null,
    },
    {
      key: 'verifications',
      label: 'User & Student KYC',
      path: '/admin/verifications',
      icon: UserCheck,
      badge: stats?.pendingVerifications || 0,
      badgeColor: 'bg-[#4717AE] text-white',
    },
    {
      key: 'club-verifications',
      label: 'Club Verifications',
      path: '/admin/club-verifications',
      icon: Building2,
      badge: null,
    },
    {
      key: 'milestones',
      label: 'Milestone Escrow',
      path: '/admin/milestones',
      icon: ShieldCheck,
      badge: stats?.pendingMilestones || 0,
      badgeColor: 'bg-[#FFDD33] text-[#121316]',
    },
    {
      key: 'users',
      label: 'Users & Donors',
      path: '/admin/users',
      icon: Users,
      badge: null,
    },
    {
      key: 'endorsements',
      label: 'Faculty Endorsements',
      path: '/admin?tab=endorsements',
      icon: Award,
      badge: null,
      badgeColor: 'bg-[#9EFC5F] text-[#0F534A]',
    },
    {
      key: 'financials',
      label: 'Financial Ledger',
      path: '/admin/financials',
      icon: Landmark,
      badge: null,
    },
    {
      key: 'audit-logs',
      label: 'Audit Trail',
      path: '/admin/audit-logs',
      icon: FileText,
      badge: null,
    },
  ];

  const handleItemClick = (item: (typeof menuItems)[0]) => {
    if (onSelectTab) {
      onSelectTab(item.key);
    } else {
      navigate(item.path);
    }
  };

  const isItemActive = (item: (typeof menuItems)[0]) => {
    if (activeTab) {
      return activeTab === item.key;
    }
    return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
  };

  return (
    <aside
      className={`bg-[#0F534A] text-white min-h-screen sticky top-0 z-40 flex flex-col border-r-4 border-[#121316] shadow-[4px_0_0_#4717AE] transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-72'
      }`}
    >
      {/* ── TOP LOGO & HEADER ── */}
      <div
        className={`p-5 border-b-3 border-[#121316] bg-[#0c433c] flex items-center ${
          isCollapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => handleItemClick(menuItems[0])}>
          <div className="w-10 h-10 bg-[#FE4E1A] text-white border-3 border-[#121316] shadow-[2px_2px_0_#FFDD33] flex items-center justify-center font-headline font-black text-xl flex-shrink-0">
            DX
          </div>
          {!isCollapsed && (
            <div className="leading-tight">
              <h2 className="font-headline font-black text-lg text-white uppercase tracking-wider">
                DreamX Admin
              </h2>
              <p className="text-[10px] font-bold text-[#FFDD33] uppercase tracking-widest">
                Governance Console
              </p>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-white transition-all cursor-pointer"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* ── NAVIGATION LIST ── */}
      <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item);

          return (
            <button
              key={item.key}
              onClick={() => handleItemClick(item)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center rounded-none border-2 transition-all font-headline font-black text-xs uppercase tracking-wider cursor-pointer ${
                isCollapsed ? 'justify-center p-3' : 'justify-between px-3.5 py-2.5'
              } ${
                active
                  ? 'bg-[#FFDD33] text-[#121316] border-[#121316] shadow-[4px_4px_0_#FE4E1A] translate-x-1'
                  : 'bg-transparent text-white/90 border-transparent hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${
                    active ? 'text-[#0F534A]' : 'text-[#FFDD33]'
                  }`}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>

              {/* Dynamic Badge */}
              {!isCollapsed && item.badge !== null && item.badge > 0 && (
                <span
                  className={`px-2 py-0.5 text-[10px] font-black border-2 border-[#121316] shadow-[1px_1px_0_#121316] ${
                    item.badgeColor || 'bg-[#FE4E1A] text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── FOOTER / USER IDENTITY & LOGOUT ── */}
      <div className="p-3 border-t-3 border-[#121316] bg-[#0c433c] space-y-2">
        {!isCollapsed && (
          <div className="bg-[#121316]/60 border-2 border-white/20 p-2.5 text-xs">
            <p className="font-headline font-black text-white truncate">
              {currentUser?.name || 'Administrator'}
            </p>
            <p className="text-[10px] text-[#FFDD33] font-bold uppercase truncate">
              {(currentUser as any)?.tenant?.name || 'DreamX Platform Lead'}
            </p>
          </div>
        )}

        <button
          onClick={onLogout || (() => navigate('/auth'))}
          className={`w-full flex items-center bg-[#FE4E1A] hover:bg-[#ff6333] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all font-headline font-black text-xs uppercase tracking-wider cursor-pointer ${
            isCollapsed ? 'justify-center p-2.5' : 'justify-center gap-2 py-2 px-3'
          }`}
          title="Logout of Console"
        >
          <LogOut className="w-4 h-4" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}