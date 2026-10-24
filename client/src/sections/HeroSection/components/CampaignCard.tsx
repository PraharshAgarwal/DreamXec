import { useNavigate } from "react-router-dom";
import type { HeroCampaign } from "../../../hooks/useHeroCampaigns";
import { navigateToCampaign } from "../../../utils/campaignRouting";

type Props = {
  campaign: HeroCampaign;
};

const optimizeCloudinaryUrl = (url?: string, width = 600) => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;
  if (url.includes('f_auto') || url.includes('q_auto')) return url;
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width},c_fill/`);
};

export const CampaignCard = ({ campaign }: Props) => {
  const navigate = useNavigate();

  const goal = campaign.goal ?? 0;
  const progress = goal > 0 ? Math.min(Math.round((campaign.raised / goal) * 100), 100) : 0;
  const cardImage = campaign.image?.trim()
    ? optimizeCloudinaryUrl(campaign.image, 600)
    : "/assets/student_robotics_hero.webp";

  return (
    <article
      className="w-full h-full bg-white flex flex-col transition-all duration-200 hover:translate-x-[-3px] hover:translate-y-[-3px]"
      style={{ border: '3px solid #0F534A', boxShadow: '6px 6px 0 #FE4E1A' }}
    >
      {/* ── HEADING BLOCK ── */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-3 py-2"
        style={{ background: '#0F534A', borderBottom: '3px solid #0F534A' }}
      >
        {/* Left: wordmark-style label */}
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-black text-[#0F534A]"
            style={{ background: '#FFDD33', border: '2px solid #0F534A' }}
          >
            ★
          </span>
          <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">
            DreamXec
          </span>
        </div>

        {/* Right: live badge */}
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-[#9EFC5F]"
          style={{ border: '1.5px solid #9EFC5F' }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#9EFC5F' }}
          />
          Live
        </span>
      </div>

      {/* Orange top stripe */}
      <div className="h-2 flex-shrink-0 bg-[#FE4E1A]" />

      {/* Image */}
      <div className="h-40 sm:h-48 w-full flex-shrink-0 overflow-hidden bg-[#0F534A]/10">
        <img
          src={cardImage}
          alt={campaign.title}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/assets/student_robotics_hero.webp";
          }}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">

        {/* Category */}
        <div className="mb-2">
          <span
            className="inline-block px-2 py-1 text-[10px] font-black text-[#121316] uppercase tracking-widest"
            style={{ background: '#FFDD33', border: '2px solid #0F534A' }}
          >
            {campaign.category}
          </span>
        </div>

        {/* Club name */}
        {campaign.club?.name && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs leading-none">🏛️</span>
            <span className="text-xs font-headline font-black text-[#0F534A] uppercase tracking-wide truncate">
              {campaign.club.name}
            </span>
          </div>
        )}

        {/* College */}
        {campaign.club?.college && (
          <p className="text-[11px] font-bold text-gray-700 uppercase tracking-wide truncate mb-2.5">
            {campaign.club.college}
          </p>
        )}

        {/* Title */}
        <h3 className="text-base sm:text-lg font-headline font-black text-[#121316] uppercase tracking-tight leading-snug line-clamp-2 mb-2">
          {campaign.title}
        </h3>

        {/* Description */}
        {campaign.description && (
          <p className="text-xs text-gray-800 font-bold leading-relaxed line-clamp-3 mb-3">
            {campaign.description}
          </p>
        )}

        {/* Push rest to bottom */}
        <div className="flex-1 min-h-[0.75rem]" />

        {/* Raised / goal */}
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-sm sm:text-base font-headline font-black text-[#0F534A]">
            ₹{campaign.raised.toLocaleString()}
          </span>
          <span className="text-xs font-headline font-black text-[#FE4E1A]">
            of ₹{goal.toLocaleString()}
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="w-full h-3 mb-4 overflow-hidden"
          style={{ border: '2px solid #0F534A', background: '#FCFBF7' }}
        >
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, background: '#FE4E1A' }}
          />
        </div>

        {/* CTA */}
        <button
          onClick={() => navigateToCampaign(campaign.slug || campaign.id, navigate)}
          className="w-full py-2.5 text-xs sm:text-sm font-headline font-black text-white uppercase tracking-widest transition-all hover:opacity-90 active:translate-x-[2px] active:translate-y-[2px] cursor-pointer"
          style={{
            background: '#0F534A',
            border: '2px solid #121316',
            boxShadow: '3px 3px 0 #FE4E1A',
          }}
        >
          View Campaign →
        </button>
      </div>
    </article>
  );
};