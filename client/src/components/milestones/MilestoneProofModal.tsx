import React, { useState } from 'react';
import YouTube from 'react-youtube';
import toast from 'react-hot-toast';
import {
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Video,
  ExternalLink,
  Trash2,
  Sparkles,
  X,
  FileCheck,
  Send,
  Loader2,
} from 'lucide-react';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { campaignService } from '../../services/campaignService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  milestone: any;
  campaignId: string;
  onSuccess?: () => void;
  initialMode?: 'submit' | 'view';
}

const getYoutubeId = (url?: string) => {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

const getEmbedUrl = (url?: string) => {
  if (!url) return null;
  if (url.includes('drive.google.com')) {
    const fileIdMatch = url.match(/\/d\/(.*?)(\/|$)/);
    if (fileIdMatch?.[1]) return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`;
  }
  if (url.endsWith('.pdf')) return url;
  return null;
};

export default function MilestoneProofModal({
  isOpen,
  onClose,
  milestone,
  campaignId,
  onSuccess,
  initialMode,
}: Props) {
  const latestSubmission =
    milestone?.submissions?.find((s: any) => s.status === 'APPROVED') ||
    milestone?.submissions?.[0];

  const milestoneStatus = (milestone?.status || '').toUpperCase();
  const hasPendingOrApprovedSubmission =
    latestSubmission && (latestSubmission.status === 'PENDING_REVIEW' || latestSubmission.status === 'APPROVED');

  const defaultMode =
    initialMode ||
    (hasPendingOrApprovedSubmission ? 'view' : 'submit');

  const [mode, setMode] = useState<'submit' | 'view'>(defaultMode);

  // Form State
  const [narrative, setNarrative] = useState('');
  const [demoUrl, setDemoUrl] = useState('');
  const [checkedCriteria, setCheckedCriteria] = useState<string[]>([]);
  const [uploadedDocUrls, setUploadedDocUrls] = useState<Array<{ name: string; url: string; size?: number }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cloudinary Dropzone hook
  const { uploadFile, isUploading, progress } = useCloudinaryUpload({
    folder: 'campaign-milestones-proof',
  });

  if (!isOpen || !milestone) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const res = await uploadFile(file);
        if (res?.secureUrl) {
          setUploadedDocUrls((prev) => [
            ...prev,
            { name: file.name, url: res.secureUrl, size: file.size },
          ]);
          toast.success(`Uploaded ${file.name}`);
        }
      } catch (err: any) {
        toast.error(`Failed to upload ${file.name}: ${err?.message || 'Upload error'}`);
      }
    }
  };

  const handleRemoveDoc = (index: number) => {
    setUploadedDocUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleToggleCriterion = (criterion: string) => {
    setCheckedCriteria((prev) =>
      prev.includes(criterion) ? prev.filter((c) => c !== criterion) : [...prev, criterion]
    );
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrative.trim() || narrative.trim().length < 5) {
      toast.error('Please provide a detailed completion summary (minimum 5 characters).');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting milestone deliverables for Maker-Checker review...');

    try {
      const mediaUrls = demoUrl.trim() ? [demoUrl.trim()] : [];
      const documentUrls = uploadedDocUrls.map((d) => d.url);

      await campaignService.submitMilestoneProof(campaignId, milestone.id, {
        studentNotes: narrative.trim(),
        narrative: narrative.trim(),
        evidenceMediaUrls: mediaUrls,
        evidenceDocumentUrls: documentUrls,
        criteriaChecklist: checkedCriteria,
      });

      toast.success('Milestone proof submitted successfully! Reviewers have been notified.', {
        id: toastId,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit milestone proof.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const mediaUrl =
    latestSubmission?.evidenceMediaUrls?.[0] ||
    latestSubmission?.mediaUrl ||
    demoUrl;
  const proofUrl =
    latestSubmission?.evidenceDocumentUrls?.[0] ||
    latestSubmission?.proofUrl ||
    latestSubmission?.evidenceDoc?.storageKey;

  const youtubeId = getYoutubeId(mediaUrl);
  const embedUrl = getEmbedUrl(proofUrl);

  const isRejected = latestSubmission?.status === 'REJECTED';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/80 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FCFBF7] w-full max-w-3xl border-4 border-[#121316] shadow-[8px_8px_0px_#121316] flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="flex items-stretch bg-[#0F534A] text-white border-b-4 border-[#121316]">
          <div className="w-3 bg-[#FE4E1A] flex-shrink-0" />
          <div className="flex-1 px-4 sm:px-6 py-3.5 sm:py-4">
            <div className="flex items-center gap-2">
              <span className="bg-[#FFDD33] text-[#121316] text-[10px] font-headline font-black px-2 py-0.5 border border-[#121316] uppercase tracking-wider">
                Tranche #{milestone.sequenceOrder || 1}
              </span>
              <p className="text-[11px] font-headline font-black text-[#9EFC5F] uppercase tracking-widest">
                Milestone Governance Portal
              </p>
            </div>
            <h2 className="text-base sm:text-lg md:text-xl font-headline font-black uppercase tracking-tight text-white mt-0.5 truncate">
              {milestone.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-12 sm:w-14 flex items-center justify-center bg-[#121316] text-white hover:bg-[#FE4E1A] transition-colors border-l-3 border-[#121316] font-black text-xl cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Toggle if submissions exist */}
        {latestSubmission && (
          <div className="flex border-b-3 border-[#121316] bg-white text-xs font-headline font-black">
            <button
              type="button"
              onClick={() => setMode('view')}
              className={`flex-1 py-2.5 px-4 text-center border-r-2 border-[#121316] transition-colors ${
                mode === 'view' ? 'bg-[#FFDD33] text-[#121316]' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              👁 View Current Submission ({latestSubmission.status})
            </button>
            <button
              type="button"
              onClick={() => setMode('submit')}
              className={`flex-1 py-2.5 px-4 text-center transition-colors ${
                mode === 'submit' ? 'bg-[#FE4E1A] text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              📝 Submit New / Revised Proof
            </button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5">
          
          {/* Milestone Target & Financial Context Strip */}
          <div className="bg-white border-2 border-[#121316] p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs shadow-[3px_3px_0px_#121316]">
            <div>
              <span className="text-[10px] font-headline font-black uppercase text-gray-500 block">
                Target Allocation
              </span>
              <span className="font-headline font-black text-[#0F534A] text-sm">
                ₹{Number(milestone.targetAmount || milestone.budget || 0).toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-headline font-black uppercase text-gray-500 block">
                Estimated Duration
              </span>
              <span className="font-headline font-black text-[#121316] text-sm">
                {milestone.durationDays || 30} Days
              </span>
            </div>
            <div>
              <span className="text-[10px] font-headline font-black uppercase text-gray-500 block">
                Tranche Status
              </span>
              <span className="inline-block px-2 py-0.5 bg-[#EFF6FF] text-[#1E40AF] border border-[#3B82F6] font-headline font-black text-[10px] uppercase">
                {milestoneStatus}
              </span>
            </div>
            <div>
              <span className="text-[10px] font-headline font-black uppercase text-gray-500 block">
                Review Attempts
              </span>
              <span className="font-headline font-black text-[#FE4E1A] text-sm">
                {milestone.submissions?.length || (latestSubmission ? 1 : 0)} Attempts
              </span>
            </div>
          </div>

          {/* ══════════ MODE 1: SUBMISSION FORM ══════════ */}
          {mode === 'submit' && (
            <form onSubmit={handleSubmitProof} className="space-y-5">
              
              {/* Prior Rejection Alert */}
              {isRejected && (
                <div className="bg-[#FEF2F2] border-3 border-[#DC2626] p-4 shadow-[3px_3px_0px_#DC2626] space-y-1">
                  <div className="flex items-center gap-2 text-sm font-headline font-black text-[#991B1B] uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4" /> Reviewer Rejection Feedback
                  </div>
                  <p className="text-xs font-medium text-gray-800 italic">
                    "{latestSubmission.rejectionReason || 'Deliverables did not meet the agreed criteria. Please update deliverables and resubmit.'}"
                  </p>
                </div>
              )}

              {/* 1. Acceptance Criteria Checklist */}
              {milestone.acceptanceCriteria && milestone.acceptanceCriteria.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-[#FE4E1A]" />
                    Acceptance Criteria Verification Checklist
                  </label>
                  <p className="text-[11px] text-gray-600 font-medium">
                    Confirm each deliverable requirement completed during this funding stage:
                  </p>
                  <div className="space-y-2 bg-white border-2 border-[#121316] p-3">
                    {milestone.acceptanceCriteria.map((crit: string, idx: number) => {
                      const isChecked = checkedCriteria.includes(crit);
                      return (
                        <label
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-gray-800 cursor-pointer select-none hover:bg-gray-50 p-1.5 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleCriterion(crit)}
                            className="mt-0.5 w-4 h-4 rounded-none accent-[#0F534A] border-2 border-[#121316]"
                          />
                          <span className={isChecked ? 'line-through text-gray-400 font-medium' : 'font-medium'}>
                            {crit}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Completion Narrative / Work Summary */}
              <div className="space-y-1.5">
                <label className="text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] flex items-center justify-between">
                  <span>Work Summary & Tangible Outcomes *</span>
                  <span className="text-[10px] text-gray-500 font-mono">Min 5 chars</span>
                </label>
                <textarea
                  value={narrative}
                  onChange={(e) => setNarrative(e.target.value)}
                  placeholder="Detail the deliverables built, test outcomes, prototype milestones achieved, and utilization of prior funds..."
                  rows={4}
                  required
                  className="w-full p-3 bg-white border-2 border-[#121316] text-xs font-medium text-[#121316] shadow-[2px_2px_0px_#121316] focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                />
              </div>

              {/* 3. Demo / Repository / Video URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-[#4717AE]" />
                  Live Demo, GitHub, or Video Demonstration URL
                </label>
                <input
                  type="url"
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  placeholder="e.g. https://youtu.be/..., https://github.com/..., or live deployment link"
                  className="w-full p-2.5 bg-white border-2 border-[#121316] text-xs font-medium text-[#121316] shadow-[2px_2px_0px_#121316] focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                />
              </div>

              {/* 4. Document & Invoice Upload Dropzone */}
              <div className="space-y-2">
                <label className="text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#0B9C2C]" />
                    Upload Verification Documents & Vendor Invoices
                  </span>
                  <span className="text-[10px] text-gray-500">PDF, JPG, PNG up to 25MB</span>
                </label>

                {/* Dropzone container */}
                <div className="border-2 border-dashed border-[#0F534A] bg-[#F0FDF4] p-4 text-center relative hover:bg-[#E6F8ED] transition-colors">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.zip"
                    onChange={handleFileUpload}
                    disabled={isUploading}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex flex-col items-center justify-center space-y-1 pointer-events-none">
                    <Upload className="w-6 h-6 text-[#0F534A]" />
                    <p className="text-xs font-headline font-black uppercase text-[#0F534A]">
                      {isUploading ? `Uploading... (${progress}%)` : 'Click or Drag & Drop Invoices / Reports'}
                    </p>
                    <p className="text-[10px] text-gray-600">
                      Cloudinary signed upload pipeline automatically attaches proofs to the milestone ledger
                    </p>
                  </div>
                </div>

                {/* Uploaded File Pill List */}
                {uploadedDocUrls.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <p className="text-[10px] font-headline font-black uppercase text-gray-500">
                      Attached Deliverables ({uploadedDocUrls.length})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {uploadedDocUrls.map((doc, i) => (
                        <div
                          key={i}
                          className="bg-white border-2 border-[#121316] p-2 flex items-center justify-between text-xs shadow-[2px_2px_0px_#121316]"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <FileText className="w-3.5 h-3.5 text-[#0F534A] flex-shrink-0" />
                            <span className="truncate font-medium">{doc.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <a
                              href={doc.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-gray-500 hover:text-[#0F534A]"
                              title="Open file"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <button
                              type="button"
                              onClick={() => handleRemoveDoc(i)}
                              className="text-red-500 hover:text-red-700"
                              title="Remove"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit CTA */}
              <div className="pt-3 border-t-2 border-dashed border-gray-300 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white text-gray-700 font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-gray-100"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="px-6 py-2.5 bg-[#FE4E1A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[3px_3px_0px_#121316] hover:bg-[#e03d0d] disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting Proof...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Milestone Proof 🚀
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ══════════ MODE 2: CURRENT SUBMISSION VIEWER ══════════ */}
          {mode === 'view' && latestSubmission && (
            <div className="space-y-5">
              
              {/* Status Header Strip */}
              <div
                className={`p-3.5 border-3 border-[#121316] flex items-center justify-between shadow-[3px_3px_0px_#121316] ${
                  latestSubmission.status === 'APPROVED'
                    ? 'bg-[#F0FDF4] text-[#166534]'
                    : latestSubmission.status === 'REJECTED'
                    ? 'bg-[#FEF2F2] text-[#991B1B]'
                    : 'bg-[#FFFBEB] text-[#92400E]'
                }`}
              >
                <div className="flex items-center gap-2">
                  {latestSubmission.status === 'APPROVED' ? (
                    <CheckCircle2 className="w-5 h-5 text-[#0B9C2C]" />
                  ) : latestSubmission.status === 'REJECTED' ? (
                    <AlertTriangle className="w-5 h-5 text-[#DC2626]" />
                  ) : (
                    <Clock className="w-5 h-5 text-[#FF7F00]" />
                  )}
                  <div>
                    <strong className="font-headline font-black text-xs uppercase tracking-wider block">
                      Status: {latestSubmission.status}
                    </strong>
                    <span className="text-[11px] font-medium opacity-90">
                      Submission Attempt #{latestSubmission.submissionNumber || 1} • Submitted on{' '}
                      {new Date(latestSubmission.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {isRejected && (
                  <button
                    type="button"
                    onClick={() => setMode('submit')}
                    className="px-3 py-1 bg-[#FE4E1A] text-white font-headline font-black text-[10px] uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#e03d0d]"
                  >
                    Resubmit Proof 🔄
                  </button>
                )}
              </div>

              {/* Reviewer Rejection Feedback if any */}
              {latestSubmission.rejectionReason && (
                <div className="p-3 bg-[#FEF2F2] border-2 border-[#DC2626] text-xs font-medium text-[#991B1B]">
                  <strong className="font-headline font-black uppercase tracking-wider block mb-0.5">
                    Reviewer Notes / Rejection Reason:
                  </strong>
                  <p className="italic">"{latestSubmission.rejectionReason}"</p>
                </div>
              )}

              {/* Submitted Narrative */}
              <div className="bg-white border-2 border-[#121316] p-4 shadow-[2px_2px_0px_#121316] space-y-1">
                <span className="text-[10px] font-headline font-black uppercase text-[#0F534A] tracking-wider block">
                  Creator Work Summary:
                </span>
                <p className="text-xs text-gray-800 font-medium whitespace-pre-wrap leading-relaxed">
                  {latestSubmission.narrative || latestSubmission.studentNotes || 'No notes provided with submission.'}
                </p>
              </div>

              {/* Embedded Video Demonstration if available */}
              {youtubeId && (
                <div className="space-y-2">
                  <span className="text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-[#FE4E1A]" /> Video Demonstration
                  </span>
                  <div className="border-3 border-[#121316] shadow-[4px_4px_0px_#121316] overflow-hidden">
                    <YouTube
                      videoId={youtubeId}
                      className="w-full"
                      iframeClassName="w-full aspect-video"
                      opts={{ width: '100%', height: 'auto', playerVars: { autoplay: 0 } }}
                    />
                  </div>
                </div>
              )}

              {/* PDF Document Preview if available */}
              {embedUrl && (
                <div className="space-y-2">
                  <span className="text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#0F534A]" /> Report / Presentation Preview
                  </span>
                  <div className="h-[400px] border-3 border-[#121316] shadow-[4px_4px_0px_#121316] overflow-hidden">
                    <iframe src={embedUrl} className="w-full h-full" title="Milestone Verification Document" />
                  </div>
                </div>
              )}

              {/* Uploaded Document Links */}
              {((latestSubmission.evidenceDocumentUrls && latestSubmission.evidenceDocumentUrls.length > 0) ||
                latestSubmission.evidenceDoc) && (
                <div className="space-y-2">
                  <span className="text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] block">
                    Attached Files & Invoices:
                  </span>
                  <div className="space-y-1.5">
                    {latestSubmission.evidenceDoc && (
                      <a
                        href={latestSubmission.evidenceDoc.storageKey}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-[#121316] text-xs font-medium text-[#0F534A] hover:bg-[#FFDD33] shadow-[2px_2px_0px_#121316] mr-2"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        {latestSubmission.evidenceDoc.name || 'Primary Deliverable'} ↗
                      </a>
                    )}
                    {latestSubmission.evidenceDocumentUrls?.map((url: string, idx: number) => (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border-2 border-[#121316] text-xs font-medium text-[#0F534A] hover:bg-[#FFDD33] shadow-[2px_2px_0px_#121316] mr-2"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        Invoice / Attachment #{idx + 1} ↗
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Bar */}
        <div className="p-3 bg-gray-50 border-t-3 border-[#121316] flex items-center justify-between">
          <span className="text-[10px] text-gray-500 font-mono">
            DreamXec FinXec 4-Eyes Governance Protocol
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#121316] text-white font-headline font-black text-xs uppercase tracking-wider hover:bg-[#0F534A]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}