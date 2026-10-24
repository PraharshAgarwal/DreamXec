import React from "react";

interface VerificationCardProps {
  title: string;
  subtitle?: string;
  status: "PENDING" | "VERIFIED" | "IN_REVIEW" | "REJECTED";
  children?: React.ReactNode;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({
  title,
  subtitle,
  status,
  children,
}) => {
  const statusStyles = {
    PENDING: "bg-amber-100 text-amber-900 border-amber-400",
    VERIFIED: "bg-green-100 text-green-900 border-green-500",
    IN_REVIEW: "bg-blue-100 text-blue-900 border-blue-400",
    REJECTED: "bg-red-100 text-red-900 border-red-500",
  };

  return (
    <div className="p-4 bg-white space-y-3 border-2 border-[#121316] shadow-[3px_3px_0px_#121316]">
      <div className="flex items-center justify-between">
        <div>
          <h5 className="font-black text-xs text-[#121316] uppercase">{title}</h5>
          {subtitle && <p className="text-[11px] font-medium text-[#121316]/70">{subtitle}</p>}
        </div>
        <span className={`px-2.5 py-0.5 text-[10px] font-black border ${statusStyles[status]}`}>
          {status === "IN_REVIEW" ? "UNDER REVIEW" : status}
        </span>
      </div>
      {children}
    </div>
  );
};

interface ReviewerActionDeckProps {
  reviewerType: string;
  onApprove?: () => void;
  onReject?: () => void;
  onRequestChanges?: () => void;
  isSubmitting?: boolean;
}

export const ReviewerActionDeck: React.FC<ReviewerActionDeckProps> = ({
  reviewerType,
  onApprove,
  onReject,
  onRequestChanges,
  isSubmitting = false,
}) => {
  return (
    <div className="p-3.5 bg-gray-50 space-y-3 border-2 border-[#121316] shadow-[3px_3px_0px_#121316]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-[#121316] uppercase">
          Assigned Verifier: <span className="text-[#FE4E1A]">{reviewerType}</span>
        </span>
        <span className="text-[10px] font-black bg-[#18D7E8]/20 text-[#121316] border border-[#121316] px-2 py-0.5">
          VERIFICATION REVIEW
        </span>
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        {onApprove && (
          <button
            type="button"
            onClick={onApprove}
            disabled={isSubmitting}
            className="px-4 py-2 font-black text-xs text-white bg-[#0F534A] uppercase tracking-wider hover:bg-[#0F534A]/90 transition-colors border-2 border-[#121316] cursor-pointer"
          >
            ✓ Approve Verification
          </button>
        )}
        {onReject && (
          <button
            type="button"
            onClick={onReject}
            disabled={isSubmitting}
            className="px-4 py-2 font-black text-xs text-white bg-[#F4002C] uppercase tracking-wider hover:bg-[#F4002C]/90 transition-colors border-2 border-[#121316] cursor-pointer"
          >
            ✕ Reject
          </button>
        )}
        {onRequestChanges && (
          <button
            type="button"
            onClick={onRequestChanges}
            disabled={isSubmitting}
            className="px-4 py-2 font-black text-xs text-[#121316] bg-[#FFDD33] uppercase tracking-wider hover:bg-[#FFDD33]/90 transition-colors border-2 border-[#121316] cursor-pointer"
          >
            💬 Request Changes
          </button>
        )}
      </div>
    </div>
  );
};
