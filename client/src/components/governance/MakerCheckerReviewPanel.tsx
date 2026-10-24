import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Video,
  Camera,
  ExternalLink,
  UserCheck,
  Building,
  Lock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { TactileNeobrutalistButton } from '../ui/TactileNeobrutalistButton';
import { BrushAnnotation } from '../ui/BrushAnnotation';

export interface MilestoneSubmissionData {
  submissionId: string;
  milestoneId: string;
  milestoneTitle: string;
  sequenceOrder: number;
  allocatedAmount: number;
  currency?: string;
  studentNotes: string;
  evidenceDocs?: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
  }>;
  acceptanceCriteria: string[];
  makerReview?: {
    reviewedBy: string;
    decision: 'APPROVED' | 'REVISION_REQUESTED';
    notes: string;
    reviewedAt: string;
  } | null;
  checkerReview?: {
    authorizedBy: string;
    decision: 'APPROVED' | 'REJECTED';
    authorizedAt: string;
    payoutRef: string;
  } | null;
}

export interface MakerCheckerReviewPanelProps {
  submission: MilestoneSubmissionData;
  userRole: 'MAKER' | 'CHECKER' | 'ADMIN' | 'STUDENT';
  onMakerReview?: (decision: 'APPROVED' | 'REVISION_REQUESTED', notes: string) => Promise<void>;
  onCheckerAuthorize?: (decision: 'APPROVED' | 'REJECTED', notes: string) => Promise<void>;
  className?: string;
}

export const MakerCheckerReviewPanel: React.FC<MakerCheckerReviewPanelProps> = ({
  submission,
  userRole,
  onMakerReview,
  onCheckerAuthorize,
  className = '',
}) => {
  const [criteriaChecked, setCriteriaChecked] = useState<Record<number, boolean>>({});
  const [reviewNotes, setReviewNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const allCriteriaChecked =
    submission.acceptanceCriteria.length > 0 &&
    submission.acceptanceCriteria.every((_, idx) => !!criteriaChecked[idx]);

  const toggleCriterion = (idx: number) => {
    setCriteriaChecked((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleMakerDecision = async (decision: 'APPROVED' | 'REVISION_REQUESTED') => {
    if (decision === 'APPROVED' && !allCriteriaChecked) {
      toast.error('All acceptance criteria must be verified before Maker approval.');
      return;
    }
    if (decision === 'REVISION_REQUESTED' && !reviewNotes.trim()) {
      toast.error('Please provide specific feedback/notes for the student revision.');
      return;
    }

    if (!onMakerReview) return;
    setIsProcessing(true);
    try {
      await onMakerReview(decision, reviewNotes);
      toast.success(
        decision === 'APPROVED'
          ? 'Maker Verification Approved! Tranche forwarded to Finance Checker.'
          : 'Revision requested from student.'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit Maker review.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckerDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!onCheckerAuthorize) return;
    setIsProcessing(true);
    try {
      await onCheckerAuthorize(decision, reviewNotes);
      toast.success(
        decision === 'APPROVED'
          ? 'Payout Authorized! Dual-entry escrow settlement queued.'
          : 'Payout rejected by Finance Checker.'
      );
    } catch (err: any) {
      toast.error(err.message || 'Failed to authorize disbursement.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ── HEADER BANNER ── */}
      <div className="p-6 bg-white border-4 border-[#0F534A] shadow-[6px_6px_0px_#4717AE]">
        <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b-2 border-dashed border-gray-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-headline font-black uppercase text-[#FE4E1A] tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" /> 4-Eyes Dual Authorization Workspace
            </div>
            <h3 className="text-xl sm:text-2xl font-headline font-black text-[#121316] uppercase">
              Tranche #{submission.sequenceOrder}: {submission.milestoneTitle}
            </h3>
            <p className="text-xs text-gray-600 font-medium mt-1">
              Tranche Allocation: <strong className="text-[#0F534A]">₹{submission.allocatedAmount.toLocaleString()}</strong> held in institutional escrow.
            </p>
          </div>

          <BrushAnnotation
            type="tag"
            color="yellow"
            rotate={-2}
            className="bg-[#0F534A] text-[#9EFC5F] p-2.5 border-2 border-[#121316] shadow-[3px_3px_0px_#FE4E1A] text-xs font-headline font-black uppercase"
          >
            Role: {userRole} Active
          </BrushAnnotation>
        </div>

        {/* ── DUAL 4-EYES STAGES ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
          {/* Stage 1: Maker Verification */}
          <div
            className={`p-4 border-2 ${
              submission.makerReview?.decision === 'APPROVED'
                ? 'bg-[#9EFC5F]/20 border-[#0F534A]'
                : 'bg-[#FFF9F2] border-[#0F534A]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <UserCheck className="w-4 h-4 text-[#0F534A]" />
              <h4 className="font-headline font-black text-xs uppercase text-[#0F534A]">
                Stage 1: Lead Maker Verification
              </h4>
            </div>
            <p className="text-[11px] text-gray-700">
              {submission.makerReview?.decision === 'APPROVED'
                ? `Verified by ${submission.makerReview.reviewedBy}`
                : 'Awaiting evidence inspection by Technical/Faculty Reviewer.'}
            </p>
          </div>

          {/* Stage 2: Checker Authorization */}
          <div
            className={`p-4 border-2 ${
              submission.checkerReview?.decision === 'APPROVED'
                ? 'bg-[#9EFC5F]/20 border-[#0F534A]'
                : 'bg-[#FFF9F2] border-[#0F534A]'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Building className="w-4 h-4 text-[#4717AE]" />
              <h4 className="font-headline font-black text-xs uppercase text-[#4717AE]">
                Stage 2: Finance Checker Payout
              </h4>
            </div>
            <p className="text-[11px] text-gray-700">
              {submission.checkerReview?.decision === 'APPROVED'
                ? `Authorized by ${submission.checkerReview.authorizedBy} (Ref: ${submission.checkerReview.payoutRef})`
                : 'Awaiting 4-Eyes sign-off by Finance Officer.'}
            </p>
          </div>
        </div>
      </div>

      {/* ── SUBMITTED DELIVERABLES & EVIDENCE INSPECTION ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Deliverables & Evidence */}
        <div className="p-6 bg-white border-4 border-[#0F534A] shadow-[5px_5px_0px_#0F534A] space-y-4">
          <h4 className="font-headline font-black text-base uppercase text-[#0F534A] pb-2 border-b-2 border-dashed border-gray-200">
            Submitted Proofs & Notes
          </h4>

          <div>
            <label className="block text-xs font-headline font-black uppercase text-gray-500 mb-1">
              Student Execution Narrative
            </label>
            <p className="p-3 bg-[#FFF9F2] border-2 border-gray-200 text-xs font-medium text-gray-800 leading-relaxed whitespace-pre-line">
              {submission.studentNotes || 'No notes provided.'}
            </p>
          </div>

          <div>
            <label className="block text-xs font-headline font-black uppercase text-gray-500 mb-2">
              Attached Evidence Documents ({submission.evidenceDocs?.length || 0})
            </label>
            <div className="space-y-2">
              {submission.evidenceDocs?.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 border-2 border-[#0F534A] hover:bg-orange-50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#FE4E1A]" />
                    <span className="text-xs font-bold text-[#121316] truncate max-w-[200px]">
                      {doc.name}
                    </span>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Acceptance Criteria Inspection & Decision Panel */}
        <div className="p-6 bg-white border-4 border-[#0F534A] shadow-[5px_5px_0px_#4717AE] space-y-5">
          <h4 className="font-headline font-black text-base uppercase text-[#0F534A] pb-2 border-b-2 border-dashed border-gray-200">
            Acceptance Criteria Release Gate
          </h4>

          <div className="space-y-2.5">
            {submission.acceptanceCriteria.map((crit, idx) => (
              <div
                key={idx}
                onClick={() => userRole === 'MAKER' && toggleCriterion(idx)}
                className={`flex items-start gap-3 p-3 border-2 transition-all ${
                  criteriaChecked[idx]
                    ? 'bg-[#9EFC5F]/20 border-[#0F534A]'
                    : 'bg-white border-gray-300'
                } ${userRole === 'MAKER' ? 'cursor-pointer hover:border-[#0F534A]' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={!!criteriaChecked[idx]}
                  disabled={userRole !== 'MAKER'}
                  onChange={() => toggleCriterion(idx)}
                  className="w-4 h-4 mt-0.5 accent-[#0F534A]"
                />
                <span className="text-xs font-bold text-[#121316] leading-snug">
                  {crit}
                </span>
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
              Reviewer Audit Notes / Revision Guidance
            </label>
            <textarea
              rows={3}
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Enter audit commentary or specific deliverables required for re-submission..."
              className="w-full px-3 py-2 border-2 border-[#0F534A] text-xs font-medium text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A]"
            />
          </div>

          {/* Maker Actions */}
          {userRole === 'MAKER' && (
            <div className="flex items-center gap-3 pt-2">
              <TactileNeobrutalistButton
                variant="red"
                size="sm"
                className="flex-1"
                isLoading={isProcessing}
                onClick={() => handleMakerDecision('REVISION_REQUESTED')}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Request Revision
              </TactileNeobrutalistButton>

              <TactileNeobrutalistButton
                variant="primary"
                size="sm"
                className="flex-1"
                isLoading={isProcessing}
                disabled={!allCriteriaChecked}
                onClick={() => handleMakerDecision('APPROVED')}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Approve Verification ✦
              </TactileNeobrutalistButton>
            </div>
          )}

          {/* Checker Actions */}
          {userRole === 'CHECKER' && (
            <div className="flex items-center gap-3 pt-2">
              <TactileNeobrutalistButton
                variant="red"
                size="sm"
                className="flex-1"
                isLoading={isProcessing}
                onClick={() => handleCheckerDecision('REJECTED')}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Reject Payout
              </TactileNeobrutalistButton>

              <TactileNeobrutalistButton
                variant="secondary"
                size="sm"
                className="flex-1"
                isLoading={isProcessing}
                onClick={() => handleCheckerDecision('APPROVED')}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Authorize Payout Release ✦
              </TactileNeobrutalistButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
