import React, { useEffect, useState } from 'react';
import { getProjectFullDetails, verifyUserProject } from '../../services/adminService';
import AdminNotesPanel from './AdminNotesPanel';
import {
  Award,
  DollarSign,
  X,
  Check,
  Eye,
  Users,
  FileText,
  Building2,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Clock,
  Landmark,
  FileCode,
  Video,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import UserAvatar from '../common/UserAvatar';

interface Props {
  projectId: string;
  projectType: 'user' | 'donor';
  onClose: () => void;
}

export default function AdminProjectDetails({ projectId, projectType, onClose }: Props) {
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDetails();
  }, [projectId]);

  const fetchDetails = async () => {
    try {
      const res = await getProjectFullDetails(projectType, projectId);
      setProject(res.data?.details || res.data?.project || res.data?.campaign);
    } catch (error) {
      console.error('Failed to fetch project details:', error);
      toast.error('Failed to load project details.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!project) return;
    setActionLoading(true);
    const toastId = toast.loading('Approving and publishing campaign...');
    try {
      await verifyUserProject(project.id, { status: 'APPROVED' });
      toast.success('🎉 Campaign verified and set to LIVE!', { id: toastId });
      fetchDetails();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to approve campaign', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!project) return;
    const reason = window.prompt('Enter rejection / revision reason:');
    if (!reason?.trim()) return;

    setActionLoading(true);
    const toastId = toast.loading('Submitting rejection feedback...');
    try {
      await verifyUserProject(project.id, { status: 'REJECTED', reason: reason.trim() });
      toast.success('Campaign rejected with feedback recorded.', { id: toastId });
      fetchDetails();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to reject campaign', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  if (!projectId) return null;

  const creatorName = project?.student?.name || project?.user?.name || project?.studentName || 'Student Creator';
  const creatorEmail = project?.student?.email || project?.user?.email || 'N/A';
  const creatorAvatar = project?.student?.avatar || project?.user?.avatar || null;
  const institutionName = project?.tenant?.name || 'NIT Kurukshetra';
  const departmentName = project?.department?.name || null;

  const teamRoster = Array.isArray(project?.members) && project.members.length > 0
    ? project.members
    : Array.isArray(project?.teamMembers) && project.teamMembers.length > 0
    ? project.teamMembers.map((tm: any, idx: number) => ({
        id: `tm_${idx}`,
        title: tm.role || tm.title || 'Team Member',
        role: tm.role || 'MEMBER',
        user: { name: tm.name, email: tm.email || '', profilePicture: tm.avatarUrl || tm.image || null },
      }))
    : [];

  const beneficiary = project?.beneficiaryDetails || null;
  const isPending = project?.status === 'PENDING' || project?.status === 'PENDING_VERIFICATION' || project?.status === 'SUBMITTED';

  return (
    <div
      className="fixed inset-0 z-[9999] flex justify-center items-center p-4 bg-black/75 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-[#FCFBF7] w-full max-w-6xl border-4 border-[#121316] shadow-[10px_10px_0_#FE4E1A] overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER BANNER ── */}
        <div className="bg-[#0F534A] border-b-3 border-[#121316] p-6 flex justify-between items-start text-white">
          <div className="space-y-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="bg-[#FFDD33] text-[#121316] text-[10px] font-headline font-black uppercase px-2 py-0.5 border border-[#121316]">
                Maker-Checker Inspection
              </span>
              <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight">
                {project?.title || 'Campaign Deep Inspection'}
              </h2>
              {project && (
                <span
                  className={`px-3 py-0.5 text-[10px] font-headline font-black uppercase border-2 border-[#121316] ${
                    project.status === 'APPROVED' || project.status === 'LIVE'
                      ? 'bg-[#9EFC5F] text-[#0F534A]'
                      : project.status === 'REJECTED'
                      ? 'bg-[#F4002C] text-white'
                      : 'bg-[#FFDD33] text-[#121316]'
                  }`}
                >
                  {project.status}
                </span>
              )}
            </div>
            <p className="text-[#FFDD33] text-xs font-mono">
              ID: {projectId} • Slug: {project?.slug || '—'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-[#FFDD33] text-[#121316] hover:bg-[#FE4E1A] hover:text-white p-1.5 border-2 border-[#121316] transition-all cursor-pointer shadow-[2px_2px_0_#121316]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading || !project ? (
          <div className="p-16 text-center text-[#0F534A] font-headline font-black text-xl animate-pulse uppercase">
            Loading Comprehensive Campaign Specifications...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Top Action Bar if Pending */}
            {isPending && (
              <div className="p-4 bg-[#FFF9F2] border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-bold text-[#121316]">
                  <AlertTriangle className="w-5 h-5 text-[#FE4E1A]" />
                  <span>Action Required: This campaign proposal is pending administrative review.</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    disabled={actionLoading}
                    onClick={handleReject}
                    className="px-4 py-2 bg-[#F4002C] hover:bg-[#c90024] text-white font-headline font-black text-xs uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316] cursor-pointer"
                  >
                    Reject / Revisions ✗
                  </button>
                  <button
                    disabled={actionLoading}
                    onClick={handleApprove}
                    className="px-5 py-2 bg-[#0F534A] hover:bg-[#0b3d36] text-white font-headline font-black text-xs uppercase border-2 border-[#121316] shadow-[2px_2px_0_#FE4E1A] cursor-pointer"
                  >
                    Approve &amp; Go Live ✓
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* ── LEFT & CENTER COLS (Main Specifications) ── */}
              <div className="lg:col-span-2 space-y-6">
                {/* 1. CREATOR & INSTITUTION CARD */}
                <div className="bg-white p-5 border-3 border-[#121316] shadow-[4px_4px_0_#121316] space-y-4">
                  <h3 className="font-headline font-black text-xs uppercase text-[#0F534A] flex items-center gap-1.5 border-b-2 border-gray-100 pb-2">
                    <UserCheck className="w-4 h-4 text-[#FE4E1A]" /> Project Creator &amp; Institutional Governance
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center gap-3">
                      <UserAvatar
                        user={project?.student || project?.user}
                        src={creatorAvatar}
                        name={creatorName}
                        username={project?.student?.username || project?.user?.username}
                        size="lg"
                        shape="circle"
                      />
                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-500 block">Lead Student Creator</span>
                        <p className="font-headline font-black text-sm text-[#121316]">{creatorName}</p>
                        <p className="font-mono text-gray-600 text-[11px]">{creatorEmail}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-[#FCFBF7] p-3 border-2 border-[#121316]">
                      <Building2 className="w-5 h-5 text-[#0F534A] mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-500 block">Affiliated Institution</span>
                        <p className="font-headline font-black text-xs text-[#0F534A]">{institutionName}</p>
                        {departmentName && (
                          <p className="text-[11px] font-bold text-gray-700 mt-0.5">Dept: {departmentName}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. TEAM MEMBERS ROSTER */}
                <div className="bg-white p-5 border-3 border-[#121316] shadow-[4px_4px_0_#121316] space-y-3">
                  <h3 className="font-headline font-black text-xs uppercase text-[#0F534A] flex items-center justify-between border-b-2 border-gray-100 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-[#FE4E1A]" /> Campaign Team Collaborators ({teamRoster.length})
                    </span>
                    <span className="text-[10px] font-mono uppercase text-gray-500 font-bold">
                      Type: {project.campaignType || 'INDIVIDUAL'}
                    </span>
                  </h3>

                  {teamRoster.length === 0 ? (
                    <p className="text-xs text-gray-500 font-medium italic">
                      Individual proposal — no additional team members added.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {teamRoster.map((m: any, idx: number) => {
                        const mName = m.user?.name || m.name || 'Member';
                        const mRole = m.title || m.role || 'Contributor';
                        const mEmail = m.user?.email || m.email || '';
                        const mAvatar = m.user?.profilePicture || null;
                        return (
                          <div
                            key={m.id || idx}
                            className="flex items-center gap-3 p-3 bg-[#FCFBF7] border-2 border-[#121316] shadow-[2px_2px_0_#121316]"
                          >
                            <UserAvatar
                              user={m.user}
                              src={mAvatar}
                              name={mName}
                              username={m.user?.username}
                              size="sm"
                              shape="circle"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="font-headline font-black text-xs text-[#121316] truncate">{mName}</p>
                              <p className="text-[10px] font-bold text-[#FE4E1A] uppercase truncate">{mRole}</p>
                              {mEmail && <p className="text-[10px] font-mono text-gray-500 truncate">{mEmail}</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. PITCH STORY & MEDIA */}
                <div className="bg-white p-5 border-3 border-[#121316] shadow-[4px_4px_0_#121316] space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {(project.coverImageUrl || project.imageUrl) && (
                      <img
                        src={project.coverImageUrl || project.imageUrl}
                        alt="Cover"
                        className="w-full sm:w-48 h-32 object-cover border-2 border-[#121316] shadow-[2px_2px_0_#121316]"
                      />
                    )}
                    <div className="flex-1 space-y-2">
                      <h3 className="font-headline font-black text-xs uppercase text-[#0F534A] flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-[#FE4E1A]" /> Proposal Executive Summary
                      </h3>
                      <p className="text-xs text-gray-700 font-medium leading-relaxed whitespace-pre-line">
                        {project.description || project.shortDescription}
                      </p>
                    </div>
                  </div>

                  {/* External Media Links */}
                  {(project.presentationDeckUrl || project.videoUrl) && (
                    <div className="pt-3 border-t border-gray-200 flex flex-wrap gap-3">
                      {project.presentationDeckUrl && (
                        <a
                          href={project.presentationDeckUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFDD33] text-[#121316] font-headline font-black text-xs uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#FE4E1A] hover:text-white transition-all"
                        >
                          <FileCode className="w-4 h-4" /> View Pitch Deck <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {project.videoUrl && (
                        <a
                          href={project.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FCFBF7] text-[#121316] font-headline font-black text-xs uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-gray-100 transition-all"
                        >
                          <Video className="w-4 h-4 text-[#FE4E1A]" /> Watch Demo Video <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* 4. COMPREHENSIVE MILESTONES ROADMAP */}
                <div className="bg-white p-5 border-3 border-[#121316] shadow-[4px_4px_0_#121316] space-y-4">
                  <h3 className="font-headline font-black text-xs uppercase text-[#0F534A] flex items-center justify-between border-b-2 border-gray-100 pb-2">
                    <span className="flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#FE4E1A]" /> Milestone Disbursement Tranches ({project.milestones?.length || 0})
                    </span>
                    <span className="text-xs font-mono font-bold text-[#0F534A]">
                      Total: ₹{(Number(project.targetAmount || project.goalAmount || 0)).toLocaleString('en-IN')}
                    </span>
                  </h3>

                  <div className="space-y-4">
                    {(project.milestones || []).map((m: any, idx: number) => {
                      const criteriaList = Array.isArray(m.acceptanceCriteria)
                        ? m.acceptanceCriteria
                        : typeof m.acceptanceCriteria === 'string'
                        ? [m.acceptanceCriteria]
                        : [];
                      const evidenceList = Array.isArray(m.requiredEvidenceTypes) ? m.requiredEvidenceTypes : [];
                      const submissions = Array.isArray(m.submissions) ? m.submissions : [];

                      return (
                        <div
                          key={m.id || idx}
                          className="p-4 bg-[#FCFBF7] border-2 border-[#121316] shadow-[3px_3px_0_#121316] space-y-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-200 pb-2">
                            <div>
                              <span className="font-headline font-black text-sm text-[#0F534A] uppercase block">
                                Tranche #{m.sequenceOrder || idx + 1}: {m.title}
                              </span>
                              <div className="flex items-center gap-3 text-[11px] text-gray-500 font-bold mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" /> Duration: {m.durationDays || 30} Days
                                </span>
                                {m.deadline && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" /> Deadline: {new Date(m.deadline).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-black text-sm text-[#FE4E1A] bg-white px-2.5 py-1 border border-[#121316]">
                                ₹{(Number(m.targetAmount ?? m.budget ?? m.amount ?? 0)).toLocaleString('en-IN')}
                              </span>
                              <span
                                className={`text-[9px] px-2 py-0.5 font-headline font-black uppercase border-2 border-[#121316] ${
                                  m.status === 'COMPLETED' || m.status === 'APPROVED'
                                    ? 'bg-[#9EFC5F] text-[#0F534A]'
                                    : m.status === 'IN_PROGRESS' || m.status === 'ACTIVE'
                                    ? 'bg-[#FFDD33] text-[#121316]'
                                    : 'bg-gray-200 text-gray-700'
                                }`}
                              >
                                {m.status}
                              </span>
                            </div>
                          </div>

                          {m.description && (
                            <p className="text-xs text-gray-700 font-medium">{m.description}</p>
                          )}

                          {/* Acceptance Criteria */}
                          {criteriaList.length > 0 && (
                            <div className="space-y-1 bg-white p-3 border border-[#121316]">
                              <span className="text-[10px] font-headline font-black uppercase text-[#0F534A] block">
                                Verification Acceptance Criteria:
                              </span>
                              <ul className="space-y-1">
                                {criteriaList.map((crit: any, cIdx: number) => (
                                  <li key={cIdx} className="text-xs text-gray-700 flex items-start gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#0F534A] mt-0.5 flex-shrink-0" />
                                    <span>{typeof crit === 'string' ? crit : JSON.stringify(crit)}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Required Evidence Types */}
                          {evidenceList.length > 0 && (
                            <div className="flex items-center gap-2 flex-wrap text-[10px]">
                              <span className="font-bold uppercase text-gray-500">Required Evidence:</span>
                              {evidenceList.map((ev: string, eIdx: number) => (
                                <span
                                  key={eIdx}
                                  className="bg-gray-100 text-gray-800 px-2 py-0.5 font-mono font-bold border border-gray-300"
                                >
                                  {ev}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Submission Proofs */}
                          {submissions.length > 0 && (
                            <div className="pt-2 border-t border-gray-200 space-y-2">
                              <span className="text-[10px] font-headline font-black uppercase text-[#FE4E1A] block">
                                Submission History &amp; Proofs ({submissions.length}):
                              </span>
                              {submissions.map((sub: any, sIdx: number) => (
                                <div key={sub.id || sIdx} className="p-2 bg-white border border-gray-300 text-xs space-y-1">
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold">Attempt #{sub.submissionNumber || sIdx + 1}</span>
                                    <span className="font-mono text-[10px] uppercase font-bold px-1.5 py-0.5 bg-gray-100">
                                      {sub.status}
                                    </span>
                                  </div>
                                  {sub.studentNotes && (
                                    <p className="text-gray-600 text-[11px] italic">"{sub.studentNotes}"</p>
                                  )}
                                  {sub.evidenceDoc && (
                                    <p className="text-[11px] font-mono text-[#0F534A]">
                                      📄 Attached: {sub.evidenceDoc.name}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ── RIGHT COL: Governance, Escrow KYC & Notes ── */}
              <div className="lg:col-span-1 space-y-6">
                {/* 1. FINANCIAL KPI SUMMARY */}
                <div className="bg-white p-4 border-3 border-[#121316] shadow-[3px_3px_0_#121316] space-y-3">
                  <h3 className="font-headline font-black text-xs uppercase text-[#0F534A] border-b border-gray-200 pb-1">
                    Financial Specifications
                  </h3>
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-[#FCFBF7] border border-[#121316]">
                      <span className="text-[10px] font-bold text-gray-500 uppercase block">Target Goal</span>
                      <p className="font-headline font-black text-sm text-[#0F534A]">
                        ₹{(Number(project.targetAmount || project.goalAmount || 0)).toLocaleString('en-IN')}
                      </p>
                    </div>
                    <div className="p-3 bg-[#FFF9F2] border border-[#121316]">
                      <span className="text-[10px] font-bold text-[#FE4E1A] uppercase block">Current Raised</span>
                      <p className="font-headline font-black text-sm text-[#FE4E1A]">
                        ₹{(Number(project.currentRaisedAmount || project.amountRaised || 0)).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs space-y-1 pt-1">
                    <p><span className="text-gray-500 font-bold uppercase text-[10px]">Category:</span> <span className="font-bold text-[#0F534A]">{project.category || 'INNOVATION'}</span></p>
                    <p><span className="text-gray-500 font-bold uppercase text-[10px]">Stage:</span> <span className="font-bold">{project.stage || 'DISCOVERY'}</span></p>
                    <p><span className="text-gray-500 font-bold uppercase text-[10px]">Backers:</span> <span className="font-bold">{project.donorCount || 0}</span></p>
                  </div>
                </div>

                {/* 2. BENEFICIARY ESCROW & BANKING KYC */}
                <div className="bg-white p-4 border-3 border-[#121316] shadow-[3px_3px_0_#121316] space-y-3">
                  <h3 className="font-headline font-black text-xs uppercase text-[#0F534A] flex items-center gap-1.5 border-b border-gray-200 pb-1">
                    <Landmark className="w-4 h-4 text-[#FE4E1A]" /> Escrow Banking &amp; KYC
                  </h3>

                  {beneficiary ? (
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-500 block">Account Holder</span>
                        <p className="font-headline font-black text-[#121316]">{beneficiary.accountHolderName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase text-gray-500 block">Bank Account #</span>
                        <p className="font-mono font-bold text-gray-800">{beneficiary.bankAccountNumber || 'N/A'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase text-gray-500 block">IFSC Code</span>
                          <p className="font-mono font-bold text-gray-800">{beneficiary.ifscCode || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase text-gray-500 block">UPI ID</span>
                          <p className="font-mono font-bold text-gray-800">{beneficiary.upiId || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-gray-100 flex items-center gap-1 text-[11px] text-[#0F534A] font-bold">
                        <ShieldCheck className="w-4 h-4 text-[#9EFC5F]" /> Bank details logged for disbursement
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 font-medium italic">
                      No direct beneficiary banking record logged.
                    </p>
                  )}
                </div>

                {/* 3. REJECTION REASON DISPLAY */}
                {project.rejectionReason && (
                  <div className="p-3 bg-[#FEF2F2] border-2 border-[#F4002C] text-[#F4002C] text-xs space-y-1">
                    <strong className="block text-[10px] uppercase font-black">Official Rejection Feedback:</strong>
                    <p>{project.rejectionReason}</p>
                  </div>
                )}

                {/* 4. ADMIN NOTES PANEL */}
                <div className="min-h-[260px]">
                  <AdminNotesPanel
                    entityType={projectType === 'user' ? 'project' : 'donor_project'}
                    entityId={project.id}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}