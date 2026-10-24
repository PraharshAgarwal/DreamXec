import { useState } from "react";
import type { CampaignComment } from "../../types/comment";
import ReplyForm from "./ReplyForm";
import { MessageSquare, Trash2, Flag, CornerDownRight, CheckCircle2 } from "lucide-react";
import UserAvatar from "../common/UserAvatar";

interface CurrentUser {
  id: string;
  role: string;
}

interface Props {
  comment: CampaignComment;
  currentUser: CurrentUser | null;
  campaignOwnerId: string;
  onReply: (parentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  onReport: (commentId: string) => Promise<void>;
  depth?: number;
}

export default function CommentItem({
  comment,
  currentUser,
  campaignOwnerId,
  onReply,
  onDelete,
  onReport,
  depth = 0,
}: Props) {
  const [showReply, setShowReply] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete =
    currentUser &&
    (currentUser.id === comment.author?.id ||
      currentUser.id === campaignOwnerId ||
      currentUser.role === "ADMIN" ||
      (currentUser as any).role === "SUPER_ADMIN");

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      setIsDeleting(true);
      await onDelete(comment.id);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplySubmit = async (content: string) => {
    await onReply(comment.id, content);
    setShowReply(false);
  };

  const authorName = comment.author?.name || "Verified User";
  const initials = authorName
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "DX";

  return (
    <div className="mt-4 space-y-2">
      <div className="bg-white border-2 sm:border-3 border-[#0F534A] shadow-[3px_3px_0px_#0F534A] p-3.5 sm:p-4 transition-all">
        {/* Header */}
        <div className="flex justify-between items-start mb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Avatar */}
            <UserAvatar
              user={comment.author}
              name={authorName}
              username={comment.author?.username}
              size="sm"
              shape="square"
            />

            <span className="font-headline font-black text-[#121316] text-xs sm:text-sm">
              {authorName}
            </span>

            {comment.author?.isProjectLead && (
              <span className="px-2 py-0.5 text-[9px] font-headline font-black bg-[#FE4E1A] text-white border border-[#121316] shadow-[1px_1px_0_#121316] uppercase">
                👑 Lead Creator
              </span>
            )}

            {!comment.author?.isProjectLead && comment.author?.isTeamMember && (
              <span className="px-2 py-0.5 text-[9px] font-headline font-black bg-[#4717AE] text-white border border-[#121316] shadow-[1px_1px_0_#121316] uppercase">
                👥 Team Member
              </span>
            )}

            {comment.author?.isBacker && (
              <span className="px-2 py-0.5 text-[9px] font-headline font-black bg-[#9EFC5F] text-[#041A16] border border-[#121316] shadow-[1px_1px_0_#121316] uppercase">
                💚 Verified Backer
              </span>
            )}

            {comment.author?.isVerified && !comment.author?.isProjectLead && !comment.author?.isTeamMember && (
              <span className="px-2 py-0.5 text-[9px] font-headline font-black bg-[#18D7E8] text-[#041A16] border border-[#121316] shadow-[1px_1px_0_#121316] uppercase">
                <CheckCircle2 className="w-2.5 h-2.5 inline mr-0.5" /> Verified
              </span>
            )}
          </div>

          <span className="text-[10px] sm:text-xs text-gray-500 font-medium">
            {new Date(comment.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Content */}
        <p className="text-[#121316] font-medium text-xs sm:text-sm leading-relaxed whitespace-pre-line pl-0.5">
          {comment.content}
        </p>

        {/* Flagged indicator */}
        {comment.isFlagged && (
          <p className="text-[10px] text-red-600 mt-2 font-bold uppercase flex items-center gap-1 bg-red-50 p-1.5 border border-red-200">
            <Flag className="w-3 h-3" /> This comment has been flagged for moderation.
          </p>
        )}

        {/* Actions Bar */}
        <div className="flex items-center gap-3 mt-3 pt-2 border-t border-dashed border-gray-200 text-xs font-bold">
          {currentUser && (
            <button
              type="button"
              onClick={() => setShowReply(!showReply)}
              className="inline-flex items-center gap-1 text-[#0F534A] hover:text-[#FE4E1A] font-headline font-black uppercase text-[10px] transition cursor-pointer"
            >
              <CornerDownRight className="w-3 h-3" />
              {showReply ? "Cancel" : "Reply"}
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-headline font-black uppercase text-[10px] disabled:opacity-50 transition cursor-pointer ml-auto"
            >
              <Trash2 className="w-3 h-3" />
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}

          {currentUser && !canDelete && (
            <button
              type="button"
              onClick={() => onReport(comment.id)}
              className="inline-flex items-center gap-1 text-gray-500 hover:text-red-600 font-headline font-bold uppercase text-[10px] transition cursor-pointer ml-auto"
            >
              <Flag className="w-3 h-3" />
              Report
            </button>
          )}
        </div>

        {/* Reply Form */}
        {showReply && (
          <div className="mt-3">
            <ReplyForm
              onSubmit={handleReplySubmit}
              onCancel={() => setShowReply(false)}
            />
          </div>
        )}
      </div>

      {/* Threaded Replies (depth limited) */}
      {comment.replies && comment.replies.length > 0 && depth < 4 && (
        <div className="ml-3 sm:ml-6 pl-3 border-l-3 border-[#0F534A]/30 space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUser={currentUser}
              campaignOwnerId={campaignOwnerId}
              onReply={onReply}
              onDelete={onDelete}
              onReport={onReport}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
