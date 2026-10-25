import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Eye,
  FileText,
  ShieldCheck,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import apiRequest from '../../services/api';
import { LeetCodeCardSkeleton } from '../common/LeetCodeSkeleton';
import UserAvatar from '../common/UserAvatar';

export interface PendingCampaign {
  id: string;
  title: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  category?: string;
  campaignType?: string;
  stage?: string;
  targetAmount?: number;
  goalAmount?: number;
  raisedAmount?: number;
  currentRaisedAmount?: number;
  coverImageUrl?: string | null;
  presentationDeckUrl?: string | null;
  videoUrl?: string | null;
  status: string;
  createdAt: string;
  creator?: {
    id?: string;
    fullName?: string;
    email?: string;
    username?: string | null;
    avatar?: string | null;
  };
  student?: {
    id?: string;
    name?: string;
    email?: string;
    username?: string | null;
    avatar?: string | null;
  };
  user?: {
    id?: string;
    name?: string;
    email?: string;
    username?: string | null;
    avatar?: string | null;
  };
  tenant?: {
    id?: string;
    name?: string;
    slug?: string;
    orgType?: string;
  };
  department?: {
    id?: string;
    name?: string;
    slug?: string;
  };
  organization?: {
    id?: string;
    name?: string;
    orgType?: string;
  };
  members?: Array<{
    id: string;
    role: string;
    title?: string;
    user?: {
      id: string;
      name: string;
      email?: string;
      profilePicture?: string | null;
    };
  }>;
  teamMembers?: Array<{
    name: string;
    role: string;
    email?: string;
  }>;
  beneficiaryDetails?: {
    recipientType?: string;
    accountHolderName?: string;
    bankAccountNumber?: string;
    ifscCode?: string;
    upiId?: string | null;
  } | null;
  milestones?: Array<{
    id: string;
    sequenceOrder?: number;
    title: string;
    targetAmount: number;
    budget?: number;
    description?: string;
    durationDays?: number;
    deadline?: string | null;
    acceptanceCriteria?: string[];
    requiredEvidenceTypes?: string[];
  }>;
  endorsements?: Array<{
    id: string;
    endorserName?: string;
    comments?: string;
  }>;
}

let campaignCache: PendingCampaign[] | null = null;

export const DxCampaignApprovals: React.FC = () => {
  const [campaigns, setCampaigns] = useState<PendingCampaign[]>(campaignCache || []);
  const [loading, setLoading] = useState<boolean>(!campaignCache);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  const [inspectingCampaign, setInspectingCampaign] = useState<PendingCampaign | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState<boolean>(false);
  const [selectedCampaign, setSelectedCampaign] = useState<PendingCampaign | null>(null);
  const [decisionType, setDecisionType] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [decisionReason, setDecisionReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const fetchPendingCampaigns = async () => {
    if (!campaignCache) {
      setLoading(true);
    }
    setError('');
    try {
      const res = await apiRequest<any>('/campaigns/pending-review').catch(() => null);
      const list = res?.data?.campaigns || res?.campaigns || res?.results || [];
      const validList = Array.isArray(list) ? list : [];
      campaignCache = validList;
      setCampaigns(validList);
    } catch (err: any) {
      console.error('Error fetching pending campaigns:', err);
      setError(err?.message || 'Failed to load pending campaign submissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingCampaigns();
  }, []);

  const handleOpenDecisionModal = (campaign: PendingCampaign, type: 'APPROVED' | 'REJECTED') => {
    setSelectedCampaign(campaign);
    setDecisionType(type);
    setDecisionReason('');
    setDecisionModalOpen(true);
  };

  const handleDecisionSubmit = async () => {
    if (!selectedCampaign) return;
    setSubmitting(true);

    try {
      await apiRequest(`/campaigns/${selectedCampaign.id}/verify`, {
        method: 'POST',
        body: JSON.stringify({
          status: decisionType,
          rejectionReason: decisionType === 'REJECTED' ? (decisionReason.trim() || 'Campaign proposal rejected by administration.') : null,
        }),
      });

      setDecisionModalOpen(false);
      if (inspectingCampaign?.id === selectedCampaign.id) {
        setInspectingCampaign(null);
      }
      await fetchPendingCampaigns();
    } catch (err: any) {
      console.error('Campaign decision submission error:', err);
      alert(err?.message || 'Failed to execute campaign approval decision.');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = campaigns.filter((c) => {
    const title = (c.title || '').toLowerCase();
    const creator = (c.creator?.fullName || c.creator?.email || '').toLowerCase();
    const org = (c.organization?.name || '').toLowerCase();
    const category = (c.category || '').toLowerCase();
    const query = searchQuery.toLowerCase();

    const matchesSearch =
      title.includes(query) || creator.includes(query) || org.includes(query) || category.includes(query);
    const matchesCategory = filterCategory === '' || c.category?.toUpperCase() === filterCategory.toUpperCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pt-4">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FCFBF7] p-6 border-3 border-[#121316] shadow-[4px_4px_0_#121316]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-[#FE4E1A] text-white flex items-center justify-center border-2 border-[#121316] shadow-[2px_2px_0_#121316]">
              <Rocket className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-headline font-black uppercase text-[#121316] tracking-wide">
              Campaign Proposals &amp; Marketplace Approval Console
            </h2>
          </div>
          <p className="text-xs text-gray-600 mt-1 font-medium">
            Evaluate student &amp; research fundraising projects, verify milestone allocations, and grant public marketplace listing approvals.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search campaign, student, org..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border-2 border-[#121316] text-[#121316] placeholder-gray-400 text-xs font-bold focus:outline-none focus:border-[#FE4E1A] shadow-[2px_2px_0_#121316]"
            />
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316]">
            <Filter className="w-3.5 h-3.5 text-[#0F534A]" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-transparent text-xs font-headline font-black text-[#121316] focus:outline-none cursor-pointer uppercase"
            >
              <option value="">All Categories</option>
              <option value="RESEARCH">Research &amp; Innovation</option>
              <option value="HARDWARE">Hardware &amp; Robotics</option>
              <option value="COMMUNITY">Community &amp; Social Impact</option>
              <option value="STUDENT_CLUB">Student Club Project</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Campaign Cards List */}
      {loading ? (
        <div className="space-y-4">
          <LeetCodeCardSkeleton />
          <LeetCodeCardSkeleton />
          <LeetCodeCardSkeleton />
        </div>
      ) : error ? (
        <div className="p-6 bg-[#F4002C]/10 border-2 border-[#F4002C] text-[#F4002C] text-xs font-bold shadow-[4px_4px_0_#F4002C]">
          ⚠️ {error}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border-3 border-dashed border-[#121316] p-8 shadow-[4px_4px_0_#121316]">
          <Rocket className="w-12 h-12 text-[#0F534A] mx-auto mb-3" />
          <h3 className="text-base font-headline font-black text-[#121316] uppercase">Campaign Review Queue Clean!</h3>
          <p className="text-gray-500 text-xs mt-1">There are currently no pending campaign proposals awaiting administrative verification.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white border-3 border-[#121316] p-5 shadow-[5px_5px_0_#121316] flex flex-col justify-between gap-4 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
            >
              <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                <div className="space-y-3 flex-1">
                  {/* Category & Status Badges */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="px-3 py-1 bg-[#FE4E1A] text-white text-xs font-headline font-black border border-[#121316] uppercase tracking-wider shadow-[1px_1px_0_#121316]">
                      {campaign.category || 'INNOVATION'}
                    </span>
                    {campaign.status === 'PAUSED' ? (
                      <span className="px-2.5 py-0.5 bg-[#FE4E1A] text-white text-[11px] font-headline font-black border border-[#121316] uppercase tracking-wider shadow-[1px_1px_0_#121316]">
                        ⚠️ Milestone Revision Review (Paused)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 bg-[#FFDD33] text-[#121316] text-[11px] font-headline font-black border border-[#121316] uppercase tracking-wider shadow-[1px_1px_0_#121316]">
                        Pending Administrative Approval
                      </span>
                    )}
                    <span className="text-[11px] text-gray-500 flex items-center gap-1 font-mono font-bold">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      Submitted: {new Date(campaign.createdAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Title & Short Description */}
                  <div>
                    <h3 className="text-base font-headline font-black text-[#121316] uppercase tracking-tight">
                      {campaign.title}
                    </h3>
                    <p className="text-xs text-gray-600 font-medium mt-1 line-clamp-2">
                      {campaign.shortDescription || campaign.description || 'No detailed description provided.'}
                    </p>
                  </div>

                  {/* Creator & Target Metrics */}
                  <div className="flex items-center gap-6 text-xs text-[#121316] pt-1 flex-wrap">
                    <span className="flex items-center gap-1.5 font-headline font-black text-sm text-[#0F534A]">
                      <Building2 className="w-4 h-4 text-[#FE4E1A]" />
                      {campaign.organization?.name || 'Independent Student Campaign'}
                    </span>

                    <span className="flex items-center gap-1.5 font-bold text-xs text-[#121316]">
                      <User className="w-4 h-4 text-[#4717AE]" />
                      {campaign.creator?.fullName || 'Student Innovator'} ({campaign.creator?.email || 'N/A'})
                    </span>

                    <span className="flex items-center gap-1.5 font-headline font-black text-sm text-[#FE4E1A] bg-[#FE4E1A]/10 px-3 py-1 border border-[#121316]">
                      <DollarSign className="w-4 h-4 text-[#FE4E1A]" />
                      Goal Target: ₹{Number(campaign.targetAmount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Deck */}
              <div className="flex items-center justify-between border-t-2 border-gray-100 pt-3 flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingCampaign(campaign)}
                  className="px-4 py-2.5 bg-[#4717AE] hover:bg-[#FE4E1A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] transition-all flex items-center gap-1.5 cursor-pointer shadow-[3px_3px_0_#121316]"
                >
                  <Eye className="w-4 h-4 text-[#9EFC5F]" /> Inspect Full Proposal &amp; Milestones →
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDecisionModal(campaign, 'APPROVED')}
                    className="px-4 py-2 bg-[#0F534A] hover:bg-[#0F534A]/90 text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] transition-all flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0_#121316]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#9EFC5F]" /> Approve Campaign
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenDecisionModal(campaign, 'REJECTED')}
                    className="px-3.5 py-2 bg-[#F4002C] hover:bg-red-700 text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] transition-all flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0_#121316]"
                  >
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Campaign Full Inspection Modal */}
      {inspectingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-[#FCFBF7] border-4 border-[#121316] w-full max-w-4xl shadow-[12px_12px_0px_#FE4E1A] max-h-[92vh] overflow-y-auto relative flex flex-col">
            
            {/* Top Review Header Banner */}
            <div className="bg-[#0F534A] text-white p-5 border-b-4 border-[#121316] flex items-start justify-between gap-4 sticky top-0 z-20 shadow-md">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 bg-[#FFDD33] text-[#121316] font-headline font-black text-[10px] uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                    Maker-Checker Governance Review
                  </span>
                  <span className="px-2.5 py-0.5 bg-[#FE4E1A] text-white font-headline font-black text-[10px] uppercase tracking-wider border-2 border-[#121316]">
                    {inspectingCampaign.category || 'INNOVATION'}
                  </span>
                  <span className="text-[11px] text-[#9EFC5F] font-mono font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Submitted: {new Date(inspectingCampaign.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-headline font-black uppercase text-white tracking-tight leading-tight">
                  {inspectingCampaign.title}
                </h2>
                <p className="text-xs font-bold text-[#FFDD33] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5" />
                  {inspectingCampaign.tenant?.name || inspectingCampaign.organization?.name || 'Independent Student Campaign'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectingCampaign(null)}
                className="w-9 h-9 bg-white border-2 border-[#121316] text-[#121316] font-headline font-black text-lg hover:bg-[#FE4E1A] hover:text-white transition flex items-center justify-center cursor-pointer shadow-[3px_3px_0px_#121316] flex-shrink-0"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 flex-1 bg-[#FCFBF7]">

              {/* ── 1. METRICS & APPLICANT HERO GRID ── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Applicant Card */}
                <div className="bg-white border-3 border-[#121316] p-4 shadow-[4px_4px_0px_#121316] flex items-start gap-3">
                  <UserAvatar
                    src={inspectingCampaign.creator?.avatar || inspectingCampaign.student?.avatar || inspectingCampaign.user?.avatar}
                    name={inspectingCampaign.creator?.fullName || inspectingCampaign.student?.name || inspectingCampaign.user?.name}
                    username={inspectingCampaign.creator?.username || inspectingCampaign.student?.username || inspectingCampaign.user?.username}
                    size="lg"
                    shape="square"
                    className="flex-shrink-0"
                  />
                  <div className="space-y-0.5 min-w-0">
                    <span className="text-[9px] font-headline font-black uppercase text-[#FE4E1A] tracking-wider block">
                      Lead Applicant
                    </span>
                    <h4 className="text-sm font-headline font-black text-[#121316] truncate">
                      {inspectingCampaign.creator?.fullName || inspectingCampaign.student?.name || inspectingCampaign.user?.name || 'Student Lead'}
                    </h4>
                    <span className="text-[10px] font-mono text-gray-600 truncate block">
                      {inspectingCampaign.creator?.email || inspectingCampaign.student?.email || inspectingCampaign.user?.email || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Target Funding Goal Card */}
                <div className="bg-[#FFF8F0] border-3 border-[#121316] p-4 shadow-[4px_4px_0px_#FE4E1A] space-y-1">
                  <span className="text-[9px] font-headline font-black uppercase text-gray-600 tracking-wider block">
                    Target Funding Goal
                  </span>
                  <div className="text-2xl font-headline font-black text-[#FE4E1A] tracking-tight">
                    ₹{Number(inspectingCampaign.targetAmount || inspectingCampaign.goalAmount || 0).toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="px-2 py-0.5 bg-white border border-[#121316] text-[9px] font-headline font-black uppercase text-[#121316]">
                      {inspectingCampaign.campaignType || 'INDIVIDUAL'}
                    </span>
                    <span className="px-2 py-0.5 bg-[#0F534A] text-white text-[9px] font-headline font-black uppercase">
                      {inspectingCampaign.milestones?.length || 0} Tranches
                    </span>
                  </div>
                </div>

                {/* Institutional Department Card */}
                <div className="bg-white border-3 border-[#121316] p-4 shadow-[4px_4px_0px_#121316] space-y-1">
                  <span className="text-[9px] font-headline font-black uppercase text-gray-600 tracking-wider block">
                    Institutional Affiliation
                  </span>
                  <h4 className="text-sm font-headline font-black text-[#0F534A]">
                    {inspectingCampaign.tenant?.name || inspectingCampaign.organization?.name || 'VIT Chennai'}
                  </h4>
                  <span className="text-[10px] text-gray-600 font-bold block">
                    Dept: {inspectingCampaign.department?.name || 'Innovation Center'}
                  </span>
                  <span className="inline-block px-2 py-0.5 bg-[#9EFC5F] text-[#121316] border border-[#121316] text-[9px] font-headline font-black uppercase">
                    Verified Campus Student
                  </span>
                </div>

              </div>

              {/* ── 2. TEAM MEMBERS ROSTER ── */}
              {((inspectingCampaign.members && inspectingCampaign.members.length > 0) || (inspectingCampaign.teamMembers && inspectingCampaign.teamMembers.length > 0)) && (
                <div className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0px_#121316] space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-headline font-black uppercase text-[#0F534A] flex items-center gap-1.5">
                      <User className="w-4 h-4 text-[#FE4E1A]" />
                      Collaborative Project Team ({inspectingCampaign.members?.length || inspectingCampaign.teamMembers?.length})
                    </h4>
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Multi-Disciplinary Team</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {(inspectingCampaign.members || inspectingCampaign.teamMembers || []).map((m: any, idx: number) => (
                      <div
                        key={idx}
                        className="bg-[#FCFBF7] border-2 border-[#121316] p-2.5 shadow-[2px_2px_0px_#121316] flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-[#121316] truncate">{m.user?.name || m.name || 'Member'}</p>
                          <p className="text-[10px] text-gray-500 font-mono truncate">{m.user?.email || m.email || ''}</p>
                        </div>
                        <span className="px-2 py-0.5 bg-[#FFDD33] text-[#121316] border border-[#121316] text-[9px] font-headline font-black uppercase flex-shrink-0">
                          {m.title || m.role || 'Member'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── 3. PROJECT OVERVIEW & IMPACT STORY ── */}
              <div className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0px_#121316] space-y-3">
                <div className="flex items-center justify-between border-b-2 border-dashed border-gray-200 pb-2">
                  <h4 className="text-xs font-headline font-black uppercase text-[#0F534A] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#FE4E1A]" />
                    Project Narrative &amp; Technical Architecture
                  </h4>
                  <span className="text-[10px] bg-[#FCFBF7] border border-gray-300 px-2 py-0.5 font-bold uppercase text-gray-600">
                    Full Description
                  </span>
                </div>

                <p className="text-xs text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                  {inspectingCampaign.description || inspectingCampaign.shortDescription || 'No overview provided.'}
                </p>

                {(inspectingCampaign.presentationDeckUrl || inspectingCampaign.videoUrl) && (
                  <div className="pt-3 border-t-2 border-dashed border-gray-200 flex gap-2.5 flex-wrap">
                    {inspectingCampaign.presentationDeckUrl && (
                      <a
                        href={inspectingCampaign.presentationDeckUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-[#FFDD33] hover:bg-[#ffe666] text-[#121316] border-2 border-[#121316] text-xs font-headline font-black uppercase shadow-[2px_2px_0px_#121316] transition flex items-center gap-1.5 cursor-pointer"
                      >
                        📄 View Presentation Pitch Deck ↗
                      </a>
                    )}
                    {inspectingCampaign.videoUrl && (
                      <a
                        href={inspectingCampaign.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-2 bg-[#18D7E8] hover:bg-[#15bed0] text-[#121316] border-2 border-[#121316] text-xs font-headline font-black uppercase shadow-[2px_2px_0px_#121316] transition flex items-center gap-1.5 cursor-pointer"
                      >
                        🎬 Watch Prototype Video Demo ↗
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* ── 4. ESCROW BENEFICIARY BANKING KYC ── */}
              {inspectingCampaign.beneficiaryDetails && (
                <div className="bg-[#F0FDF4] border-3 border-[#0F534A] p-5 shadow-[4px_4px_0px_#0F534A] space-y-3">
                  <div className="flex items-center justify-between border-b-2 border-[#0F534A]/20 pb-2">
                    <h4 className="text-xs font-headline font-black uppercase text-[#0F534A] flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#0F534A]" />
                      Escrow Beneficiary Banking &amp; KYC Clearance
                    </h4>
                    <span className="px-2 py-0.5 bg-[#0F534A] text-white font-headline font-black text-[9px] uppercase tracking-wider">
                      Verified Account
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-white p-2.5 border-2 border-[#0F534A]">
                      <span className="text-gray-500 uppercase text-[9px] font-bold block mb-0.5">Account Holder</span>
                      <strong className="text-[#121316] font-bold text-xs">{inspectingCampaign.beneficiaryDetails.accountHolderName}</strong>
                    </div>
                    <div className="bg-white p-2.5 border-2 border-[#0F534A]">
                      <span className="text-gray-500 uppercase text-[9px] font-bold block mb-0.5">Bank Account No</span>
                      <strong className="font-mono text-xs text-[#0F534A]">{inspectingCampaign.beneficiaryDetails.bankAccountNumber}</strong>
                    </div>
                    <div className="bg-white p-2.5 border-2 border-[#0F534A]">
                      <span className="text-gray-500 uppercase text-[9px] font-bold block mb-0.5">IFSC Routing Code</span>
                      <strong className="font-mono text-xs text-[#121316]">{inspectingCampaign.beneficiaryDetails.ifscCode}</strong>
                    </div>
                    <div className="bg-white p-2.5 border-2 border-[#0F534A]">
                      <span className="text-gray-500 uppercase text-[9px] font-bold block mb-0.5">UPI ID</span>
                      <strong className="font-mono text-xs text-[#121316]">{inspectingCampaign.beneficiaryDetails.upiId || 'N/A'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* ── 5. PROPOSED MILESTONE TRANCHES BREAKDOWN ── */}
              {inspectingCampaign.milestones && inspectingCampaign.milestones.length > 0 && (
                <div className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0px_#121316] space-y-4">
                  <div className="flex items-center justify-between border-b-2 border-[#121316] pb-2.5">
                    <div>
                      <h4 className="text-xs font-headline font-black uppercase text-[#0F534A] flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-[#FE4E1A]" />
                        Escrow Milestone Tranches Roadmap ({inspectingCampaign.milestones.length})
                      </h4>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">
                        Funds released sequentially upon proof-of-completion verification
                      </p>
                    </div>

                    <span className="px-3 py-1 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0px_#121316]">
                      Total: ₹{inspectingCampaign.milestones.reduce((s: number, m: any) => s + Number(m.targetAmount || m.budget || 0), 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="space-y-3.5">
                    {inspectingCampaign.milestones.map((ms: any, idx: number) => {
                      const criteria = Array.isArray(ms.acceptanceCriteria) ? ms.acceptanceCriteria : [];
                      return (
                        <div
                          key={ms.id || idx}
                          className="p-4 bg-[#FCFBF7] border-2 border-[#121316] shadow-[3px_3px_0px_#121316] space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-[#FFDD33] text-[#121316] border border-[#121316] font-headline font-black text-xs uppercase">
                                Tranche #{ms.sequenceOrder || idx + 1}
                              </span>
                              <h5 className="font-headline font-black text-sm text-[#121316] uppercase">
                                {ms.title}
                              </h5>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 bg-[#FCFBF7] border border-[#121316] text-[11px] font-bold text-gray-700">
                                ⏱ {ms.durationDays || 30} Days
                              </span>
                              <span className="font-headline font-black text-sm text-white bg-[#0F534A] px-3 py-1 border border-[#121316] shadow-[2px_2px_0px_#121316]">
                                ₹{Number(ms.targetAmount || ms.budget || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>

                          {ms.description && (
                            <p className="text-xs text-gray-700 font-medium leading-relaxed bg-white p-2.5 border border-gray-200">
                              {ms.description}
                            </p>
                          )}

                          {/* Pending Milestone Revisions Callout */}
                          {ms.revisions && ms.revisions.some((r: any) => r.status === 'PENDING_APPROVAL') && (
                            <div className="p-3 bg-[#FFF9F2] border-2 border-[#FE4E1A] shadow-[2px_2px_0px_#FE4E1A] text-xs space-y-1.5">
                              <div className="flex items-center justify-between font-headline font-black text-[#FE4E1A] uppercase text-[11px]">
                                <span className="flex items-center gap-1">⚡ Proposed Milestone Modification</span>
                                <span className="bg-[#FE4E1A] text-white px-2 py-0.5 border border-[#121316] text-[10px]">
                                  Pending Authorization
                                </span>
                              </div>
                              {ms.revisions
                                .filter((r: any) => r.status === 'PENDING_APPROVAL')
                                .map((rev: any, rIdx: number) => (
                                  <div key={rev.id || rIdx} className="text-[11px] text-gray-800 bg-white p-2 border border-[#FE4E1A]/40 space-y-0.5">
                                    <div className="flex items-center justify-between font-bold">
                                      <span>Revision #{rev.revisionNumber}: {rev.title}</span>
                                      <span className="text-[#0F534A]">Proposed: ₹{Number(rev.targetAmount).toLocaleString()}</span>
                                    </div>
                                    <p className="text-gray-600 text-[10px]"><strong>Change Justification:</strong> {rev.changeReason}</p>
                                  </div>
                                ))}
                            </div>
                          )}

                          {criteria.length > 0 && (
                            <div className="bg-white p-3 border-2 border-dashed border-[#0F534A]/40 space-y-1.5">
                              <span className="text-[10px] font-headline font-black uppercase text-[#0F534A] block">
                                Verifiable Acceptance Criteria:
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {criteria.map((c: any, cIdx: number) => (
                                  <div
                                    key={cIdx}
                                    className="text-xs text-gray-800 font-medium flex items-center gap-1.5 bg-[#FCFBF7] px-2 py-1 border border-gray-200"
                                  >
                                    <span className="text-[#0B9C2C] font-bold">✓</span>
                                    <span>{typeof c === 'string' ? c : JSON.stringify(c)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Sticky Action Footer */}
            <div className="bg-white border-t-4 border-[#121316] p-4 flex items-center justify-between gap-3 sticky bottom-0 z-20 flex-wrap">
              <button
                type="button"
                onClick={() => setInspectingCampaign(null)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-[#121316] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] cursor-pointer"
              >
                Close Preview
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleOpenDecisionModal(inspectingCampaign, 'REJECTED')}
                  className="px-5 py-2.5 bg-[#F4002C] hover:bg-red-700 text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] transition cursor-pointer shadow-[3px_3px_0px_#121316] flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Reject Campaign
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenDecisionModal(inspectingCampaign, 'APPROVED')}
                  className="px-6 py-2.5 bg-[#0F534A] hover:bg-[#0b3d36] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] transition cursor-pointer shadow-[4px_4px_0px_#FE4E1A] flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#9EFC5F]" /> Approve &amp; Publish Campaign 🚀
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Decision Confirmation Modal */}
      {decisionModalOpen && selectedCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#FCFBF7] border-3 border-[#121316] w-full max-w-xl p-6 space-y-5 shadow-[8px_8px_0_#121316]">
            <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
              <h3 className="text-base font-headline font-black text-[#121316] uppercase flex items-center gap-2">
                {decisionType === 'APPROVED' ? (
                  <CheckCircle2 className="w-5 h-5 text-[#0F534A]" />
                ) : (
                  <XCircle className="w-5 h-5 text-[#F4002C]" />
                )}
                Confirm Campaign Decision ({decisionType})
              </h3>
              <button
                type="button"
                onClick={() => setDecisionModalOpen(false)}
                className="w-8 h-8 bg-white border-2 border-[#121316] text-[#121316] font-headline font-black text-sm hover:bg-[#FE4E1A] hover:text-white transition flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#121316]"
              >
                ✕
              </button>
            </div>

            <div className="bg-white border-2 border-[#121316] p-4 text-xs space-y-1 shadow-[2px_2px_0_#121316]">
              <p>
                <strong className="font-headline font-black text-[#0F534A] uppercase">Campaign:</strong> {selectedCampaign.title}
              </p>
              <p>
                <strong className="font-headline font-black text-[#0F534A] uppercase">Target Goal:</strong> ₹
                {Number(selectedCampaign.targetAmount || 0).toLocaleString()}
              </p>
            </div>

            <div>
              <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1.5">
                Official Review Remarks / Decision Notes {decisionType === 'REJECTED' && <span className="text-[#F4002C]">*</span>}
              </label>
              <textarea
                rows={3}
                placeholder="Provide official campaign decision notes..."
                value={decisionReason}
                onChange={(e) => setDecisionReason(e.target.value)}
                className="w-full bg-white border-2 border-[#121316] p-3 text-[#121316] text-xs font-medium focus:outline-none focus:border-[#FE4E1A] shadow-[2px_2px_0_#121316]"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                disabled={submitting}
                onClick={() => setDecisionModalOpen(false)}
                className="px-4 py-2 bg-white border-2 border-[#121316] text-[#121316] font-headline font-black text-xs uppercase hover:bg-gray-100 transition cursor-pointer shadow-[2px_2px_0_#121316]"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={handleDecisionSubmit}
                className={`px-5 py-2 text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] transition flex items-center gap-2 cursor-pointer shadow-[2px_2px_0_#121316] ${
                  decisionType === 'APPROVED' ? 'bg-[#0F534A] hover:bg-[#0F534A]/90' : 'bg-[#F4002C] hover:bg-red-700'
                }`}
              >
                {submitting ? 'Submitting...' : 'Confirm Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DxCampaignApprovals;
