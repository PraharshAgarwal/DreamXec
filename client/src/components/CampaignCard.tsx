import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Heart, Zap, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Campaign } from '../types';
import { BrushAnnotation } from './ui/BrushAnnotation';
import { TactileNeobrutalistButton } from './ui/TactileNeobrutalistButton';
import { wishlistService } from '../services/wishlistService';
import { getCampaignUrl, navigateToCampaign } from '../utils/campaignRouting';

interface CampaignCardProps {
  campaign: Campaign & {
    category?: string;
    verified?: boolean;
    milestonesCount?: number;
    completedMilestonesCount?: number;
    annotationText?: string;
    universityName?: string;
    impactScore?: number;
    isWishlisted?: boolean;
  };
  href?: string;
  onQuickDonate?: (campaign: any) => void;
}

// Cloudinary URL optimizer
const optimizeCloudinaryUrl = (url?: string, width = 450) => {
  if (!url) return '';
  if (!url.includes('cloudinary.com')) return url;
  if (url.includes('f_auto') || url.includes('q_auto')) return url;
  return url.replace('/upload', `/upload/f_auto,q_auto,w_${width},c_fill/`);
};

export default function CampaignCard({ campaign, href, onQuickDonate }: CampaignCardProps) {
  const navigate = useNavigate();
  const targetHref = href || getCampaignUrl(campaign.slug || campaign.id);
  const currentAmount = Number(campaign.currentAmount ?? (campaign as any).currentRaisedAmount ?? 0);
  const goalAmount = Number(campaign.goalAmount ?? (campaign as any).targetAmount ?? 0);
  const progressPercentage =
    goalAmount > 0 ? Math.min(Math.round((currentAmount / goalAmount) * 100), 100) : 0;

  const milestones = campaign.milestones || [];
  const totalMilestones = milestones.length || (campaign as any).milestonesCount || 0;
  const completedMilestones =
    milestones.filter((m: any) => ['COMPLETED', 'VERIFIED', 'APPROVED', 'DISBURSED'].includes((m.status || '').toUpperCase())).length ||
    (campaign as any).completedMilestonesCount ||
    0;

  // Impact Score (L5)
  const impactScore = Number(
    (campaign as any).impactScore ||
    Math.min(99, Math.max(84, 82 + completedMilestones * 4 + ((campaign as any).verified ? 7 : 0) + (progressPercentage > 40 ? 5 : 2)))
  );

  // Wishlist Bookmark State (L6)
  const [isSaved, setIsSaved] = useState<boolean>(Boolean(campaign.isWishlisted));
  const [isSavingWishlist, setIsSavingWishlist] = useState<boolean>(false);

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to save campaigns to your wishlist.');
      return;
    }

    setIsSavingWishlist(true);
    try {
      const res = await wishlistService.toggleWishlist(campaign.id);
      setIsSaved(res.isWishlisted);
      toast.success(res.isWishlisted ? 'Saved to Wishlist ❤️' : 'Removed from Wishlist');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update wishlist');
    } finally {
      setIsSavingWishlist(false);
    }
  };

  const category = (campaign as any).category || 'STARTUP_INNOVATION';
  const categoryLabels: Record<string, string> = {
    TUITION_FEE: 'Tuition Fee',
    RESEARCH_GRANT: 'Research Grant',
    STARTUP_INNOVATION: 'Startup Innovation',
    EMERGENCY_AID: 'Emergency Aid',
    COMPETITION_TRAVEL: 'Competition',
    EXTRACURRICULAR: 'Extracurricular',
    COMMUNITY_PROJECT: 'Community',
    CLUB_PROJECT: 'Club Project',
  };

  const categoryColors: Record<string, string> = {
    RESEARCH_GRANT: 'bg-[#18D7E8] text-[#041A16]',
    STARTUP_INNOVATION: 'bg-[#FFDD33] text-[#121316]',
    TUITION_FEE: 'bg-[#FEB3FC] text-[#350f87]',
    EMERGENCY_AID: 'bg-[#F4002C] text-white',
    COMMUNITY_PROJECT: 'bg-[#9EFC5F] text-[#0F534A]',
    CLUB_PROJECT: 'bg-[#FFDD33] text-[#121316]',
  };

  const badgeColor = categoryColors[category] || 'bg-[#FFDD33] text-[#121316]';
  const categoryLabel = categoryLabels[category] || category.replace('_', ' ');

  const isVerified = Boolean((campaign as any).verified || (campaign as any).verifiedAt || (campaign.status && ['LIVE', 'APPROVED', 'COMPLETED', 'FULLY_FUNDED', 'DISBURSING'].includes(campaign.status.toUpperCase())));
  const rawImageUrl = String(campaign.imageUrl || (campaign as any).coverImageUrl || '').trim();
  const imageUrl = rawImageUrl || '/assets/student_robotics_hero.webp';

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a[data-prevent-card-click]')) {
      return;
    }
    navigateToCampaign(campaign.slug || campaign.id, navigate);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col w-full bg-white border-4 border-[#121316] shadow-[6px_6px_0px_#FE4E1A] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[9px_9px_0px_#FFDD33] transition-all duration-200 cursor-pointer select-none"
    >
      {/* ── IMAGE BANNER WITH OVERLAYS ── */}
      <div className="relative w-full h-52 overflow-hidden border-b-4 border-[#121316] bg-[#0F534A] flex-shrink-0">
        <img
          src={optimizeCloudinaryUrl(imageUrl, 450)}
          alt={campaign.title || 'Student Innovation Project'}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/assets/curious_student_hero.webp';
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Top-Left Category Badge */}
        <div className="absolute top-3 left-3 z-10">
          <span
            className={`inline-block px-2.5 py-1 text-[11px] font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] ${badgeColor}`}
          >
            {categoryLabel}
          </span>
        </div>

        {/* Top-Right Badges: Verified + Impact Score (L5) */}
        <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
          {isVerified && (
            <div className="flex items-center gap-1 bg-[#0F534A] text-white px-2 py-0.5 border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
              <ShieldCheck className="w-3.5 h-3.5 text-[#9EFC5F]" />
              <span className="text-[10px] font-headline font-black uppercase tracking-wider">
                Verified
              </span>
            </div>
          )}

          {/* Impact Score Pill (L5) */}
          <div className="flex items-center gap-1 bg-[#121316] text-[#FFDD33] px-2 py-0.5 border border-[#FFDD33] shadow-[2px_2px_0px_#0F534A] text-[10px] font-headline font-black uppercase tracking-wider">
            <Zap className="w-3 h-3 text-[#FFDD33] fill-current" />
            {impactScore}/100 Impact
          </div>
        </div>

        {/* Floating Handwritten Annotation */}
        <div className="absolute bottom-2 right-2 z-10">
          <BrushAnnotation
            type="tag"
            color="yellow"
            rotate={-3}
            className="bg-[#121316] px-2 py-0.5 border border-[#FFDD33] shadow-[2px_2px_0px_#0F534A] text-xs font-bold text-[#FFDD33]"
          >
            {completedMilestones > 0
              ? `Milestone ${completedMilestones + 1} Active`
              : 'Tranche Protected'}
          </BrushAnnotation>
        </div>
      </div>

      {/* ── CONTENT BODY ── */}
      <div className="p-5 flex flex-col flex-grow justify-between bg-white">
        <div>
          {/* Campaign Title */}
          <h3 className="font-headline font-black text-lg md:text-xl text-[#121316] leading-tight line-clamp-2 uppercase tracking-tight mb-2 group-hover:text-[#FE4E1A] transition-colors">
            {campaign.title}
          </h3>

          {/* Short Narrative */}
          <p className="text-xs font-normal text-gray-700 leading-relaxed line-clamp-2 mb-4">
            {(campaign as any).shortDescription || campaign.description || 'Milestone-based student initiative governed by institutional escrow.'}
          </p>
        </div>

        <div>
          {/* ── MILESTONE MINI-METER ── */}
          <div className="mb-4 pt-3 border-t-2 border-dashed border-gray-200">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 mb-1.5">
              <span className="uppercase tracking-wider">Tranche Governance:</span>
              <span className="font-black text-[#0F534A]">
                {completedMilestones}/{totalMilestones} Completed
              </span>
            </div>
            {/* Segmented meter strip */}
            <div className="grid grid-flow-col auto-cols-fr gap-1.5 h-2.5">
              {Array.from({ length: totalMilestones }).map((_, idx) => {
                const isPassed = idx < completedMilestones;
                const isCurrent = idx === completedMilestones;
                return (
                  <div
                    key={idx}
                    className={`h-full border border-[#0F534A] ${
                      isPassed
                        ? 'bg-[#0F534A]'
                        : isCurrent
                        ? 'bg-[#FE4E1A] animate-pulse'
                        : 'bg-[#FFF9F2]'
                    }`}
                    title={`Milestone ${idx + 1}`}
                  />
                );
              })}
            </div>
          </div>

          {/* ── FUNDING PROGRESS ── */}
          <div className="mb-5">
            <div className="flex items-baseline justify-between mb-1">
              <span className="font-headline font-black text-base text-[#0F534A]">
                ₹{currentAmount.toLocaleString()}
              </span>
              <span className="font-headline font-black text-sm text-[#FE4E1A]">
                {progressPercentage}%
              </span>
            </div>
            <div className="w-full h-3 bg-[#FFF9F2] border-2 border-[#0F534A] overflow-hidden">
              <div
                className="h-full bg-[#FE4E1A] transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-[10px] font-bold text-gray-500 mt-1">
              Goal: ₹{goalAmount.toLocaleString()} • Protected in Dual-Entry Escrow
            </p>
          </div>

          {/* ── CTA FOOTER ── */}
          <div className="flex items-center gap-2 pt-2 border-t-2 border-[#0F534A]">
            {targetHref.startsWith('http') ? (
              <a
                href={targetHref}
                data-prevent-card-click
                className="flex-1 inline-flex items-center justify-center font-headline font-black text-xs uppercase py-2.5 px-3 bg-[#0F534A] text-white border-2 border-[#4717AE] shadow-[3px_3px_0px_#4717AE] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#4717AE] active:translate-x-0.5 active:translate-y-0.5 transition-all text-center"
              >
                View Story <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </a>
            ) : (
              <Link
                to={targetHref}
                data-prevent-card-click
                className="flex-1 inline-flex items-center justify-center font-headline font-black text-xs uppercase py-2.5 px-3 bg-[#0F534A] text-white border-2 border-[#4717AE] shadow-[3px_3px_0px_#4717AE] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#4717AE] active:translate-x-0.5 active:translate-y-0.5 transition-all text-center"
              >
                View Story <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onQuickDonate) {
                  onQuickDonate(campaign);
                } else if (targetHref.startsWith('http')) {
                  window.location.href = `${targetHref}?action=donate`;
                } else {
                  navigate(`${targetHref}?action=donate`);
                }
              }}
              className="inline-flex items-center justify-center font-headline font-black text-xs uppercase py-2.5 px-3 bg-[#FE4E1A] text-white border-2 border-[#0F534A] shadow-[3px_3px_0px_#0F534A] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#0F534A] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
              title="Quick Donate"
              aria-label="Quick Donate"
            >
              <Sparkles className="w-3.5 h-3.5 fill-current text-[#FFDD33]" />
            </button>

            {/* Wishlist Save Button (L6) */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              disabled={isSavingWishlist}
              className={`inline-flex items-center justify-center font-headline font-black text-xs uppercase py-2.5 px-3 border-2 border-[#121316] shadow-[3px_3px_0px_#121316] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer ${
                isSaved
                  ? 'bg-[#FE4E1A] text-white'
                  : 'bg-white text-gray-700 hover:bg-[#FFF9F2]'
              }`}
              title={isSaved ? 'Saved in Wishlist' : 'Save to Wishlist'}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-white text-white' : 'text-[#FE4E1A]'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}