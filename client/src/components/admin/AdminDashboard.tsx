import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { getCampaignUrl } from '../../utils/campaignRouting';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  Clock,
  Rocket,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  Layers,
  ArrowRight,
  Sparkles,
  Building2,
  Calendar,
  Award,
  Video,
  Presentation,
  UserCheck,
  Phone,
  MessageSquare,
  Undo,
  SlidersHorizontal,
  PauseCircle,
} from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import UnifiedDashboardLayout from '../layout/UnifiedDashboardLayout';
import TransactionLedgerView from '../common/TransactionLedgerView';
import AdminStudentVerifications from './AdminStudentVerification';
import AdminClubVerifications from './AdminClubVerifications';
import AdminFinancials from './AdminFinancials';
import AdminMilestones from './AdminMilestone';
import AdminUsers from './AdminUser';
import AdminAuditLogs from './AdminAuditLogs';
import AdminFacultyEndorsements from './AdminFacultyEndorsements';
import DxOrgManagementConsole from '../dx-admin/DxOrgManagementConsole';
import { campaignService } from '../../services/campaignService';
import {
  getDashboardStats,
  getAllProjects,
  verifyUserProject,
  getStudentVerifications,
  approveStudentVerification,
  rejectStudentVerification,
} from '../../services/adminService';
import type { Campaign, User, DashboardStats } from '../../types';
import SEO from '../SEO';

interface AdminDashboardProps {
  initialTab?: string;
  currentUser?: User | null;
  onLogout?: () => void;
}

export default function AdminDashboard({
  initialTab = 'overview',
  currentUser,
  onLogout,
}: AdminDashboardProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const tabParam = searchParams.get('tab') || initialTab;
  const [activeTab, setActiveTab] = useState<string>(tabParam);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalCampaigns: 0,
    pendingCampaigns: 0,
    liveCampaigns: 0,
    pendingMilestones: 0,
    pendingVerifications: 0,
    totalAmountRaised: 0,
    totalTargetGoal: 0,
  });

  const [pendingCampaignsList, setPendingCampaignsList] = useState<any[]>([]);
  const [allCampaignsList, setAllCampaignsList] = useState<any[]>([]);
  const [userVerificationsList, setUserVerificationsList] = useState<any[]>([]);

  // Review Modal state for Campaign
  const [reviewingCampaign, setReviewingCampaign] = useState<any | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [freezeModalOpen, setFreezeModalOpen] = useState(false);
  const [freezeReason, setFreezeReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // 6-Criterion Scoring Rubric State (L2, R3a)
  const [rubricScores, setRubricScores] = useState({
    problemClarity: 8,
    feasibility: 8,
    budgetRealism: 8,
    milestoneVerifiability: 8,
    teamEndorsement: 8,
    clarityOfAsk: 8,
  });
  const [rubricFeedback, setRubricFeedback] = useState('');

  const rubricTotalScore = useMemo(() => {
    const sum =
      rubricScores.problemClarity +
      rubricScores.feasibility +
      rubricScores.budgetRealism +
      rubricScores.milestoneVerifiability +
      rubricScores.teamEndorsement +
      rubricScores.clarityOfAsk;
    return Math.round((sum / 60) * 100);
  }, [rubricScores]);

  useEffect(() => {
    if (reviewingCampaign) {
      setRubricScores({
        problemClarity: 8,
        feasibility: 8,
        budgetRealism: 8,
        milestoneVerifiability: 8,
        teamEndorsement: 8,
        clarityOfAsk: 8,
      });
      setRubricFeedback('');
    }
  }, [reviewingCampaign?.id]);

  // Review Modal state for User/Student Verification
  const [reviewingUser, setReviewingUser] = useState<any | null>(null);
  const [userRejectModalOpen, setUserRejectModalOpen] = useState(false);
  const [userRejectionReason, setUserRejectionReason] = useState('');

  // Search & Filter in lists
  const [searchQuery, setSearchQuery] = useState('');
  const [campaignFilter, setCampaignFilter] = useState('ALL');
  const [userVerificationFilter, setUserVerificationFilter] = useState('PENDING');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const activeOrgId = (currentUser?.activeProfile as any)?.organizationId;
      const activeOrgSlug = (currentUser?.activeProfile as any)?.orgSlug;
      const isDreamXecRoot = activeOrgSlug?.toLowerCase() === 'dreamxec';
      const tenantParam = (isDreamXecRoot || !activeOrgId) ? undefined : activeOrgId;

      const [statsRes, pendingRes, publicRes, verificationsRes] = await Promise.all([
        getDashboardStats().catch(() => ({ data: {} } as any)),
        getAllProjects({ status: 'PENDING', tenantId: tenantParam }).catch(() => ({ data: { userProjects: { data: [] } } } as any)),
        getAllProjects({ limit: 100, tenantId: tenantParam }).catch(() => ({ data: { userProjects: { data: [] } } } as any)),
        getStudentVerifications().catch(() => ({ data: { verifications: [] } } as any)),
      ]);

      const pending =
        pendingRes.data?.userProjects?.data ||
        pendingRes.data?.projects ||
        pendingRes.data?.campaigns ||
        (pendingRes as any)?.campaigns ||
        [];

      const publicC =
        publicRes.data?.userProjects?.data ||
        publicRes.data?.projects ||
        publicRes.data?.campaigns ||
        (publicRes as any)?.campaigns ||
        [];

      const rawVerifications =
        verificationsRes.data?.verifications ||
        (verificationsRes as any)?.verifications ||
        (Array.isArray(verificationsRes.data) ? verificationsRes.data : []);

      setPendingCampaignsList(pending);
      setAllCampaignsList(publicC);
      setUserVerificationsList(rawVerifications);
      const pendingVerifs = rawVerifications.filter((v: any) => v.status === 'PENDING');

      const statsData = statsRes.data?.stats || statsRes.data || {};
      const calculatedLiveCampaigns = publicC.filter((c: any) => c.status === 'LIVE' || c.status === 'APPROVED').length;
      const calculatedTotalRaised = publicC.reduce((acc: number, curr: any) => acc + (Number(curr.amountRaised || curr.currentAmount || 0)), 0);
      const calculatedTotalGoal = publicC.reduce((acc: number, curr: any) => acc + (Number(curr.targetAmount || curr.goalAmount || 0)), 0);

      setStats({
        totalUsers: statsData.totalUsers ?? 0,
        totalCampaigns: statsData.totalCampaigns || publicC.length || 0,
        pendingCampaigns: pending.length || statsData.pendingCampaigns || 0,
        liveCampaigns: calculatedLiveCampaigns || statsData.liveCampaigns || 0,
        pendingMilestones: statsData.pendingMilestones || 0,
        pendingVerifications: pendingVerifs.length || statsData.pendingVerifications || 0,
        totalAmountRaised: statsData.totalAmountRaised || calculatedTotalRaised || 0,
        totalTargetGoal: statsData.totalTargetGoal || calculatedTotalGoal || 0,
      });
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
      toast.error('Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

  // ── CAMPAIGN ENDORSEMENT & MODERATION ACTIONS (L2, R3a) ──
  const handleApproveCampaign = async (campaignId: string) => {
    setActionLoading(true);
    const toastId = toast.loading('Endorsing campaign & publishing live...');
    try {
      await verifyUserProject(campaignId, {
        status: 'APPROVED',
        scoringRubric: {
          ...rubricScores,
          totalScore: rubricTotalScore,
          generalFeedback: rubricFeedback.trim() || undefined,
        },
      });
      toast.success(`Campaign verified and published LIVE! Rubric Score: ${rubricTotalScore}/100`, { id: toastId });
      setReviewingCampaign(null);
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to endorse campaign.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevisions = async () => {
    if (!reviewingCampaign || !revisionNotes.trim()) {
      toast.error('Please specify revision requirements for the creator.');
      return;
    }
    setActionLoading(true);
    const toastId = toast.loading('Dispatching revision request...');
    try {
      await verifyUserProject(reviewingCampaign.id, {
        status: 'REVISION_REQUIRED',
        reason: revisionNotes.trim(),
        scoringRubric: {
          ...rubricScores,
          totalScore: rubricTotalScore,
          generalFeedback: revisionNotes.trim(),
        },
      });
      toast.success('Revision request sent to creator. Campaign moved to DRAFT.', { id: toastId });
      setRevisionModalOpen(false);
      setRevisionNotes('');
      setReviewingCampaign(null);
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to request revisions.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFreezeCampaign = async () => {
    if (!reviewingCampaign || !freezeReason.trim()) {
      toast.error('Please enter a reason to freeze/pause this campaign.');
      return;
    }
    setActionLoading(true);
    const toastId = toast.loading('Freezing campaign donations & disbursements...');
    try {
      await verifyUserProject(reviewingCampaign.id, {
        status: 'FROZEN',
        reason: freezeReason.trim(),
      });
      toast.success('Campaign has been FROZEN/PAUSED. Donations halted.', { id: toastId });
      setFreezeModalOpen(false);
      setFreezeReason('');
      setReviewingCampaign(null);
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to freeze campaign.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCampaign = async () => {
    if (!reviewingCampaign || !rejectionReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }

    setActionLoading(true);
    const toastId = toast.loading('Recording rejection decision...');
    try {
      await verifyUserProject(reviewingCampaign.id, {
        status: 'REJECTED',
        reason: rejectionReason.trim(),
        scoringRubric: {
          ...rubricScores,
          totalScore: rubricTotalScore,
          generalFeedback: rejectionReason.trim(),
        },
      });
      toast.success('Campaign rejected.', { id: toastId });
      setRejectModalOpen(false);
      setRejectionReason('');
      setReviewingCampaign(null);
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to record campaign feedback.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  // ── USER / STUDENT VERIFICATION ACTIONS ──
  const handleApproveUserVerification = async (id: string) => {
    setActionLoading(true);
    const toastId = toast.loading('Verifying student identity & granting verified badge...');
    try {
      await approveStudentVerification(id);
      toast.success('Student verified successfully! Verified badge granted.', { id: toastId });
      setReviewingUser(null);
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to verify student.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectUserVerification = async () => {
    if (!reviewingUser || !userRejectionReason.trim()) {
      toast.error('Please enter a reason for rejecting verification.');
      return;
    }

    setActionLoading(true);
    const toastId = toast.loading('Rejecting verification request...');
    try {
      await rejectStudentVerification(reviewingUser.id, userRejectionReason.trim());
      toast.success('Verification request rejected.', { id: toastId });
      setUserRejectModalOpen(false);
      setUserRejectionReason('');
      setReviewingUser(null);
      await fetchDashboardData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject verification.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleWhatsAppContact = (number: string, name: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    const message = `Hello ${name}, this is DreamXec Governance Support regarding your student verification request.`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Filtered All Campaigns
  const filteredAllCampaigns = useMemo(() => {
    return allCampaignsList.filter((c) => {
      const matchesSearch =
        !searchQuery ||
        c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.student?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category?.toLowerCase().includes(searchQuery.toLowerCase());

      const status = (c.status || '').toUpperCase();
      let matchesFilter = campaignFilter === 'ALL';
      if (campaignFilter === 'LIVE') matchesFilter = status === 'LIVE' || status === 'APPROVED';
      if (campaignFilter === 'PENDING') matchesFilter = ['PENDING', 'PENDING_VERIFICATION', 'SUBMITTED'].includes(status);
      if (campaignFilter === 'REJECTED') matchesFilter = status === 'REJECTED';
      if (campaignFilter === 'DRAFT') matchesFilter = status === 'DRAFT';

      return matchesSearch && matchesFilter;
    });
  }, [allCampaignsList, searchQuery, campaignFilter]);

  // Filtered User Verifications
  const filteredUserVerifications = useMemo(() => {
    return userVerificationsList.filter((v) => {
      const status = (v.status || '').toUpperCase();
      if (userVerificationFilter === 'ALL') return true;
      return status === userVerificationFilter.toUpperCase();
    });
  }, [userVerificationsList, userVerificationFilter]);

  const headerActions = (
    <>
      <Link
        to="/campaigns"
        className="bg-white hover:bg-[#FFDD33] text-[#121316] px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all"
      >
        ← Marketplace
      </Link>

      <button
        onClick={fetchDashboardData}
        disabled={loading}
        className="bg-[#0F534A] hover:bg-[#0b3d36] text-white px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#FE4E1A] transition-all cursor-pointer disabled:opacity-50"
      >
        {loading ? 'Refreshing...' : '🔄 Refresh Data'}
      </button>
    </>
  );

  return (
    <UnifiedDashboardLayout
      title="Admin Governance Console | DreamXec"
      headerTitle={currentUser?.name ? `${currentUser.name} • Admin Console` : 'Governance Command Hub'}
      headerActions={headerActions}
    >
      <div className="p-6 sm:p-8 space-y-8 h-full">
            {/* ═══════════════════════════════════════════════════ */}
            {/* TAB 1: COMMAND CENTER OVERVIEW                      */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Urgent Action Radar Banner (If pending items exist) */}
                {(stats.pendingCampaigns > 0 || stats.pendingVerifications > 0 || stats.pendingMilestones > 0) && (
                  <div className="bg-[#FFF9F2] border-4 border-[#FE4E1A] shadow-[6px_6px_0_#4717AE] p-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 bg-[#FE4E1A] text-white px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider border-2 border-[#121316]">
                          <AlertTriangle className="w-3.5 h-3.5" /> Action Queue Pending
                        </div>
                        <h2 className="font-headline font-black text-2xl text-[#0F534A] uppercase tracking-tight">
                          Verification Approvals Awaiting Action
                        </h2>
                        <p className="text-xs sm:text-sm text-gray-700 font-medium">
                          You have <strong>{stats.pendingCampaigns} pending campaign(s)</strong> and <strong>{stats.pendingVerifications} user verification request(s)</strong> awaiting institutional review.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 flex-wrap">
                        {stats.pendingCampaigns > 0 && (
                          <button
                            onClick={() => handleTabChange('campaign-approvals')}
                            className="bg-[#FE4E1A] hover:bg-[#e03d0d] text-white px-4 py-2.5 text-xs font-headline font-black uppercase tracking-wider border-3 border-[#121316] shadow-[3px_3px_0_#121316] transition-all cursor-pointer"
                          >
                            Verify Campaigns ({stats.pendingCampaigns}) →
                          </button>
                        )}
                        {stats.pendingVerifications > 0 && (
                          <button
                            onClick={() => handleTabChange('verifications')}
                            className="bg-[#4717AE] hover:bg-[#350f87] text-white px-4 py-2.5 text-xs font-headline font-black uppercase tracking-wider border-3 border-[#121316] shadow-[3px_3px_0_#121316] transition-all cursor-pointer"
                          >
                            Verify Users ({stats.pendingVerifications}) →
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* KPI Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div
                    onClick={() => handleTabChange('campaign-approvals')}
                    className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] p-5 cursor-pointer transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-headline font-black uppercase tracking-widest text-[#FE4E1A]">
                        Pending Campaigns
                      </span>
                      <Clock className="w-5 h-5 text-[#FE4E1A]" />
                    </div>
                    <p className="font-headline font-black text-3xl text-[#121316]">{stats.pendingCampaigns}</p>
                    <p className="text-[11px] text-gray-500 font-bold mt-1">Awaiting marketplace verification</p>
                  </div>

                  <div
                    onClick={() => handleTabChange('verifications')}
                    className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#4717AE] p-5 cursor-pointer transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-headline font-black uppercase tracking-widest text-[#4717AE]">
                        User KYC Requests
                      </span>
                      <UserCheck className="w-5 h-5 text-[#4717AE]" />
                    </div>
                    <p className="font-headline font-black text-3xl text-[#121316]">{stats.pendingVerifications}</p>
                    <p className="text-[11px] text-gray-500 font-bold mt-1">Student & ID verification queue</p>
                  </div>

                  <div
                    onClick={() => handleTabChange('campaigns')}
                    className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#0F534A] p-5 cursor-pointer transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-headline font-black uppercase tracking-widest text-[#0F534A]">
                        Live Campaigns
                      </span>
                      <Rocket className="w-5 h-5 text-[#0F534A]" />
                    </div>
                    <p className="font-headline font-black text-3xl text-[#121316]">{stats.liveCampaigns}</p>
                    <p className="text-[11px] text-gray-500 font-bold mt-1">Actively raising student funds</p>
                  </div>

                  <div
                    onClick={() => handleTabChange('financials')}
                    className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FFDD33] p-5 cursor-pointer transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-headline font-black uppercase tracking-widest text-[#0F534A]">
                        Funds Raised
                      </span>
                      <DollarSign className="w-5 h-5 text-[#0F534A]" />
                    </div>
                    <p className="font-headline font-black text-3xl text-[#0F534A]">
                      ₹{stats.totalAmountRaised.toLocaleString('en-IN')}
                    </p>
                    <p className="text-[11px] text-gray-500 font-bold mt-1">Protected in institutional escrow</p>
                  </div>
                </div>

                {/* Quick Campaign Verification Radar */}
                <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] p-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b-3 border-[#121316] pb-3">
                    <div className="space-y-0.5">
                      <div className="inline-block bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
                        Maker-Checker Review
                      </div>
                      <h3 className="font-headline font-black text-xl text-[#0F534A] uppercase">
                        Campaign Proposals Awaiting Verification ({pendingCampaignsList.length})
                      </h3>
                    </div>

                    <button
                      onClick={() => handleTabChange('campaign-approvals')}
                      className="inline-flex items-center gap-1.5 text-xs font-headline font-black uppercase tracking-wider text-[#FE4E1A] hover:underline"
                    >
                      Open Full Review Console <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {pendingCampaignsList.length === 0 ? (
                    <div className="p-8 text-center bg-[#FCFBF7] border-2 border-[#121316] space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-[#0B9C2C] mx-auto" />
                      <p className="font-headline font-black text-base text-[#121316] uppercase">
                        Campaign Queue is Clear!
                      </p>
                      <p className="text-xs text-gray-600 font-medium">
                        All student and researcher campaigns have been verified.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingCampaignsList.slice(0, 4).map((c) => (
                        <div
                          key={c.id}
                          className="bg-[#FCFBF7] border-3 border-[#121316] shadow-[3px_3px_0_#FE4E1A] p-4 flex flex-col justify-between gap-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2 py-0.5 text-[9px] font-headline font-black uppercase">
                                ⏳ Pending Review
                              </span>
                              <span className="text-[10px] text-gray-700 font-bold truncate">
                                {c.student?.name || c.user?.name || 'Student Creator'}
                              </span>
                            </div>
                            <h4 className="font-headline font-black text-base text-[#0F534A] uppercase leading-tight line-clamp-1">
                              {c.title}
                            </h4>
                            <p className="text-xs text-gray-600 font-medium line-clamp-2">
                              {c.shortDescription || c.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t-2 border-gray-200">
                            <div>
                              <span className="text-[9px] text-gray-500 font-bold uppercase">Target Goal</span>
                              <p className="font-headline font-black text-sm text-[#0F534A]">
                                ₹{Number(c.targetAmount || c.goalAmount || 0).toLocaleString('en-IN')}
                              </p>
                            </div>

                            <button
                              onClick={() => setReviewingCampaign(c)}
                              className="bg-[#FE4E1A] hover:bg-[#e03d0d] text-white px-3 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
                            >
                              Verify & Inspect →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Student Verification Radar */}
                <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#4717AE] p-6 space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2 border-b-3 border-[#121316] pb-3">
                    <div className="space-y-0.5">
                      <div className="inline-block bg-[#4717AE] text-white border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
                        KYC & Identity Verification
                      </div>
                      <h3 className="font-headline font-black text-xl text-[#0F534A] uppercase">
                        Pending Student Verification Requests ({userVerificationsList.filter(v => v.status === 'PENDING').length})
                      </h3>
                    </div>

                    <button
                      onClick={() => handleTabChange('verifications')}
                      className="inline-flex items-center gap-1.5 text-xs font-headline font-black uppercase tracking-wider text-[#4717AE] hover:underline"
                    >
                      Manage All Verifications <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {userVerificationsList.filter(v => v.status === 'PENDING').length === 0 ? (
                    <div className="p-8 text-center bg-[#FCFBF7] border-2 border-[#121316] space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-[#0B9C2C] mx-auto" />
                      <p className="font-headline font-black text-base text-[#121316] uppercase">
                        All Student Verification Requests Cleared!
                      </p>
                      <p className="text-xs text-gray-600 font-medium">
                        No pending identity checks in the queue.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {userVerificationsList.filter(v => v.status === 'PENDING').slice(0, 4).map((v) => (
                        <div
                          key={v.id}
                          className="bg-[#FCFBF7] border-3 border-[#121316] shadow-[3px_3px_0_#4717AE] p-4 flex flex-col justify-between gap-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="bg-[#4717AE] text-white border-2 border-[#121316] px-2 py-0.5 text-[9px] font-headline font-black uppercase">
                                Student ID Proof
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                {new Date(v.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <h4 className="font-headline font-black text-base text-[#0F534A] uppercase leading-tight truncate">
                              {v.user?.name || 'Student Applicant'}
                            </h4>
                            <p className="text-xs text-gray-600 font-medium">
                              Roll: <span className="font-mono font-bold text-[#121316]">{v.rollNumber}</span> • {v.branch}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t-2 border-gray-200">
                            <span className="text-[10px] text-gray-500 font-bold truncate max-w-[150px]">
                              {v.institution}
                            </span>
                            <button
                              onClick={() => setReviewingUser(v)}
                              className="bg-[#4717AE] hover:bg-[#350f87] text-white px-3 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
                            >
                              Review ID Proof →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ═══════════════════════════════════════════════════ */}
            {/* TAB: ORG FINANCIAL LEDGER */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'ledger' && (
              <div className="space-y-6">
                <TransactionLedgerView
                  title="Organization Financial Ledger"
                  subtitle="Audit trail of grant allocations, student campaign disbursements, and escrow holds for your organization"
                  orgId={(currentUser?.activeProfile as any)?.organizationId}
                />
              </div>
            )}
            {/* TAB 2: CAMPAIGN APPROVALS & VERIFICATION WORKBENCH */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'campaign-approvals' && (
              <div className="space-y-6">
                {/* Header */}
                <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#FE4E1A] p-6">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
                      <ShieldCheck className="w-3.5 h-3.5" /> Maker-Checker Dual Custody
                    </div>
                    <h2 className="font-headline font-black text-2xl sm:text-3xl text-[#0F534A] uppercase tracking-tight">
                      Campaign Verification Workbench
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-700 font-medium max-w-3xl">
                      Review campaigns submitted by students. Inspect project story, milestone disbursement tranches, and presentation decks. Verified campaigns transition to LIVE status.
                    </p>
                  </div>
                </div>

                {/* Pending Queue List */}
                {pendingCampaignsList.length === 0 ? (
                  <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0B9C2C] p-12 text-center max-w-lg mx-auto space-y-3">
                    <div className="w-14 h-14 bg-[#9EFC5F] border-3 border-[#121316] text-[#0F534A] flex items-center justify-center mx-auto text-2xl shadow-[3px_3px_0_#121316] font-black">
                      ✓
                    </div>
                    <h3 className="font-headline font-black text-2xl text-[#121316] uppercase">
                      All Campaigns Verified!
                    </h3>
                    <p className="text-xs text-gray-600 font-medium">
                      No campaign proposals are currently awaiting institutional review.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingCampaignsList.map((c) => (
                      <div
                        key={c.id}
                        className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#FE4E1A] p-6 space-y-4"
                      >
                        <div className="flex flex-col lg:flex-row gap-6 items-start">
                          {/* Cover Thumbnail */}
                          <div className="w-full lg:w-60 h-44 flex-shrink-0 border-3 border-[#121316] shadow-[3px_3px_0_#121316] overflow-hidden bg-gray-100 relative">
                            <img
                              src={c.coverImageUrl || '/assets/curious_student_hero.webp'}
                              alt={c.title}
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute top-2 left-2 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2 py-0.5 text-[9px] font-headline font-black uppercase">
                              {c.category || 'INNOVATION'}
                            </span>
                          </div>

                          {/* Details */}
                          <div className="flex-1 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <h3 className="font-headline font-black text-xl sm:text-2xl text-[#0F534A] uppercase tracking-tight">
                                {c.title}
                              </h3>
                              <span className="inline-flex items-center gap-1 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-black uppercase">
                                <Clock className="w-3 h-3" /> Awaiting Verification
                              </span>
                            </div>

                            <p className="text-xs sm:text-sm text-gray-700 font-medium line-clamp-2">
                              {c.shortDescription || c.description}
                            </p>

                            {/* Creator & Target Info */}
                            <div className="bg-[#FCFBF7] border-2 border-[#121316] p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Student Lead</span>
                                <p className="font-headline font-black text-xs text-[#121316] truncate">
                                  {c.student?.name || c.user?.name || 'Aarav Sharma'}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Target Goal</span>
                                <p className="font-headline font-black text-sm text-[#0F534A]">
                                  ₹{Number(c.targetAmount || c.goalAmount || 0).toLocaleString('en-IN')}
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Milestones</span>
                                <p className="font-headline font-black text-sm text-[#FE4E1A]">
                                  {c.milestones?.length || 3} Tranches
                                </p>
                              </div>
                              <div>
                                <span className="text-[10px] font-bold text-gray-500 uppercase">Institution</span>
                                <p className="font-headline font-black text-xs text-[#0F534A] truncate">
                                  {c.tenant?.name || 'NIT Kurukshetra'}
                                </p>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t-2 border-dashed border-gray-300">
                              <button
                                onClick={() => setReviewingCampaign(c)}
                                className="inline-flex items-center gap-1.5 bg-[#4717AE] hover:bg-[#350f87] text-white px-4 py-2 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> Full Proposal Review
                              </button>

                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setReviewingCampaign(c);
                                    setRejectModalOpen(true);
                                  }}
                                  className="inline-flex items-center gap-1 bg-[#F4002C] hover:bg-[#c90024] text-white px-3.5 py-2 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" /> Reject with Feedback
                                </button>

                                <button
                                  onClick={() => handleApproveCampaign(c.id)}
                                  className="inline-flex items-center gap-1.5 bg-[#0F534A] hover:bg-[#0b3d36] text-white px-4 py-2 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#FE4E1A] transition-all cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" /> Approve & Go Live ✓
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ═══════════════════════════════════════════════════ */}
            {/* TAB 3: MARKETPLACE CAMPAIGNS CATALOG               */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'campaigns' && (
              <div className="space-y-6">
                {/* Search & Filter Toolbar */}
                <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#0F534A] p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="w-full md:w-80 relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search campaigns by title, student..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white uppercase tracking-wider"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                    <Filter className="w-4 h-4 text-[#0F534A]" />
                    {['ALL', 'LIVE', 'PENDING', 'REJECTED', 'DRAFT'].map((f) => (
                      <button
                        key={f}
                        onClick={() => setCampaignFilter(f)}
                        className={`px-3 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] transition-all cursor-pointer ${
                          campaignFilter === f
                            ? 'bg-[#FE4E1A] text-white shadow-[2px_2px_0_#121316]'
                            : 'bg-white text-[#121316] hover:bg-[#FFDD33]'
                        }`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Campaigns Table */}
                <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-[#0F534A] text-white font-headline font-black uppercase tracking-wider border-b-3 border-[#121316]">
                      <tr>
                        <th className="p-4">Campaign Title</th>
                        <th className="p-4">Lead Student</th>
                        <th className="p-4">Target Goal</th>
                        <th className="p-4">Raised</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y-2 divide-gray-200 font-medium">
                      {filteredAllCampaigns.map((c) => (
                        <tr key={c.id} className="hover:bg-[#FCFBF7] transition-colors">
                          <td className="p-4 font-headline font-black text-sm text-[#0F534A] uppercase">
                            {c.title}
                          </td>
                          <td className="p-4 font-bold text-gray-700">
                            {c.student?.name || c.user?.name || 'Student Creator'}
                          </td>
                          <td className="p-4 font-mono font-bold text-[#0F534A]">
                            ₹{Number(c.targetAmount || c.goalAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-4 font-mono font-bold text-[#FE4E1A]">
                            ₹{Number(c.currentRaisedAmount || c.currentAmount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 text-[9px] font-headline font-black uppercase border-2 border-[#121316] ${
                                c.status === 'LIVE' || c.status === 'APPROVED'
                                  ? 'bg-[#9EFC5F] text-[#0F534A]'
                                  : c.status === 'REJECTED'
                                  ? 'bg-[#F4002C] text-white'
                                  : 'bg-[#FFDD33] text-[#121316]'
                              }`}
                            >
                              {c.status || 'LIVE'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              onClick={() => setReviewingCampaign(c)}
                              className="inline-flex items-center gap-1 bg-[#4717AE] text-white px-3 py-1 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#350f87]"
                            >
                              <Eye className="w-3 h-3" /> Inspect
                            </button>
                            {getCampaignUrl(c.slug || c.id).startsWith('http') ? (
                              <a
                                href={getCampaignUrl(c.slug || c.id)}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 bg-white text-[#121316] px-3 py-1 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#FFDD33]"
                              >
                                <ExternalLink className="w-3 h-3" /> Public View
                              </a>
                            ) : (
                              <Link
                                to={getCampaignUrl(c.slug || c.id)}
                                className="inline-flex items-center gap-1 bg-white text-[#121316] px-3 py-1 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#FFDD33]"
                              >
                                <ExternalLink className="w-3 h-3" /> Public View
                              </Link>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ═══════════════════════════════════════════════════ */}
            {/* TAB 4: USER & STUDENT KYC VERIFICATIONS             */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'verifications' && <AdminStudentVerifications embedded={true} />}

            {/* ═══════════════════════════════════════════════════ */}
            {/* TAB 5: CLUB VERIFICATIONS                           */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'club-verifications' && <AdminClubVerifications />}

            {/* ═══════════════════════════════════════════════════ */}
            {/* TAB 6: MILESTONE ESCROW GOVERNANCE                  */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'milestones' && <AdminMilestones embedded={true} />}

            {/* ═══════════════════════════════════════════════════ */}
            {/* TAB 7: USERS & DONORS DIRECTORY                    */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'users' && <AdminUsers embedded={true} />}

            {/* ═══════════════════════════════════════════════════ */}
            {/* TAB 8: FINANCIALS & ESCROW LEDGER                  */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'financials' && <AdminFinancials embedded={true} />}

            {/* ═══════════════════════════════════════════════════ */}
            {/* TAB 9: AUDIT TRAIL                                  */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'audit-logs' && <AdminAuditLogs />}

            {/* ═══════════════════════════════════════════════════ */}
            {/* TAB 10: FACULTY ENDORSEMENT QUEUE (L14)             */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'endorsements' && <AdminFacultyEndorsements embedded={true} />}

            {/* ═══════════════════════════════════════════════════ */}
            {/* TAB 11: DX PLATFORM STUDIO (FOR SUPER ADMINS)      */}
            {/* ═══════════════════════════════════════════════════ */}
            {activeTab === 'platform-studio' && (
              <div className="space-y-6">
                <DxOrgManagementConsole />
              </div>
            )}
          </div>

        {/* ── CAMPAIGN PROPOSAL INSPECTION & VERIFICATION MODAL ── */}
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
                <div className="inline-block bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
                  Maker-Checker Campaign Review
                </div>
                <h2 className="font-headline font-black text-2xl sm:text-3xl text-[#0F534A] uppercase tracking-tight">
                  {reviewingCampaign.title}
                </h2>
                <div className="flex items-center gap-3 pt-1">
                  <UserAvatar
                    user={reviewingCampaign.student || reviewingCampaign.user}
                    src={reviewingCampaign.student?.avatar || reviewingCampaign.user?.avatar}
                    name={reviewingCampaign.student?.name || reviewingCampaign.user?.name}
                    username={reviewingCampaign.student?.username || reviewingCampaign.user?.username}
                    size="sm"
                    shape="circle"
                  />
                  <div>
                    <p className="text-xs text-[#121316] font-bold">
                      {reviewingCampaign.student?.name || reviewingCampaign.user?.name || 'Student Creator'} ({reviewingCampaign.student?.email || reviewingCampaign.user?.email || 'N/A'})
                    </p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase">
                      Institution: {reviewingCampaign.tenant?.name || 'NIT Kurukshetra'} • Category: {reviewingCampaign.category || 'Innovation'}
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

              {/* Pitch & Description */}
              <div className="bg-[#FCFBF7] border-3 border-[#121316] p-4 space-y-2">
                <h4 className="font-headline font-black text-sm uppercase text-[#0F534A]">
                  Campaign Pitch &amp; Story
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
                        {m.user?.name || m.name} <span className="text-[#FE4E1A] text-[10px] uppercase">({m.title || m.role || 'Member'})</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Escrow Banking KYC Preview */}
              {reviewingCampaign.beneficiaryDetails && (
                <div className="bg-white border-2 border-[#121316] p-4 space-y-1.5 shadow-[2px_2px_0_#121316] text-xs">
                  <h4 className="font-headline font-black text-xs uppercase text-[#0F534A]">
                    🏦 Beneficiary Escrow Bank KYC
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono">
                    <div><span className="text-gray-500 uppercase text-[9px] block">Holder:</span> <strong className="font-sans">{reviewingCampaign.beneficiaryDetails.accountHolderName}</strong></div>
                    <div><span className="text-gray-500 uppercase text-[9px] block">Account #:</span> <strong>{reviewingCampaign.beneficiaryDetails.bankAccountNumber}</strong></div>
                    <div><span className="text-gray-500 uppercase text-[9px] block">IFSC:</span> <strong>{reviewingCampaign.beneficiaryDetails.ifscCode}</strong></div>
                    <div><span className="text-gray-500 uppercase text-[9px] block">UPI ID:</span> <strong>{reviewingCampaign.beneficiaryDetails.upiId || 'N/A'}</strong></div>
                  </div>
                </div>
              )}

              {/* Minor Guardian Consent (O8, K11) */}
              {reviewingCampaign.beneficiaryDetails?.isMinor && (
                <div className="bg-[#FFF9F2] border-2 border-[#FE4E1A] p-4 space-y-2 shadow-[2px_2px_0_#121316] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-headline font-black text-xs uppercase text-[#FE4E1A] flex items-center gap-1.5">
                      ⚠️ Minor Creator Guardian Co-Signatory Verified (O8, K11)
                    </span>
                    {reviewingCampaign.beneficiaryDetails.guardianConsentUrl && (
                      <a
                        href={reviewingCampaign.beneficiaryDetails.guardianConsentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-[#FE4E1A] text-white px-2 py-0.5 text-[10px] font-headline font-black uppercase inline-flex items-center gap-1 border border-[#121316]"
                      >
                        View Consent Form <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono pt-1 text-[11px]">
                    <div>Guardian: <strong className="font-sans">{reviewingCampaign.beneficiaryDetails.guardianName}</strong></div>
                    <div>Relationship: <strong>{reviewingCampaign.beneficiaryDetails.guardianRelationship || 'PARENT'}</strong></div>
                    <div>Contact: <strong>{reviewingCampaign.beneficiaryDetails.guardianPhone}</strong></div>
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
                    Goal: ₹{Number(reviewingCampaign.targetAmount || reviewingCampaign.goalAmount || 0).toLocaleString('en-IN')}
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
                        </div>
                        {criteria.length > 0 && (
                          <div className="bg-[#FCFBF7] p-2 border border-gray-300 space-y-1">
                            <span className="text-[10px] font-black uppercase text-[#0F534A] block">Acceptance Criteria:</span>
                            {criteria.map((c: any, cIdx: number) => (
                              <div key={cIdx} className="text-[11px] text-gray-700">✓ {typeof c === 'string' ? c : JSON.stringify(c)}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6-Criterion Scoring Rubric (L2, R3a) */}
              <div className="bg-[#FCFBF7] border-3 border-[#121316] p-4 sm:p-5 space-y-4 shadow-[3px_3px_0_#121316]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#121316] pb-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5 text-[#FE4E1A]" />
                    <div>
                      <h4 className="font-headline font-black text-sm uppercase text-[#121316]">
                        6-Criterion Governance Scoring Rubric
                      </h4>
                      <p className="text-[11px] text-gray-600 font-medium">
                        Standardized multi-vector quality assessment required before live publishing
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Composite Score:</span>
                    <span
                      className={`font-mono font-black text-sm px-3 py-1 border-2 border-[#121316] shadow-[2px_2px_0_#121316] ${
                        rubricTotalScore >= 75
                          ? 'bg-[#9EFC5F] text-[#121316]'
                          : rubricTotalScore >= 50
                          ? 'bg-[#FFDD33] text-[#121316]'
                          : 'bg-[#F4002C] text-white'
                      }`}
                    >
                      {rubricTotalScore} / 100
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  {/* Criterion 1 */}
                  <div className="bg-white border-2 border-[#121316] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-headline font-black uppercase text-[#0F534A]">
                        1. Problem Clarity & Social Need
                      </label>
                      <span className="font-mono font-black text-xs px-2 py-0.5 bg-[#FFDD33] border border-[#121316]">
                        {rubricScores.problemClarity}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={rubricScores.problemClarity}
                      onChange={(e) =>
                        setRubricScores((prev) => ({ ...prev, problemClarity: Number(e.target.value) }))
                      }
                      className="w-full accent-[#FE4E1A] cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-500">Clarity of problem statement and validated beneficiary impact.</p>
                  </div>

                  {/* Criterion 2 */}
                  <div className="bg-white border-2 border-[#121316] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-headline font-black uppercase text-[#0F534A]">
                        2. Feasibility & Technical Merit
                      </label>
                      <span className="font-mono font-black text-xs px-2 py-0.5 bg-[#FFDD33] border border-[#121316]">
                        {rubricScores.feasibility}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={rubricScores.feasibility}
                      onChange={(e) =>
                        setRubricScores((prev) => ({ ...prev, feasibility: Number(e.target.value) }))
                      }
                      className="w-full accent-[#FE4E1A] cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-500">Methodology, tech stack, and execution realism.</p>
                  </div>

                  {/* Criterion 3 */}
                  <div className="bg-white border-2 border-[#121316] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-headline font-black uppercase text-[#0F534A]">
                        3. Budget Realism & Cost Breakdown
                      </label>
                      <span className="font-mono font-black text-xs px-2 py-0.5 bg-[#FFDD33] border border-[#121316]">
                        {rubricScores.budgetRealism}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={rubricScores.budgetRealism}
                      onChange={(e) =>
                        setRubricScores((prev) => ({ ...prev, budgetRealism: Number(e.target.value) }))
                      }
                      className="w-full accent-[#FE4E1A] cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-500">Itemized quotation justification & fair market rate adherence.</p>
                  </div>

                  {/* Criterion 4 */}
                  <div className="bg-white border-2 border-[#121316] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-headline font-black uppercase text-[#0F534A]">
                        4. Milestone Verifiability
                      </label>
                      <span className="font-mono font-black text-xs px-2 py-0.5 bg-[#FFDD33] border border-[#121316]">
                        {rubricScores.milestoneVerifiability}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={rubricScores.milestoneVerifiability}
                      onChange={(e) =>
                        setRubricScores((prev) => ({ ...prev, milestoneVerifiability: Number(e.target.value) }))
                      }
                      className="w-full accent-[#FE4E1A] cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-500">Objective acceptance criteria and tangible demo proofs.</p>
                  </div>

                  {/* Criterion 5 */}
                  <div className="bg-white border-2 border-[#121316] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-headline font-black uppercase text-[#0F534A]">
                        5. Team Capability & Endorsement
                      </label>
                      <span className="font-mono font-black text-xs px-2 py-0.5 bg-[#FFDD33] border border-[#121316]">
                        {rubricScores.teamEndorsement}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={rubricScores.teamEndorsement}
                      onChange={(e) =>
                        setRubricScores((prev) => ({ ...prev, teamEndorsement: Number(e.target.value) }))
                      }
                      className="w-full accent-[#FE4E1A] cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-500">Faculty advisory backing, skills match, and student track record.</p>
                  </div>

                  {/* Criterion 6 */}
                  <div className="bg-white border-2 border-[#121316] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-headline font-black uppercase text-[#0F534A]">
                        6. Clarity of Funding Ask
                      </label>
                      <span className="font-mono font-black text-xs px-2 py-0.5 bg-[#FFDD33] border border-[#121316]">
                        {rubricScores.clarityOfAsk}/10
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={rubricScores.clarityOfAsk}
                      onChange={(e) =>
                        setRubricScores((prev) => ({ ...prev, clarityOfAsk: Number(e.target.value) }))
                      }
                      className="w-full accent-[#FE4E1A] cursor-pointer"
                    />
                    <p className="text-[10px] text-gray-500">Public transparency, donor tier utility, and timeline clarity.</p>
                  </div>
                </div>

                {/* Optional Feedback */}
                <div>
                  <label className="block text-[11px] font-headline font-black uppercase text-gray-700 mb-1">
                    Moderator Observations & Rubric Notes (Optional):
                  </label>
                  <input
                    type="text"
                    value={rubricFeedback}
                    onChange={(e) => setRubricFeedback(e.target.value)}
                    placeholder="e.g. Excellent technical plan, mentor confirmed. Approved for immediate funding."
                    className="w-full p-2.5 text-xs border-2 border-[#121316] bg-white font-medium focus:outline-none focus:border-[#0F534A]"
                  />
                </div>
              </div>

              {/* Action Bar (R3a, L2) */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t-3 border-[#121316]">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectModalOpen(true)}
                    disabled={actionLoading}
                    className="px-4 py-2.5 text-xs font-headline font-black uppercase tracking-wider bg-[#F4002C] hover:bg-[#c90024] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] cursor-pointer disabled:opacity-50"
                  >
                    Reject ✗
                  </button>

                  <button
                    type="button"
                    onClick={() => setFreezeModalOpen(true)}
                    disabled={actionLoading}
                    className="px-4 py-2.5 text-xs font-headline font-black uppercase tracking-wider bg-[#121316] hover:bg-gray-800 text-[#18D7E8] border-2 border-[#121316] shadow-[2px_2px_0_#121316] cursor-pointer disabled:opacity-50"
                  >
                    Freeze / Pause ❄️
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setRevisionModalOpen(true)}
                    disabled={actionLoading}
                    className="px-5 py-2.5 text-xs font-headline font-black uppercase tracking-wider bg-[#FFDD33] hover:bg-[#e6c72b] text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0_#121316] cursor-pointer disabled:opacity-50"
                  >
                    Request Revisions ✍️
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApproveCampaign(reviewingCampaign.id)}
                    disabled={actionLoading}
                    className="px-6 py-2.5 text-xs font-headline font-black uppercase tracking-wider bg-[#0F534A] hover:bg-[#0b3d36] text-white border-2 border-[#121316] shadow-[3px_3px_0_#FE4E1A] cursor-pointer disabled:opacity-50"
                  >
                    {actionLoading ? 'Verifying...' : `Approve & Go Live (${rubricTotalScore}/100) ✓`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── CAMPAIGN REJECTION MODAL ── */}
        {rejectModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-4 border-[#121316] shadow-[10px_10px_0_#F4002C] max-w-md w-full p-6 space-y-4">
              <div className="space-y-1 text-center">
                <div className="w-12 h-12 bg-[#F4002C] text-white border-2 border-[#121316] flex items-center justify-center mx-auto text-xl shadow-[2px_2px_0_#121316] font-black">
                  ✗
                </div>
                <h3 className="font-headline font-black text-xl text-[#121316] uppercase">
                  Reject Campaign
                </h3>
                <p className="text-xs text-gray-600 font-medium">
                  Provide justification for permanently rejecting this proposal.
                </p>
              </div>

              <div>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Violates research ethics guidelines, commercial resale not permitted..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 text-xs font-medium border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-[#121316]">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 text-xs font-headline font-black uppercase bg-gray-100 border-2 border-[#121316]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectCampaign}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="px-5 py-2 text-xs font-headline font-black uppercase bg-[#F4002C] text-white border-2 border-[#121316] shadow-[3px_3px_0_#121316] disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Proposal ✗'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CAMPAIGN REQUEST REVISIONS MODAL ── */}
        {revisionModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-4 border-[#121316] shadow-[10px_10px_0_#FFDD33] max-w-md w-full p-6 space-y-4">
              <div className="space-y-1 text-center">
                <div className="w-12 h-12 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] flex items-center justify-center mx-auto text-xl shadow-[2px_2px_0_#121316] font-black">
                  ✍️
                </div>
                <h3 className="font-headline font-black text-xl text-[#121316] uppercase">
                  Request Revisions
                </h3>
                <p className="text-xs text-gray-600 font-medium">
                  The campaign will revert to DRAFT status with your feedback so the creator can edit and resubmit.
                </p>
              </div>

              <div>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Please clarify milestone 2 deliverables, reduce procurement budget on item 4, and re-upload vendor quotation..."
                  value={revisionNotes}
                  onChange={(e) => setRevisionNotes(e.target.value)}
                  className="w-full p-3 text-xs font-medium border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-[#121316]">
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(false)}
                  className="px-4 py-2 text-xs font-headline font-black uppercase bg-gray-100 border-2 border-[#121316]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRequestRevisions}
                  disabled={actionLoading || !revisionNotes.trim()}
                  className="px-5 py-2 text-xs font-headline font-black uppercase bg-[#FE4E1A] text-white border-2 border-[#121316] shadow-[3px_3px_0_#121316] disabled:opacity-50"
                >
                  {actionLoading ? 'Sending...' : 'Send Revision Request ✍️'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── CAMPAIGN FREEZE MODAL ── */}
        {freezeModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-4 border-[#121316] shadow-[10px_10px_0_#18D7E8] max-w-md w-full p-6 space-y-4">
              <div className="space-y-1 text-center">
                <div className="w-12 h-12 bg-[#121316] text-[#18D7E8] border-2 border-[#121316] flex items-center justify-center mx-auto text-xl shadow-[2px_2px_0_#121316] font-black">
                  ❄️
                </div>
                <h3 className="font-headline font-black text-xl text-[#121316] uppercase">
                  Freeze / Pause Campaign
                </h3>
                <p className="text-xs text-gray-600 font-medium">
                  Freezing immediately pauses incoming donations and locks milestone disbursements pending compliance check.
                </p>
              </div>

              <div>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Under compliance review pending faculty sponsor confirmation..."
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  className="w-full p-3 text-xs font-medium border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-[#121316]">
                <button
                  type="button"
                  onClick={() => setFreezeModalOpen(false)}
                  className="px-4 py-2 text-xs font-headline font-black uppercase bg-gray-100 border-2 border-[#121316]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFreezeCampaign}
                  disabled={actionLoading || !freezeReason.trim()}
                  className="px-5 py-2 text-xs font-headline font-black uppercase bg-[#121316] text-[#18D7E8] border-2 border-[#121316] shadow-[3px_3px_0_#121316] disabled:opacity-50"
                >
                  {actionLoading ? 'Freezing...' : 'Confirm Freeze ❄️'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── USER / STUDENT KYC REVIEW MODAL ── */}
        {reviewingUser && (
          <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white border-4 border-[#121316] shadow-[10px_10px_0_#4717AE] max-w-2xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto space-y-6">
              <button
                onClick={() => setReviewingUser(null)}
                className="absolute top-4 right-4 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] p-1.5 hover:bg-[#FE4E1A] hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-1">
                <div className="inline-block bg-[#4717AE] text-white border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
                  Student KYC & Identity Review
                </div>
                <h2 className="font-headline font-black text-2xl text-[#0F534A] uppercase tracking-tight">
                  {reviewingUser.user?.name || 'Student Applicant'}
                </h2>
                <p className="text-xs text-gray-600 font-bold">
                  {reviewingUser.user?.email} • {reviewingUser.institution}
                </p>
              </div>

              {/* Student Metadata Info */}
              <div className="bg-[#FCFBF7] border-3 border-[#121316] p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Govt ID Proof</span>
                  <p className="font-headline font-black text-xs text-[#121316]">{reviewingUser.govtDocType || 'Aadhaar Card'}</p>
                  <p className="font-mono text-[10px] text-gray-600 font-bold">{reviewingUser.govtDocNumber || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Roll & Branch</span>
                  <p className="font-headline font-black text-xs text-[#0F534A]">{reviewingUser.rollNumber}</p>
                  <p className="text-[10px] text-gray-600 font-bold">{reviewingUser.branch} - {reviewingUser.year}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">Status</span>
                  <p className="font-headline font-black text-xs text-[#FE4E1A]">{reviewingUser.status}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">WhatsApp</span>
                  <p className="font-headline font-black text-xs text-[#0F534A] font-mono">{reviewingUser.whatsappNumber || '—'}</p>
                </div>
              </div>

              {/* ID Proofs Preview Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Govt ID */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-headline font-black text-xs uppercase text-[#0F534A]">
                      1. {reviewingUser.govtDocType || 'Government ID'} Proof
                    </h4>
                    {reviewingUser.govtDocUrl && (
                      <a
                        href={reviewingUser.govtDocUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-headline font-black uppercase text-[#FE4E1A] hover:underline inline-flex items-center gap-1"
                      >
                        Open Full Scan <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="border-3 border-[#121316] shadow-[3px_3px_0_#121316] bg-gray-100 h-52 overflow-hidden flex items-center justify-center p-2">
                    {reviewingUser.govtDocUrl ? (
                      <img
                        src={reviewingUser.govtDocUrl}
                        alt="Government ID"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-4 text-xs text-gray-400 font-bold">
                        No Government ID scan uploaded
                      </div>
                    )}
                  </div>
                </div>

                {/* College ID */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-headline font-black text-xs uppercase text-[#0F534A]">
                      2. College ID Card / University Proof
                    </h4>
                    {reviewingUser.collegeIdCardUrl && (
                      <a
                        href={reviewingUser.collegeIdCardUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-headline font-black uppercase text-[#4717AE] hover:underline inline-flex items-center gap-1"
                      >
                        Open Full Scan <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <div className="border-3 border-[#121316] shadow-[3px_3px_0_#121316] bg-gray-100 h-52 overflow-hidden flex items-center justify-center p-2">
                    {reviewingUser.collegeIdCardUrl ? (
                      <img
                        src={reviewingUser.collegeIdCardUrl}
                        alt="College ID Card"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-4 text-xs text-gray-400 font-bold">
                        No College ID card uploaded
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-4 border-t-3 border-[#121316]">
                {reviewingUser.whatsappNumber && (
                  <button
                    onClick={() => handleWhatsAppContact(reviewingUser.whatsappNumber, reviewingUser.user?.name)}
                    className="inline-flex items-center gap-1.5 bg-[#9EFC5F] text-[#0F534A] px-3.5 py-2 text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316]"
                  >
                    <MessageSquare className="w-4 h-4" /> WhatsApp Student
                  </button>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setUserRejectModalOpen(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 text-xs font-headline font-black uppercase bg-[#F4002C] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316]"
                  >
                    Reject ID ✗
                  </button>

                  <button
                    onClick={() => handleApproveUserVerification(reviewingUser.id)}
                    disabled={actionLoading}
                    className="px-5 py-2 text-xs font-headline font-black uppercase bg-[#0F534A] text-white border-2 border-[#121316] shadow-[2px_2px_0_#4717AE]"
                  >
                    {actionLoading ? 'Verifying...' : 'Approve & Grant Badge ✓'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── USER VERIFICATION REJECTION MODAL ── */}
        {userRejectModalOpen && (
          <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-4 border-[#121316] shadow-[10px_10px_0_#F4002C] max-w-md w-full p-6 space-y-4">
              <div className="space-y-1 text-center">
                <div className="w-12 h-12 bg-[#F4002C] text-white border-2 border-[#121316] flex items-center justify-center mx-auto text-xl shadow-[2px_2px_0_#121316] font-black">
                  ✗
                </div>
                <h3 className="font-headline font-black text-xl text-[#121316] uppercase">
                  Reject Student Verification
                </h3>
                <p className="text-xs text-gray-600 font-medium">
                  Provide feedback explaining why the submitted ID was invalid.
                </p>
              </div>

              <div>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. ID card image is blurred, please re-upload clear photo..."
                  value={userRejectionReason}
                  onChange={(e) => setUserRejectionReason(e.target.value)}
                  className="w-full p-3 text-xs font-medium border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-[#121316]">
                <button
                  type="button"
                  onClick={() => setUserRejectModalOpen(false)}
                  className="px-4 py-2 text-xs font-headline font-black uppercase bg-gray-100 border-2 border-[#121316]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectUserVerification}
                  disabled={actionLoading || !userRejectionReason.trim()}
                  className="px-5 py-2 text-xs font-headline font-black uppercase bg-[#F4002C] text-white border-2 border-[#121316] shadow-[3px_3px_0_#121316] disabled:opacity-50"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Verification ✗'}
                </button>
              </div>
            </div>
          </div>
        )}

    </UnifiedDashboardLayout>
  );
}