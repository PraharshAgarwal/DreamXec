import React from 'react';
import {
  Building2,
  Users,
  Rocket,
  ArrowRight,
  ShieldCheck,
  Plus,
  Layers,
} from 'lucide-react';

interface OrgChildOrgsTabProps {
  childOrgs: any[];
  parentOrg: any;
  onFilterByChildOrg: (orgId: string, tab: 'campaigns' | 'members') => void;
  onRefresh: () => void;
  loading: boolean;
}

export const OrgChildOrgsTab: React.FC<OrgChildOrgsTabProps> = ({
  childOrgs,
  parentOrg,
  onFilterByChildOrg,
  onRefresh,
  loading,
}) => {
  const parentOrgName = parentOrg?.name || 'Institutional Network';

  const clubsCount = childOrgs.filter((o) => o.orgType === 'CLUB' || o.orgType === 'STUDENT_CLUB').length;
  const deptsCount = childOrgs.filter((o) => o.orgType === 'COLLEGE_DEPARTMENT' || o.orgType === 'DEPARTMENT' || o.orgType === 'UNIVERSITY').length;
  const labsCount = childOrgs.filter((o) => o.orgType === 'LAB' || o.orgType === 'INCUBATOR').length;

  return (
    <div className="space-y-6">
      {/* ── HEADER BANNER ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-[#0F534A]" /> Institutional Hierarchy &amp; Affiliates
            </div>
            <h2 className="font-headline font-black text-2xl sm:text-3xl text-[#0F534A] uppercase tracking-tight">
              Child Clubs &amp; Departments ({childOrgs.length})
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-3xl">
              All student clubs, academic departments, research labs, and incubator cells affiliated under {parentOrgName}.
            </p>
          </div>

          <button
            onClick={onRefresh}
            disabled={loading}
            className="bg-[#0F534A] hover:bg-[#0b3d36] text-white px-4 py-2 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : '🔄 Refresh Affiliates'}
          </button>
        </div>

        {/* Breakdown Stats Pills */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t-2 border-dashed border-gray-300">
          <div className="bg-[#FCFBF7] border-2 border-[#121316] p-3 flex items-center justify-between">
            <span className="font-headline font-black text-xs uppercase text-gray-700">Student Clubs</span>
            <span className="font-headline font-black text-lg text-[#FE4E1A]">{clubsCount || childOrgs.length}</span>
          </div>
          <div className="bg-[#FCFBF7] border-2 border-[#121316] p-3 flex items-center justify-between">
            <span className="font-headline font-black text-xs uppercase text-gray-700">Academic Depts</span>
            <span className="font-headline font-black text-lg text-[#0F534A]">{deptsCount}</span>
          </div>
          <div className="bg-[#FCFBF7] border-2 border-[#121316] p-3 flex items-center justify-between">
            <span className="font-headline font-black text-xs uppercase text-gray-700">Labs &amp; Incubators</span>
            <span className="font-headline font-black text-lg text-[#4717AE]">{labsCount}</span>
          </div>
        </div>
      </div>

      {/* ── CHILD ORGS GRID ── */}
      {childOrgs.length === 0 ? (
        <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-12 text-center max-w-lg mx-auto space-y-3">
          <Building2 className="w-12 h-12 text-[#0F534A] mx-auto" />
          <h3 className="font-headline font-black text-2xl text-[#121316] uppercase">
            No Child Units Affiliated
          </h3>
          <p className="text-xs text-gray-600 font-medium">
            This organization does not currently have sub-departments or student clubs registered under its hierarchy.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {childOrgs.map((org) => {
            const memberCount = org._count?.memberships || 0;
            const campaignCount = (org._count?.tenantCampaigns || 0) + (org._count?.departmentCampaigns || 0);

            return (
              <div
                key={org.id}
                className="bg-white border-4 border-[#121316] shadow-[5px_5px_0_#0F534A] p-5 flex flex-col justify-between gap-4 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2 py-0.5 text-[9px] font-headline font-black uppercase">
                      {org.orgType || 'CLUB'}
                    </span>
                    <span className="bg-[#9EFC5F]/40 text-[#0F534A] border border-[#0F534A]/30 px-2 py-0.5 text-[9px] font-headline font-black uppercase">
                      {org.lifecycleStatus || 'ACTIVE'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-headline font-black text-xl text-[#0F534A] uppercase leading-tight">
                      {org.name}
                    </h3>
                    <p className="text-[11px] text-gray-500 font-mono mt-0.5">slug: {org.slug}</p>
                  </div>

                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 bg-[#FCFBF7] border-2 border-[#121316] p-3 text-xs">
                    <div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase block">Enrolled Members</span>
                      <p className="font-headline font-black text-base text-[#4717AE] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {memberCount}
                      </p>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase block">Hosted Campaigns</span>
                      <p className="font-headline font-black text-base text-[#FE4E1A] flex items-center gap-1">
                        <Rocket className="w-3.5 h-3.5" /> {campaignCount}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Filters */}
                <div className="flex items-center gap-2 pt-2 border-t-2 border-dashed border-gray-300">
                  <button
                    onClick={() => onFilterByChildOrg(org.id, 'campaigns')}
                    className="flex-1 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white px-3 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer text-center"
                  >
                    Campaigns ({campaignCount}) →
                  </button>

                  <button
                    onClick={() => onFilterByChildOrg(org.id, 'members')}
                    className="flex-1 bg-[#4717AE] hover:bg-[#350f87] text-white px-3 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer text-center"
                  >
                    Members ({memberCount}) →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrgChildOrgsTab;
