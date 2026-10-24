import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { navigateToCampaign } from '../utils/campaignRouting';
import toast from 'react-hot-toast';
import {
  Folder,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Edit3,
  Trash2,
  Pause,
  Play,
  Send,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Layers,
  ArrowRight,
  TrendingUp,
  Image,
  FileText,
  X,
  Sparkles,
  AlertCircle,
  Users,
  CheckCircle,
  Upload,
} from 'lucide-react';
import { campaignService } from '../services/campaignService';
import { MilestoneTrancheBuilder, MilestoneItem } from './create-campaign/MilestoneTrancheBuilder';
import MilestoneProofModal from './milestones/MilestoneProofModal';
import { BrushAnnotation } from './ui/BrushAnnotation';
import type { Campaign, User } from '../types';
import SEO from './SEO';

interface MyCampaignsProps {
  currentUser?: User | null;
  onLogin?: () => void;
}

export default function MyCampaigns({ currentUser, onLogin }: MyCampaignsProps) {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Milestone Proof Submission & View Modal State (R1a)
  const [proofModalState, setProofModalState] = useState<{
    isOpen: boolean;
    milestone: any | null;
    campaignId: string;
    mode: 'submit' | 'view';
  }>({
    isOpen: false,
    milestone: null,
    campaignId: '',
    mode: 'submit',
  });

  // Edit Modal state
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    shortDescription: string;
    description: string;
    category: string;
    goalAmount: number;
    coverImageUrl: string;
    videoUrl: string;
    presentationDeckUrl: string;
    milestones: MilestoneItem[];
  }>({
    title: '',
    shortDescription: '',
    description: '',
    category: 'STARTUP_INNOVATION',
    goalAmount: 0,
    coverImageUrl: '',
    videoUrl: '',
    presentationDeckUrl: '',
    milestones: [],
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Edit Team Members state
  const [editTeamMembers, setEditTeamMembers] = useState<
    Array<{ name: string; username?: string; role: string; email: string; userId?: string }>
  >([]);
  const [newMemberQuery, setNewMemberQuery] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [isVerifyingMember, setIsVerifyingMember] = useState(false);

  // Delete Modal state
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Status Action state
  const [processingStatusId, setProcessingStatusId] = useState<string | null>(null);
  const activeOrgId = (currentUser as any)?.activeProfile?.orgId;

  const fetchMyCampaigns = async () => {
    setLoading(true);
    try {
      const res = await campaignService.getMyCampaigns(activeOrgId);
      const list = res.data?.campaigns || (res as any)?.campaigns || [];
      const mapped: (Campaign & { tenantId?: string; organizationId?: string | null })[] = list.map((c: any) => ({
        id: c.id,
        slug: c.slug,
        title: c.title,
        tenantId: c.tenantId || c.tenant?.id,
        organizationId: c.organizationId || c.department?.id || null,
        description: c.description || '',
        shortDescription: c.shortDescription || '',
        category: c.category || 'STARTUP_INNOVATION',
        goalAmount: Number(c.targetAmount || c.goalAmount || 0),
        raisedAmount: Number(c.currentRaisedAmount || c.currentAmount || 0),
        currentAmount: Number(c.currentRaisedAmount || c.currentAmount || 0),
        status: (c.status || 'DRAFT').toLowerCase() as any,
        imageUrl: c.coverImageUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
        videoUrl: c.videoUrl,
        presentationDeckUrl: c.presentationDeckUrl,
        campaignType: c.campaignType || 'INDIVIDUAL',
        studentName: c.student?.name || currentUser?.name || 'Me',
        college: c.tenant?.name || 'Institution',
        milestones: c.milestones || [],
        members: c.members || [],
        teamMembers: c.teamMembers || [],
        donorCount: c.donorCount || 0,
        currency: c.currency || 'INR',
        rejectionReason: c.rejectionReason,
        reapprovalCount: c.reapprovalCount || 0,
        createdAt: c.createdAt,
      }));

      // Strictly scope to current active profile's organization if set
      const scoped = activeOrgId
        ? mapped.filter(
            (c) =>
              c.tenantId === activeOrgId ||
              c.organizationId === activeOrgId
          )
        : mapped;

      setCampaigns(scoped);
    } catch (err: any) {
      console.error('Failed to fetch user campaigns:', err);
      toast.error('Failed to load campaigns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCampaigns();
  }, [activeOrgId]);

  // Analytics
  const analytics = useMemo(() => {
    const total = campaigns.length;
    const live = campaigns.filter((c) => ['live', 'approved', 'fully_funded', 'disbursing', 'completed'].includes((c.status || '').toLowerCase())).length;
    const pending = campaigns.filter((c) => ['pending', 'pending_verification', 'pending_endorsement', 'submitted'].includes((c.status || '').toLowerCase())).length;
    const drafts = campaigns.filter((c) => ['draft'].includes((c.status || '').toLowerCase())).length;
    const totalRaised = campaigns.reduce((sum, c) => sum + (Number(c.currentAmount || c.raisedAmount || 0)), 0);
    const totalGoal = campaigns.reduce((sum, c) => sum + (Number(c.goalAmount || 0)), 0);

    return { total, live, pending, drafts, totalRaised, totalGoal };
  }, [campaigns]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchQuery.toLowerCase());

      const cStatus = (c.status || '').toLowerCase();
      let matchesStatus = filterStatus === 'ALL';
      if (filterStatus === 'live') {
        matchesStatus = ['live', 'approved', 'fully_funded', 'disbursing', 'completed'].includes(cStatus);
      } else if (filterStatus === 'pending') {
        matchesStatus = ['pending', 'pending_verification', 'pending_endorsement', 'submitted'].includes(cStatus);
      } else if (filterStatus === 'draft') {
        matchesStatus = cStatus === 'draft';
      } else if (filterStatus === 'paused') {
        matchesStatus = cStatus === 'paused';
      } else if (filterStatus === 'rejected') {
        matchesStatus = cStatus === 'rejected';
      }

      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchQuery, filterStatus]);

  // Open Edit Modal
  const handleOpenEdit = (c: Campaign) => {
    setEditingCampaign(c);
    const ms: MilestoneItem[] = (c.milestones && c.milestones.length > 0)
      ? c.milestones.map((m: any, idx: number) => ({
          id: m.id || `m_${idx + 1}`,
          order: m.sequenceOrder || m.order || idx + 1,
          title: m.title || `Phase ${idx + 1}`,
          objective: m.description || m.objective || '',
          durationDays: Number(m.durationDays || 30),
          deadline: m.deadline,
          budget: Number(m.targetAmount ?? m.budget ?? m.amount ?? 0),
          acceptanceCriteria: Array.isArray(m.acceptanceCriteria) && m.acceptanceCriteria.length > 0
            ? m.acceptanceCriteria
            : (Array.isArray(m.criteria) && m.criteria.length > 0 ? m.criteria : ['Prototype completion verified by faculty mentor']),
          requiredEvidenceTypes: Array.isArray(m.requiredEvidenceTypes) && m.requiredEvidenceTypes.length > 0
            ? m.requiredEvidenceTypes
            : ['INVOICE', 'ON_SITE_PHOTO'],
        }))
      : [
          {
            id: 'm_1',
            order: 1,
            title: 'Phase 1: Architecture & Prototype Design',
            objective: 'Core prototype development and component assembly.',
            durationDays: 30,
            budget: Number(c.goalAmount) || 50000,
            acceptanceCriteria: ['Prototype completion verified by faculty mentor'],
            requiredEvidenceTypes: ['INVOICE', 'ON_SITE_PHOTO'],
          },
        ];

    const initialGoal = Number(c.goalAmount || ms.reduce((sum, m) => sum + m.budget, 0));

    // Populate team members
    const rawMembers = (c as any).members || (c as any).teamMembers || [];
    const initialTeam = rawMembers.map((m: any) => ({
      name: m.user?.fullName || m.name || m.user?.email || 'Member',
      username: m.user?.username,
      role: m.role === 'OWNER' ? 'Project Lead' : (m.title || m.role || 'Collaborator'),
      email: m.user?.email || m.email || '',
      userId: m.userId || m.user?.id,
    }));
    setEditTeamMembers(initialTeam);
    setNewMemberQuery('');
    setNewMemberRole('');

    setEditForm({
      title: c.title || '',
      shortDescription: (c as any).shortDescription || c.description?.slice(0, 200) || '',
      description: c.description || '',
      category: (c as any).category || 'STARTUP_INNOVATION',
      goalAmount: initialGoal,
      coverImageUrl: c.imageUrl || c.coverImageUrl || '',
      videoUrl: c.videoUrl || c.youtubeUrl || '',
      presentationDeckUrl: c.presentationDeckUrl || '',
      milestones: ms,
    });
  };

  // Add verified team member by @username or email lookup
  const handleAddTeamMember = async () => {
    const rawQuery = newMemberQuery.trim();
    if (!rawQuery) {
      toast.error('Please enter the @username or registered email of the team member.');
      return;
    }

    if (!newMemberRole.trim()) {
      toast.error('Please specify the role for this team member (e.g. Co-Lead, Hardware Eng).');
      return;
    }

    const cleanHandle = rawQuery.replace(/^@/, '').toLowerCase();

    if (
      editTeamMembers.some(
        (m) =>
          m.email?.toLowerCase() === cleanHandle ||
          (m.username && m.username.toLowerCase() === cleanHandle)
      )
    ) {
      toast.error('This user is already part of your campaign team roster.');
      return;
    }

    setIsVerifyingMember(true);
    const toastId = toast.loading('Verifying user on DreamXec...');
    try {
      const res = await campaignService.lookupUser(rawQuery);
      const user = res.data?.user || (res as any)?.user;

      if (!user) {
        throw new Error(`No registered user found for "${rawQuery}"`);
      }

      setEditTeamMembers((prev) => [
        ...prev,
        {
          name: user.fullName || user.name || cleanHandle,
          username: user.username,
          role: newMemberRole.trim(),
          email: user.email,
          userId: user.id,
        },
      ]);

      toast.success(`✓ Verified: ${user.fullName || user.name} (@${user.username}) added to team!`, { id: toastId });
      setNewMemberRole('');
      setNewMemberQuery('');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || `User "${rawQuery}" is not registered on DreamXec.`,
        { id: toastId }
      );
    } finally {
      setIsVerifyingMember(false);
    }
  };

  const handleRemoveTeamMember = (index: number) => {
    setEditTeamMembers((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;

    const totalMilestoneBudget = editForm.milestones.reduce((sum, m) => sum + (Number(m.budget) || 0), 0);
    const goalAmountNum = Number(editForm.goalAmount || totalMilestoneBudget);

    if (editForm.milestones.length > 0 && Math.abs(totalMilestoneBudget - goalAmountNum) > 0.01) {
      toast.error(`Total milestone budget (₹${totalMilestoneBudget.toLocaleString()}) must equal the funding goal (₹${goalAmountNum.toLocaleString()}). You can adjust the goal or milestone budgets.`);
      return;
    }

    setSavingEdit(true);
    const toastId = toast.loading('Saving campaign & milestone modifications...');
    try {
      await campaignService.updateCampaign(editingCampaign.id, {
        title: editForm.title,
        shortDescription: editForm.shortDescription,
        description: editForm.description,
        category: editForm.category as any,
        goalAmount: goalAmountNum,
        coverImageUrl: editForm.coverImageUrl,
        videoUrl: editForm.videoUrl || undefined,
        presentationDeckUrl: editForm.presentationDeckUrl || undefined,
        teamMembers: editTeamMembers.map((tm) => ({
          name: tm.name,
          role: tm.role,
          email: tm.email,
          userId: tm.userId,
        })),
        milestones: editForm.milestones.map((m, idx) => ({
          id: m.id && !m.id.startsWith('m_') ? m.id : undefined,
          title: m.title,
          description: m.objective || m.title,
          durationDays: Number(m.durationDays || 30),
          budget: Number(m.budget),
          targetAmount: Number(m.budget),
          sequenceOrder: Number(m.order || idx + 1),
          acceptanceCriteria: Array.isArray(m.acceptanceCriteria) ? m.acceptanceCriteria.filter(Boolean) : [],
          requiredEvidenceTypes: Array.isArray(m.requiredEvidenceTypes) ? m.requiredEvidenceTypes : ['INVOICE', 'ON_SITE_PHOTO'],
        })),
      });

      const isLiveCampaign = ['live', 'approved', 'paused'].includes((editingCampaign.status || '').toLowerCase());
      if (isLiveCampaign) {
        toast.success('Milestone revisions recorded! Your campaign is now paused pending Administrator approval.', { id: toastId, duration: 6000 });
      } else {
        toast.success('Campaign & milestones updated successfully!', { id: toastId });
      }
      setEditingCampaign(null);
      await fetchMyCampaigns();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save changes.', { id: toastId });
    } finally {
      setSavingEdit(false);
    }
  };

  // Submit Draft for Review
  const handleSubmitForReview = async (campaignId: string) => {
    setProcessingStatusId(campaignId);
    const toastId = toast.loading('Submitting campaign for administrative approval...');
    try {
      await campaignService.submitCampaignForReview(campaignId);
      toast.success('Campaign submitted! It is now in the administrative review queue.', { id: toastId });
      await fetchMyCampaigns();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit for review.', { id: toastId });
    } finally {
      setProcessingStatusId(null);
    }
  };

  // Pause / Resume Toggle
  const handleTogglePause = async (campaign: Campaign) => {
    const isPaused = (campaign.status || '').toLowerCase() === 'paused';
    const nextStatus = isPaused ? 'LIVE' : 'PAUSED';

    setProcessingStatusId(campaign.id);
    const toastId = toast.loading(`${isPaused ? 'Resuming' : 'Pausing'} campaign...`);
    try {
      await campaignService.updateCampaign(campaign.id, {
        status: nextStatus as any,
      });
      toast.success(`Campaign is now ${nextStatus}!`, { id: toastId });
      await fetchMyCampaigns();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update campaign status.', { id: toastId });
    } finally {
      setProcessingStatusId(null);
    }
  };

  // Delete Campaign
  const handleConfirmDelete = async () => {
    if (!deletingCampaign) return;

    setIsDeleting(true);
    const toastId = toast.loading('Deleting campaign...');
    try {
      await campaignService.deleteCampaign(deletingCampaign.id);
      toast.success('Campaign deleted successfully.', { id: toastId });
      setDeletingCampaign(null);
      await fetchMyCampaigns();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete campaign.', { id: toastId });
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (statusStr: string) => {
    const s = (statusStr || '').toLowerCase();
    if (['live', 'approved', 'fully_funded', 'disbursing', 'completed'].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 bg-[#9EFC5F] text-[#0F534A] border-2 border-[#0F534A] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0_#0F534A]">
          <CheckCircle2 className="w-3 h-3" /> Live
        </span>
      );
    }
    if (['pending', 'pending_verification', 'submitted'].includes(s)) {
      return (
        <span className="inline-flex items-center gap-1 bg-[#FFF9F2] text-[#FE4E1A] border-2 border-[#FE4E1A] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0_#FE4E1A]">
          <Clock className="w-3 h-3" /> Pending Admin Approval
        </span>
      );
    }
    if (s === 'pending_endorsement') {
      return (
        <span className="inline-flex items-center gap-1 bg-[#FFF9F2] text-[#FE4E1A] border-2 border-[#FE4E1A] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0_#FE4E1A]">
          <Clock className="w-3 h-3" /> Pending Faculty Review
        </span>
      );
    }
    if (s === 'paused') {
      return (
        <span className="inline-flex items-center gap-1 bg-white text-[#4717AE] border-2 border-[#4717AE] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0_#4717AE]">
          <Pause className="w-3 h-3" /> Paused
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 bg-[#FFF0F2] text-[#F4002C] border-2 border-[#F4002C] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0_#F4002C]">
          <XCircle className="w-3 h-3" /> Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-white text-[#121316] border-2 border-[#121316] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0_#121316]">
        <FileText className="w-3 h-3" /> Draft
      </span>
    );
  };

  return (
    <>
      <SEO
        title="My Campaigns | DreamXec Governance Hub"
        description="Manage, modify, track review status, and oversee your DreamXec fundraising campaigns."
      />

      <div className="min-h-full bg-[#FCFBF7] text-[#121316] pb-24">
        {/* ── TOP HERO BANNER ── */}
        <div className="bg-[#0F534A] border-b-5 border-[#4717AE] text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Navigation & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 bg-[#FFDD33] text-[#0F534A] border-2 border-[#121316] shadow-[3px_3px_0px_#121316] px-3.5 py-1 font-headline font-black text-xs uppercase tracking-wider">
                    <span>★</span> Campaign Portfolio
                  </div>
                  {(currentUser as any)?.activeProfile && (
                    <div className="inline-flex items-center gap-1.5 bg-white/20 text-[#FFF9F2] border border-white/40 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-[#9EFC5F]"></span>
                      Profile: {(currentUser as any).activeProfile.orgName || (currentUser as any).activeProfile.role?.replace(/_/g, ' ')}
                    </div>
                  )}
                </div>
                <h1 className="font-headline font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight leading-tight flex items-center gap-2 flex-wrap">
                  <span>My</span> <span className="text-[#FE4E1A]">Campaigns</span>
                  <BrushAnnotation color="yellow" rotate={-2} className="text-sm normal-case tracking-normal">
                    ✦ Portfolio Hub
                  </BrushAnnotation>
                </h1>
                <p className="text-sm sm:text-base text-[#FFF9F2] font-medium max-w-2xl">
                  {(currentUser as any)?.activeProfile?.orgName
                    ? `Initiatives and fundraising campaigns created under ${(currentUser as any).activeProfile.orgName}.`
                    : 'Manage your initiatives, edit details, track administrative approval statuses, and oversee milestone disbursements.'}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  to="/campaigns"
                  className="bg-white text-[#121316] hover:bg-[#FFDD33] px-4 py-2.5 font-headline font-black text-xs uppercase tracking-wider border-3 border-[#121316] shadow-[3px_3px_0px_#121316] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer"
                >
                  ← Browse Marketplace
                </Link>

                <Link
                  to="/create"
                  className="bg-[#FE4E1A] hover:bg-[#e03d0d] text-white px-5 py-2.5 font-headline font-black text-xs uppercase tracking-wider border-3 border-white shadow-[3px_3px_0px_#121316] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Start New Campaign
                </Link>
              </div>
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-[#121316]/40 border-2 border-white/30 p-3 shadow-[2px_2px_0_#121316]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FFDD33]">Total Campaigns</p>
                <p className="text-2xl font-black text-white">{analytics.total}</p>
              </div>
              <div className="bg-[#121316]/40 border-2 border-white/30 p-3 shadow-[2px_2px_0_#121316]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9EFC5F]">Live & Raising</p>
                <p className="text-2xl font-black text-white">{analytics.live}</p>
              </div>
              <div className="bg-[#121316]/40 border-2 border-white/30 p-3 shadow-[2px_2px_0_#121316]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FE4E1A]">Pending Review</p>
                <p className="text-2xl font-black text-white">{analytics.pending}</p>
              </div>
              <div className="bg-[#121316]/40 border-2 border-white/30 p-3 shadow-[2px_2px_0_#121316]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#18D7E8]">Funds Raised</p>
                <p className="text-2xl font-black text-white">₹{analytics.totalRaised.toLocaleString('en-IN')}</p>
              </div>
            </div>

          </div>
        </div>

        {/* ── CONTROLS & FILTER BAR ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Search Bar */}
            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white uppercase tracking-wider"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <Filter className="w-4 h-4 text-[#0F534A] flex-shrink-0" />
              {[
                { key: 'ALL', label: 'All' },
                { key: 'live', label: 'Live' },
                { key: 'pending', label: 'Pending Approval' },
                { key: 'draft', label: 'Drafts' },
                { key: 'paused', label: 'Paused' },
                { key: 'rejected', label: 'Rejected' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setFilterStatus(key)}
                  className={`px-3 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] transition-all cursor-pointer ${
                    filterStatus === key
                      ? 'bg-[#0F534A] text-white shadow-[2px_2px_0_#FE4E1A]'
                      : 'bg-white text-[#121316] hover:bg-[#FFDD33]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* ── CAMPAIGNS LIST ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {loading ? (
            <div className="p-16 text-center bg-white border-4 border-[#0F534A] shadow-[6px_6px_0_#121316]">
              <div className="w-10 h-10 border-4 border-[#0F534A] border-t-[#FE4E1A] rounded-full animate-spin mx-auto mb-4" />
              <p className="font-headline font-black uppercase tracking-widest text-[#0F534A] text-xs">
                Loading Campaign Portfolio...
              </p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="p-12 text-center bg-white border-4 border-[#121316] shadow-[6px_6px_0_#FE4E1A] max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 bg-[#FFDD33] border-3 border-[#121316] shadow-[3px_3px_0_#121316] flex items-center justify-center mx-auto text-2xl">
                <Folder className="w-8 h-8 text-[#0F534A]" />
              </div>
              <h3 className="font-headline font-black text-2xl text-[#121316] uppercase">No Campaigns Found</h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                {searchQuery || filterStatus !== 'ALL'
                  ? 'No campaigns matched your current filters. Try selecting "All" or clearing the search term.'
                  : "You haven't initialized any fundraising campaigns yet. Launch a new initiative to get started!"}
              </p>
              <Link
                to="/create"
                className="inline-flex items-center gap-2 bg-[#FE4E1A] text-white px-5 py-3 font-headline font-black text-xs uppercase tracking-wider border-3 border-[#121316] shadow-[4px_4px_0_#121316] hover:bg-[#e03d0d] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Start a Campaign Now
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredCampaigns.map((c) => {
                const s = (c.status || '').toLowerCase();
                const isPending = ['pending', 'pending_verification', 'submitted', 'pending_endorsement'].includes(s);
                const isLive = ['live', 'approved', 'fully_funded', 'disbursing', 'completed'].includes(s);
                const isDraft = s === 'draft';
                const isPaused = s === 'paused';
                const isRejected = s === 'rejected';

                const progress =
                  c.goalAmount > 0
                    ? Math.min(((Number(c.currentAmount || c.raisedAmount || 0)) / Number(c.goalAmount)) * 100, 100)
                    : 0;

                return (
                  <div
                    key={c.id}
                    className="bg-white border-3 border-[#121316] shadow-[6px_6px_0_#121316] p-5 sm:p-6 transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  >
                    <div className="flex flex-col lg:flex-row gap-6 items-start">
                      
                      {/* Campaign Image Thumbnail */}
                      <div className="w-full lg:w-64 h-44 flex-shrink-0 border-3 border-[#121316] shadow-[3px_3px_0_#121316] overflow-hidden relative bg-gray-100">
                        <img
                          src={c.imageUrl}
                          alt={c.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80';
                          }}
                        />
                        <span className="absolute top-2 left-2 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2 py-0.5 text-[9px] font-headline font-black uppercase tracking-wider">
                          {(c as any).category || 'Innovation'}
                        </span>
                      </div>

                      {/* Main Details */}
                      <div className="flex-1 space-y-3 w-full">
                        
                        {/* Title & Status */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h2 className="font-headline font-black text-xl sm:text-2xl text-[#0F534A] uppercase tracking-tight">
                            {c.title}
                          </h2>
                          <div>{getStatusBadge(c.status)}</div>
                        </div>

                        <p className="text-xs sm:text-sm text-gray-700 font-medium line-clamp-2">
                          {(c as any).shortDescription || c.description}
                        </p>

                        {/* Status Notices */}
                        {isPending && (
                          <div className="bg-[#FFF9F2] border-2 border-[#FE4E1A] shadow-[2px_2px_0_#FE4E1A] p-3 flex items-start gap-2 text-xs font-medium text-[#121316]">
                            <Clock className="w-4 h-4 text-[#FE4E1A] flex-shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-black uppercase tracking-wide text-[#FE4E1A]">Status: Under Administrative Review</strong>
                              <p className="mt-0.5">
                                Your campaign has been submitted for Maker-Checker verification. Once approved by institutional administrators, it will automatically appear on the public browse page.
                              </p>
                            </div>
                          </div>
                        )}

                        {isRejected && (
                          <div className="bg-[#FFF0F2] border-2 border-[#F4002C] shadow-[2px_2px_0_#F4002C] p-3 text-xs font-medium text-[#121316]">
                            <div className="flex items-center gap-1.5 font-black uppercase tracking-wide text-[#F4002C]">
                              <AlertTriangle className="w-4 h-4" /> Changes Requested / Rejected
                            </div>
                            {c.rejectionReason && (
                              <p className="mt-1 italic">"{c.rejectionReason}"</p>
                            )}
                          </div>
                        )}

                        {/* Progress & Target Stats with Escrow Held (R1a) */}
                        <div className="bg-[#FCFBF7] border-2 border-[#121316] p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shadow-[2px_2px_0_#121316]">
                          <div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Target Goal</span>
                            <p className="font-headline font-black text-sm text-[#0F534A]">
                              ₹{Number(c.goalAmount || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Raised</span>
                            <p className="font-headline font-black text-sm text-[#0F534A]">
                              ₹{Number(c.currentAmount || c.raisedAmount || 0).toLocaleString('en-IN')}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Escrow Held</span>
                            <p className="font-headline font-black text-sm text-[#4717AE]">
                              {(c as any).escrowBalance != null
                                ? `₹${Number((c as any).escrowBalance).toLocaleString('en-IN')}`
                                : <span className="text-gray-400 font-medium text-xs">— Pending</span>}
                            </p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Milestones</span>
                            <p className="font-headline font-black text-sm text-[#FE4E1A]">
                              {c.milestones?.length || 0} Tranches ({progress.toFixed(0)}% Funded)
                            </p>
                          </div>
                        </div>

                        {/* ── Milestone Tranche Ecosystem (R1a Slice) ── */}
                        {c.milestones && c.milestones.length > 0 && (
                          <div className="bg-white border-2 border-[#121316] p-3.5 space-y-2.5 shadow-[2px_2px_0_#121316]">
                            <div className="flex items-center justify-between border-b pb-1.5 border-dashed border-gray-300">
                              <span className="text-[11px] font-headline font-black uppercase text-[#0F534A] tracking-wider flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-[#FE4E1A]" />
                                Milestone Tranches & Proof Submissions ({c.milestones.length})
                              </span>
                              <span className="text-[10px] font-mono font-bold text-[#4717AE] bg-white px-2 py-0.5 border border-[#4717AE] shadow-[1px_1px_0px_#4717AE]">
                                Maker-Checker Protected
                              </span>
                            </div>

                            <div className="space-y-2">
                              {c.milestones.map((m: any, mIdx: number) => {
                                const mStatus = (m.status || 'PENDING').toUpperCase();
                                // Only show Submit Proof if the campaign itself is live/active
                                const isActionable =
                                  isLive &&
                                  [
                                    'ACTIVE',
                                    'IN_PROGRESS',
                                    'PENDING',
                                    'DUE',
                                    'REVISION_REQUIRED',
                                  ].includes(mStatus);
                                const hasSubmissions =
                                  (m.submissions && m.submissions.length > 0) ||
                                  [
                                    'SUBMITTED',
                                    'UNDER_VERIFICATION',
                                    'APPROVED',
                                    'VERIFIED',
                                    'FUNDS_RELEASED',
                                    'COMPLETED',
                                  ].includes(mStatus);

                                return (
                                  <div
                                    key={m.id || mIdx}
                                    className="p-2.5 bg-[#FCFBF7] border-2 border-[#121316] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-[1px_1px_0_#121316]"
                                  >
                                    <div className="space-y-0.5 min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="px-1.5 py-0.5 bg-[#FFDD33] text-[#121316] text-[9px] font-headline font-black border border-[#121316]">
                                          Tranche #{m.sequenceOrder || mIdx + 1}
                                        </span>
                                        <h4 className="font-headline font-black text-[#121316] text-xs truncate">
                                          {m.title}
                                        </h4>
                                      </div>
                                      <p className="text-[10px] text-gray-600 truncate font-medium">
                                        ₹{Number(m.targetAmount || m.budget || m.amount || 0).toLocaleString('en-IN')} • {m.durationDays || 30} Days • {m.description || 'Milestone deliverable'}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <span
                                        className={`px-2 py-0.5 text-[9px] font-headline font-black uppercase tracking-wider ${
                                          ['APPROVED', 'COMPLETED', 'VERIFIED', 'FUNDS_RELEASED'].includes(mStatus)
                                            ? 'bg-[#9EFC5F] text-[#0F534A] border-2 border-[#0F534A] shadow-[1px_1px_0_#0F534A]'
                                            : ['SUBMITTED', 'UNDER_VERIFICATION'].includes(mStatus)
                                            ? 'bg-[#FFDD33] text-[#0F534A] border-2 border-[#0F534A] shadow-[1px_1px_0_#0F534A]'
                                            : ['REJECTED', 'REVISION_REQUIRED'].includes(mStatus)
                                            ? 'bg-[#FFF0F2] text-[#F4002C] border-2 border-[#F4002C] shadow-[1px_1px_0_#F4002C]'
                                            : ['ACTIVE', 'IN_PROGRESS'].includes(mStatus)
                                            ? 'bg-[#18D7E8] text-[#121316] border-2 border-[#121316] shadow-[1px_1px_0_#121316]'
                                            : 'bg-white text-[#121316] border-2 border-[#121316] shadow-[1px_1px_0_#121316]'
                                        }`}
                                      >
                                        {mStatus}
                                      </span>

                                      {/* Submit Proof Button */}
                                      {isActionable && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setProofModalState({
                                              isOpen: true,
                                              milestone: m,
                                              campaignId: c.id,
                                              mode: 'submit',
                                            })
                                          }
                                          className="px-2.5 py-1 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white font-headline font-black text-[10px] uppercase tracking-wider border border-[#121316] shadow-[1px_1px_0_#121316] flex items-center gap-1 cursor-pointer transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]"
                                        >
                                          <Upload className="w-3 h-3" /> Submit Proof
                                        </button>
                                      )}

                                      {/* View Proof Button */}
                                      {hasSubmissions && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setProofModalState({
                                              isOpen: true,
                                              milestone: m,
                                              campaignId: c.id,
                                              mode: 'view',
                                            })
                                          }
                                          className="px-2 py-1 bg-white hover:bg-gray-100 text-[#0F534A] font-headline font-black text-[10px] uppercase tracking-wider border border-[#0F534A] shadow-[1px_1px_0_#0F534A] flex items-center gap-1 cursor-pointer transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]"
                                        >
                                          <ExternalLink className="w-3 h-3" /> View Proof
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Action Toolbar */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t-2 border-dashed border-gray-300">
                          <div className="flex items-center gap-2 flex-wrap">
                            
                            {/* View / Preview */}
                            <button
                              onClick={() => navigateToCampaign(c.slug || c.id, navigate)}
                              className="inline-flex items-center gap-1.5 bg-[#4717AE] hover:bg-[#3a1291] text-white px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Preview Campaign
                            </button>

                            {/* Edit Button */}
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="inline-flex items-center gap-1.5 bg-white hover:bg-[#FFDD33] text-[#121316] px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#0F534A]" /> Edit Campaign
                            </button>

                            {/* State Control Buttons */}
                            {(isDraft || isRejected) && (
                              <button
                                onClick={() => handleSubmitForReview(c.id)}
                                disabled={processingStatusId === c.id}
                                className="inline-flex items-center gap-1.5 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer disabled:opacity-50"
                              >
                                <Send className="w-3.5 h-3.5" /> Submit for Review
                              </button>
                            )}

                            {isLive && (
                              <button
                                onClick={() => handleTogglePause(c)}
                                disabled={processingStatusId === c.id}
                                className="inline-flex items-center gap-1.5 bg-white hover:bg-[#FFF9F2] text-[#4717AE] px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#4717AE] shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
                              >
                                <Pause className="w-3.5 h-3.5" /> Pause Campaign
                              </button>
                            )}

                            {isPaused && (
                              <button
                                onClick={() => handleTogglePause(c)}
                                disabled={processingStatusId === c.id}
                                className="inline-flex items-center gap-1.5 bg-[#9EFC5F] hover:bg-[#86e844] text-[#0F534A] px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#0F534A] shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
                              >
                                <Play className="w-3.5 h-3.5" /> Resume Campaign
                              </button>
                            )}

                          </div>

                          {/* Delete Action — always anchored to the right on sm+ */}
                          <button
                            onClick={() => setDeletingCampaign(c)}
                            className="self-start sm:self-auto inline-flex items-center gap-1 bg-[#FFF0F2] hover:bg-[#F4002C] text-[#F4002C] hover:text-white px-3 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#F4002C] shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex-shrink-0"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>

                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── EDIT CAMPAIGN MODAL ── */}
        {editingCampaign && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center p-4 py-8 overflow-y-auto">
            <div className="bg-white border-4 border-[#121316] shadow-[10px_10px_0_#FE4E1A] max-w-3xl w-full p-6 relative">
              
              {/* Close Button */}
              <button
                onClick={() => setEditingCampaign(null)}
                className="absolute top-4 right-4 bg-white border-2 border-[#121316] p-1.5 hover:bg-[#FE4E1A] hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-between gap-3 mb-5 pr-8 flex-wrap">
                <div className="space-y-1">
                  <div className="inline-block bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
                    Modify Campaign & Milestones
                  </div>
                  <h2 className="font-headline font-black text-2xl text-[#0F534A] uppercase tracking-tight">
                    Edit: {editingCampaign.title}
                  </h2>
                </div>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-5">
                {/* Administrative Review Policy Notice for Live/Approved Campaigns */}
                {['live', 'approved', 'paused'].includes((editingCampaign.status || '').toLowerCase()) && (
                  <div className="p-3.5 bg-[#FFF9F2] border-2 border-[#FE4E1A] shadow-[2px_2px_0px_#FE4E1A] flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-[#FE4E1A] shrink-0 mt-0.5" />
                    <div className="text-xs text-[#121316]">
                      <span className="font-headline font-black uppercase text-[#FE4E1A] block mb-0.5">
                        Administrative Milestone Review Policy
                      </span>
                      Modifying milestone budgets, scopes, or criteria on an active campaign records versioned revision history snapshots and pauses the campaign until reviewed and authorized by Platform Administrators.
                    </div>
                  </div>
                )}

                {/* Title */}
                <div>
                  <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1">
                    Campaign Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white uppercase"
                  />
                </div>

                {/* Short Description */}
                <div>
                  <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1">
                    Short Tagline / Summary (Max 200 chars) *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={200}
                    value={editForm.shortDescription}
                    onChange={(e) => setEditForm({ ...editForm, shortDescription: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                  />
                </div>

                {/* Full Description / Story */}
                <div>
                  <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1">
                    Full Description & Technical Architecture *
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-medium border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1">
                      Category *
                    </label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white uppercase"
                    >
                      <option value="STARTUP_INNOVATION">Startup Innovation</option>
                      <option value="RESEARCH_GRANT">Research Grant</option>
                      <option value="TUITION_FEE">Tuition Fee</option>
                      <option value="EMERGENCY_AID">Emergency Aid</option>
                      <option value="COMPETITION_TRAVEL">Competition & Travel</option>
                      <option value="EXTRACURRICULAR">Club & Extracurricular</option>
                    </select>
                  </div>

                  {/* Goal Amount */}
                  <div>
                    <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1">
                      Total Funding Goal (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      value={editForm.goalAmount || ''}
                      onChange={(e) => setEditForm({ ...editForm, goalAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>

                {/* ── TEAM MEMBERS & COLLABORATORS SECTION ── */}
                <div className="p-4 bg-[#FCFBF7] border-2 border-[#0F534A] shadow-[3px_3px_0px_#0F534A] space-y-3">
                  <div>
                    <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#FE4E1A]" />
                      Campaign Team Roster & Verified Collaborators ({editTeamMembers.length})
                    </label>
                    <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                      Add co-founders and team members by their registered DreamXec email. Verified accounts will be mapped to this campaign.
                    </p>
                  </div>

                  {/* Add New Member Input Bar */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Member @username or Registered Email *"
                        value={newMemberQuery}
                        onChange={(e) => setNewMemberQuery(e.target.value)}
                        className="w-full p-2 border-2 border-[#121316] text-xs font-bold bg-white focus:outline-none placeholder-gray-400"
                      />
                    </div>
                    <div className="sm:col-span-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="Role (e.g. Lead Dev)"
                        value={newMemberRole}
                        onChange={(e) => setNewMemberRole(e.target.value)}
                        className="flex-1 p-2 border-2 border-[#121316] text-xs font-bold bg-white focus:outline-none placeholder-gray-400"
                      />
                      <button
                        type="button"
                        disabled={isVerifyingMember}
                        onClick={handleAddTeamMember}
                        className="px-3 py-2 bg-[#9EFC5F] text-[#0F534A] font-headline font-black text-xs uppercase border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#86e844] cursor-pointer disabled:opacity-50 flex-shrink-0"
                      >
                        {isVerifyingMember ? 'Verifying...' : '+ Add'}
                      </button>
                    </div>
                  </div>

                  {/* Current Team Members Cards */}
                  {editTeamMembers.length > 0 ? (
                    <div className="space-y-2 pt-2 border-t border-gray-200">
                      <span className="text-[10px] font-headline font-black uppercase text-[#121316] block">
                        Verified Team Members ({editTeamMembers.length}):
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {editTeamMembers.map((tm, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-2.5 bg-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316]"
                          >
                            <div className="truncate pr-2">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-[#121316] truncate">{tm.name}</span>
                                {tm.username && (
                                  <span className="px-1.5 py-0.5 bg-[#0F534A] text-[#9EFC5F] border border-[#121316] text-[9px] font-mono font-bold">
                                    @{tm.username}
                                  </span>
                                )}
                                <span className="px-1.5 py-0.5 bg-[#FFDD33] text-[#121316] text-[9px] font-headline font-black uppercase border border-[#121316]">
                                  {tm.role}
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-500 truncate block font-mono">{tm.email}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveTeamMember(idx)}
                              className="p-1 hover:bg-red-100 text-red-600 border border-transparent hover:border-red-400 cursor-pointer transition-all shrink-0"
                              title="Remove member"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500 italic pt-1">
                      No team collaborators added yet. Solo student project.
                    </p>
                  )}
                </div>

                {/* ── MILESTONE TRANCHES SECTION (Identical to Creation) ── */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-[#0F534A]">
                    <div>
                      <h3 className="font-headline font-black text-base uppercase text-[#0F534A] flex items-center gap-1.5">
                        <Layers className="w-5 h-5 text-[#FE4E1A]" />
                        Milestone Tranche Builder
                      </h3>
                      <p className="text-xs text-gray-600 font-medium">
                        Break your project into delivery milestones. Disbursements will release sequentially upon verification.
                      </p>
                    </div>
                  </div>

                  <MilestoneTrancheBuilder
                    milestones={editForm.milestones}
                    totalGoal={Number(editForm.goalAmount || 0)}
                    currency="INR"
                    onChange={(newMilestones) =>
                      setEditForm((prev) => ({ ...prev, milestones: newMilestones }))
                    }
                  />
                </div>

                {/* Media Links Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1">
                      Cover Image URL
                    </label>
                    <input
                      type="text"
                      value={editForm.coverImageUrl}
                      onChange={(e) => setEditForm({ ...editForm, coverImageUrl: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                      placeholder="/uploads/..."
                    />
                    {editForm.coverImageUrl && (
                      <div className="mt-2 h-16 w-full border-2 border-[#121316] bg-gray-100 overflow-hidden shadow-[2px_2px_0_#121316]">
                        <img
                          src={editForm.coverImageUrl}
                          alt="Cover preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1">
                      Demo Video Link
                    </label>
                    <input
                      type="text"
                      value={editForm.videoUrl}
                      onChange={(e) => setEditForm({ ...editForm, videoUrl: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-medium border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                      placeholder="https://youtube.com/..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1">
                      Presentation Deck URL
                    </label>
                    <input
                      type="text"
                      value={editForm.presentationDeckUrl}
                      onChange={(e) => setEditForm({ ...editForm, presentationDeckUrl: e.target.value })}
                      className="w-full px-3 py-2 text-xs font-medium border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                      placeholder="https://docs.google.com/..."
                    />
                  </div>
                </div>

                {/* Submit Controls */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-[#121316]">
                  <button
                    type="button"
                    onClick={() => setEditingCampaign(null)}
                    className="px-4 py-2 text-xs font-headline font-black uppercase tracking-wider bg-gray-100 hover:bg-gray-200 border-2 border-[#121316] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 text-xs font-headline font-black uppercase tracking-wider bg-[#0F534A] hover:bg-[#0b3d36] text-white border-2 border-[#121316] shadow-[3px_3px_0_#FE4E1A] cursor-pointer disabled:opacity-50"
                  >
                    {savingEdit ? 'Saving...' : 'Save Modifications ✓'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

        {/* ── DELETE CONFIRMATION MODAL ── */}
        {deletingCampaign && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-4 border-[#121316] shadow-[8px_8px_0_#F4002C] max-w-md w-full p-6 text-center space-y-4">
              <div className="w-14 h-14 bg-[#FFF0F2] border-3 border-[#F4002C] text-[#F4002C] flex items-center justify-center mx-auto shadow-[3px_3px_0_#121316]">
                <Trash2 className="w-7 h-7 text-[#F4002C]" />
              </div>

              <div className="space-y-1">
                <h3 className="font-headline font-black text-2xl text-[#121316] uppercase">
                  Delete Campaign?
                </h3>
                <p className="text-xs text-gray-600 font-medium">
                  Are you sure you want to permanently delete <strong className="text-[#0F534A]">"{deletingCampaign.title}"</strong>?
                  All associated milestones and data will be removed.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingCampaign(null)}
                  disabled={isDeleting}
                  className="px-4 py-2 text-xs font-headline font-black uppercase tracking-wider bg-gray-100 hover:bg-gray-200 border-2 border-[#121316] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={isDeleting}
                  className="px-5 py-2 text-xs font-headline font-black uppercase tracking-wider bg-[#F4002C] hover:bg-[#d60026] text-white border-2 border-[#121316] shadow-[3px_3px_0_#121316] cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Yes, Delete Permanently ✗'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Milestone Proof Submission & Verification Modal (R1a, K8) ── */}
        {proofModalState.isOpen && proofModalState.milestone && (
          <MilestoneProofModal
            isOpen={proofModalState.isOpen}
            onClose={() =>
              setProofModalState({ isOpen: false, milestone: null, campaignId: '', mode: 'submit' })
            }
            milestone={proofModalState.milestone}
            campaignId={proofModalState.campaignId}
            initialMode={proofModalState.mode}
            onSuccess={fetchMyCampaigns}
          />
        )}

      </div>
    </>
  );
}
