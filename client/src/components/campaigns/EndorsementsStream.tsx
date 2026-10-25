import React, { useState } from 'react';
import { Award, ShieldCheck, UserCheck, Star, Building2, CheckCircle2, LogIn, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

export interface EndorsementItem {
  id: string;
  endorserName?: string;
  endorser?: { id: string; name?: string; fullName?: string } | null;
  designation: string;
  organizationName?: string;
  comments?: string;
  status: string;
  createdAt?: string;
  endorsedAt?: string;
}

export interface EndorsementsStreamProps {
  endorsements?: EndorsementItem[];
  currentUser?: any;
  onLogin?: () => void;
  onEndorse?: (endorsement: { designation: string; comments: string }) => Promise<void>;
  className?: string;
}

export const EndorsementsStream: React.FC<EndorsementsStreamProps> = ({
  endorsements = [],
  currentUser = null,
  onLogin,
  onEndorse,
  className = '',
}) => {
  const [showEndorseForm, setShowEndorseForm] = useState(false);
  const [designation, setDesignation] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!designation.trim()) {
      toast.error('Please enter your professional or academic designation');
      return;
    }
    if (!onEndorse) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Recording your endorsement sign-off...');
    try {
      await onEndorse({ designation: designation.trim(), comments: comments.trim() });
      toast.success('Endorsement submitted successfully!', { id: toastId });
      setDesignation('');
      setComments('');
      setShowEndorseForm(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Failed to submit endorsement.', { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b-3 border-[#0F534A]">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-[#FE4E1A]" />
          <div>
            <h3 className="font-headline font-black text-xl uppercase text-[#0F534A]">
              Faculty &amp; Peer Endorsements ({endorsements.length})
            </h3>
            <p className="text-xs text-gray-600 font-medium">
              Academic sign-offs, faculty recommendations, and technical feasibility reviews.
            </p>
          </div>
        </div>

        {currentUser ? (
          !showEndorseForm && (
            <button
              type="button"
              onClick={() => setShowEndorseForm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FFDD33] text-[#121316] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#ffe55b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FE4E1A]" /> Endorse Initiative
            </button>
          )
        ) : (
          <button
            type="button"
            onClick={onLogin}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FE4E1A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#e03d0d] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-white" /> Sign In to Endorse
          </button>
        )}
      </div>

      {/* Endorse Form Modal/Card */}
      {showEndorseForm && (
        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 bg-white border-3 border-[#0F534A] shadow-[5px_5px_0px_#FFDD33] space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b-2 border-dashed border-gray-200">
            <h4 className="font-headline font-black text-sm uppercase text-[#0F534A] flex items-center gap-1.5">
              <Award className="w-4 h-4 text-[#FE4E1A]" />
              Official Initiative Endorsement
            </h4>
            <span className="text-[10px] font-bold text-gray-500 uppercase">
              Authenticated Sign-off
            </span>
          </div>

          <div>
            <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
              Your Professional / Academic Designation *
            </label>
            <input
              type="text"
              required
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Professor & Head of Robotics Lab, VIT Chennai / Senior ML Researcher"
              className="w-full px-3 py-2 border-2 border-[#121316] bg-[#FCFBF7] font-bold text-xs sm:text-sm text-[#121316] focus:bg-white focus:border-[#FE4E1A] outline-none shadow-[inset_1px_1px_3px_rgba(0,0,0,0.05)]"
            />
          </div>

          <div>
            <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
              Technical Review &amp; Recommendation Remarks (Optional)
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="State your assessment of the prototype milestone feasibility, student credentials, and societal impact..."
              className="w-full px-3 py-2 border-2 border-[#121316] bg-[#FCFBF7] font-medium text-xs sm:text-sm text-[#121316] focus:bg-white focus:border-[#FE4E1A] outline-none shadow-[inset_1px_1px_3px_rgba(0,0,0,0.05)] resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-dashed border-gray-200">
            <button
              type="button"
              onClick={() => setShowEndorseForm(false)}
              className="px-3 py-1.5 text-xs font-headline font-bold uppercase text-gray-600 hover:text-black cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !designation.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0F534A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#FE4E1A] hover:bg-[#0b3d36] disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#9EFC5F]" />
              {isSubmitting ? 'Signing...' : 'Sign Endorsement ✦'}
            </button>
          </div>
        </form>
      )}

      {/* Endorsements Stream List */}
      {endorsements.length === 0 ? (
        <div className="p-8 bg-[#FFF9F2] border-3 border-[#0F534A] text-center space-y-2">
          <Building2 className="w-8 h-8 text-[#0F534A] mx-auto opacity-60" />
          <h4 className="font-headline font-black text-sm uppercase text-[#121316]">
            No Endorsements Recorded Yet
          </h4>
          <p className="text-xs text-gray-600 max-w-md mx-auto font-medium">
            University department heads, faculty advisors, industry mentors, and backers endorse this initiative as milestone execution progress is verified.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {endorsements.map((end) => {
            const displayName =
              end.endorserName ||
              end.endorser?.name ||
              end.endorser?.fullName ||
              'Verified Institutional Endorser';
            const dateStr = end.endorsedAt || end.createdAt;

            return (
              <div
                key={end.id}
                className="p-4 sm:p-5 bg-white border-3 border-[#0F534A] shadow-[4px_4px_0px_#0F534A] space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 pb-2 border-b-2 border-dashed border-gray-200">
                    <div className="w-9 h-9 bg-[#0F534A] text-white border-2 border-[#121316] flex items-center justify-center shadow-[2px_2px_0px_#FE4E1A] flex-shrink-0">
                      <UserCheck className="w-5 h-5 text-[#9EFC5F]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-headline font-black text-xs sm:text-sm uppercase text-[#121316] truncate">
                          {displayName}
                        </h4>
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0F534A] flex-shrink-0" />
                      </div>
                      <p className="text-[11px] font-headline font-bold text-[#FE4E1A] line-clamp-1">
                        {end.designation}
                      </p>
                    </div>
                  </div>

                  {end.comments && (
                    <p className="text-xs font-medium text-gray-700 leading-relaxed italic bg-[#FFF9F2] p-3 border border-[#0F534A]/40 shadow-[1px_1px_0px_#0F534A]">
                      "{end.comments}"
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium pt-1">
                  <span className="inline-flex items-center gap-1 text-[#0F534A] font-bold uppercase">
                    <ShieldCheck className="w-3 h-3 text-[#9EFC5F]" /> Verified Endorsement
                  </span>
                  {dateStr && (
                    <span>
                      {new Date(dateStr).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
