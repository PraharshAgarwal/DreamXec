import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Sparkles,
  Globe,
  Dna,
  Share2,
  X,
  Trees,
  Activity,
  Heart,
  User,
  UserCheck,
  Calendar,
  Shield,
  ShieldCheck,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import type { SpeciesIdentity, User as UserType } from '../../types';
import { getAvatarUrl } from '../../utils/avatarHelper';
import { API_BASE_URL } from '../../utils/apiConfig';
import toast from 'react-hot-toast';

interface SpeciesCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  speciesIdentity?: SpeciesIdentity | null;
  username?: string;
  user?: UserType | null;
}

export const SpeciesCardModal: React.FC<SpeciesCardModalProps> = ({
  isOpen,
  onClose,
  speciesIdentity,
  username,
  user
}) => {
  const [copied, setCopied] = useState(false);
  const [liveSpecies, setLiveSpecies] = useState<SpeciesIdentity | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeAccessory, setActiveAccessory] = useState<string>('none');
  const [activeMood, setActiveMood] = useState<string>('happy');
  const [activeShape, setActiveShape] = useState<'circle' | 'badge'>('circle');
  const [showStudio, setShowStudio] = useState(false);

  // Fallback defaults grounded in real seed dataset if props not fully populated
  const defaultSpecies: SpeciesIdentity = {
    slug: "saola",
    commonName: "Saola",
    scientificName: "Pseudoryx nghetinhensis",
    taxonomicGroup: "MAMMAL",
    category: "CRITICALLY_ENDANGERED",
    speciesId: "7efbe203-cd88-4423-b35a-9dd2aac72111",
    speciesNumber: user?.speciesNumber || 1,
    totalCount: 50,
    assignedCount: 1,
    habitat: "Annamite Range evergreen wet mountain forests",
    region: "Vietnam & Laos",
    avatarUrl: "/api/species/saola/avatar.svg",
    thumbnailUrl: "/api/species/saola/avatar.svg",
    description: "Known as the Asian Unicorn, famous for long, needle-sharp parallel horns.",
    badgeTitle: "Saola #1 / 50",
  };

  const currentSpeciesSlug =
    speciesIdentity?.slug ||
    user?.speciesIdentity?.slug ||
    (username ? username.replace(/_\d+$/, '') : null) ||
    'saola';

  // Fetch full live backend data for this species slug
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchLiveSpecies = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/species/${currentSpeciesSlug}`);
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && json?.data?.species) {
          const s = json.data.species;
          setLiveSpecies({
            speciesId: s.id,
            commonName: s.commonName,
            scientificName: s.scientificName,
            slug: s.slug,
            taxonomicGroup: s.taxonomicGroup,
            category: s.category,
            estimatedCount: s.estimatedCount,
            totalCount: s.estimatedCount,
            assignedCount: s.assignedCount,
            habitat: s.habitat,
            region: s.region,
            description: s.description,
            avatarUrl: s.avatarUrl || `/api/species/${s.slug}/avatar.svg`,
            thumbnailUrl: s.thumbnailUrl || `/api/species/${s.slug}/avatar.svg`,
          });
        }
      } catch (err) {
        console.warn('Failed to fetch live species metadata:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiveSpecies();

    return () => {
      isMounted = false;
    };
  }, [isOpen, currentSpeciesSlug]);

  if (!isOpen) return null;

  // Merge live fetched data > passed props > user props > defaults
  const species: SpeciesIdentity = {
    ...defaultSpecies,
    ...(user?.speciesIdentity || {}),
    ...(speciesIdentity || {}),
    ...(liveSpecies || {}),
    // Preserve exact assigned species number from user
    speciesNumber:
      speciesIdentity?.speciesNumber ||
      user?.speciesNumber ||
      user?.speciesIdentity?.speciesNumber ||
      defaultSpecies.speciesNumber ||
      1,
    speciesId:
      speciesIdentity?.speciesId ||
      user?.speciesId ||
      user?.speciesIdentity?.speciesId ||
      liveSpecies?.speciesId ||
      defaultSpecies.speciesId,
  };

  const effectiveUsername = username || user?.username || `${species.slug}_${species.speciesNumber || 1}`;
  
  const customAvatarUrl = getAvatarUrl(
    `/api/species/${species.slug}/avatar.svg`,
    species.slug,
    effectiveUsername,
    {
      accessory: activeAccessory,
      mood: activeMood,
      shape: activeShape,
      seed: effectiveUsername,
      animated: true,
    }
  );

  const defaultAvatarUrl = getAvatarUrl(species.avatarUrl || species.thumbnailUrl, species.slug, effectiveUsername);
  const displayedAvatarUrl = showStudio ? customAvatarUrl : defaultAvatarUrl;

  const totalCount = species.totalCount || (species as any).estimatedCount || 50;
  const speciesNum = species.speciesNumber || 1;
  const percentageGuarded = ((1 / totalCount) * 100).toFixed(2);

  // Format creation / assignment date
  const formatAssignedDate = (dateStr?: string) => {
    if (!dateStr) return '30 May 2024';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '30 May 2024';
    }
  };

  const assignedOnDate = formatAssignedDate(species.assignedOn || user?.createdAt);
  const assignedByOrg =
    species.assignedBy ||
    user?.activeProfile?.orgName ||
    user?.organizations?.[0]?.name ||
    'DreamXec Network';

  const uuidString = species.speciesId || '7efbe203-cd88-4423-b35a-9dd2aac72111';

  const handleCopyUuid = () => {
    navigator.clipboard.writeText(uuidString);
    setCopied(true);
    toast.success('Species UUID copied to clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyAvatarUrl = () => {
    if (displayedAvatarUrl) {
      navigator.clipboard.writeText(displayedAvatarUrl);
      toast.success('Custom avatar URL copied to clipboard!');
    }
  };

  const handleShareBadge = () => {
    const shareUrl = window.location.origin ? `${window.location.origin}/species-profile` : window.location.href;
    navigator.clipboard.writeText(shareUrl);
    toast.success('Official Species Identity Badge link copied!');
  };

  const ACCESSORY_LIST = [
    { id: 'none', label: 'Default', icon: '🌿' },
    { id: 'shades', label: 'Shades', icon: '😎' },
    { id: 'party', label: 'Party', icon: '🎉' },
    { id: 'headphones', label: 'DJ Beats', icon: '🎧' },
    { id: 'crown', label: 'Crown', icon: '👑' },
    { id: 'boba', label: 'Boba', icon: '🧋' },
    { id: 'explorer', label: 'Explorer', icon: '🧭' },
    { id: 'flower', label: 'Blossom', icon: '🌸' },
    { id: 'monocle', label: 'Monocle', icon: '🧐' },
  ];

  const MOOD_LIST = [
    { id: 'happy', label: 'Happy', emoji: '😊' },
    { id: 'cool', label: 'Cool', emoji: '😎' },
    { id: 'excited', label: 'Excited', emoji: '🤩' },
    { id: 'kawaii', label: 'Kawaii', emoji: '🥺' },
    { id: 'curious', label: 'Curious', emoji: '🤔' },
    { id: 'zen', label: 'Zen', emoji: '🧘' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      {/* ── MAIN MODAL CONTAINER ── */}
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden text-[#121316] my-auto">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full border border-gray-200 bg-white hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors shadow-xs cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-5 sm:p-7 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
          {/* ═════════════════════════════════════════════════════════════
              LEFT COLUMN (~58% width on desktop)
             ═════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. TOP SPECIES HEADER HERO */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-center gap-4 sm:gap-5">
                {/* Circular Avatar with Yellow Halo & Sparkles */}
                <div className="relative flex-shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#FFDD33]/40 border-3 border-[#121316] flex items-center justify-center relative shadow-xs p-1">
                    {/* Decorative 4-point Sparkle Stars */}
                    <Sparkles className="w-3.5 h-3.5 text-[#0F534A] absolute -top-1 -left-1 opacity-90" />
                    <Sparkles className="w-3.5 h-3.5 text-[#0F534A] absolute top-1 -right-2 opacity-90" />
                    <Sparkles className="w-3 h-3 text-[#0F534A] absolute bottom-1 -left-1 opacity-80" />

                    <img
                      src={displayedAvatarUrl}
                      alt={species.commonName}
                      key={displayedAvatarUrl}
                      className="w-full h-full rounded-full object-cover bg-white"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />

                    {/* Red Shield Overlay */}
                    <div className="absolute bottom-0 right-0 bg-[#F4002C] text-white p-1.5 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
                      <ShieldAlert className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Species Text Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="inline-block px-2.5 py-0.5 bg-[#F4002C] text-white text-[10px] font-headline font-black uppercase tracking-wider rounded-md">
                      {(species.category || 'CRITICALLY_ENDANGERED').replace(/_/g, ' ')}
                    </span>
                    <button
                      onClick={() => setShowStudio(!showStudio)}
                      className={`px-2 py-0.5 text-[10px] font-headline font-black uppercase rounded-md border border-[#121316] transition-all cursor-pointer shadow-xs flex items-center gap-1 ${
                        showStudio ? 'bg-[#4717AE] text-white' : 'bg-[#FFDD33] text-[#121316] hover:bg-[#FFE566]'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{showStudio ? 'Close Studio' : 'Avatar Fun Studio'}</span>
                    </button>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-headline font-black text-[#121316] uppercase tracking-tight leading-none mb-1 truncate">
                    {species.commonName}
                  </h2>
                  <p className="text-xs sm:text-sm italic font-semibold text-[#0F534A] leading-tight mb-2 truncate">
                    {species.scientificName}
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-xs font-headline font-extrabold uppercase text-[#4717AE]">
                    <User className="w-3.5 h-3.5 text-[#4717AE]" />
                    <span>GUARANTEED USER ASSIGNMENT #{speciesNum}</span>
                  </div>
                </div>
              </div>

              {/* ── AVATAR FUN STUDIO ACCORDION ── */}
              {showStudio && (
                <div className="mt-4 pt-4 border-t border-gray-200 space-y-3 bg-[#FCFBF7] p-3 rounded-xl border-2 border-[#121316] animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-headline font-black uppercase tracking-wide text-[#121316] flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#FE4E1A]" />
                      Wardrobe & Expression Studio
                    </span>
                    <button
                      onClick={handleCopyAvatarUrl}
                      className="text-[10px] font-headline font-bold text-[#0F534A] hover:underline cursor-pointer"
                    >
                      Copy SVG URL
                    </button>
                  </div>

                  {/* Accessory Pills */}
                  <div>
                    <span className="text-[10px] font-headline font-bold text-gray-500 uppercase block mb-1">
                      Choose Accessory:
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      {ACCESSORY_LIST.map((acc) => (
                        <button
                          key={acc.id}
                          onClick={() => setActiveAccessory(acc.id)}
                          className={`px-2 py-1 rounded-lg text-xs font-headline font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                            activeAccessory === acc.id
                              ? 'bg-[#FE4E1A] text-white border-[#121316] shadow-[1px_1px_0_#121316]'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span>{acc.icon}</span>
                          <span>{acc.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mood Selector */}
                  <div>
                    <span className="text-[10px] font-headline font-bold text-gray-500 uppercase block mb-1">
                      Expression Mood:
                    </span>
                    <div className="flex gap-1.5 flex-wrap">
                      {MOOD_LIST.map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setActiveMood(m.id)}
                          className={`px-2 py-1 rounded-lg text-xs font-headline font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                            activeMood === m.id
                              ? 'bg-[#18D7E8] text-[#121316] border-[#121316] shadow-[1px_1px_0_#121316]'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <span>{m.emoji}</span>
                          <span>{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Shape Switcher */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-headline font-bold text-gray-500 uppercase">Format:</span>
                      <button
                        onClick={() => setActiveShape('circle')}
                        className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${
                          activeShape === 'circle' ? 'bg-[#FFDD33] text-[#121316] border-[#121316]' : 'bg-white text-gray-600 border-gray-300'
                        }`}
                      >
                        Circle Sticker
                      </button>
                      <button
                        onClick={() => setActiveShape('badge')}
                        className={`px-2 py-0.5 text-[11px] font-bold rounded-md border ${
                          activeShape === 'badge' ? 'bg-[#FFDD33] text-[#121316] border-[#121316]' : 'bg-white text-gray-600 border-gray-300'
                        }`}
                      >
                        Neo Badge
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. GLOBAL LIVING POPULATION PROGRESS CARD */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs space-y-2.5">
              <div className="flex justify-between items-center text-xs font-headline font-black uppercase">
                <span className="flex items-center gap-1.5 text-[#121316]">
                  <Activity className="w-4 h-4 text-[#F4002C]" /> Global Living Population
                </span>
                <span className="text-[#F4002C] bg-white border border-red-200 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-xs">
                  {speciesNum} OF {totalCount} REMAINING
                </span>
              </div>
              <div className="w-full bg-gray-100 border border-gray-200 rounded-full h-3.5 p-0.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#FE4E1A] to-[#F4002C] h-full rounded-full transition-all duration-700 shadow-xs"
                  style={{ width: `${Math.max(6, Math.min(100, (1 / (totalCount || 50)) * 100 * 5))}%` }}
                />
              </div>
              <p className="text-[11px] font-bold text-gray-600 text-right">
                You guard <span className="text-[#0F534A] font-black underline">{percentageGuarded}%</span> of the entire global living population.
              </p>
            </div>

            {/* 3. 2x2 INFO GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* GLOBAL REGION */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-3.5 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-[#FE4E1A]" />
                  <span className="text-[10px] font-headline font-black text-gray-400 uppercase tracking-widest">
                    GLOBAL REGION
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-headline font-bold text-[#121316] leading-snug">
                  {species.region || 'Vietnam & Laos'}
                </p>
              </div>

              {/* PROTECTED HABITAT */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-3.5 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5">
                  <Trees className="w-4 h-4 text-[#0F534A]" />
                  <span className="text-[10px] font-headline font-black text-gray-400 uppercase tracking-widest">
                    PROTECTED HABITAT
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-headline font-bold text-[#121316] leading-snug">
                  {species.habitat || 'Annamite Range evergreen wet mountain forests'}
                </p>
              </div>

              {/* TAXONOMIC GROUP */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-3.5 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5">
                  <Dna className="w-4 h-4 text-[#4717AE]" />
                  <span className="text-[10px] font-headline font-black text-gray-400 uppercase tracking-widest">
                    TAXONOMIC GROUP
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-headline font-bold text-[#121316] uppercase">
                  {species.taxonomicGroup || 'MAMMAL'}
                </p>
              </div>

              {/* STATUS LEVEL */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-3.5 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-[#F4002C]" />
                  <span className="text-[10px] font-headline font-black text-gray-400 uppercase tracking-widest">
                    STATUS LEVEL
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-headline font-bold text-[#F4002C] uppercase">
                  {(species.category || 'CRITICALLY_ENDANGERED').replace(/_/g, ' ')}
                </p>
              </div>
            </div>

            {/* 4. SPECIES CONSERVATION BRIEF */}
            <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs space-y-1.5">
              <div className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#FE4E1A]" />
                <span className="text-[11px] font-headline font-black text-[#121316] uppercase tracking-wider">
                  SPECIES CONSERVATION BRIEF
                </span>
              </div>
              <p className="text-xs text-gray-700 font-medium leading-relaxed">
                {species.description || 'Known as the Asian Unicorn, famous for long, needle-sharp parallel horns.'}
              </p>
            </div>

            {/* 5. REGISTERED SPECIES IDENTITY UUID */}
            <div className="bg-[#EEF9F5] border border-[#BDE7D7] rounded-2xl p-3.5 shadow-xs space-y-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0F534A]" />
                <span className="text-xs font-headline font-extrabold text-[#0F534A]">
                  Registered Species Identity UUID:
                </span>
              </div>
              <div className="bg-white border border-gray-200 rounded-xl px-3 py-2 flex items-center justify-between shadow-xs">
                <code className="font-mono text-xs text-gray-800 tracking-tight select-all truncate">
                  {uuidString}
                </code>
                <button
                  onClick={handleCopyUuid}
                  className="p-1 text-gray-500 hover:text-[#121316] hover:bg-gray-100 rounded transition-all cursor-pointer flex-shrink-0 ml-2"
                  title="Copy UUID"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-[#0F534A]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════════
              RIGHT COLUMN (~42% width on desktop)
             ═════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-4">
              {/* 1. GREEN COMMITMENT HERO BANNER */}
              <div className="bg-[#0F534A] text-white rounded-2xl p-4 flex items-center gap-3.5 shadow-xs relative overflow-hidden">
                <div className="bg-[#16655B] p-2.5 rounded-full border border-[#238B7D] flex-shrink-0 text-[#9EFC5F]">
                  <Globe className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0 pr-5">
                  <p className="font-headline font-bold text-sm text-white leading-snug">
                    Your commitment is making a real impact!
                  </p>
                </div>
                <Sparkles className="w-4 h-4 text-[#9EFC5F] absolute top-3 right-3 opacity-90" />
              </div>

              {/* 2. ASSIGNED BY & ASSIGNED ON */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-gray-400">
                    <UserCheck className="w-4 h-4 text-[#4717AE]" />
                    <span className="text-[10px] font-headline font-bold uppercase tracking-widest">
                      ASSIGNED BY
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-headline font-bold text-[#121316] leading-snug">
                    {assignedByOrg}
                  </p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Calendar className="w-4 h-4 text-[#4717AE]" />
                    <span className="text-[10px] font-headline font-bold uppercase tracking-widest">
                      ASSIGNED ON
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-headline font-bold text-[#121316] leading-snug">
                    {assignedOnDate}
                  </p>
                </div>
              </div>

              {/* 3. YOUR IMPACT CARD */}
              <div className="bg-[#F8F5FF] border border-[#E9DFFC] rounded-2xl p-4 shadow-xs space-y-2">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#4717AE]" />
                  <span className="text-xs font-headline font-black text-[#4717AE] uppercase tracking-wider">
                    YOUR IMPACT
                  </span>
                </div>
                <p className="text-xs text-gray-700 font-medium leading-relaxed">
                  Your guardianship helps support conservation efforts, habitat protection and research.
                </p>
                <a
                  href="/campaigns"
                  className="text-xs font-headline font-bold text-[#4717AE] hover:text-[#FE4E1A] inline-flex items-center gap-1 transition-colors cursor-pointer pt-1"
                >
                  <span>Learn more</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* 4. GLOBAL POPULATION TREND CARD */}
              <div className="bg-white border border-gray-200/90 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-[#F4002C]" />
                    <span className="text-[11px] font-headline font-black text-[#121316] uppercase tracking-wider">
                      GLOBAL POPULATION TREND
                    </span>
                  </div>
                  <span className="bg-[#F4002C] text-white text-[9px] font-headline font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs">
                    AT RISK INCREASING
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 p-0.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-[#F4002C] via-[#FE4E1A] to-[#4717AE] rounded-full h-full w-[45%]" />
                </div>
                <p className="text-[11px] font-bold text-[#0F534A] text-center">
                  Target: Population down 80% since three decades.
                </p>
              </div>
            </div>

            {/* 5. FOOTER ACTION BUTTONS */}
            <div className="flex items-center gap-3 pt-3">
              <button
                onClick={handleShareBadge}
                className="flex-1 py-3 px-4 bg-[#FFDD33] hover:bg-[#FFE566] text-[#121316] border border-[#121316] rounded-xl font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Share2 className="w-4 h-4" />
                <span>SHARE IDENTITY BADGE</span>
              </button>
              <button
                onClick={onClose}
                className="py-3 px-6 bg-white hover:bg-gray-100 text-[#121316] border border-[#121316] rounded-xl font-headline font-black text-xs uppercase tracking-wider transition-all cursor-pointer shadow-xs"
              >
                <span>CLOSE</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeciesCardModal;
