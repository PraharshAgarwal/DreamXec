import React from 'react';
import {
  Rocket,
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import UserAvatar from '../../common/UserAvatar';

interface OrgOverviewTabProps {
  organization: any;
  childOrgs: any[];
  stats: any;
  recentCampaigns: any[];
  recentMembers: any[];
  onNavigateTab: (tab: string) => void;
  onInspectCampaign: (campaign: any) => void;
  loading: boolean;
}

export const OrgOverviewTab: React.FC<OrgOverviewTabProps> = ({
  organization,
  childOrgs,
  stats,
  recentCampaigns,
  recentMembers,
  onNavigateTab,
  onInspectCampaign,
  loading,
}) => {
  const orgName = organization?.name || 'Institutional Network';
  const orgType = organization?.orgType || 'INSTITUTION';
  const orgSlug = organization?.slug || '';

  return (
    <div className="space-y-6">
      {/* ── INSTITUTION HERO BANNER ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-xs font-headline font-black uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-[#0F534A]" /> {orgType} Console
            </span>
            {childOrgs.length > 0 && (
              <span className="inline-flex items-center gap-1 bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] px-2 py-0.5 text-[11px] font-headline font-black uppercase">
                <Building2 className="w-3 h-3" /> {childOrgs.length} Child Clubs / Departments
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-4xl font-headline font-black text-[#0F534A] uppercase tracking-tight">
            {orgName}
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-2xl">
            Hierarchical governance &amp; innovation command hub overseeing all academic departments, research labs, student clubs, and innovation campaigns.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => onNavigateTab('campaigns')}
            className="flex items-center gap-2 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white text-xs font-headline font-black uppercase tracking-wider px-4 py-2.5 border-3 border-[#121316] shadow-[3px_3px_0_#121316] transition-all cursor-pointer"
          >
            <Rocket className="w-4 h-4" /> View All Campaigns ({stats.totalCampaigns || 0})
          </button>
          <button
            onClick={() => onNavigateTab('members')}
            className="flex items-center gap-2 bg-[#4717AE] hover:bg-[#350f87] text-white text-xs font-headline font-black uppercase tracking-wider px-4 py-2.5 border-3 border-[#121316] shadow-[3px_3px_0_#121316] transition-all cursor-pointer"
          >
            <Users className="w-4 h-4" /> Enrolled Members ({stats.totalUsers || 0})
          </button>
        </div>
      </div>


      {/* ── 4 KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Total Campaigns */}
        <div
          onClick={() => onNavigateTab('campaigns')}
          className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] p-5 cursor-pointer transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-headline font-black uppercase tracking-widest text-[#FE4E1A]">
              Total Campaigns
            </span>
            <Rocket className="w-5 h-5 text-[#FE4E1A]" />
          </div>
          <p className="font-headline font-black text-3xl text-[#121316]">{stats.totalCampaigns || 0}</p>
          <p className="text-[11px] text-gray-500 font-bold mt-1">
            {stats.liveCampaigns || 0} active &bull; parent + child orgs
          </p>
        </div>

        {/* Metric 2: Total Members */}
        <div
          onClick={() => onNavigateTab('members')}
          className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#4717AE] p-5 cursor-pointer transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-headline font-black uppercase tracking-widest text-[#4717AE]">
              Enrolled Members
            </span>
            <Users className="w-5 h-5 text-[#4717AE]" />
          </div>
          <p className="font-headline font-black text-3xl text-[#121316]">{stats.totalUsers || 0}</p>
          <p className="text-[11px] text-gray-500 font-bold mt-1">Students, researchers &amp; faculty</p>
        </div>

        {/* Metric 3: Child Orgs & Clubs */}
        <div
          onClick={() => onNavigateTab('child-orgs')}
          className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#0F534A] p-5 cursor-pointer transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-headline font-black uppercase tracking-widest text-[#0F534A]">
              Child Clubs &amp; Depts
            </span>
            <Building2 className="w-5 h-5 text-[#0F534A]" />
          </div>
          <p className="font-headline font-black text-3xl text-[#121316]">{childOrgs.length}</p>
          <p className="text-[11px] text-gray-500 font-bold mt-1">Affiliated units under {orgName}</p>
        </div>

        {/* Metric 4: Funds Raised in Escrow */}
        <div
          onClick={() => onNavigateTab('ledger')}
          className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FFDD33] p-5 cursor-pointer transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-headline font-black uppercase tracking-widest text-[#0F534A]">
              Funds Raised
            </span>
            <DollarSign className="w-5 h-5 text-[#0F534A]" />
          </div>
          <p className="font-headline font-black text-3xl text-[#0F534A]">
            ₹{Number(stats.totalAmountRaised || 0).toLocaleString('en-IN')}
          </p>
          <p className="text-[11px] text-gray-500 font-bold mt-1">Escrow volume across org campaigns</p>
        </div>
      </div>

      {/* ── RECENT CAMPAIGNS PORTFOLIO PREVIEW ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b-3 border-[#121316] pb-3">
          <div className="space-y-0.5">
            <div className="inline-block bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
              Org Tree Innovation Portfolio
            </div>
            <h3 className="font-headline font-black text-xl text-[#0F534A] uppercase">
              Recent Campaigns from {orgName} &amp; Child Units
            </h3>
          </div>

          <button
            onClick={() => onNavigateTab('campaigns')}
            className="inline-flex items-center gap-1.5 text-xs font-headline font-black uppercase tracking-wider text-[#FE4E1A] hover:underline cursor-pointer"
          >
            View All Campaigns ({stats.totalCampaigns || 0}) <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentCampaigns.length === 0 ? (
          <div className="p-8 text-center bg-[#FCFBF7] border-2 border-[#121316] space-y-2">
            <Rocket className="w-8 h-8 text-[#0F534A] mx-auto" />
            <p className="font-headline font-black text-base text-[#121316] uppercase">
              No Campaigns Found
            </p>
            <p className="text-xs text-gray-600 font-medium">
              No campaigns have been initiated yet under {orgName} or its child clubs.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentCampaigns.slice(0, 6).map((c) => {
              const studentName = c.student?.fullName || c.student?.name || c.user?.name || 'Student Creator';
              const targetGoal = Number(c.targetAmount || c.goalAmount || 0);
              const currentRaised = Number(c.currentRaisedAmount || c.currentAmount || 0);
              const progressPct = targetGoal > 0 ? Math.min(100, Math.round((currentRaised / targetGoal) * 100)) : 0;
              const orgLabel = c.department?.name || c.tenant?.name || orgName;

              return (
                <div
                  key={c.id}
                  className="bg-[#FCFBF7] border-3 border-[#121316] shadow-[3px_3px_0_#FE4E1A] p-4 flex flex-col justify-between gap-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2 py-0.5 text-[9px] font-headline font-black uppercase truncate max-w-[140px]">
                        {orgLabel}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-headline font-black uppercase border-2 border-[#121316] ${
                          c.status === 'LIVE' || c.status === 'APPROVED'
                            ? 'bg-[#9EFC5F] text-[#0F534A]'
                            : c.status === 'COMPLETED' || c.status === 'FULLY_FUNDED'
                            ? 'bg-[#18D7E8] text-[#121316]'
                            : 'bg-white text-gray-700'
                        }`}
                      >
                        {c.status || 'LIVE'}
                      </span>
                    </div>

                    <h4 className="font-headline font-black text-base text-[#0F534A] uppercase leading-tight line-clamp-1">
                      {c.title}
                    </h4>

                    <p className="text-xs text-gray-600 font-medium line-clamp-2">
                      {c.shortDescription || c.description}
                    </p>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full bg-gray-200 h-2 border border-[#121316] overflow-hidden">
                        <div
                          className="bg-[#0F534A] h-full transition-all"
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[10px] font-bold">
                        <span className="text-[#0F534A]">₹{currentRaised.toLocaleString('en-IN')} raised</span>
                        <span className="text-gray-500">Goal: ₹{targetGoal.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t-2 border-gray-200">
                    <span className="text-[10px] text-gray-700 font-bold truncate max-w-[120px]">
                      By {studentName}
                    </span>

                    <button
                      onClick={() => onInspectCampaign(c)}
                      className="bg-[#0F534A] hover:bg-[#0b3d36] text-white px-3 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
                    >
                      Inspect →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── RECENT MEMBERS ROSTER PREVIEW ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#4717AE] p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b-3 border-[#121316] pb-3">
          <div className="space-y-0.5">
            <div className="inline-block bg-[#4717AE] text-white border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
              Enrolled Institutional Community
            </div>
            <h3 className="font-headline font-black text-xl text-[#0F534A] uppercase">
              Recent Members Across {orgName} &amp; Child Units
            </h3>
          </div>

          <button
            onClick={() => onNavigateTab('members')}
            className="inline-flex items-center gap-1.5 text-xs font-headline font-black uppercase tracking-wider text-[#4717AE] hover:underline cursor-pointer"
          >
            Manage Member Directory ({stats.totalUsers || 0}) <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {recentMembers.length === 0 ? (
          <div className="p-8 text-center bg-[#FCFBF7] border-2 border-[#121316] space-y-2">
            <Users className="w-8 h-8 text-[#4717AE] mx-auto" />
            <p className="font-headline font-black text-base text-[#121316] uppercase">
              No Members Registered Yet
            </p>
            <p className="text-xs text-gray-600 font-medium">
              Invite students, researchers, and faculty to join {orgName}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {recentMembers.slice(0, 8).map((u) => {
              const primaryMembership = u.memberships?.[0];
              const roleName = (u.role || primaryMembership?.role || 'STUDENT').replace(/_/g, ' ');
              const memberOrg = primaryMembership?.organization?.name || orgName;

              return (
                <div
                  key={u.id}
                  className="bg-[#FCFBF7] border-3 border-[#121316] shadow-[3px_3px_0_#4717AE] p-4 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <UserAvatar
                      user={u}
                      name={u.fullName || u.name}
                      username={u.username}
                      size="md"
                      shape="neo"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-headline font-black text-sm text-[#121316] uppercase truncate">
                        {u.fullName || u.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-bold truncate">
                        {u.email}
                      </p>
                      <span className="inline-block mt-1 bg-[#9EFC5F]/40 text-[#0F534A] border border-[#0F534A]/30 px-2 py-0.5 text-[9px] font-headline font-black uppercase rounded">
                        {roleName}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 text-[10px] text-gray-600 font-bold truncate">
                    📍 {memberOrg}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrgOverviewTab;
