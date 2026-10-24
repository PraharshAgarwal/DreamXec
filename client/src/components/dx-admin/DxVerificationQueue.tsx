import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Building2,
  User,
  ShieldCheck,
  Search,
  Filter,
  ExternalLink,
  Clock,
  Eye,
  X,
  FileCheck,
  Download,
  Maximize2,
} from 'lucide-react';
import apiRequest, { getToken } from '../../services/api';
import { resolveBackendMediaUrl } from '../../utils/apiConfig';
import { LeetCodeCardSkeleton } from '../common/LeetCodeSkeleton';

interface VerificationDocument {
  name: string;
  url: string;
  fieldName?: string;
  stageName?: string;
  size?: number;
  mimeType?: string;
}

interface SubmissionField {
  key: string;
  label: string;
  type: 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'FILE';
  value?: string;
  name?: string;
  url?: string;
  size?: number;
  mimeType?: string;
}

interface StageSubmissionItem {
  id: string;
  stageId: string;
  stageName: string;
  stageType: string;
  executionOrder?: number;
  status: string;
  createdAt: string;
  fields: SubmissionField[];
}

interface VerificationTask {
  id: string;
  verificationType: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'VERIFIED' | 'FAILED';
  evidenceUrl?: string;
  documents?: VerificationDocument[];
  stageSubmissions?: StageSubmissionItem[];
  formDetails?: Record<string, any>;
  verificationData?: any;
  assignedOrgAdminId?: string;
  createdAt: string;
  completedAt?: string;
  applicant?: {
    id?: string;
    name: string;
    email: string;
    role: string;
    organizationName: string;
    organizationType: string;
    organizationSlug: string;
  };
  organization?: {
    id: string;
    name: string;
    slug: string;
    orgType: string;
    lifecycleStatus: string;
  };
  instance?: {
    id: string;
    applicantName: string;
    applicantEmail: string;
    status: string;
    completedAt?: string;
    currentStage?: { name: string; stageType: string };
    instanceData?: any;
    submissions?: any[];
    executions?: any[];
  };
}

let verificationCache: VerificationTask[] | null = null;

export const DxVerificationQueue: React.FC = () => {
  const [verifications, setVerifications] = useState<VerificationTask[]>(verificationCache || []);
  const [loading, setLoading] = useState<boolean>(!verificationCache);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Full Inspection Modal State
  const [inspectingTask, setInspectingTask] = useState<VerificationTask | null>(null);

  // Preview Modal for Document Images / PDFs
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string } | null>(null);

  // Decision Modal State
  const [decisionModalOpen, setDecisionModalOpen] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<VerificationTask | null>(null);
  const [decisionType, setDecisionType] = useState<'VERIFIED' | 'FAILED' | 'CHANGES_REQUESTED'>(
    'VERIFIED'
  );
  const [decisionReason, setDecisionReason] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const resolveDocUrl = (url: string) => {
    return resolveBackendMediaUrl(url);
  };

  const fetchVerifications = async () => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    if (!verificationCache) {
      setLoading(true);
    }
    try {
      const res = await apiRequest<any>('/dx-admin/verifications', {
        params: filterStatus ? { status: filterStatus } : undefined,
      });
      const list = res.data?.verifications || [];
      verificationCache = list;
      setVerifications(list);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, [filterStatus]);

  const handleOpenDecisionModal = (
    task: VerificationTask,
    action: 'VERIFIED' | 'FAILED' | 'CHANGES_REQUESTED'
  ) => {
    setSelectedTask(task);
    setDecisionType(action);
    setDecisionReason(
      action === 'VERIFIED'
        ? 'Institutional credentials and identity evidence verified.'
        : action === 'CHANGES_REQUESTED'
          ? 'Uploaded proof is unclear or requires additional documentation.'
          : 'Applicant credentials do not match institutional records.'
    );
    setDecisionModalOpen(true);
  };

  const handleDecisionSubmit = async () => {
    if (!selectedTask) return;
    if (
      (decisionType === 'FAILED' || decisionType === 'CHANGES_REQUESTED') &&
      !decisionReason.trim()
    ) {
      toast.error('Please provide a reason for rejection or change request');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest(`/dx-admin/verifications/${selectedTask.id}/decision`, {
        method: 'POST',
        body: JSON.stringify({
          decision: decisionType,
          reason: decisionReason,
        }),
      });

      const updatedStatus: VerificationTask['status'] =
        decisionType === 'VERIFIED' ? 'VERIFIED' : decisionType === 'FAILED' ? 'FAILED' : 'PENDING';
      const updatedVerifications = verifications.map((task) =>
        task.id === selectedTask.id ? { ...task, status: updatedStatus } : task
      );
      verificationCache = updatedVerifications;
      setVerifications(updatedVerifications);

      toast.success(
        `Verification marked as ${decisionType.toLowerCase()} and permissions updated!`
      );
      setDecisionModalOpen(false);
      setSelectedTask(null);
      setInspectingTask(null);
      fetchVerifications();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error processing decision');
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to extract and normalize all documents attached to a task
  const extractAllDocuments = (task: VerificationTask): VerificationDocument[] => {
    const docs: VerificationDocument[] = [];
    const seenUrls = new Set<string>();

    const addDoc = (name: string, url: string, stageName?: string, fieldName?: string) => {
      if (!url || typeof url !== 'string' || seenUrls.has(url)) return;
      seenUrls.add(url);
      docs.push({
        name: name || 'Verification Document',
        url: resolveDocUrl(url),
        stageName,
        fieldName,
      });
    };

    // 1. Check explicit task.documents
    if (Array.isArray(task.documents)) {
      for (const d of task.documents) {
        if (d?.url) addDoc(d.name || 'Uploaded Document', d.url, d.stageName, d.fieldName);
      }
    }

    // 2. Check stageSubmissions
    if (Array.isArray(task.stageSubmissions)) {
      for (const stage of task.stageSubmissions) {
        for (const f of stage.fields) {
          if (f.type === 'FILE' && f.url) {
            addDoc(f.name || f.label, f.url, stage.stageName, f.key);
          }
        }
      }
    }

    // 3. Check verificationData.documents
    const vDocs = task.verificationData?.documents;
    if (Array.isArray(vDocs)) {
      for (const d of vDocs) {
        if (d?.url)
          addDoc(d.name || d.fieldName || 'Document Proof', d.url, d.stageName, d.fieldName);
      }
    }

    // 4. Check evidenceUrl
    if (task.evidenceUrl) {
      addDoc('Primary ID Proof / Evidence', task.evidenceUrl, 'Primary Evidence');
    }

    return docs;
  };

  // Helper to extract structured form data key-values
  const extractFormDetails = (task: VerificationTask): Record<string, any> => {
    const details: Record<string, any> = {};

    if (task.formDetails) {
      Object.assign(details, task.formDetails);
    }

    if (task.stageSubmissions) {
      for (const sub of task.stageSubmissions) {
        for (const f of sub.fields) {
          if (f.type !== 'FILE' && f.value !== undefined) {
            details[f.label || f.key] = f.value;
          }
        }
      }
    }

    if (task.verificationData?.formDetails) {
      Object.assign(details, task.verificationData.formDetails);
    }

    return details;
  };

  const isImageFile = (url: string) => {
    if (!url) return false;
    return (
      url.startsWith('data:image') ||
      /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url) ||
      url.includes('cloudfront.net') ||
      url.includes('amazonaws.com') ||
      url.includes('cloudinary.com')
    );
  };

  const filtered = verifications.filter((v) => {
    const orgName = (v.organization?.name || v.applicant?.organizationName || '').toLowerCase();
    const applicantName = (v.applicant?.name || v.instance?.applicantName || '').toLowerCase();
    const applicantEmail = (v.applicant?.email || v.instance?.applicantEmail || '').toLowerCase();
    const role = (v.applicant?.role || '').toLowerCase();
    const type = (v.verificationType || '').toLowerCase();
    const query = searchQuery.toLowerCase();
    return (
      orgName.includes(query) ||
      applicantName.includes(query) ||
      applicantEmail.includes(query) ||
      role.includes(query) ||
      type.includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FCFBF7] p-6 border-2 border-[#121316] shadow-[4px_4px_0_#121316]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 bg-[#0F534A] text-white flex items-center justify-center border-2 border-[#121316] shadow-[2px_2px_0_#121316]">
              <ShieldCheck className="w-5 h-5 text-[#9EFC5F]" />
            </span>
            <h2 className="text-lg font-headline font-black uppercase text-[#121316] tracking-wide">
              Verification Tasks &amp; Evidence Audit Queue
            </h2>
          </div>
          <p className="text-xs text-gray-600 mt-1 font-medium">
            Inspect applicant documents, evaluate submitted proofs, and approve or reject onboarding
            roles.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search applicant, role, org..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border-2 border-[#121316] text-[#121316] placeholder-gray-400 text-xs font-bold focus:outline-none focus:border-[#FE4E1A] shadow-[2px_2px_0_#121316]"
            />
          </div>

          <div className="flex items-center gap-2 bg-white px-3 py-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316]">
            <Filter className="w-3.5 h-3.5 text-[#0F534A]" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-transparent text-xs font-headline font-black text-[#121316] focus:outline-none cursor-pointer uppercase"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="VERIFIED">Verified / Approved</option>
              <option value="FAILED">Failed / Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="space-y-4">
          <LeetCodeCardSkeleton />
          <LeetCodeCardSkeleton />
          <LeetCodeCardSkeleton />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border-2 border-dashed border-[#121316] p-8 shadow-[3px_3px_0_#121316]">
          <ShieldCheck className="w-12 h-12 text-[#0F534A] mx-auto mb-3" />
          <h3 className="text-base font-headline font-black text-[#121316] uppercase">
            No Verification Tasks Found
          </h3>
          <p className="text-gray-500 text-xs mt-1">
            There are no pending or matching onboarding verification records in queue.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((task) => {
            const allDocs = extractAllDocuments(task);
            const formDetails = extractFormDetails(task);
            const detailKeys = Object.keys(formDetails);
            const role =
              task.applicant?.role || task.instance?.instanceData?.selectedRole || 'ORG_ADMIN';

            return (
              <div
                key={task.id}
                className="bg-white border-2 border-[#121316] p-5 shadow-[4px_4px_0_#121316] flex flex-col justify-between gap-4 hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
              >
                <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                  <div className="space-y-3 flex-1 min-w-0">
                    {/* Header Badges */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="px-3 py-1 bg-[#0F534A] text-white text-xs font-headline font-black border border-[#121316] uppercase tracking-wider shadow-[1px_1px_0_#121316]">
                        {task.verificationType || 'MANUAL_REVIEW'}
                      </span>

                      <span className="px-2.5 py-0.5 bg-[#FE4E1A] text-white text-[11px] font-headline font-black border border-[#121316] uppercase tracking-wider shadow-[1px_1px_0_#121316]">
                        Role: {role.replace(/_/g, ' ')}
                      </span>

                      {allDocs.length > 0 && (
                        <span className="px-2.5 py-0.5 bg-[#FFDD33] text-[#121316] text-[11px] font-headline font-black border border-[#121316] flex items-center gap-1 shadow-[1px_1px_0_#121316]">
                          <FileCheck className="w-3.5 h-3.5 text-[#0F534A]" /> {allDocs.length}{' '}
                          Document{allDocs.length > 1 ? 's' : ''} Attached
                        </span>
                      )}

                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-headline font-black border border-[#121316] shadow-[1px_1px_0_#121316] ${
                          task.status === 'VERIFIED'
                            ? 'bg-[#9EFC5F] text-[#121316]'
                            : task.status === 'FAILED'
                              ? 'bg-[#F4002C] text-white'
                              : 'bg-[#FFDD33] text-[#121316]'
                        }`}
                      >
                        {task.status}
                      </span>

                      <span className="text-[11px] text-gray-500 flex items-center gap-1 font-mono font-bold">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(task.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Applicant & Org Info */}
                    <div className="flex items-center gap-4 text-xs text-[#121316] pt-1 flex-wrap">
                      <span className="flex items-center gap-1.5 font-headline font-black text-sm text-[#0F534A]">
                        <Building2 className="w-4 h-4 text-[#FE4E1A]" />
                        {task.organization?.name || task.applicant?.organizationName || 'N/A'}
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 border border-gray-300 font-mono">
                          {task.organization?.orgType ||
                            task.applicant?.organizationType ||
                            'COLLEGE'}
                        </span>
                      </span>

                      <span className="flex items-center gap-1.5 font-bold text-xs text-[#121316]">
                        <User className="w-4 h-4 text-[#FE4E1A]" />
                        {task.applicant?.name ||
                          task.instance?.applicantName ||
                          'Onboarding User'}{' '}
                        (
                        {task.applicant?.email ||
                          task.instance?.applicantEmail ||
                          'onboarding@user.com'}
                        )
                      </span>
                    </div>

                    {/* Quick Summary of Submitted Details */}
                    {detailKeys.length > 0 && (
                      <div className="bg-[#FCFBF7] border border-[#121316] p-3 space-y-1.5">
                        <div className="text-[10px] font-headline font-black uppercase text-[#0F534A] tracking-wider">
                          Key Submitted Credentials:
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                          {detailKeys.slice(0, 4).map((k) => (
                            <span
                              key={k}
                              title={String(formDetails[k])}
                              className="bg-white px-2 py-0.5 border border-gray-300 font-mono text-[11px] max-w-full whitespace-normal [overflow-wrap:anywhere]"
                            >
                              <strong className="text-gray-600">{k}:</strong>{' '}
                              {String(formDetails[k])}
                            </span>
                          ))}
                          {detailKeys.length > 4 && (
                            <span className="text-[11px] text-gray-500 font-bold self-center">
                              +{detailKeys.length - 4} more fields
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Document Proofs Previews */}
                    {allDocs.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1">
                        {allDocs.map((doc, idx) => (
                          <div
                            key={idx}
                            className="inline-flex items-center gap-1.5 text-xs bg-white text-[#121316] font-bold px-2.5 py-1 border-2 border-[#121316] shadow-[2px_2px_0_#121316]"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#FE4E1A]" />
                            <span className="max-w-[180px] truncate">{doc.name}</span>
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="text-[#0F534A] hover:text-[#FE4E1A] p-0.5 cursor-pointer ml-1"
                              title="Preview Document"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-gray-500 hover:text-[#121316] p-0.5 cursor-pointer"
                              title="Open in new tab"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Actions Deck */}
                <div className="flex items-center justify-between border-t-2 border-gray-100 pt-3 flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectingTask(task)}
                    className="px-4 py-2.5 bg-[#4717AE] hover:bg-[#FE4E1A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] transition-all flex items-center gap-1.5 cursor-pointer shadow-[3px_3px_0_#121316]"
                  >
                    <Eye className="w-4 h-4 text-[#9EFC5F]" /> View Details &amp; Proofs →
                  </button>

                  {task.status === 'VERIFIED' || task.status === 'FAILED' ? (
                    <span
                      className={`px-3 py-2 font-headline font-black text-xs uppercase border-2 border-[#121316] flex items-center gap-1.5 shadow-[2px_2px_0_#121316] ${
                        task.status === 'VERIFIED'
                          ? 'bg-[#9EFC5F] text-[#121316]'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {task.status === 'VERIFIED' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      {task.status === 'VERIFIED' ? 'Verified' : 'Rejected'}
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenDecisionModal(task, 'VERIFIED')}
                        className="px-4 py-2 bg-[#0F534A] hover:bg-[#0F534A]/90 text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] transition-all flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0_#121316]"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#9EFC5F]" /> Approve Role
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDecisionModal(task, 'CHANGES_REQUESTED')}
                        className="px-3 py-2 bg-white hover:bg-gray-100 text-[#121316] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] transition-all flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0_#121316]"
                      >
                        <AlertCircle className="w-4 h-4 text-[#FE4E1A]" /> Request Info
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenDecisionModal(task, 'FAILED')}
                        className="px-3 py-2 bg-[#F4002C] hover:bg-red-700 text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] transition-all flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0_#121316]"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          1. FULL INSPECTION MODAL (Detailed Submission Dossier)
      ───────────────────────────────────────────────────────────── */}
      {inspectingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#FCFBF7] border-3 border-[#121316] w-full max-w-4xl p-6 space-y-6 shadow-[8px_8px_0_#121316] max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b-2 border-[#121316] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 bg-[#FE4E1A] text-white flex items-center justify-center border-2 border-[#121316] shadow-[2px_2px_0_#121316]">
                    <FileText className="w-4 h-4" />
                  </span>
                  <h3 className="text-base font-headline font-black uppercase text-[#121316]">
                    Application Inspection &amp; Verification Dossier
                  </h3>
                </div>
                <p className="text-xs text-gray-600 mt-1 font-medium">
                  Review complete applicant details, submitted credentials, and uploaded document
                  evidence.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setInspectingTask(null)}
                className="p-1.5 bg-white border-2 border-[#121316] text-gray-500 hover:text-[#F4002C] hover:bg-gray-100 transition cursor-pointer shadow-[2px_2px_0_#121316]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Applicant & Organization Snapshot */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 bg-white p-4 border-2 border-[#121316] shadow-[2px_2px_0_#121316]">
              <div>
                <span className="text-[10px] font-headline font-black uppercase text-gray-400 block">
                  Applicant Name
                </span>
                <span className="text-xs font-headline font-black text-[#121316]">
                  {inspectingTask.applicant?.name ||
                    inspectingTask.instance?.applicantName ||
                    'Onboarding User'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-headline font-black uppercase text-gray-400 block">
                  Official Email
                </span>
                <span className="text-xs font-mono font-bold text-[#0F534A]">
                  {inspectingTask.applicant?.email ||
                    inspectingTask.instance?.applicantEmail ||
                    'onboarding@user.com'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-headline font-black uppercase text-gray-400 block">
                  Target Role
                </span>
                <span className="text-xs font-headline font-black text-[#FE4E1A]">
                  {(
                    inspectingTask.applicant?.role ||
                    inspectingTask.instance?.instanceData?.selectedRole ||
                    'ORG_ADMIN'
                  ).replace(/_/g, ' ')}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-headline font-black uppercase text-gray-400 block">
                  Organization
                </span>
                <span className="text-xs font-headline font-black text-[#0F534A]">
                  {inspectingTask.organization?.name ||
                    inspectingTask.applicant?.organizationName ||
                    'N/A'}{' '}
                  (
                  {inspectingTask.organization?.orgType ||
                    inspectingTask.applicant?.organizationType ||
                    'COLLEGE'}
                  )
                </span>
              </div>
              <div>
                <span className="text-[10px] font-headline font-black uppercase text-gray-400 block">
                  Verification Status
                </span>
                <span className="text-xs font-headline font-black text-[#0F534A]">
                  {inspectingTask.status}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-headline font-black uppercase text-gray-400 block">
                  Submission Date
                </span>
                <span className="text-xs font-mono font-bold text-gray-600">
                  {new Date(inspectingTask.createdAt).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Stage-by-Stage Submissions Breakdown */}
            {inspectingTask.stageSubmissions && inspectingTask.stageSubmissions.length > 0 ? (
              <div className="space-y-4">
                <h4 className="text-xs font-headline font-black uppercase text-[#0F534A] flex items-center justify-between">
                  <span>
                    📋 Stage-by-Stage Submissions ({inspectingTask.stageSubmissions.length})
                  </span>
                </h4>

                {inspectingTask.stageSubmissions.map((sub, idx) => (
                  <div
                    key={sub.id || idx}
                    className="bg-white border-2 border-[#121316] p-4 shadow-[2px_2px_0_#121316] space-y-3"
                  >
                    <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 bg-[#0F534A] text-white text-[10px] font-headline font-black flex items-center justify-center border border-[#121316]">
                          {idx + 1}
                        </span>
                        <h5 className="text-xs font-headline font-black text-[#121316] uppercase">
                          {sub.stageName}{' '}
                          <span className="text-[10px] font-mono text-gray-500 font-normal">
                            ({sub.stageType})
                          </span>
                        </h5>
                      </div>
                      <span className="text-[10px] font-mono text-gray-500 font-bold">
                        {new Date(sub.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Stage Fields Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {sub.fields.map((f, fIdx) => (
                        <div
                          key={fIdx}
                          className="p-3 bg-[#FCFBF7] border border-gray-200 space-y-1"
                        >
                          <span className="text-[10px] font-headline font-black uppercase text-gray-500 block">
                            {f.label}
                          </span>

                          {f.type === 'FILE' && f.url ? (
                            <div className="space-y-2 pt-1">
                              <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-[#FE4E1A] shrink-0" />
                                <span
                                  className="text-xs font-bold text-[#121316] truncate max-w-[170px]"
                                  title={f.name || f.label}
                                >
                                  {f.name || f.label}
                                </span>
                              </div>

                              {isImageFile(f.url) && (
                                <div
                                  onClick={() =>
                                    setPreviewDoc({
                                      name: f.name || f.label,
                                      url: resolveDocUrl(f.url!),
                                    })
                                  }
                                  className="relative h-24 bg-gray-100 border border-[#121316] overflow-hidden cursor-pointer group flex items-center justify-center"
                                >
                                  <img
                                    src={resolveDocUrl(f.url)}
                                    alt={f.name || f.label}
                                    className="w-full h-full object-contain group-hover:scale-105 transition duration-200"
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-headline font-black text-[10px] gap-1">
                                    <Maximize2 className="w-3.5 h-3.5" /> Zoom
                                  </div>
                                </div>
                              )}

                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPreviewDoc({
                                      name: f.name || f.label,
                                      url: resolveDocUrl(f.url!),
                                    })
                                  }
                                  className="px-2 py-1 bg-[#0F534A] text-white font-headline font-black text-[9px] uppercase border border-[#121316] flex items-center gap-1 cursor-pointer hover:bg-[#FE4E1A] transition"
                                >
                                  <Eye className="w-3 h-3" /> Quick View
                                </button>
                                <a
                                  href={resolveDocUrl(f.url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-2 py-1 bg-white text-[#121316] font-headline font-black text-[9px] uppercase border border-[#121316] flex items-center gap-1 hover:bg-gray-100 transition"
                                >
                                  <ExternalLink className="w-3 h-3" /> Open
                                </a>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs font-mono font-bold text-[#121316] break-words block">
                              {f.value || 'N/A'}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Fallback if stageSubmissions is not present: render all documents and formDetails */
              <div className="space-y-4">
                {/* 📁 Uploaded Documents & Evidence */}
                <div>
                  <h4 className="text-xs font-headline font-black uppercase text-[#0F534A] mb-3 flex items-center justify-between">
                    <span>📁 Uploaded Documents &amp; ID Proofs</span>
                    <span className="text-[10px] font-mono text-gray-500 font-bold">
                      {extractAllDocuments(inspectingTask).length} File(s)
                    </span>
                  </h4>

                  {extractAllDocuments(inspectingTask).length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {extractAllDocuments(inspectingTask).map((doc, idx) => (
                        <div
                          key={idx}
                          className="bg-white border-2 border-[#121316] p-3 flex flex-col justify-between gap-3 shadow-[2px_2px_0_#121316]"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 bg-amber-50 text-[#FE4E1A] flex items-center justify-center border border-[#121316] shrink-0">
                                <FileText className="w-4 h-4" />
                              </span>
                              <div>
                                <span className="text-xs font-headline font-black text-[#121316] block leading-tight">
                                  {doc.name}
                                </span>
                                {doc.stageName && (
                                  <span className="text-[10px] font-mono text-gray-500">
                                    {doc.stageName}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Image Thumbnail Preview if image format */}
                          {isImageFile(doc.url) && (
                            <div
                              onClick={() => setPreviewDoc(doc)}
                              className="relative h-32 bg-gray-100 border border-[#121316] overflow-hidden cursor-pointer group flex items-center justify-center"
                            >
                              <img
                                src={doc.url}
                                alt={doc.name}
                                className="w-full h-full object-contain group-hover:scale-105 transition duration-200"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-headline font-black text-xs gap-1">
                                <Maximize2 className="w-4 h-4" /> Click to Zoom
                              </div>
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={() => setPreviewDoc(doc)}
                              className="px-2.5 py-1 bg-[#0F534A] text-white font-headline font-black text-[10px] uppercase tracking-wider border border-[#121316] flex items-center gap-1 cursor-pointer hover:bg-[#FE4E1A] transition"
                            >
                              <Eye className="w-3 h-3" /> Quick View
                            </button>

                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-white text-[#121316] font-headline font-black text-[10px] uppercase tracking-wider border border-[#121316] flex items-center gap-1 hover:bg-gray-100 transition"
                            >
                              <ExternalLink className="w-3 h-3" /> Open in Tab
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-white border-2 border-dashed border-[#121316] text-center text-xs text-gray-500 italic">
                      No document files attached for this stage.
                    </div>
                  )}
                </div>

                {/* 📝 Complete Form Submissions */}
                <div>
                  <h4 className="text-xs font-headline font-black uppercase text-[#0F534A] mb-3">
                    📝 Complete Form Submissions Across All Stages
                  </h4>

                  {Object.keys(extractFormDetails(inspectingTask)).length > 0 ? (
                    <div className="bg-white border-2 border-[#121316] p-4 shadow-[2px_2px_0_#121316]">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(extractFormDetails(inspectingTask)).map(([key, val]) => (
                          <div key={key} className="p-2.5 bg-[#FCFBF7] border border-gray-200">
                            <span className="text-[10px] font-headline font-black uppercase text-gray-500 block mb-0.5">
                              {key.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs font-mono font-bold text-[#121316] break-words">
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-white border-2 border-dashed border-[#121316] text-center text-xs text-gray-500 italic">
                      No additional dynamic form fields recorded.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Admin Decision History Banner if already decided */}
            {inspectingTask.instance?.instanceData?.adminDecision && (
              <div className="p-4 bg-[#FFDD33]/20 border-2 border-[#121316] shadow-[2px_2px_0_#121316] space-y-1">
                <span className="text-[10px] font-headline font-black uppercase text-[#0F534A] tracking-wider block">
                  Previous Admin Review Action:
                </span>
                <p className="text-xs font-medium text-[#121316]">
                  <strong>Decision:</strong>{' '}
                  {inspectingTask.instance.instanceData.adminDecision.decision} |{' '}
                  <strong>Remarks:</strong>{' '}
                  {inspectingTask.instance.instanceData.adminDecision.reason || 'No remarks'} |{' '}
                  <span className="font-mono text-[10px] text-gray-600">
                    {new Date(
                      inspectingTask.instance.instanceData.adminDecision.decidedAt
                    ).toLocaleString()}
                  </span>
                </p>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between border-t-2 border-[#121316] pt-4 flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setInspectingTask(null)}
                className="px-4 py-2 bg-white text-[#121316] font-headline font-black text-xs uppercase border-2 border-[#121316] hover:bg-gray-100 transition cursor-pointer shadow-[2px_2px_0_#121316]"
              >
                Close Inspector
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenDecisionModal(inspectingTask, 'VERIFIED')}
                  className="px-4 py-2 bg-[#0F534A] hover:bg-[#0F534A]/90 text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] transition cursor-pointer shadow-[2px_2px_0_#121316] flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#9EFC5F]" /> Approve &amp; Activate Role
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDecisionModal(inspectingTask, 'CHANGES_REQUESTED')}
                  className="px-3 py-2 bg-[#FFDD33] text-[#121316] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] transition cursor-pointer shadow-[2px_2px_0_#121316] flex items-center gap-1.5"
                >
                  <AlertCircle className="w-4 h-4 text-[#FE4E1A]" /> Request Changes
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDecisionModal(inspectingTask, 'FAILED')}
                  className="px-3 py-2 bg-[#F4002C] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] transition cursor-pointer shadow-[2px_2px_0_#121316] flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" /> Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          2. IN-APP DOCUMENT / IMAGE FULLSCREEN PREVIEW MODAL
      ───────────────────────────────────────────────────────────── */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-white border-3 border-[#121316] w-full max-w-4xl p-5 space-y-4 shadow-[8px_8px_0_#121316] max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
              <div className="flex items-center gap-2">
                <span className="font-headline font-black text-sm uppercase text-[#121316]">
                  📄 Document Viewer: {previewDoc.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-[#FFDD33] border-2 border-[#121316] text-[#121316] text-xs font-headline font-black uppercase flex items-center gap-1 shadow-[2px_2px_0_#121316]"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white border-2 border-[#121316] text-[#121316] text-xs font-headline font-black uppercase flex items-center gap-1 shadow-[2px_2px_0_#121316]"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Open Tab
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 bg-white border-2 border-[#121316] text-gray-600 hover:text-red-600 transition cursor-pointer shadow-[2px_2px_0_#121316]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-100 border-2 border-[#121316] flex items-center justify-center p-2 min-h-[350px]">
              {isImageFile(previewDoc.url) ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="max-h-[65vh] max-w-full object-contain"
                />
              ) : previewDoc.url.endsWith('.pdf') || previewDoc.url.includes('/pdf/') ? (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.name}
                  className="w-full h-[65vh] border-0"
                />
              ) : (
                <iframe
                  src={`https://docs.google.com/gview?url=${encodeURIComponent(previewDoc.url)}&embedded=true`}
                  title={previewDoc.name}
                  className="w-full h-[65vh] border-0"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. DECISION CONFIRMATION MODAL
      ───────────────────────────────────────────────────────────── */}
      {decisionModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#FCFBF7] border-3 border-[#121316] rounded-none w-full max-w-xl p-6 space-y-5 shadow-[8px_8px_0_#121316] max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-headline font-black text-[#121316] uppercase flex items-center gap-2 border-b-2 border-[#121316] pb-3">
              {decisionType === 'VERIFIED' && <CheckCircle2 className="w-5 h-5 text-[#0F534A]" />}
              {decisionType === 'FAILED' && <XCircle className="w-5 h-5 text-[#F4002C]" />}
              {decisionType === 'CHANGES_REQUESTED' && (
                <AlertCircle className="w-5 h-5 text-[#FE4E1A]" />
              )}
              Confirm Verification Decision ({decisionType})
            </h3>

            <div className="bg-white border-2 border-[#121316] p-4 text-xs space-y-2 shadow-[2px_2px_0_#121316]">
              <p>
                <strong className="font-headline font-black text-[#0F534A] uppercase">
                  Organization:
                </strong>{' '}
                {selectedTask.organization?.name || 'N/A'}
              </p>
              <p>
                <strong className="font-headline font-black text-[#0F534A] uppercase">
                  Applicant:
                </strong>{' '}
                {selectedTask.instance?.applicantName} ({selectedTask.instance?.applicantEmail})
              </p>
              <p>
                <strong className="font-headline font-black text-[#0F534A] uppercase">
                  Verification Stage:
                </strong>{' '}
                {selectedTask.verificationType}
              </p>
            </div>

            <div>
              <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1.5">
                Official Review Remarks / Decision Notes{' '}
                {decisionType !== 'VERIFIED' && <span className="text-[#F4002C]">*</span>}
              </label>
              <textarea
                rows={3}
                placeholder="Provide official review remarks or decision notes..."
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
                  decisionType === 'VERIFIED'
                    ? 'bg-[#0F534A] hover:bg-[#0F534A]/90'
                    : decisionType === 'FAILED'
                      ? 'bg-[#F4002C] hover:bg-red-700'
                      : 'bg-[#FE4E1A] hover:bg-[#FE4E1A]/90'
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

export default DxVerificationQueue;
