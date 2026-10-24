import { useState } from "react";
import { CornerDownRight, Send } from "lucide-react";

interface Props {
  onSubmit: (content: string) => Promise<void> | void;
  onCancel: () => void;
}

export default function ReplyForm({ onSubmit, onCancel }: Props) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || loading) return;

    try {
      setLoading(true);
      await onSubmit(content.trim());
      setContent("");
      onCancel();
    } catch (err) {
      console.error("Reply failed", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#FCFBF7] p-3.5 border-2 border-[#0F534A] shadow-[3px_3px_0px_#FFDD33] mt-3 space-y-2.5"
    >
      <div className="flex items-center gap-1.5 text-[11px] font-headline font-black uppercase text-[#0F534A]">
        <CornerDownRight className="w-3.5 h-3.5 text-[#FE4E1A]" />
        Write a Reply
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type your response..."
        rows={2}
        className="w-full p-2.5 text-xs font-medium border border-[#121316] bg-white focus:outline-none focus:border-[#FE4E1A] resize-none"
      />

      <div className="flex justify-end items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-xs font-headline font-bold uppercase text-gray-600 hover:text-black cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-headline font-black uppercase bg-[#0F534A] text-white border border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#0b3d36] disabled:opacity-50 cursor-pointer"
        >
          <Send className="w-3 h-3 text-[#9EFC5F]" />
          {loading ? "Sending..." : "Submit Reply"}
        </button>
      </div>
    </form>
  );
}
