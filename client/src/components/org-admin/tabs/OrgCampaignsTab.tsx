import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Rocket,
  Eye,
  ExternalLink,
  Building2,
  Users,
  Award,
  Calendar,
  X,
  Sparkles,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import UserAvatar from '../../common/UserAvatar';
import { getCampaignUrl } from '../../../utils/campaignRouting';

interface OrgCampaignsTabProps {
  campaigns: any[];
  childOrgs: any[];
  parentOrgName: string;
  loading: boolean;
  selectedChildOrg: string;
  onSelectChildOrg: (orgId: string) => void;
  onRefresh: () => void;
}

export const OrgCampaignsTab: React.FC<OrgCampaignsTabProps> = ({
  campaigns,
  childOrgs,
  parentOrgName,
  loading,
  selectedChildOrg,
  onSelectChildOrg,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reviewingCampaign, setReviewingCampaign] = useState<any | null>(null);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      // 1. Child org filter
      if (selectedChildOrg !== 'ALL') {
        const cOrgId = c.organizationId || c.tenantId;
        if (cOrgId !== selectedChildOrg) return false;
      }

      // 2. Status filter
      const status = (c.status || '').toUpperCase();
      let matchesStatus = statusFilter === 'ALL';
      if (statusFilter === 'LIVE') matchesStatus = status === 'LIVE' || status === 'APPROVED';
      if (statusFilter === 'FULLY_FUNDED') matchesStatus = status === 'FULLY_FUNDED';
      if (statusFilter === 'COMPLETED') matchesStatus = status === 'COMPLETED';
      if (statusFilter === 'DRAFT') matchesStatus = status === 'DRAFT' || status === 'SUBMITTED' || status === 'PENDING_VERIFICATION';
      if (statusFilter === 'REJECTED') matchesStatus = status === 'REJECTED';

      if (!matchesStatus) return false;

      // 3. Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const title = (c.title || '').toLowerCase();
      const studentName = (c.student?.fullName || c.student?.name || c.user?.name || '').toLowerCase();
      const category = (c.category || '').toLowerCase();
      const dept = (c.department?.name || c.tenant?.name || '').toLowerCase();

      return title.includes(q) || studentName.includes(q) || category.includes(q) || dept.includes(q);
    });
  }, [campaigns, selectedChildOrg, statusFilter, searchQuery]);

  return (
    <div className="space-y-6">
      {/* ── HEADER TOOLBAR ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#FE4E1A] p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
              <Rocket className="w-3.5 h-3.5 text-[#0F534A]" /> Org Tree Campaign Portfolio
            </div>
            <h2 className="font-headline font-black text-2xl sm:text-3xl text-[#0F534A] uppercase tracking-tight">
              All Campaigns ({campaigns.length})
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-3xl">
              Comprehensive portfolio of all innovation initiatives and funding campaigns hosted across {parentOrgName} and its affiliated child clubs and departments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/campaigns"
              className="bg-white hover:bg-[#FFDD33] text-[#121316] px-3.5 py-2 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all"
            >
              Public Marketplace ↗
            </Link>
            <button
              onClick={onRefresh}
              disabled={loading}
              className="bg-[#0F534A] hover:bg-[#0b3d36] text-white px-3.5 py-2 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#FE4E1A] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : '🔄 Refresh Data'}
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="pt-3 border-t-2 border-dashed border-gray-300 flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search campaigns by title, student lead, club..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white uppercase tracking-wider"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Child Org Selector */}
            {childOrgs.length > 0 && (
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0F534A]" />
                <select
                  value={selectedChildOrg}
                  onChange={(e) => onSelectChildOrg(e.target.value)}
                  className="px-3 py-1.5 text-xs font-headline font-black uppercase border-2 border-[#121316] bg-white text-[#121316] shadow-[2px_2px_0_#121316] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">All Child Clubs &amp; Depts ({childOrgs.length + 1})</option>
                  {childOrgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.orgType})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-gray-500" />
              {['ALL', 'LIVE', 'FULLY_FUNDED', 'COMPLETED', 'DRAFT'].map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] transition-all cursor-pointer ${
                    statusFilter === f
                      ? 'bg-[#FE4E1A] text-white shadow-[2px_2px_0_#121316]'
                      : 'bg-white text-[#121316] hover:bg-[#FFDD33]'
                  }`}
                >
                  {f.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── CAMPAIGNS GRID / TABLE ── */}
      {filteredCampaigns.length === 0 ? (
        <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-12 text-center max-w-lg mx-auto space-y-3">
          <Rocket className="w-12 h-12 text-[#FE4E1A] mx-auto" />
          <h3 className="font-headline font-black text-2xl text-[#121316] uppercase">
            No Campaigns Match Your Criteria
          </h3>
          <p className="text-xs text-gray-600 font-medium">
            Try adjusting your search terms, status filters, or child club selection.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCampaigns.map((c) => {
            const studentName = c.student?.fullName || c.student?.name || c.user?.name || 'Student Creator';
            const studentEmail = c.student?.email || 'N/A';
            const targetGoal = Number(c.targetAmount || c.goalAmount || 0);
            const currentRaised = Number(c.currentRaisedAmount || c.currentAmount || 0);
            const progressPct = targetGoal > 0 ? Math.min(100, Math.round((currentRaised / targetGoal) * 100)) : 0;
            const orgLabel = c.department?.name || c.tenant?.name || parentOrgName;

            return (
              <div
                key={c.id}
                className="bg-white border-4 border-[#121316] shadow-[5px_5px_0_#121316] p-5 flex flex-col justify-between gap-4 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
              >
                <div className="space-y-3">
                  {/* Thumbnail Cover */}
                  <div className="w-full h-40 border-3 border-[#121316] shadow-[2px_2px_0_#121316] overflow-hidden bg-gray-100 relative">
                    <img
                      src={c.coverImageUrl || '/assets/curious_student_hero.webp'}
                      alt={c.title}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2 py-0.5 text-[9px] font-headline font-black uppercase">
                      {c.category || 'INNOVATION'}
                    </span>
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 text-[9px] font-headline font-black uppercase border-2 border-[#121316] ${
                        c.status === 'LIVE' || c.status === 'APPROVED'
                          ? 'bg-[#9EFC5F] text-[#0F534A]'
                          : c.status === 'COMPLETED' || c.status === 'FULLY_FUNDED'
                          ? 'bg-[#18D7E8] text-[#121316]'
                          : 'bg-white text-gray-800'
                      }`}
                    >
                      {c.status || 'LIVE'}
                    </span>
                  </div>

                  {/* Title & Affiliation */}
                  <div>
                    <div className="inline-block bg-[#FCFBF7] border border-[#121316] text-[#0F534A] px-2 py-0.5 text-[9px] font-headline font-black uppercase truncate max-w-full mb-1">
                      🏛 {orgLabel}
                    </div>
                    <h3 className="font-headline font-black text-lg text-[#0F534A] uppercase leading-tight line-clamp-2">
                      {c.title}
                    </h3>
                  </div>

                  <p className="text-xs text-gray-600 font-medium line-clamp-2">
                    {c.shortDescription || c.description}
                  </p>

                  {/* Student Lead */}
                  <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
                    <UserAvatar
                      user={c.student || c.user}
                      name={studentName}
                      size="sm"
                      shape="circle"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-[#121316] truncate">{studentName}</p>
                      <p className="text-[10px] text-gray-500 font-mono truncate">{studentEmail}</p>
                    </div>
                  </div>

                  {/* Progress Metrics */}
                  <div className="space-y-1.5 bg-[#FCFBF7] border-2 border-[#121316] p-2.5">
                    <div className="w-full bg-gray-200 h-2 border border-[#121316] overflow-hidden">
                      <div
                        className="bg-[#0F534A] h-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-[#0F534A] font-mono">₹{currentRaised.toLocaleString('en-IN')}</span>
                      <span className="text-gray-500 font-mono">Goal: ₹{targetGoal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase pt-0.5">
                      <span>{c.donorCount || 0} Backers</span>
                      <span>{c.milestones?.length || 3} Milestones</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t-2 border-dashed border-gray-300">
                  <button
                    onClick={() => setReviewingCampaign(c)}
                    className="inline-flex items-center gap-1.5 bg-[#4717AE] hover:bg-[#350f87] text-white px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Inspect
                  </button>

                  {getCampaignUrl(c.slug || c.id).startsWith('http') ? (
                    <a
                      href={getCampaignUrl(c.slug || c.id)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 bg-white hover:bg-[#FFDD33] text-[#121316] px-3 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </a>
                  ) : (
                    <Link
                      to={getCampaignUrl(c.slug || c.id)}
                      target="_blank"
                      className="inline-flex items-center gap-1 bg-white hover:bg-[#FFDD33] text-[#121316] px-3 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> View
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── CAMPAIGN INSPECTION MODAL ── */}
      {reviewingCampaign && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border-4 border-[#121316] shadow-[10px_10px_0_#FE4E1A] max-w-4xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto space-y-6">
            {/* Close button */}
            <button
              onClick={() => setReviewingCampaign(null)}
              className="absolute top-4 right-4 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] p-1.5 hover:bg-[#FE4E1A] hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-block bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
                  Org Tree Campaign Inspection
                </span>
                <span className="inline-block bg-[#0F534A] text-white border-2 border-[#121316] px-2 py-0.5 text-[10px] font-headline font-black uppercase">
                  {reviewingCampaign.department?.name || reviewingCampaign.tenant?.name || parentOrgName}
                </span>
              </div>
              <h2 className="font-headline font-black text-2xl sm:text-3xl text-[#0F534A] uppercase tracking-tight">
                {reviewingCampaign.title}
              </h2>
              <div className="flex items-center gap-3 pt-1">
                <UserAvatar
                  user={reviewingCampaign.student || reviewingCampaign.user}
                  name={reviewingCampaign.student?.fullName || reviewingCampaign.student?.name || reviewingCampaign.user?.name}
                  size="sm"
                  shape="circle"
                />
                <div>
                  <p className="text-xs text-[#121316] font-bold">
                    {reviewingCampaign.student?.fullName || reviewingCampaign.student?.name || reviewingCampaign.user?.name || 'Student Lead'} ({reviewingCampaign.student?.email || reviewingCampaign.user?.email || 'N/A'})
                  </p>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">
                    Category: {reviewingCampaign.category || 'Innovation'} &bull; Status: {reviewingCampaign.status || 'LIVE'}
                  </p>
                </div>
              </div>
            </div>

            {/* Cover Banner & Deck Links */}
            <div className="space-y-2">
              <div className="h-56 w-full border-3 border-[#121316] shadow-[3px_3px_0_#121316] overflow-hidden bg-gray-100">
                <img
                  src={reviewingCampaign.coverImageUrl || '/assets/curious_student_hero.webp'}
                  alt={reviewingCampaign.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {(reviewingCampaign.presentationDeckUrl || reviewingCampaign.videoUrl) && (
                <div className="flex gap-2">
                  {reviewingCampaign.presentationDeckUrl && (
                    <a
                      href={reviewingCampaign.presentationDeckUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] text-[11px] font-headline font-black uppercase shadow-[2px_2px_0_#121316]"
                    >
                      📄 Pitch Deck ↗
                    </a>
                  )}
                  {reviewingCampaign.videoUrl && (
                    <a
                      href={reviewingCampaign.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-[#FCFBF7] text-[#121316] border-2 border-[#121316] text-[11px] font-headline font-black uppercase shadow-[2px_2px_0_#121316]"
                    >
                      🎬 Video Link ↗
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Pitch & Story */}
            <div className="bg-[#FCFBF7] border-3 border-[#121316] p-4 space-y-2">
              <h4 className="font-headline font-black text-sm uppercase text-[#0F534A]">
                Campaign Pitch &amp; Problem Statement
              </h4>
              <p className="text-xs sm:text-sm text-gray-800 font-medium whitespace-pre-line leading-relaxed">
                {reviewingCampaign.description || reviewingCampaign.shortDescription}
              </p>
            </div>

            {/* Team Members Roster */}
            {(reviewingCampaign.members?.length > 0 || reviewingCampaign.teamMembers?.length > 0) && (
              <div className="bg-white border-2 border-[#121316] p-4 space-y-2 shadow-[2px_2px_0_#121316]">
                <h4 className="font-headline font-black text-xs uppercase text-[#0F534A]">
                  👥 Team Collaborators ({reviewingCampaign.members?.length || reviewingCampaign.teamMembers?.length})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(reviewingCampaign.members || reviewingCampaign.teamMembers || []).map((m: any, idx: number) => (
                    <span key={idx} className="bg-[#FCFBF7] border border-[#121316] px-2.5 py-1 text-xs font-bold shadow-[1px_1px_0_#121316]">
                      {m.user?.name || m.user?.fullName || m.name} <span className="text-[#FE4E1A] text-[10px] uppercase">({m.title || m.role || 'Member'})</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Milestones Tranches */}
            <div className="space-y-3">
              <h4 className="font-headline font-black text-sm uppercase text-[#0F534A] flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#FE4E1A]" /> Milestone Disbursement Tranches ({reviewingCampaign.milestones?.length || 0})
                </span>
                <span className="text-xs font-mono font-bold text-[#0F534A]">
                  Target Goal: ₹{Number(reviewingCampaign.targetAmount || reviewingCampaign.goalAmount || 0).toLocaleString('en-IN')}
                </span>
              </h4>

              <div className="space-y-3">
                {(reviewingCampaign.milestones || []).map((m: any, idx: number) => {
                  const criteria = Array.isArray(m.acceptanceCriteria) ? m.acceptanceCriteria : [];
                  return (
                    <div key={m.id || idx} className="bg-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-headline font-black text-sm text-[#0F534A] uppercase">
                          Tranche {m.sequenceOrder || idx + 1}: {m.title}
                        </span>
                        <span className="font-mono font-black text-sm text-[#FE4E1A]">
                          ₹{Number(m.targetAmount || m.allocatedAmount || m.budget || 0).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-gray-700 font-medium">{m.objective || m.description || 'Milestone deliverables and progress proof requirements.'}</p>
                      <div className="flex items-center gap-4 text-[10px] text-gray-500 font-bold">
                        <span>⏱ Duration: {m.durationDays || 30} Days</span>
                        {m.deadline && <span>📅 Deadline: {new Date(m.deadline).toLocaleDateString()}</span>}
                        <span>Status: <strong className="text-[#0F534A]">{m.status || 'PLANNED'}</strong></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t-3 border-[#121316]">
              {getCampaignUrl(reviewingCampaign.slug || reviewingCampaign.id).startsWith('http') ? (
                <a
                  href={getCampaignUrl(reviewingCampaign.slug || reviewingCampaign.id)}
                  target="_blank"
                  rel="noreferrer"
                  className="px-5 py-2.5 text-xs font-headline font-black uppercase tracking-wider bg-[#FFDD33] hover:bg-[#FE4E1A] hover:text-white text-[#121316] border-2 border-[#121316] shadow-[3px_3px_0_#121316]"
                >
                  Open Public Campaign Page ↗
                </a>
              ) : (
                <Link
                  to={getCampaignUrl(reviewingCampaign.slug || reviewingCampaign.id)}
                  target="_blank"
                  className="px-5 py-2.5 text-xs font-headline font-black uppercase tracking-wider bg-[#FFDD33] hover:bg-[#FE4E1A] hover:text-white text-[#121316] border-2 border-[#121316] shadow-[3px_3px_0_#121316]"
                >
                  Open Public Campaign Page ↗
                </Link>
              )}
              <button
                type="button"
                onClick={() => setReviewingCampaign(null)}
                className="px-5 py-2.5 text-xs font-headline font-black uppercase tracking-wider bg-[#0F534A] hover:bg-[#0b3d36] text-white border-2 border-[#121316] shadow-[3px_3px_0_#121316] cursor-pointer"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrgCampaignsTab;
