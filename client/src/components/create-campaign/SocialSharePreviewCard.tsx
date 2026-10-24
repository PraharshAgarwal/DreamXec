import React from 'react';
import { Share2, Globe, ShieldCheck } from 'lucide-react';
import { BrushAnnotation } from '../ui/BrushAnnotation';

export interface SocialSharePreviewCardProps {
  title: string;
  shortDescription: string;
  category: string;
  goalAmount: number;
  coverImageUrl?: string;
  currency?: string;
}

export const SocialSharePreviewCard: React.FC<SocialSharePreviewCardProps> = ({
  title,
  shortDescription,
  category,
  goalAmount,
  coverImageUrl,
  currency = 'INR',
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-headline font-black uppercase text-[#0F534A]">
          Live Social Unfurl Preview (WhatsApp / X / LinkedIn)
        </label>
        <span className="text-[11px] font-bold text-gray-500 flex items-center gap-1">
          <Globe className="w-3.5 h-3.5 text-[#FE4E1A]" /> OpenGraph 2.0
        </span>
      </div>

      {/* Social Card Mockup */}
      <div className="bg-[#FFF9F2] border-3 border-[#0F534A] shadow-[5px_5px_0px_#4717AE] overflow-hidden max-w-lg mx-auto">
        <div className="h-44 w-full bg-gray-200 relative overflow-hidden border-b-3 border-[#0F534A]">
          {coverImageUrl ? (
            <img src={coverImageUrl} alt="Preview cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-headline font-black text-xl text-white bg-[#0F534A]">
              DreamXec Innovation
            </div>
          )}
          <div className="absolute top-2 left-2 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2 py-0.5 text-[10px] font-headline font-black uppercase shadow-[2px_2px_0px_#121316]">
            {category}
          </div>
        </div>

        <div className="p-4 space-y-2 bg-white">
          <p className="text-[10px] font-headline font-black uppercase text-[#FE4E1A] tracking-wider">
            dreamxec.com • Verified Student Campaign
          </p>
          <h4 className="font-headline font-black text-base text-[#121316] uppercase leading-tight line-clamp-2">
            {title || 'Your Campaign Headline Here'}
          </h4>
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
            {shortDescription || 'Support groundbreaking student research and technology breakthroughs on DreamXec.'}
          </p>
          <div className="pt-2 flex items-center justify-between text-xs font-bold text-[#0F534A]">
            <span>Target: ₹{goalAmount.toLocaleString()}</span>
            <span className="text-[#FE4E1A] uppercase font-headline font-black">Escrow Protected ✦</span>
          </div>
        </div>
      </div>
    </div>
  );
};
