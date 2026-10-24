import React, { useState } from 'react';
import {
  ShieldAlert,
  Sparkles,
  MapPin,
  Globe,
  Dna,
  Share2,
  Award,
  Trees,
  Activity,
  Heart,
  FileBadge,
  ArrowLeft,
  CheckCircle2,
  Info
} from 'lucide-react';
import type { SpeciesIdentity, User } from '../../types';
import { getAvatarUrl } from '../../utils/avatarHelper';
import { getUserRoleProfile } from '../../utils/roleUtils';
import { SpeciesCardModal } from './SpeciesCardModal';
import { ShimmerSpeciesCard } from '../common/ShimmerSkeleton';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface EndangeredSpeciesViewProps {
  user?: User | null;
  loading?: boolean;
}

export const EndangeredSpeciesView: React.FC<EndangeredSpeciesViewProps> = ({
  user,
  loading = false
}) => {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const roleProfile = getUserRoleProfile(user);
  const displayRole = roleProfile.roleLabel;
  const primaryOrgName = roleProfile.orgName;

  // Fallback defaults to real dataset schema
  const defaultSpecies: SpeciesIdentity = {
    slug: "javan_rhino",
    region: "Southeast Asia",
    habitat: "Ujung Kulon National Park, Java",
    category: "CRITICALLY_ENDANGERED",
    avatarUrl: "/api/species/javan_rhino/avatar.svg",
    speciesId: "015d2aee-0601-401d-afb7-fd589d29d949",
    badgeTitle: "Javan Rhino #1 / 76",
    commonName: "Javan Rhino",
    totalCount: 76,
    description: "One of the rarest large mammals on Earth, with all remaining individuals surviving in a single national park at the western tip of Java.",
    thumbnailUrl: "/api/species/javan_rhino/avatar.svg",
    speciesNumber: 1,
    scientificName: "Rhinoceros sondaicus",
    taxonomicGroup: "MAMMAL"
  };

  const species = user?.speciesIdentity || defaultSpecies;
  const username = user?.username || 'javan_rhino_1';
  const avatarUrl = getAvatarUrl(species.avatarUrl || species.thumbnailUrl, species.slug, username);

  if (loading) {
    return <ShimmerSpeciesCard />;
  }

  const percentageRemaining = ((1 / (species.totalCount || 76)) * 100).toFixed(2);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Endangered species profile link copied to clipboard!');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-2 sm:p-4">
      {/* ── 1. NAVIGATION HEADER ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/profile/personal')}
            className="p-2 bg-[#FCFBF7] hover:bg-[#FFDD33] border-2 border-[#121316] shadow-[2px_2px_0_#121316] rounded-lg transition-all cursor-pointer"
            title="Back to Personal Details"
          >
            <ArrowLeft className="w-5 h-5 text-[#121316]" />
          </button>
          <div>
            <h1 className="text-xl font-headline font-black uppercase text-[#121316] flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-[#FE4E1A]" /> Endangered Species Guardian Profile
            </h1>
            <p className="text-xs text-gray-600 font-semibold">
              Official Biological Identity Assignment & Conservation Metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleShare}
            className="flex-1 sm:flex-none px-4 py-2 bg-[#FFDD33] hover:bg-[#9EFC5F] border-2 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Share2 className="w-4 h-4" /> Share Profile
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <FileBadge className="w-4 h-4 text-[#FFDD33]" /> View Trading Card
          </button>
        </div>
      </div>

      {/* ── 2. HERO HEADER SECTION (UNBOXED USER & SPECIES IDENTITY) ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[8px_8px_0_#121316] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
          {/* AVATAR WITH #1 OF 76 BADGE */}
          <div className="relative flex-shrink-0">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-[#121316] shadow-[4px_4px_0_#FE4E1A] overflow-hidden bg-[#FEB3FC]">
              <img
                src={avatarUrl}
                alt={species.commonName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-[#4717AE] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] px-2.5 py-1 rounded-xl text-center">
              <span className="text-[11px] font-headline font-black block leading-none">#{species.speciesNumber || 1}</span>
              <span className="text-[8px] font-headline font-extrabold uppercase text-[#FFDD33] block leading-none pt-0.5">OF {species.totalCount || 76}</span>
            </div>
          </div>

          {/* CENTER USER & SPECIES INFO */}
          <div className="space-y-2 text-center md:text-left flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
              <h1 className="font-headline font-black text-2xl sm:text-3xl text-[#121316] uppercase tracking-wide">
                {user?.fullName || user?.name || 'Jay Kumar'}
              </h1>
              <span className="px-3 py-1 bg-[#FEB3FC] border-2 border-[#121316] shadow-[2px_2px_0_#121316] text-xs font-headline font-black text-[#121316] rounded-lg">
                @{username}
              </span>
            </div>

            <p className="text-xs font-headline font-extrabold text-[#121316] uppercase tracking-wider">
              {displayRole}
            </p>
            <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">
              {primaryOrgName}
            </p>

            {/* DYNAMIC REAL TAG PILLS */}
            <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start pt-2">
              <span className="px-3 py-1 bg-[#9EFC5F]/60 border-2 border-[#121316] shadow-[1.5px_1.5px_0_#121316] text-[10px] font-headline font-black uppercase text-[#0F534A] rounded-full">
                {species.taxonomicGroup || 'MAMMAL'}
              </span>
              <span className="px-3 py-1 bg-[#18D7E8]/40 border-2 border-[#121316] shadow-[1.5px_1.5px_0_#121316] text-[10px] font-headline font-black uppercase text-[#4717AE] rounded-full">
                {roleProfile.isIndependent ? 'INDEPENDENT USER' : roleProfile.roleLabel.toUpperCase()}
              </span>
              <span className="px-3 py-1 bg-[#FEB3FC]/60 border-2 border-[#121316] shadow-[1.5px_1.5px_0_#121316] text-[10px] font-headline font-black uppercase text-[#121316] rounded-full">
                {user?.accountStatus || 'ACTIVE'} ACCOUNT
              </span>
            </div>
          </div>

          {/* VERIFIED GUARDIAN BADGE */}
          <div className="flex-shrink-0">
            <div className="inline-flex items-center gap-1.5 bg-[#9EFC5F]/30 border-2 border-[#0F534A] px-3.5 py-1.5 rounded-full text-xs font-headline font-black text-[#0F534A] uppercase shadow-[2px_2px_0_#0F534A]">
              <CheckCircle2 className="w-4 h-4 text-[#0F534A]" />
              <span>IDENTITY VERIFIED</span>
              <CheckCircle2 className="w-4 h-4 text-[#0F534A]" />
            </div>
          </div>
        </div>

        {/* ── 3. SPECIES 4-COLUMN OVERVIEW GRID ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t-2 border-dashed border-gray-300">
          {/* COL 1: SPECIES */}
          <div className="space-y-1">
            <span className="text-[10px] font-headline font-black text-gray-400 uppercase tracking-widest block">
              SPECIES
            </span>
            <h3 className="text-xl font-headline font-black text-[#121316]">
              {species.commonName}
            </h3>
            <p className="text-xs italic text-gray-600 font-medium">
              {species.scientificName}
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1 bg-[#F4002C] text-white border border-[#121316] px-2.5 py-0.5 text-[9px] font-headline font-black uppercase rounded shadow-[1.5px_1.5px_0_#121316]">
                <ShieldAlert className="w-3 h-3 text-[#FFDD33]" />
                {(species.category || 'CRITICALLY_ENDANGERED').replace(/_/g, ' ')}
              </span>
            </div>
          </div>

          {/* COL 2: REGION */}
          <div className="space-y-1 border-l-0 sm:border-l-2 sm:border-dashed border-gray-200 pl-0 sm:pl-4">
            <div className="flex items-center gap-1 text-gray-400">
              <Globe className="w-4 h-4 text-[#18D7E8]" />
              <span className="text-[10px] font-headline font-black uppercase tracking-widest">REGION</span>
            </div>
            <p className="text-sm font-headline font-black text-[#121316]">
              {species.region}
            </p>
          </div>

          {/* COL 3: HABITAT */}
          <div className="space-y-1 border-l-0 md:border-l-2 md:border-dashed border-gray-200 pl-0 md:pl-4">
            <div className="flex items-center gap-1 text-gray-400">
              <Trees className="w-4 h-4 text-[#9EFC5F]" />
              <span className="text-[10px] font-headline font-black uppercase tracking-widest">HABITAT</span>
            </div>
            <p className="text-xs font-headline font-bold text-[#121316] leading-tight">
              {species.habitat}
            </p>
          </div>

          {/* COL 4: GROUP */}
          <div className="space-y-1 border-l-0 md:border-l-2 md:border-dashed border-gray-200 pl-0 md:pl-4">
            <div className="flex items-center gap-1 text-gray-400">
              <Dna className="w-4 h-4 text-[#4717AE]" />
              <span className="text-[10px] font-headline font-black uppercase tracking-widest">GROUP</span>
            </div>
            <p className="text-sm font-headline font-black text-[#121316]">
              {species.taxonomicGroup}
            </p>
          </div>
        </div>

        {/* SPECIES DESCRIPTION PARAGRAPH */}
        <div className="py-2">
          <p className="text-xs text-gray-700 font-medium leading-relaxed">
            {species.description}
          </p>
        </div>

        {/* METRICS FOOTER */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t-2 border-dashed border-gray-200 text-center">
          <div className="border-r-2 border-dashed border-gray-300 pr-2">
            <span className="text-[9px] font-headline font-black text-gray-400 uppercase tracking-widest block">SPECIES NUMBER</span>
            <span className="text-2xl font-headline font-black text-[#121316]">{species.speciesNumber || 1}</span>
          </div>
          <div className="border-r-2 border-dashed border-gray-300 pr-2">
            <span className="text-[9px] font-headline font-black text-gray-400 uppercase tracking-widest block">TOTAL COUNT</span>
            <span className="text-2xl font-headline font-black text-[#FE4E1A]">{species.totalCount || 76}</span>
          </div>
          <div>
            <span className="text-[9px] font-headline font-black text-gray-400 uppercase tracking-widest block">TAXONOMIC GROUP</span>
            <span className="text-base font-headline font-black text-[#4717AE] uppercase">{species.taxonomicGroup || 'MAMMAL'}</span>
          </div>
        </div>
      </div>

      {/* ── 4. CONSERVATION BAROMETER ── */}
      <div className="bg-white border-3 border-[#121316] shadow-[6px_6px_0_#121316] p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <h3 className="text-base font-headline font-black uppercase text-[#121316] flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#F4002C]" /> Global Conservation Rarity Barometer
            </h3>
            <p className="text-xs text-gray-600 font-semibold">
              Live census tracking of remaining living individuals worldwide
            </p>
          </div>
          <span className="bg-[#F4002C] text-white border-2 border-[#121316] px-3 py-1 text-xs font-headline font-black uppercase shadow-[2px_2px_0_#121316]">
            {species.speciesNumber} OF {species.totalCount} REMAINING
          </span>
        </div>

        <div className="relative h-6 w-full bg-[#FCFBF7] border-3 border-[#121316] rounded-full p-1 shadow-[inner_0_2px_4px_rgba(0,0,0,0.1)]">
          <div
            className="h-full bg-gradient-to-r from-[#FE4E1A] via-[#F4002C] to-[#4717AE] rounded-full transition-all duration-700 shadow-[2px_0_6px_rgba(254,78,26,0.6)]"
            style={{ width: `${Math.max(4, (1 / (species.totalCount || 76)) * 100 * 4)}%` }}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center text-xs font-headline font-bold text-[#0F534A] gap-2 pt-1 border-t-2 border-dashed border-gray-200">
          <span>Personal Guardian Share: <strong className="text-[#FE4E1A] text-sm">{percentageRemaining}%</strong> of total Earth population</span>
          <span>Target Protection Zone: <strong>100% Zero Poaching Reserve</strong></span>
        </div>
      </div>

      {/* ── 5. SYSTEM METADATA & COLLECTIBLE CARD TRIGGER ── */}
      <div className="bg-[#FCFBF7] border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-[10px] font-headline font-black text-gray-500 uppercase">System Species Identifier UUID</span>
          <p className="text-xs font-mono font-bold bg-white border border-[#121316] px-3 py-1.5 rounded-lg text-[#121316]">
            {species.speciesId}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="w-full sm:w-auto px-6 py-3 bg-[#FFDD33] hover:bg-[#9EFC5F] border-2 border-[#121316] shadow-[3px_3px_0_#121316] font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#FE4E1A]" /> Open Collectible Species Card
        </button>
      </div>

      {/* COLLECTIBLE CARD MODAL */}
      <SpeciesCardModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        speciesIdentity={species}
        username={username}
        user={user}
      />
    </div>
  );
};

export default EndangeredSpeciesView;
