import CommentItem from "./CommentItem";
import type { CampaignComment } from "../../types/comment";
import { MessageSquare, ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  comments: CampaignComment[];
  currentUser: any;
  campaignOwnerId: string;
  onReply: any;
  onDelete: any;
  onReport: any;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function CommentList({
  comments,
  currentUser,
  campaignOwnerId,
  onReply,
  onDelete,
  onReport,
  page,
  totalPages,
  onPageChange,
}: Props) {
  /* ---------------- EMPTY STATE ---------------- */
  if (!comments || comments.length === 0) {
    return (
      <div className="bg-[#FFF9F2] border-3 border-[#0F534A] p-8 text-center space-y-2">
        <MessageSquare className="w-8 h-8 text-[#0F534A] mx-auto opacity-60" />
        <h3 className="font-headline font-black text-sm sm:text-base uppercase text-[#121316]">
          No Discussion Comments Yet
        </h3>
        <p className="text-xs text-gray-600 font-medium max-w-sm mx-auto">
          Start the conversation by sharing questions about this research project, suggesting technical ideas, or cheering on the team.
        </p>
      </div>
    );
  }

  /* ---------------- NORMAL STATE ---------------- */
  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUser={currentUser}
          campaignOwnerId={campaignOwnerId}
          onReply={onReply}
          onDelete={onDelete}
          onReport={onReport}
        />
      ))}

      {/* ---------------- PAGINATION ---------------- */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-6 pt-4 border-t border-dashed border-gray-300">
          <button
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-headline font-black uppercase border-2 border-[#121316] transition-all cursor-pointer ${
              page === 1
                ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                : "bg-white text-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#FFDD33]"
            }`}
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Prev
          </button>

          <span className="text-xs font-headline font-bold uppercase text-[#0F534A]">
            Page {page} of {totalPages}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => onPageChange(page + 1)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-headline font-black uppercase border-2 border-[#121316] transition-all cursor-pointer ${
              page === totalPages
                ? "bg-gray-100 text-gray-400 border-gray-300 cursor-not-allowed"
                : "bg-white text-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#FFDD33]"
            }`}
          >
            Next <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
