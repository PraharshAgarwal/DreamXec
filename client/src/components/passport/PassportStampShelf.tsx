import React, { useState } from 'react';
import {
  Award,
  ShieldCheck,
  ChevronRight,
  BookOpen,
  Sparkles,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import ResearcherPassportModal from './ResearcherPassportModal';
import type { User } from '../../types';

interface Props {
  user: User | null;
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function PassportStampShelf({
  user,
  title = 'Researcher & Backer Passport',
  subtitle = 'Cryptographic Proof of Solvency & Escrow Milestones',
  className = '',
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!user) return null;

  // Mini preview stamps
  const stamps = [
    { label: '₹1 PENNY DROP', color: '#0F534A', bg: '#9EFC5F/20', tilt: -3 },
    { label: 'DIGILOCKER CCA', color: '#4717AE', bg: '#FEB3FC/30', tilt: 4 },
    { label: 'TRANCHE PIONEER', color: '#FE4E1A', bg: '#FFDD33/30', tilt: -2 },
    { label: 'ESCROW BACKER', color: '#0F534A', bg: '#18D7E8/20', tilt: 3 },
  ];

  return (
    <>
      <div
        className={`p-4 sm:p-5 bg-[#FFFDF9] border-3 border-[#0F534A] shadow-[4px_4px_0px_#0F534A] relative overflow-hidden ${className}`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Booklet Preview & Info */}
          <div className="flex items-center gap-4">
            {/* Miniature Physical Booklet Cover */}
            <div
              onClick={() => setIsModalOpen(true)}
              className="w-14 h-20 sm:w-16 sm:h-22 bg-[#0F534A] border-2 border-[#121316] shadow-[3px_3px_0px_#FE4E1A] rounded-sm p-1.5 flex flex-col justify-between items-center text-center cursor-pointer hover:scale-105 transition-transform flex-shrink-0 relative group"
            >
              <div className="w-5 h-5 rounded-full border border-[#FFDD33] flex items-center justify-center text-[#FFDD33] text-[8px] font-headline font-black mt-0.5">
                DX
              </div>
              <div className="font-headline font-black text-[7px] text-[#FFDD33] uppercase leading-tight tracking-wider">
                OFFICIAL PASSPORT
              </div>
              <div className="text-[6px] font-mono text-white/80">
                2026 // IN
              </div>
              {/* Gold Spine Accent */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFDD33]/40" />
            </div>

            {/* Title & Subtext */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] font-headline font-black uppercase tracking-wider text-[#FE4E1A] bg-[#FE4E1A]/10 px-2 py-0.5 border border-[#FE4E1A]/30">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED REGISTRY
                </span>
                <span className="text-[10px] font-mono text-[#0F534A] font-bold">
                  DX-PASSPORT-BOOKLET
                </span>
              </div>
              <h4 className="font-headline font-black text-base sm:text-lg text-[#121316] uppercase mt-0.5">
                {title}
              </h4>
              <p className="text-xs text-gray-600 font-medium">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Right: Tactile Ink-Bleed Stamp Shelf & Open Button */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Stamp Badges */}
            <div className="flex items-center gap-2">
              {stamps.map((s, idx) => (
                <div
                  key={idx}
                  style={{ transform: `rotate(${s.tilt}deg)` }}
                  className="px-2 py-1 bg-white border border-dashed border-[#0F534A] text-[9px] font-headline font-black uppercase text-[#0F534A] shadow-[1px_1px_0px_rgba(0,0,0,0.1)] hidden sm:inline-block select-none"
                >
                  ✓ {s.label}
                </div>
              ))}
            </div>

            {/* Launch Modal Action */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0F534A] hover:bg-[#14665b] text-[#9EFC5F] border-2 border-[#121316] text-xs font-headline font-black uppercase shadow-[3px_3px_0px_#121316] cursor-pointer transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Inspect Passport</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Booklet */}
      <ResearcherPassportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        user={user}
      />
    </>
  );
}
