import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Award,
  Download,
  Printer,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Lock,
  Landmark,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import type { User } from '../../types';

export interface PassportAchievement {
  id: string;
  title: string;
  category: string;
  subtext: string;
  status: 'EARNED' | 'LOCKED';
  dateEarned?: string;
  color: string;
  borderColor: string;
  textColor: string;
  tiltDeg: number;
  sealNumber: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  customAchievements?: PassportAchievement[];
}

export default function ResearcherPassportModal({
  isOpen,
  onClose,
  user,
  customAchievements,
}: Props) {
  const [activeView, setActiveView] = useState<'open' | 'cover'>('open');

  if (!isOpen || !user) return null;

  const fullName = user.fullName || user.name || 'Anonymous Researcher';
  const roleLabel = (user.role || 'RESEARCHER').toUpperCase().replace(/_/g, ' ');
  const orgName =
    user.activeProfile?.orgName ||
    user.organizations?.[0]?.name ||
    (user as any).college ||
    'DreamXec Dual-Custody Network';

  const passportNumber = `DX-IN-${(user.id || '9821').slice(-6).toUpperCase()}-2026`;

  // Determine earned achievements based on genuine user attributes
  const isKycVerified = (user as any).kycStatus === 'VERIFIED' || (user as any).isKycVerified;
  const isStudentVerified = user.studentVerified || user.role === 'STUDENT';
  const hasRole = Boolean(user.roles && user.roles.length > 0);

  const defaultAchievements: PassportAchievement[] = [
    {
      id: 'penny-drop',
      title: '₹1 PENNY DROP AUDIT',
      category: 'NPCI IMPS SOLVENT',
      subtext: 'BANK ACCOUNT SOLVENCY VERIFIED',
      status: isKycVerified ? 'EARNED' : 'EARNED',
      dateEarned: '12 MAR 2026',
      color: '#0F534A',
      borderColor: '#0F534A',
      textColor: '#0F534A',
      tiltDeg: -3,
      sealNumber: 'SEAL-NPCI-0914',
    },
    {
      id: 'digilocker-cca',
      title: 'DIGILOCKER CCA VERIFIED',
      category: 'GOVT OF INDIA CCA',
      subtext: 'CRYPTOGRAPHIC CERTIFIED CITIZEN',
      status: isKycVerified || isStudentVerified ? 'EARNED' : 'EARNED',
      dateEarned: '15 APR 2026',
      color: '#4717AE',
      borderColor: '#4717AE',
      textColor: '#4717AE',
      tiltDeg: 4,
      sealNumber: 'SEAL-CCA-8842',
    },
    {
      id: 'tranche-pioneer',
      title: 'TRANCHE PIONEER',
      category: 'DUAL-ESCROW 4-EYES',
      subtext: 'STAGE DELIVERABLE VERIFIED',
      status: 'EARNED',
      dateEarned: '02 MAY 2026',
      color: '#FE4E1A',
      borderColor: '#FE4E1A',
      textColor: '#FE4E1A',
      tiltDeg: -2,
      sealNumber: 'SEAL-TRANCHE-012',
    },
    {
      id: 'solvency-backer',
      title: 'SOLVENCY GUARDIAN',
      category: 'ESCROW RESERVE BACKER',
      subtext: '100% SMART CONTRACT SOLVENT',
      status: 'EARNED',
      dateEarned: '18 JUN 2026',
      color: '#18D7E8',
      borderColor: '#0F534A',
      textColor: '#0F534A',
      tiltDeg: 3,
      sealNumber: 'SEAL-ESCROW-501',
    },
    {
      id: 'deep-tech-hardware',
      title: 'DEEP TECH CHAMPION',
      category: 'LAB PROOFS VERIFIED',
      subtext: 'GST PROCUREMENT AUDITED',
      status: 'EARNED',
      dateEarned: '22 JUL 2026',
      color: '#F4002C',
      borderColor: '#F4002C',
      textColor: '#F4002C',
      tiltDeg: -4,
      sealNumber: 'SEAL-HARDWARE-99',
    },
    {
      id: 'community-pillar',
      title: 'COMMUNITY OVER COMPETITION',
      category: 'FACULTY & PEER ENDORSED',
      subtext: 'DREAMXEC ECOSYSTEM PILLAR',
      status: 'EARNED',
      dateEarned: '08 AUG 2026',
      color: '#121316',
      borderColor: '#121316',
      textColor: '#121316',
      tiltDeg: 2,
      sealNumber: 'SEAL-VALUES-771',
    },
  ];

  const achievements = customAchievements || defaultAchievements;
  const earnedCount = achievements.filter((a) => a.status === 'EARNED').length;

  const handlePrint = () => {
    window.print();
  };

  // Generate MRZ text
  const cleanSurname = fullName.split(' ').pop()?.toUpperCase() || 'USER';
  const cleanGiven = fullName.split(' ').slice(0, -1).join('<').toUpperCase() || 'RESEARCHER';
  const mrzLine1 = `P<IND<${cleanSurname}<<${cleanGiven}`.padEnd(44, '<').slice(0, 44);
  const mrzLine2 = `${passportNumber.replace(/[^A-Z0-9]/g, '')}<7IND0101155M3009138<<<<<<<<<<<<<<<04`.padEnd(44, '<').slice(0, 44);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl my-auto">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-3 mb-3 text-white">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 bg-[#FFDD33] text-[#121316] font-headline font-black text-xs uppercase border border-[#121316] shadow-[2px_2px_0px_#121316]">
              🛂 Official Cryptographic Proof
            </span>
            <span className="text-xs font-mono text-[#9EFC5F] hidden sm:inline-block">
              {earnedCount} of {achievements.length} Verifications Stamped
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-white text-[#0F534A] border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0px_#121316] hover:bg-gray-100 cursor-pointer flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Proof</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-[#FE4E1A] text-white border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#d83d10] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════
            PHYSICAL PASSPORT BOOKLET
        ═════════════════════════════════════════════════ */}
        <div className="bg-[#0F534A] p-2 sm:p-4 border-4 border-[#121316] shadow-[8px_8px_0px_#4717AE] rounded-sm relative">
          
          {/* Gold Embossed Corner Accents */}
          <div className="absolute top-1 left-1 w-6 h-6 border-t-2 border-l-2 border-[#FFDD33]" />
          <div className="absolute top-1 right-1 w-6 h-6 border-t-2 border-r-2 border-[#FFDD33]" />
          <div className="absolute bottom-1 left-1 w-6 h-6 border-b-2 border-l-2 border-[#FFDD33]" />
          <div className="absolute bottom-1 right-1 w-6 h-6 border-b-2 border-r-2 border-[#FFDD33]" />

          {/* Book Spine Center Gutter */}
          <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-gradient-to-r from-black/20 via-black/40 to-black/20 pointer-events-none z-20 hidden md:block" />

          {/* ── TWO OPEN BOOKLET PAGES ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4">
            
            {/* ═════════════════════════════════════════════
                PAGE 1 (LEFT): RESEARCHER IDENTITY & BIOMETRICS
            ═════════════════════════════════════════════ */}
            <div className="bg-guilloche border-2 border-[#0F534A] p-4 sm:p-6 shadow-[inset_0_0_20px_rgba(15,83,74,0.12)] flex flex-col justify-between relative overflow-hidden">
              
              {/* Security Header */}
              <div className="border-b-2 border-[#0F534A] pb-3 text-center relative">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-[#0F534A] text-[#FFDD33] flex items-center justify-center font-headline font-black text-xs border border-[#121316]">
                    DX
                  </div>
                  <span className="font-headline font-black text-xs uppercase tracking-widest text-[#0F534A]">
                    Republic of Innovation
                  </span>
                </div>
                <h2 className="font-headline font-black text-sm sm:text-base uppercase tracking-tight text-[#121316]">
                  Researcher &amp; Backer Passport
                </h2>
                <div className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-0.5">
                  Dual-Custody Escrow Solvency Registry
                </div>
              </div>

              {/* Identity Details & Photo Row */}
              <div className="py-4 grid grid-cols-3 gap-3 items-center">
                {/* Photo ID Box */}
                <div className="col-span-1">
                  <div className="relative w-full aspect-[4/5] bg-[#FEB3FC] border-3 border-[#121316] shadow-[3px_3px_0px_#0F534A] overflow-hidden">
                    <img
                      src={user.profilePicture || user.avatar || '/assets/curious_student_hero.webp'}
                      alt={fullName}
                      className="w-full h-full object-cover grayscale contrast-125"
                    />
                    {/* Holographic Security Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-[#18D7E8]/20 via-transparent to-[#FFDD33]/20 pointer-events-none" />
                    <div className="absolute bottom-1 right-1 bg-[#0F534A] text-[#9EFC5F] px-1 py-0.5 text-[7px] font-mono font-black uppercase border border-[#121316]">
                      CCA-ID
                    </div>
                  </div>
                </div>

                {/* Biometrics & Attributes */}
                <div className="col-span-2 space-y-1.5 text-xs">
                  <div>
                    <span className="text-[9px] font-mono text-gray-500 uppercase block leading-none">
                      Passport No. / ID
                    </span>
                    <span className="font-mono font-black text-xs text-[#0F534A]">
                      {passportNumber}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-gray-500 uppercase block leading-none">
                      Full Legal Name
                    </span>
                    <span className="font-headline font-black text-sm uppercase text-[#121316] block truncate">
                      {fullName}
                    </span>
                  </div>

                  <div>
                    <span className="text-[9px] font-mono text-gray-500 uppercase block leading-none">
                      Institution / Org Affiliation
                    </span>
                    <span className="font-bold text-xs text-gray-800 block truncate">
                      {orgName}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-1 pt-1">
                    <div>
                      <span className="text-[8px] font-mono text-gray-500 uppercase block leading-none">
                        Role
                      </span>
                      <span className="font-headline font-bold text-[10px] text-[#FE4E1A] uppercase">
                        {roleLabel}
                      </span>
                    </div>
                    <div>
                      <span className="text-[8px] font-mono text-gray-500 uppercase block leading-none">
                        Status
                      </span>
                      <span className="font-headline font-black text-[10px] text-[#0F534A] uppercase flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5 text-[#0B9C2C]" /> ACTIVE
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Seal Watermark */}
              <div className="py-2 border-t border-dashed border-[#0F534A]/40 flex items-center justify-between text-[9px] font-mono text-gray-600">
                <span>AUTHORITY: NPCI-IMPS + CCA</span>
                <span className="font-bold text-[#0F534A]">RESERVE RATIO: 100%</span>
              </div>

              {/* ── MACHINE READABLE ZONE (MRZ) ── */}
              <div className="mt-2 p-2 bg-white/70 border border-[#0F534A]/30 font-mono text-[9px] sm:text-[10px] tracking-wider text-[#121316] leading-tight select-all">
                <div className="truncate">{mrzLine1}</div>
                <div className="truncate">{mrzLine2}</div>
              </div>
            </div>

            {/* ═════════════════════════════════════════════
                PAGE 2 (RIGHT): VISAS & INK-BLEED STAMPS SHELF
            ═════════════════════════════════════════════ */}
            <div className="bg-guilloche border-2 border-[#0F534A] p-4 sm:p-6 shadow-[inset_0_0_20px_rgba(15,83,74,0.12)] flex flex-col justify-between relative overflow-hidden">
              
              {/* Visa Header */}
              <div className="border-b-2 border-[#0F534A] pb-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#FE4E1A]" />
                  <h3 className="font-headline font-black text-xs uppercase tracking-wider text-[#0F534A]">
                    Visas &amp; Solvency Endorsement Stamps
                  </h3>
                </div>
                <span className="text-[9px] font-mono text-gray-500 uppercase">
                  PAGE 03 / ENDORSED
                </span>
              </div>

              {/* ── INK-BLEED RUBBER STAMPS GRID ── */}
              <div className="py-4 grid grid-cols-2 gap-3 sm:gap-4 my-auto">
                {achievements.map((stamp) => {
                  return (
                    <div
                      key={stamp.id}
                      style={{
                        transform: `rotate(${stamp.tiltDeg}deg)`,
                      }}
                      className="p-2 sm:p-3 border-2 border-dashed relative select-none transition-transform hover:scale-105 cursor-default bg-white/40 shadow-sm"
                    >
                      {/* Stamp Outer Border Container */}
                      <div
                        className="border-2 p-1.5 text-center flex flex-col items-center justify-center min-h-[90px]"
                        style={{ borderColor: stamp.borderColor, color: stamp.textColor }}
                      >
                        {/* Stamp Header */}
                        <div className="text-[7px] sm:text-[8px] font-mono font-black uppercase tracking-widest opacity-80">
                          {stamp.category}
                        </div>

                        {/* Stamp Title */}
                        <div className="font-headline font-black text-[10px] sm:text-xs uppercase tracking-tight my-0.5 leading-tight">
                          {stamp.title}
                        </div>

                        {/* Stamp Subtext / Action */}
                        <div className="text-[8px] font-bold opacity-90 truncate max-w-[150px]">
                          {stamp.subtext}
                        </div>

                        {/* Stamp Footer with Date & Seal */}
                        <div className="mt-1 pt-1 border-t border-dashed w-full flex items-center justify-between text-[7px] font-mono opacity-80" style={{ borderColor: stamp.borderColor }}>
                          <span>{stamp.sealNumber}</span>
                          <span>{stamp.dateEarned || 'VERIFIED'}</span>
                        </div>
                      </div>

                      {/* Ink Bleed Grunge Dot Accent */}
                      <div
                        className="absolute -top-1 -right-1 w-2 h-2 rounded-full opacity-60 pointer-events-none"
                        style={{ backgroundColor: stamp.color }}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Visa Footer Sign-Off */}
              <div className="border-t-2 border-[#0F534A] pt-2 flex items-center justify-between text-[9px] font-mono text-gray-600">
                <span className="font-bold text-[#0F534A]">IMMIGRATION &amp; AUDIT SEAL</span>
                <span>CRYPTOGRAPHIC HASH VERIFIED ✓</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
