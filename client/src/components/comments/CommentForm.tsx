import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Send, MessageSquare, LogIn } from "lucide-react";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  currentUser: any;
  onLogin?: () => void;
}

export default function CommentForm({
  onSubmit,
  currentUser,
  onLogin,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;
    setLoading(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="bg-[#FFF9F2] border-3 border-[#0F534A] shadow-[4px_4px_0px_#FFDD33] p-5 text-center space-y-2">
        <MessageSquare className="w-6 h-6 text-[#FE4E1A] mx-auto" />
        <h4 className="font-headline font-black text-sm uppercase text-[#121316]">
          Join the Campaign Discussion
        </h4>
        <p className="text-xs text-gray-600 font-medium max-w-sm mx-auto">
          Sign in to ask technical questions, discuss research milestones, or share feedback with the project creators.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => (onLogin ? onLogin() : navigate("/auth"))}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FE4E1A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#e03d0d] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" /> Sign In to Comment
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border-3 border-[#0F534A] shadow-[4px_4px_0px_#0F534A] p-4 space-y-3"
    >
      <div className="flex items-center justify-between gap-2">
        <label className="font-headline font-black text-xs uppercase text-[#0F534A] flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-[#FE4E1A]" />
          Post a Discussion Comment
        </label>
        <span className="text-[10px] font-bold text-gray-500">
          {content.length} / 500
        </span>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder="Share technical questions, feedback on milestones, or words of encouragement..."
        className="w-full p-3 text-xs sm:text-sm font-medium border-2 border-[#121316] bg-[#FCFBF7] focus:bg-white focus:outline-none focus:border-[#FE4E1A] shadow-[inset_1px_1px_3px_rgba(0,0,0,0.05)] resize-none"
      />

      <div className="flex items-center justify-between">
        <p className="text-[10px] text-gray-500 font-medium">
          Posting as <strong className="text-[#121316] font-bold">{currentUser.fullName || currentUser.name || currentUser.email}</strong>
        </p>

        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F534A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#FE4E1A] hover:bg-[#0b3d36] disabled:opacity-50 disabled:cursor-not-allowed hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5 text-[#9EFC5F]" />
          {loading ? "Posting..." : "Post Comment"}
        </button>
      </div>
    </form>
  );
}
