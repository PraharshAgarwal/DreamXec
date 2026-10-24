import React, { useState } from 'react';
import { X, Copy, Check, Share2, MessageCircle, Twitter, Linkedin } from 'lucide-react';
import toast from 'react-hot-toast';
import { TactileNeobrutalistButton } from '../ui/TactileNeobrutalistButton';

export interface SocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignTitle: string;
  campaignUrl?: string;
  shortDescription?: string;
}

export const SocialShareModal: React.FC<SocialShareModalProps> = ({
  isOpen,
  onClose,
  campaignTitle,
  campaignUrl = typeof window !== 'undefined' ? window.location.href : '',
  shortDescription = 'Check out this verified student initiative on DreamXec!',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const encodedUrl = encodeURIComponent(campaignUrl);
  const encodedText = encodeURIComponent(`${campaignTitle}\n\n${shortDescription}\n\nSupport this tranche-protected milestone initiative:`);

  const shareLinks = {
    whatsapp: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}&hashtags=DreamXec,StudentInnovation`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(campaignUrl);
    setCopied(true);
    toast.success('Campaign link copied to clipboard!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border-4 border-[#0F534A] shadow-[8px_8px_0px_#FE4E1A] max-w-md w-full p-6 space-y-6 relative animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-3 border-[#0F534A]">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#FE4E1A]" />
            <h3 className="font-headline font-black text-lg uppercase text-[#0F534A]">
              Share This Initiative
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center border-2 border-[#121316] bg-[#FFF9F2] text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-3 gap-3">
          <a
            href={shareLinks.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-2 p-3 bg-[#25D366] text-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#121316] transition-all"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="font-headline font-black text-[11px] uppercase">WhatsApp</span>
          </a>

          <a
            href={shareLinks.twitter}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-2 p-3 bg-[#1DA1F2] text-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#121316] transition-all"
          >
            <Twitter className="w-6 h-6" />
            <span className="font-headline font-black text-[11px] uppercase">X / Twitter</span>
          </a>

          <a
            href={shareLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-2 p-3 bg-[#0A66C2] text-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#121316] transition-all"
          >
            <Linkedin className="w-6 h-6" />
            <span className="font-headline font-black text-[11px] uppercase">LinkedIn</span>
          </a>
        </div>

        {/* Copy Link input */}
        <div>
          <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
            Direct Shareable URL
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={campaignUrl}
              className="flex-1 px-3 py-2 bg-gray-50 border-2 border-[#0F534A] text-xs font-mono text-gray-800 select-all outline-none"
            />
            <TactileNeobrutalistButton
              variant={copied ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleCopyLink}
              leftIcon={copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            >
              {copied ? 'Copied' : 'Copy'}
            </TactileNeobrutalistButton>
          </div>
        </div>
      </div>
    </div>
  );
};
