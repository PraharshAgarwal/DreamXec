import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MessageSquare, RefreshCw } from "lucide-react";
import CommentForm from "./CommentForm";
import CommentList from "./CommentList";
import {
  getCampaignComments,
  createCampaignComment,
  deleteCampaignComment,
  reportCampaignComment,
} from "../../services/commentService";
import type { CampaignComment } from "../../types/comment";

interface CurrentUser {
  id: string;
  role: string;
}

interface Props {
  campaignId: string;
  campaignOwnerId: string;
  currentUser: CurrentUser | null;
  onLogin?: () => void;
}

export default function CommentSection({
  campaignId,
  campaignOwnerId,
  currentUser,
  onLogin,
}: Props) {
  const [comments, setComments] = useState<CampaignComment[]>([]);
  const [loading, setLoading] = useState(false);

  /* ---------------- FETCH ---------------- */
  const fetchComments = async () => {
    try {
      setLoading(true);
      const res = await getCampaignComments(campaignId);
      setComments(res.data?.comments || []);
    } catch (err) {
      console.error("Failed to fetch comments", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [campaignId]);

  /* ---------------- OPTIMISTIC CREATE ---------------- */
  const handleCreate = async (content: string, parentId?: string) => {
    if (!currentUser) {
      if (onLogin) onLogin();
      return;
    }

    const tempId = `temp-${Date.now()}`;

    const optimisticComment: CampaignComment = {
      id: tempId,
      content,
      createdAt: new Date().toISOString(),
      isFlagged: false,
      parentId: parentId || null,
      author: {
        id: currentUser.id,
        name: (currentUser as any).fullName || (currentUser as any).name || "You",
        type: currentUser.role === "DONOR" ? "DONOR" : "USER",
        role: currentUser.role,
      },
      replies: [],
    };

    /* ---- Immediately update UI ---- */
    if (!parentId) {
      setComments((prev) => [optimisticComment, ...prev]);
    } else {
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === parentId
            ? {
                ...comment,
                replies: [...(comment.replies || []), optimisticComment],
              }
            : comment
        )
      );
    }

    try {
      const res = await createCampaignComment(
        campaignId,
        content,
        parentId
      );

      const realComment = res.data?.comment;

      if (realComment) {
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === tempId ? realComment : comment
          )
        );
        toast.success("Comment posted!");
      }
    } catch (err: any) {
      console.error("Failed to create comment", err);
      toast.error(err?.message || "Failed to post comment");

      // Rollback UI if failed
      setComments((prev) =>
        prev.filter((comment) => comment.id !== tempId)
      );
    }
  };

  /* ---------------- OPTIMISTIC DELETE ---------------- */
  const handleDelete = async (commentId: string) => {
    const previous = comments;

    // Immediately remove from UI
    setComments((prev) =>
      prev.filter((comment) => comment.id !== commentId)
    );

    try {
      await deleteCampaignComment(commentId);
      toast.success("Comment deleted");
    } catch (err: any) {
      console.error("Failed to delete comment", err);
      toast.error(err?.message || "Failed to delete comment");
      setComments(previous);
    }
  };

  /* ---------------- REPORT ---------------- */
  const handleReport = async (commentId: string) => {
    try {
      await reportCampaignComment(commentId);
      toast.success("Comment flagged for moderation review.");
    } catch (err: any) {
      console.error("Failed to report comment", err);
      toast.error(err?.message || "Failed to report comment");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b-3 border-[#0F534A]">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#FE4E1A]" />
          <h3 className="font-headline font-black text-xl uppercase text-[#0F534A]">
            Discussion Stream ({comments.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={fetchComments}
          disabled={loading}
          className="inline-flex items-center gap-1 text-xs font-headline font-black uppercase text-[#0F534A] hover:text-[#FE4E1A] cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <CommentForm
        currentUser={currentUser}
        onLogin={onLogin}
        onSubmit={(content) => handleCreate(content)}
      />

      <div className="pt-2">
        {loading && comments.length === 0 ? (
          <div className="p-8 text-center bg-[#FFF9F2] border-2 border-dashed border-[#0F534A]/30">
            <div className="w-6 h-6 border-3 border-[#0F534A] border-t-[#FE4E1A] rounded-full animate-spin mx-auto mb-2" />
            <p className="text-xs font-headline font-black uppercase text-[#0F534A]">
              Loading discussion...
            </p>
          </div>
        ) : (
          <CommentList
            comments={comments}
            currentUser={currentUser}
            campaignOwnerId={campaignOwnerId}
            onReply={(parentId, content) =>
              handleCreate(content, parentId)
            }
            onDelete={handleDelete}
            onReport={handleReport}
            page={1}
            totalPages={1}
            onPageChange={() => {}}
          />
        )}
      </div>
    </div>
  );
}
