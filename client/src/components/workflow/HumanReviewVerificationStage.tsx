import React, { useState } from "react";
import { VerificationCard, ReviewerActionDeck } from "./VerificationCard";
import type { WorkflowRuleConfig } from "./types";

interface HumanReviewVerificationStageProps {
  reviewers?: WorkflowRuleConfig["reviewers"];
  applicantName?: string;
  applicantEmail?: string;
  onDecision?: (decision: "APPROVE" | "REJECT" | "CHANGES_REQUESTED", notes: string) => void;
}

export const HumanReviewVerificationStage: React.FC<HumanReviewVerificationStageProps> = ({
  reviewers,
  applicantName = "",
  applicantEmail = "",
  onDecision,
}) => {
  const [reviewerNotes, setReviewerNotes] = useState("");
  const [status, setStatus] = useState<"PENDING" | "VERIFIED" | "IN_REVIEW" | "REJECTED">("IN_REVIEW");

  const reviewerType = reviewers?.[0]?.reviewerType || "";

  const handleAction = (decision: "APPROVE" | "REJECT" | "CHANGES_REQUESTED") => {
    if (decision === "APPROVE") setStatus("VERIFIED");
    if (decision === "REJECT") setStatus("REJECTED");
    if (onDecision) onDecision(decision, reviewerNotes);
  };

  return (
    <div className="space-y-4">
      <VerificationCard
        title={`Human Review Stage — Assigned to ${reviewerType}`}
        subtitle={`Evaluation of verification proofs for ${applicantName} (${applicantEmail})`}
        status={status}
      >
        <div className="p-3 bg-gray-50 text-xs font-mono font-medium border border-[#121316]">
          <p>📋 Submission status: Submitted and queued for manual inspection.</p>
          <p>🛡️ Assigned reviewer role: {reviewerType}</p>
        </div>

        <div className="space-y-1 pt-1">
          <label className="block text-xs font-black text-[#121316] uppercase">Reviewer Comments / Audit Notes</label>
          <textarea
            value={reviewerNotes}
            onChange={(e) => setReviewerNotes(e.target.value)}
            placeholder="Add reviewer comments or verification feedback..."
            rows={2}
            className="w-full p-2 text-xs font-medium text-[#121316] bg-white border-2 border-[#121316] focus:outline-none"
          />
        </div>
      </VerificationCard>

      <ReviewerActionDeck
        reviewerType={reviewerType}
        onApprove={() => handleAction("APPROVE")}
        onReject={() => handleAction("REJECT")}
        onRequestChanges={() => handleAction("CHANGES_REQUESTED")}
      />
    </div>
  );
};

export const ComplianceReviewStage: React.FC<HumanReviewVerificationStageProps> = (props) => {
  return (
    <div className="space-y-3">
      <div className="p-3 bg-purple-50 flex items-center justify-between" style={{ border: "2px solid #003366" }}>
        <span className="font-black text-xs text-purple-900 uppercase">⚖️ Regulatory & CSR Compliance Review Stage</span>
        <span className="text-[10px] font-black bg-purple-900 text-white px-2 py-0.5">COMPLIANCE OFFICER</span>
      </div>
      <HumanReviewVerificationStage {...props} />
    </div>
  );
};
