import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCampaignUrl } from '../utils/campaignRouting';
import {
  Building2,
  Globe,
  ShieldCheck,
  Users,
  Rocket,
  CheckCircle2,
  Sparkles,
  Share2,
  ExternalLink,
  PlusCircle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  BookOpen,
  Cpu,
  Layers,
  MapPin,
  Mail,
  Calendar,
  Target,
  Clock,
  Award,
  AlertCircle,
  ChevronRight,
  Zap,
  Wrench,
  QrCode,
  FileText,
  CheckCheck,
  Key,
  Laptop,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getPublicClubById, sendJoinRequest, type PublicSingleClub } from '../services/clubService';
import { FooterContent } from '../sections/Footer/components/FooterContent';
import SEO from './SEO';
import { useAuth } from '../context/AuthContext';

import EditClubProfileModal from './president/EditClubProfileModal';

/* ─────────────────────────────────────────────
   DYNAMIC PRESENTATION INTERFACE FOR CLUBS
───────────────────────────────────────────── */
interface ClubPreset {
  motto: string;
  tagline: string;
  category: string;
  labLocation: string;
  meetingSchedule: string;
  facultyAdvisor: { name: string; designation: string; department: string };
  technicalStacks: Array<{ name: string; description: string; tag: string }>;
  facilities: string[];
}

export default function ClubDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [club, setClub] = useState<PublicSingleClub | null>(null);
  const [loading, setLoading] = useState(true);
  type TabKey = 'campaigns' | 'about' | 'team' | 'escrow' | 'member-hub';
  const [activeTab, setActiveTab] = useState<TabKey>('campaigns');
  const [isJoining, setIsJoining] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Equipment & Lab Reservation State
  const [selectedEquipment, setSelectedEquipment] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('Tomorrow, 10:00 AM - 1:00 PM');
  const [rollNumber, setRollNumber] = useState<string>('');
  const [bookingPurpose, setBookingPurpose] = useState<string>('Milestone Prototype Testing & Assembly');
  const [bookedPass, setBookedPass] = useState<{
    passId: string;
    equipment: string;
    slot: string;
    issuedTo: string;
    time: string;
  } | null>(null);

  // Modal Dialogs
  const [showCredentialModal, setShowCredentialModal] = useState<boolean>(false);
  const [showEvidenceModal, setShowEvidenceModal] = useState<boolean>(false);
  const [showJoinRoleModal, setShowJoinRoleModal] = useState<boolean>(false);
  const [selectedJoinRole, setSelectedJoinRole] = useState<string>('STUDENT');

  const fetchClub = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const res = await getPublicClubById(id);
      if (res.success && res.data) {
        setClub(res.data);
      } else {
        setClub(null);
      }
    } catch (err) {
      console.error('Club fetch error:', err);
      setClub(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClub();
  }, [id]);

  // Determine membership status of the logged in user
  const isMember = useMemo(() => {
    if (!user || !club) return false;
    if (club.members?.some((m) => m.userId === user.id || m.email?.toLowerCase() === user.email?.toLowerCase())) {
      return true;
    }
    if (user.clubIds?.includes(club.id)) {
      return true;
    }
    return false;
  }, [user, club]);

  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  // Authorization check for editing club profile
  const canEditClub = useMemo(() => {
    if (!user || !club) return false;
    if (['ADMIN', 'DX_ADMIN', 'SUPER_ADMIN'].includes(user.role)) return true;
    if (user.id === club.president?.userId) return true;
    if (user.role === 'STUDENT_PRESIDENT' && (user.clubIds?.includes(club.id) || club.president?.email === user.email)) return true;
    return false;
  }, [user, club]);

  // Resolve presentation metadata dynamically from the PostgreSQL club record
  const preset: ClubPreset = useMemo(() => {
    // 1. Dynamic database metadata if provided by backend
    if (club?.technicalStacks && club.technicalStacks.length > 0) {
      return {
        motto: club.motto || (club.description ? `"${club.description}"` : `Advancing student innovation at ${club.college || club.name}`),
        tagline: club.tagline || `${club.name} — Technical Research & Prototyping Chapter`,
        category: club.category || (club.isIndependent ? 'Open Innovation Collective' : 'Campus Engineering Chapter'),
        labLocation: club.labLocation || (club.isIndependent ? 'Virtual Collaborative Lab & Prototyping Shed' : `Innovation & Prototyping Lab, ${club.parent?.name || club.college}`),
        meetingSchedule: club.meetingSchedule || 'Weekly Research Assembly',
        facultyAdvisor: club.facultyAdvisor || {
          name: club.isIndependent ? 'Advisory Council' : 'Faculty Research Mentor',
          designation: 'Research Advisor',
          department: club.parent?.name || club.college || 'Engineering & Technology',
        },
        technicalStacks: club.technicalStacks,
        facilities: club.facilities && club.facilities.length > 0 ? club.facilities : [
          `${club.parent?.name || club.college || 'Campus'} Prototyping Cluster`,
          'Precision Diagnostic & Hardware Test Benches',
        ],
      };
    }

    // 2. Intelligent contextual derivation for newly created clubs before first profile customization
    const isIndie = club?.isIndependent || !club?.parentId;
    const campusName = club?.parent?.name || club?.college || 'Campus';
    const clubTitle = club?.name || 'Student Innovation Club';
    const desc = (club?.description || '').toLowerCase();
    const titleLower = clubTitle.toLowerCase();

    const derivedStacks: Array<{ name: string; description: string; tag: string }> = [];

    if (desc.includes('ai') || desc.includes('quantum') || desc.includes('data') || titleLower.includes('ai') || titleLower.includes('quantum')) {
      derivedStacks.push({ name: 'PyTorch & Edge Inferencing', description: 'Model quantization, low-latency inferencing, and sensory data pipelines.', tag: 'AI & Data' });
    }
    if (desc.includes('robot') || desc.includes('rover') || desc.includes('drone') || titleLower.includes('robot') || titleLower.includes('aero')) {
      derivedStacks.push({ name: 'ROS2 & Micro-Actuation', description: 'Kinematic planning, hardware telemetry, and brushless motor control.', tag: 'Robotics' });
    }
    if (desc.includes('bio') || desc.includes('health') || desc.includes('medical') || titleLower.includes('bio')) {
      derivedStacks.push({ name: 'Bio-Signal Acquisition & CAD', description: 'Differential biosensing, signal filtering, and biocompatible SLA housings.', tag: 'Bioengineering' });
    }
    if (desc.includes('ev') || desc.includes('battery') || desc.includes('energy') || desc.includes('climate') || titleLower.includes('mobility')) {
      derivedStacks.push({ name: 'Regenerative Power & BMS', description: 'Thermal telemetry, high-efficiency motor controllers, and regenerative braking.', tag: 'CleanTech' });
    }

    // Ensure baseline engineering stacks
    if (derivedStacks.length === 0) {
      derivedStacks.push(
        { name: 'Rapid Prototyping & CAD', description: 'Mechanical and electronic schematic design for rapid lab turnaround.', tag: 'Hardware' },
        { name: 'Connected Embedded Systems', description: 'Real-time sensor buses, LoRa/WiFi telemetry, and telemetry pipelines.', tag: 'Systems' }
      );
    }
    derivedStacks.push({ name: 'Double-Entry Escrow Ledger', description: 'Transparent milestone disbursement and audited proof-of-work via DreamXec.', tag: 'Governance' });

    const derivedFacilities = club?.facilities && club.facilities.length > 0 ? club.facilities : [
      `${campusName} Innovation Lab & CAD Workstations`,
      'Precision Electronic Soldering, Oscilloscopes & Multimeter Benches',
      'Prototype Fabrication & Component Inventory',
    ];

    return {
      motto: club?.motto || (club?.description
        ? `"${club.description}"`
        : (isIndie
            ? '"Accelerating decentralized student research & open innovation initiatives 🚀"'
            : `"Advancing cutting-edge technology and campus research at ${campusName} 🏛️"`)),
      tagline: club?.tagline || `${clubTitle} — Research & Prototyping Chapter`,
      category: club?.category || (isIndie ? 'Open Innovation Collective' : 'Campus Engineering Chapter'),
      labLocation: club?.labLocation || (isIndie
        ? 'Cross-Campus Collaborative Virtual Lab & Prototyping Shed'
        : `Innovation Lab, ${campusName}`),
      meetingSchedule: club?.meetingSchedule || 'Weekly Community Research Meetups',
      facultyAdvisor: club?.facultyAdvisor || {
        name: isIndie ? 'Open Advisory Board' : 'Faculty Research Mentor',
        designation: isIndie ? 'Advisory Panel' : 'Associate Professor & Research Guide',
        department: campusName,
      },
      technicalStacks: derivedStacks,
      facilities: derivedFacilities,
    };
  }, [club]);

  const handleJoinClub = () => {
    if (!user) {
      toast.error('Please log in or register to join this club.');
      navigate('/login', { state: { from: `/clubs/${club?.slug || id}` } });
      return;
    }

    if (isMember) {
      toast.success('You are already a verified member of this club!');
      return;
    }

    const availableRoles = club?.allowedRoles && club.allowedRoles.length > 0
      ? club.allowedRoles
      : ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER'];

    if (!availableRoles.includes(selectedJoinRole)) {
      setSelectedJoinRole(availableRoles[0]);
    }

    setShowJoinRoleModal(true);
  };

  const handleConfirmRoleJoin = async () => {
    if (!club) return;
    try {
      setIsJoining(true);
      await sendJoinRequest(club.id || id || '', selectedJoinRole);
      setShowJoinRoleModal(false);
      navigate(`/onboarding/${club.slug || club.id}?role=${selectedJoinRole}`);
    } catch (err: any) {
      console.error('Join error:', err);
      setShowJoinRoleModal(false);
      navigate(`/onboarding/${club.slug || club.id}?role=${selectedJoinRole}`);
    } finally {
      setIsJoining(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setIsCopied(true);
      toast.success('Club link copied to clipboard! 📋');
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // Auto-select first facility when preset changes
  useEffect(() => {
    if (preset.facilities && preset.facilities.length > 0 && !selectedEquipment) {
      setSelectedEquipment(preset.facilities[0]);
    }
  }, [preset, selectedEquipment]);

  const handleBookEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please log in or register to reserve club lab facilities.');
      navigate('/login', { state: { from: `/clubs/${club?.slug || id}` } });
      return;
    }
    if (!isMember) {
      toast.error(`You must be a member of ${club?.name} to reserve institutional equipment.`);
      return;
    }
    const passId = `DX-LAB-${Math.floor(1000 + Math.random() * 9000)}`;
    setBookedPass({
      passId,
      equipment: selectedEquipment || preset.facilities[0],
      slot: selectedSlot,
      issuedTo: user.name || user.fullName || user.email || 'Verified Student Researcher',
      time: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }),
    });
    toast.success(`🎉 Lab bench reserved! Pass #${passId} generated.`);
  };

  const handleLaunchCampaign = () => {
    if (!user) {
      navigate('/login', { state: { from: `/create-campaign?clubId=${club?.id}` } });
      return;
    }
    navigate(`/create-campaign?clubId=${club?.id}&clubName=${encodeURIComponent(club?.name || '')}`);
  };

  /* ── LOADING STATE ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFBF7] flex items-center justify-center p-4">
        <div className="bg-white border-4 border-[#121316] shadow-[8px_8px_0px_#121316] p-8 text-center max-w-sm w-full">
          <div className="w-12 h-12 border-4 border-[#0F534A] border-t-[#FFDD33] rounded-full animate-spin mx-auto mb-4" />
          <h2 className="font-headline font-black text-[#121316] uppercase text-sm tracking-wider">
            Loading Club Details...
          </h2>
          <p className="text-gray-500 font-sans text-xs mt-1.5">
            Connecting to DreamXec verified institutional registry
          </p>
        </div>
      </div>
    );
  }

  /* ── NOT FOUND STATE ── */
  if (!club) {
    return (
      <div className="min-h-screen bg-[#FCFBF7] flex items-center justify-center p-4">
        <div className="bg-white border-4 border-[#121316] shadow-[8px_8px_0px_#FE4E1A] p-8 text-center max-w-md w-full">
          <div className="text-5xl mb-3">🏛️</div>
          <h1 className="text-2xl font-headline font-black text-[#121316] uppercase tracking-tight">
            Club Not Found
          </h1>
          <p className="text-gray-600 font-medium text-xs sm:text-sm mt-2">
            The club you are looking for does not exist, has been merged, or was recently updated.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              to="/clubs"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0F534A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[3px_3px_0px_#121316] hover:bg-[#0c423b]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Clubs Discovery</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isIndependent = Boolean(club.isIndependent || !club.parentId);
  const collegeName = club.parent?.name || club.college || (isIndependent ? 'Cross-Campus Collective' : 'NITKKR');
  const campaignsList = club.campaigns || [];
  const membersList = club.members || [];
  const totalRaised = Number(club.totalRaised || 0);
  const totalMilestones = Number(club.totalMilestones || campaignsList.reduce((a, c) => a + (c.milestones?.length || 0), 0));
  const completedMilestones = Number(club.completedMilestones || campaignsList.reduce((a, c) => a + (c.milestones?.filter((m) => ['COMPLETED', 'VERIFIED', 'APPROVED'].includes(m.status)).length || 0), 0));
  const milestonePercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 100;

  return (
    <>
      <SEO
        title={`${club.name} | ${collegeName} | DreamXec`}
        description={
          club.description?.slice(0, 160) ||
          `Explore verified research campaigns, student engineering projects, and milestones from ${club.name} on DreamXec.`
        }
        url={`https://dreamxec.com/clubs/${club.slug || club.id}`}
        structuredData={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: club.name,
          url: `https://dreamxec.com/clubs/${club.slug || club.id}`,
          description: club.description || preset.tagline,
          parentOrganization: {
            '@type': 'CollegeOrUniversity',
            name: collegeName,
          },
        }}
      />

      <div className="min-h-screen bg-[#FCFBF7] text-[#121316] font-sans antialiased">
        
        {/* ── BREADCRUMBS & DISCOVERY RETURN ── */}
        <div className="bg-[#FFF9F2] border-b-2 border-[#121316]/15 py-3 px-4 sm:px-6 lg:px-12">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <Link
              to="/clubs"
              className="inline-flex items-center gap-1.5 font-headline font-black text-[#0F534A] hover:text-[#FE4E1A] uppercase tracking-wider transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Explore All Clubs</span>
            </Link>

            <div className="flex items-center gap-1.5 text-gray-500 font-medium">
              <span className="hidden sm:inline">Institutions</span>
              <ChevronRight className="w-3 h-3 text-gray-400 hidden sm:inline" />
              <span className="font-bold text-[#0F534A]">{collegeName}</span>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <span className="font-bold text-[#121316] truncate max-w-[200px]">{club.name}</span>
            </div>
          </div>
        </div>

        {/* ── HERO BANNER ── */}
        <section className="relative bg-gradient-to-br from-[#0F534A] via-[#09352F] to-[#121316] text-white border-b-4 border-[#121316] overflow-hidden">
          {/* Ambient Glows & Grid */}
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
              backgroundSize: '36px 36px',
            }}
          />
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#9EFC5F]/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-[#FE4E1A]/20 blur-3xl pointer-events-none" />

          {/* Top Tricolor / Accent Border */}
          <div className="h-1.5 w-full flex">
            <div className="flex-1 bg-[#FE4E1A]" />
            <div className="flex-1 bg-[#FFDD33]" />
            <div className="flex-1 bg-[#9EFC5F]" />
            <div className="flex-1 bg-[#18D7E8]" />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-10 sm:py-14 md:py-16">
            
            {/* Classification & Verified Seals */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              {isIndependent ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FE4E1A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-white shadow-[2px_2px_0px_#121316]">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Open & Cross-Campus Collective</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#9EFC5F] text-[#0F534A] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{collegeName} Verified Campus Chapter</span>
                </div>
              )}

              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFDD33] text-[#121316] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0F534A] stroke-[2.5]" />
                <span>Escrow Protected</span>
              </div>

              <span className="text-[11px] font-mono font-bold text-gray-300 ml-auto hidden md:inline-block">
                ID: {club.slug || club.id.substring(0, 12)}
              </span>
            </div>

            {/* Club Headline */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-headline font-black uppercase tracking-tight text-white leading-none">
              {club.name}
            </h1>

            {/* Subline Tagline */}
            <p className="text-gray-200 font-medium text-xs sm:text-base mt-2 max-w-3xl leading-relaxed">
              {club.description || preset.tagline}
            </p>

            {/* Motto in Badlooking Brush */}
            <div className="mt-3 font-annotation text-[#9EFC5F] text-base sm:text-xl md:text-2xl tracking-wide max-w-3xl">
              {preset.motto}
            </div>

            {/* Quick Metadata Bar */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-5 text-xs text-gray-300 font-medium mt-5 pt-4 border-t border-white/15">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#FFDD33]" />
                <span>{preset.labLocation}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#18D7E8]" />
                <span>{preset.meetingSchedule}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#9EFC5F]" />
                <span>
                  {club.president ? (
                    <>Lead: <strong className="text-white">{club.president.name}</strong></>
                  ) : (
                    <>Roster: <strong className="text-white">{membersList.length || club.membersCount || 1} Builders</strong></>
                  )}
                </span>
              </div>
            </div>

            {/* Hero Action CTAs */}
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleJoinClub}
                disabled={isJoining || isMember}
                className={`px-6 sm:px-8 py-3 font-headline font-black text-xs sm:text-sm uppercase tracking-wider border-3 border-[#121316] transition-all flex items-center gap-2 cursor-pointer ${
                  isMember
                    ? 'bg-[#9EFC5F] text-[#0F534A] shadow-[4px_4px_0px_#121316] cursor-default'
                    : 'bg-[#FFDD33] text-[#121316] shadow-[4px_4px_0px_#FE4E1A] hover:bg-[#ffe247] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5'
                }`}
              >
                {isJoining ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#121316] border-t-transparent rounded-full animate-spin" />
                    <span>Enrolling...</span>
                  </>
                ) : isMember ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#0F534A]" />
                    <span>Verified Member</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4 text-[#FE4E1A]" />
                    <span>Join Club</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('member-hub')}
                className={`px-5 sm:px-6 py-3 font-headline font-black text-xs sm:text-sm uppercase tracking-wider border-3 border-[#121316] transition-all flex items-center gap-2 cursor-pointer ${
                  isMember
                    ? 'bg-[#4717AE] text-white shadow-[4px_4px_0px_#FFDD33] hover:bg-[#3d1396]'
                    : 'bg-white text-[#4717AE] shadow-[4px_4px_0px_#121316] hover:bg-[#FFF9F2]'
                } hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5`}
              >
                <Zap className="w-4 h-4 text-[#FFDD33]" />
                <span>{isMember ? 'Member Workspace' : 'Member Privileges'}</span>
              </button>

              <button
                type="button"
                onClick={handleLaunchCampaign}
                className="px-5 sm:px-6 py-3 bg-white text-[#0F534A] font-headline font-black text-xs sm:text-sm uppercase tracking-wider border-3 border-[#121316] shadow-[4px_4px_0px_#121316] hover:bg-[#FFF9F2] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2 cursor-pointer"
              >
                <Rocket className="w-4 h-4 text-[#FE4E1A]" />
                <span>Launch Campaign</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="px-4 py-3 bg-[#121316] text-white hover:bg-black font-headline font-black text-xs uppercase tracking-wider border-2 border-white/40 shadow-[3px_3px_0px_#0F534A] flex items-center gap-1.5 transition-all cursor-pointer"
                title="Share Club Link"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-[#9EFC5F]" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Share'}</span>
              </button>

              {canEditClub && (
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-5 sm:px-6 py-3 bg-[#FFDD33] text-[#0F534A] hover:bg-[#ffe359] font-headline font-black text-xs sm:text-sm uppercase tracking-wider border-3 border-[#121316] shadow-[4px_4px_0px_#121316] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5 flex items-center gap-2 transition-all cursor-pointer"
                  title="Customize Club Profile, Tech Stacks & Facilities"
                >
                  <Wrench className="w-4 h-4 text-[#FE4E1A]" />
                  <span>Edit Club Profile</span>
                </button>
              )}
            </div>

          </div>
        </section>

        {/* ── ESCROW & IMPACT METRICS RIBBON ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 -mt-6 relative z-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            
            {/* Metric 1: Escrow Raised */}
            <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0px_#0F534A] p-4 sm:p-5 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-headline font-black uppercase text-[#0F534A] tracking-wider">
                Escrow Secured
              </span>
              <div className="text-2xl sm:text-3xl font-headline font-black text-[#121316] mt-1">
                ₹{totalRaised.toLocaleString('en-IN')}
              </div>
              <div className="text-[10px] text-gray-500 font-mono mt-1 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                <span>Milestone-gated trust</span>
              </div>
            </div>

            {/* Metric 2: Research Campaigns */}
            <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0px_#FE4E1A] p-4 sm:p-5 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-headline font-black uppercase text-[#FE4E1A] tracking-wider">
                Research Initiatives
              </span>
              <div className="text-2xl sm:text-3xl font-headline font-black text-[#121316] mt-1">
                {campaignsList.length}
              </div>
              <div className="text-[10px] text-gray-500 font-medium mt-1">
                Active & completed projects
              </div>
            </div>

            {/* Metric 3: Milestones Verified */}
            <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0px_#FFDD33] p-4 sm:p-5 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-headline font-black uppercase text-[#121316] tracking-wider">
                Milestones Delivered
              </span>
              <div className="text-2xl sm:text-3xl font-headline font-black text-[#121316] mt-1">
                {completedMilestones} <span className="text-sm text-gray-400 font-normal">/ {totalMilestones || 3}</span>
              </div>
              <div className="text-[10px] text-emerald-700 font-bold mt-1">
                {milestonePercent}% Verification Rate
              </div>
            </div>

            {/* Metric 4: Verified Members */}
            <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0px_#4717AE] p-4 sm:p-5 flex flex-col justify-between">
              <span className="text-[10px] sm:text-[11px] font-headline font-black uppercase text-[#4717AE] tracking-wider">
                Verified Contributors
              </span>
              <div className="text-2xl sm:text-3xl font-headline font-black text-[#121316] mt-1">
                {membersList.length || club.membersCount || 1}
              </div>
              <div className="text-[10px] text-gray-500 font-medium mt-1">
                Student researchers & leads
              </div>
            </div>

          </div>
        </section>

        {/* ── INTERACTIVE TAB NAVIGATION ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 mt-8 sm:mt-12">
          <div className="flex border-b-3 border-[#121316] overflow-x-auto scrollbar-hide gap-1 sm:gap-2">
            
            <button
              type="button"
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 sm:px-6 py-3 font-headline font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 border-t-3 border-x-3 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'campaigns'
                  ? 'bg-white border-[#121316] text-[#0F534A] shadow-[0px_4px_0px_#fff] -mb-[3px] z-10'
                  : 'bg-gray-100 border-transparent text-gray-500 hover:text-[#121316] hover:bg-gray-200'
              }`}
            >
              <Rocket className="w-4 h-4 text-[#FE4E1A]" />
              <span>Research Campaigns ({campaignsList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`px-4 sm:px-6 py-3 font-headline font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 border-t-3 border-x-3 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'about'
                  ? 'bg-white border-[#121316] text-[#0F534A] shadow-[0px_4px_0px_#fff] -mb-[3px] z-10'
                  : 'bg-gray-100 border-transparent text-gray-500 hover:text-[#121316] hover:bg-gray-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#0F534A]" />
              <span>About & Focus</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('team')}
              className={`px-4 sm:px-6 py-3 font-headline font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 border-t-3 border-x-3 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'team'
                  ? 'bg-white border-[#121316] text-[#0F534A] shadow-[0px_4px_0px_#fff] -mb-[3px] z-10'
                  : 'bg-gray-100 border-transparent text-gray-500 hover:text-[#121316] hover:bg-gray-200'
              }`}
            >
              <Users className="w-4 h-4 text-[#4717AE]" />
              <span>Team & Roster ({membersList.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('escrow')}
              className={`px-4 sm:px-6 py-3 font-headline font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 border-t-3 border-x-3 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'escrow'
                  ? 'bg-white border-[#121316] text-[#0F534A] shadow-[0px_4px_0px_#fff] -mb-[3px] z-10'
                  : 'bg-gray-100 border-transparent text-gray-500 hover:text-[#121316] hover:bg-gray-200'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Escrow Protocols</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('member-hub')}
              className={`px-4 sm:px-6 py-3 font-headline font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 border-t-3 border-x-3 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'member-hub'
                  ? 'bg-white border-[#121316] text-[#FE4E1A] shadow-[0px_4px_0px_#fff] -mb-[3px] z-10'
                  : 'bg-gray-100 border-transparent text-gray-500 hover:text-[#121316] hover:bg-gray-200'
              }`}
            >
              <Zap className="w-4 h-4 text-[#FE4E1A]" />
              <span>⚡ Member Privileges & Hub</span>
              {isMember && (
                <span className="w-2 h-2 rounded-full bg-[#9EFC5F] inline-block animate-pulse" />
              )}
            </button>

          </div>
        </section>

        {/* ── TAB CONTENT ── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 sm:py-10">

          {/* ════════════════════════════════════
              TAB 1: RESEARCH CAMPAIGNS
          ════════════════════════════════════ */}
          {activeTab === 'campaigns' && (
            <div className="space-y-6">
              {campaignsList.length === 0 ? (
                <div className="p-8 sm:p-12 text-center bg-white border-3 border-dashed border-[#0F534A]/30">
                  <div className="w-12 h-12 rounded-full bg-[#FFF9F2] border-2 border-[#121316] flex items-center justify-center mx-auto mb-3">
                    <Rocket className="w-6 h-6 text-[#FE4E1A]" />
                  </div>
                  <h3 className="font-headline font-black uppercase text-base text-[#121316]">
                    No Active Campaigns Currently
                  </h3>
                  <p className="text-gray-500 text-xs sm:text-sm max-w-md mx-auto mt-1">
                    Verified members of {club.name} can submit research proposals to launch the club's next milestone-protected campaign.
                  </p>
                  <button
                    type="button"
                    onClick={handleLaunchCampaign}
                    className="mt-5 px-6 py-2.5 bg-[#FE4E1A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[3px_3px_0px_#121316] hover:bg-[#e03d0d] transition-all cursor-pointer"
                  >
                    Submit New Proposal
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {campaignsList.map((campaign) => {
                    const raised = Number(campaign.currentAmount ?? campaign.amountRaised ?? 0);
                    const goal = Number(campaign.goalAmount ?? campaign.targetAmount ?? 0);
                    const pct = goal > 0 ? Math.min(Math.round((raised / goal) * 100), 100) : 0;
                    const milestones = campaign.milestones || [];

                    return (
                      <div
                        key={campaign.id}
                        className="group bg-white border-3 border-[#121316] shadow-[5px_5px_0px_#0F534A] hover:shadow-[7px_7px_0px_#FE4E1A] transition-all duration-200 flex flex-col overflow-hidden"
                      >
                        {/* Campaign Cover Image */}
                        <div className="relative h-44 sm:h-48 w-full bg-gray-100 overflow-hidden border-b-3 border-[#121316]">
                          {campaign.imageUrl || campaign.coverImageUrl ? (
                            <img
                              src={campaign.imageUrl || campaign.coverImageUrl}
                              alt={campaign.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#0F534A] flex items-center justify-center text-white text-3xl font-black">
                              DX
                            </div>
                          )}

                          {/* Category Badge */}
                          <div className="absolute top-3 left-3 bg-[#FFDD33] text-[#121316] font-headline font-black text-[10px] uppercase px-2.5 py-1 border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                            {campaign.category || 'INNOVATION'}
                          </div>

                          {/* Status Badge */}
                          <div className="absolute top-3 right-3 bg-[#9EFC5F] text-[#0F534A] font-headline font-black text-[10px] uppercase px-2 py-0.5 border border-[#121316]">
                            {campaign.status || 'LIVE'}
                          </div>
                        </div>

                        {/* Campaign Card Body */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div>
                            <span className="text-[10px] text-gray-500 font-mono font-bold uppercase tracking-wider">
                              Lead: {campaign.studentName || 'Student Researcher'}
                            </span>
                            <h4 className="font-headline font-black text-[#121316] text-base line-clamp-2 mt-1 leading-snug">
                              {campaign.title}
                            </h4>
                            <p className="text-gray-600 text-xs line-clamp-2 mt-1.5 leading-relaxed">
                              {campaign.description?.replace(/^[#*-\s]+/gm, '') || 'Research campaign backed by milestone escrow.'}
                            </p>
                          </div>

                          {/* Progress & Milestone Snapshot */}
                          <div className="mt-4 pt-3 border-t border-gray-100">
                            <div className="flex justify-between items-baseline text-xs mb-1.5 font-headline font-black">
                              <span className="text-[#0F534A]">₹{raised.toLocaleString('en-IN')}</span>
                              <span className="text-gray-400 font-medium">Goal: ₹{goal.toLocaleString('en-IN')}</span>
                            </div>

                            {/* Progress Bar */}
                            <div className="w-full h-2.5 bg-gray-100 border border-[#121316] overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#0F534A] to-[#9EFC5F] transition-all duration-500"
                                style={{ width: `${pct}%` }}
                              />
                            </div>

                            {/* Milestone Sequence Checklist */}
                            {milestones.length > 0 && (
                              <div className="mt-3 space-y-1">
                                {milestones.slice(0, 2).map((m, idx) => (
                                  <div key={m.id || idx} className="flex items-center justify-between text-[10px]">
                                    <span className="truncate max-w-[170px] text-gray-600 font-medium">
                                      M{idx + 1}: {m.title}
                                    </span>
                                    <span
                                      className={`px-1.5 py-0.5 font-black uppercase text-[9px] ${
                                        ['COMPLETED', 'VERIFIED', 'APPROVED'].includes(m.status)
                                          ? 'bg-[#9EFC5F] text-[#0F534A]'
                                          : 'bg-amber-100 text-amber-800'
                                      }`}
                                    >
                                      {m.status}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Back Project Button */}
                            {getCampaignUrl(campaign.slug || campaign.id).startsWith('http') ? (
                              <a
                                href={getCampaignUrl(campaign.slug || campaign.id)}
                                className="mt-4 w-full py-2.5 bg-[#0F534A] hover:bg-[#0c423b] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[3px_3px_0px_#FE4E1A] flex items-center justify-center gap-1.5 transition-all text-center"
                              >
                                <span>Back this Project</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </a>
                            ) : (
                              <Link
                                to={getCampaignUrl(campaign.slug || campaign.id)}
                                className="mt-4 w-full py-2.5 bg-[#0F534A] hover:bg-[#0c423b] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[3px_3px_0px_#FE4E1A] flex items-center justify-center gap-1.5 transition-all"
                              >
                                <span>Back this Project</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════
              TAB 2: ABOUT & TECHNICAL FOCUS
          ════════════════════════════════════ */}
          {activeTab === 'about' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
              
              {/* Left 2 Cols: Story, Stacks & Facilities */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Mission Statement Box */}
                <div className="bg-white border-3 border-[#121316] shadow-[5px_5px_0px_#0F534A] p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-3 text-[#0F534A]">
                    <Target className="w-5 h-5 text-[#FE4E1A]" />
                    <h3 className="font-headline font-black text-lg uppercase tracking-tight">
                      Mission & Objective
                    </h3>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed font-medium">
                    {club.description ||
                      `${club.name} is dedicated to fostering hands-on technical exploration and student-driven engineering breakthroughs. Members work collectively to design, simulate, build, and deploy genuine hardware and software solutions addressing grand technological challenges.`}
                  </p>
                  <div className="mt-4 p-3 bg-[#FCFBF7] border-l-4 border-[#0F534A] font-annotation text-[#0F534A] text-base">
                    {preset.motto}
                  </div>
                </div>

                {/* Core Technical Stacks */}
                <div className="bg-white border-3 border-[#121316] shadow-[5px_5px_0px_#FE4E1A] p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-4 text-[#121316]">
                    <Cpu className="w-5 h-5 text-[#4717AE]" />
                    <h3 className="font-headline font-black text-lg uppercase tracking-tight">
                      Technical Domains & Stack
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {preset.technicalStacks.map((stk, i) => (
                      <div key={i} className="p-3.5 bg-[#FFF9F2] border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <h4 className="font-headline font-black text-xs text-[#121316] uppercase">
                            {stk.name}
                          </h4>
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 bg-[#FFDD33] border border-[#121316]">
                            {stk.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 font-medium leading-relaxed">
                          {stk.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Facilities & Prototyping Access */}
                <div className="bg-white border-3 border-[#121316] shadow-[5px_5px_0px_#FFDD33] p-6 sm:p-8">
                  <div className="flex items-center gap-2 mb-3 text-[#121316]">
                    <Layers className="w-5 h-5 text-[#0F534A]" />
                    <h3 className="font-headline font-black text-lg uppercase tracking-tight">
                      Prototyping Labs & Facilities
                    </h3>
                  </div>
                  <ul className="space-y-2 mt-2">
                    {preset.facilities.map((fac, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-700 font-medium">
                        <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{fac}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Right Col: Faculty Advisor & Institutional Governance */}
              <div className="space-y-6">
                
                {/* Faculty Mentor Card */}
                <div className="bg-white border-3 border-[#121316] shadow-[5px_5px_0px_#4717AE] p-5 sm:p-6">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-[#4717AE] bg-[#FEB3FC]/30 px-2 py-0.5 border border-[#121316]">
                    Academic Mentorship
                  </span>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#0F534A] text-white font-headline font-black text-base flex items-center justify-center border-2 border-[#121316]">
                      {preset.facultyAdvisor.name.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-headline font-black text-sm text-[#121316]">
                        {preset.facultyAdvisor.name}
                      </h4>
                      <p className="text-[11px] text-gray-500 font-medium">
                        {preset.facultyAdvisor.designation}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 font-medium">
                    {preset.facultyAdvisor.department}
                  </div>
                </div>

                {/* Institutional Registry Card */}
                <div className="bg-[#FFF9F2] border-3 border-[#121316] shadow-[5px_5px_0px_#121316] p-5 sm:p-6 text-xs space-y-2.5">
                  <span className="font-headline font-black uppercase tracking-wider text-gray-500 text-[10px]">
                    Institutional Affiliation
                  </span>
                  <div className="font-headline font-black text-sm text-[#0F534A]">
                    {collegeName}
                  </div>
                  <div className="text-gray-600 leading-relaxed font-medium">
                    {isIndependent
                      ? 'Operates as an open, cross-institutional research collective. Welcomes students, alumni, and independent builders nationwide.'
                      : `Recognized campus chapter operating under the institutional governance and safety guidelines of ${collegeName}.`}
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex items-center justify-between text-[11px] font-mono font-bold">
                    <span className="text-gray-500">Registry Status:</span>
                    <span className="text-emerald-700">VERIFIED ACTIVE</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* ════════════════════════════════════
              TAB 3: TEAM & MEMBER ROSTER
          ════════════════════════════════════ */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              
              {/* President Spotlight Card */}
              {club.president && (
                <div className="bg-white border-3 border-[#121316] shadow-[6px_6px_0px_#FE4E1A] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-[#FFDD33] text-[#121316] font-headline font-black text-xl flex items-center justify-center border-3 border-[#121316] shadow-[2px_2px_0px_#121316]">
                      {club.president.name.slice(0, 2)}
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#FE4E1A] text-white text-[10px] font-headline font-black uppercase tracking-wider border border-[#121316]">
                        <Award className="w-3 h-3" />
                        <span>Student President & Project Lead</span>
                      </div>
                      <h3 className="text-xl font-headline font-black text-[#121316] mt-1">
                        {club.president.name}
                      </h3>
                      <p className="text-xs text-gray-600 font-medium">
                        {club.president.designation} &bull; {club.president.department || collegeName}
                      </p>
                    </div>
                  </div>

                  <div className="text-left sm:text-right text-xs">
                    <span className="text-gray-500 font-bold uppercase text-[10px]">Academic Credential:</span>
                    <div className="font-mono font-bold text-emerald-700 mt-0.5">
                      ✓ Institutional Email Verified
                    </div>
                  </div>
                </div>
              )}

              {/* Members Grid */}
              <div className="bg-white border-3 border-[#121316] shadow-[5px_5px_0px_#0F534A] p-6 sm:p-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#0F534A]" />
                    <h3 className="font-headline font-black text-lg uppercase tracking-tight">
                      Active Research Roster ({membersList.length})
                    </h3>
                  </div>
                  <span className="text-xs text-gray-500 font-medium hidden sm:inline">
                    Updated live from DreamXec membership registry
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {membersList.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 bg-[#FCFBF7] border-2 border-[#121316] shadow-[3px_3px_0px_#121316] flex items-center gap-3"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#0F534A] text-white font-headline font-black text-sm flex items-center justify-center border border-[#121316]">
                        {member.name?.slice(0, 2) || 'DX'}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-headline font-black text-xs text-[#121316] truncate">
                          {member.name}
                        </div>
                        <div className="text-[10px] text-[#FE4E1A] font-bold truncate">
                          {member.designation || member.role}
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono truncate">
                          {member.department || 'Researcher'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Member Callout */}
                <div className="mt-8 p-4 bg-[#FEB3FC]/20 border-2 border-dashed border-[#121316] text-xs flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="font-medium text-gray-700 text-center sm:text-left">
                    Are you a student researcher passionate about this domain? Join the club to get listed and collaborate on projects.
                  </div>
                  <button
                    type="button"
                    onClick={handleJoinClub}
                    disabled={isMember}
                    className="px-4 py-2 bg-[#0F534A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#0c423b] whitespace-nowrap cursor-pointer"
                  >
                    {isMember ? 'Already Member' : 'Apply to Join'}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ════════════════════════════════════
              TAB 4: ESCROW PROTOCOLS & GOVERNANCE
          ════════════════════════════════════ */}
          {activeTab === 'escrow' && (
            <div className="bg-white border-3 border-[#121316] shadow-[5px_5px_0px_#0F534A] p-6 sm:p-8 space-y-6">
              <div>
                <span className="text-[10px] font-headline font-black uppercase tracking-wider text-[#0F534A] bg-[#9EFC5F]/40 px-2.5 py-1 border border-[#121316]">
                  Dual-Entry Escrow Architecture
                </span>
                <h3 className="font-headline font-black text-xl uppercase tracking-tight text-[#121316] mt-2">
                  How DreamXec Protects Club Research Funds
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm mt-1 max-w-3xl leading-relaxed">
                  Unlike traditional crowdfunding platforms that release lump sums directly to student bank accounts, DreamXec holds all contributed capital in immutable, milestone-gated double-entry escrow accounts (<code className="bg-gray-100 px-1.5 py-0.5 border border-gray-300 font-mono text-[11px]">2010_CAMPAIGN_ESCROW</code>).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                
                <div className="p-4 bg-[#FFF9F2] border-2 border-[#121316] shadow-[3px_3px_0px_#121316]">
                  <div className="w-8 h-8 rounded-full bg-[#0F534A] text-white flex items-center justify-center font-bold text-xs mb-2">
                    1
                  </div>
                  <h4 className="font-headline font-black text-xs uppercase text-[#121316]">
                    Tranche-Gated Releases
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                    Funds are locked until student leads submit tangible proof (BOM invoices, field videos, PCB schematics) for that specific milestone tranche.
                  </p>
                </div>

                <div className="p-4 bg-[#FFF9F2] border-2 border-[#121316] shadow-[3px_3px_0px_#121316]">
                  <div className="w-8 h-8 rounded-full bg-[#FE4E1A] text-white flex items-center justify-center font-bold text-xs mb-2">
                    2
                  </div>
                  <h4 className="font-headline font-black text-xs uppercase text-[#121316]">
                    Site Admin Verification
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                    Platform compliance officers independently review submitted evidence and audit receipts before authorizing release from the liability ledger.
                  </p>
                </div>

                <div className="p-4 bg-[#FFF9F2] border-2 border-[#121316] shadow-[3px_3px_0px_#121316]">
                  <div className="w-8 h-8 rounded-full bg-[#4717AE] text-white flex items-center justify-center font-bold text-xs mb-2">
                    3
                  </div>
                  <h4 className="font-headline font-black text-xs uppercase text-[#121316]">
                    Institutional Accountability
                  </h4>
                  <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">
                    Campus clubs are linked directly to accredited universities ({collegeName}), maintaining academic oversight and reputational integrity.
                  </p>
                </div>

              </div>

              <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                <span className="text-gray-500 font-medium">
                  Have questions about club escrow and research governance?
                </span>
                <a
                  href="mailto:compliance@dreamxec.com"
                  className="font-headline font-black text-[#0F534A] hover:text-[#FE4E1A] uppercase tracking-wider flex items-center gap-1"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Contact Governance Desk</span>
                </a>
              </div>
            </div>
          )}

          {/* ════════════════════════════════════
              TAB 5: MEMBER PRIVILEGES & WORKSPACE
          ════════════════════════════════════ */}
          {activeTab === 'member-hub' && (
            <div className="space-y-8">
              {/* Member Status Hero Banner */}
              <div className={`border-4 border-[#121316] p-6 sm:p-8 text-white relative overflow-hidden ${
                isMember
                  ? 'bg-[#0F534A] shadow-[8px_8px_0px_#9EFC5F]'
                  : 'bg-[#4717AE] shadow-[8px_8px_0px_#FFDD33]'
              }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2 max-w-2xl">
                    <span className={`text-[10px] font-headline font-black uppercase tracking-wider px-3 py-1 border border-[#121316] inline-block ${
                      isMember ? 'bg-[#9EFC5F] text-[#0F534A]' : 'bg-[#FFDD33] text-[#121316]'
                    }`}>
                      {isMember ? '✦ ACTIVE INSTITUTIONAL RESEARCHER ACCESS ✦' : '✦ WHAT YOU UNLOCK BY JOINING ✦'}
                    </span>
                    <h3 className="font-headline font-black text-2xl sm:text-3xl uppercase tracking-tight text-white">
                      {isMember
                        ? `Welcome to your ${club.name} Workspace`
                        : `What You Can Do After Joining ${club.name}`}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-sans">
                      {isMember
                        ? `You are an active verified member of this chapter. You hold full privileges to propose research campaigns, reserve prototyping hardware, contribute to milestone evidence, and claim verified credentials.`
                        : `Joining this club connects your student identity to accredited campus labs, milestone-gated escrow funding, and corporate grant pools. Experience real hands-on engineering.`}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
                    {isMember ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowCredentialModal(true)}
                          className="px-5 py-3 bg-[#FFDD33] text-[#121316] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[3px_3px_0px_#121316] hover:bg-[#ffe247] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Award className="w-4 h-4 text-[#0F534A]" />
                          <span>View Digital Credential</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleLaunchCampaign}
                          className="px-5 py-3 bg-white text-[#0F534A] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[3px_3px_0px_#121316] hover:bg-[#FFF9F2] flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Rocket className="w-4 h-4 text-[#FE4E1A]" />
                          <span>Launch New Campaign</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleJoinClub}
                        disabled={isJoining}
                        className="px-6 py-3.5 bg-[#FFDD33] text-[#121316] font-headline font-black text-sm uppercase tracking-wider border-3 border-[#121316] shadow-[4px_4px_0px_#FE4E1A] hover:bg-[#ffe247] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isJoining ? (
                          <span>Enrolling...</span>
                        ) : (
                          <>
                            <PlusCircle className="w-4 h-4 text-[#FE4E1A]" />
                            <span>Join Club to Unlock Privileges</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 5 Core Capabilities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* Capability 1: Launch Campaign */}
                <div className="bg-white border-3 border-[#121316] shadow-[5px_5px_0px_#FE4E1A] p-6 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-[#FE4E1A]/10 border-2 border-[#121316] flex items-center justify-center mb-4">
                      <Rocket className="w-6 h-6 text-[#FE4E1A]" />
                    </div>
                    <div className="text-[10px] font-headline font-black uppercase text-[#FE4E1A] tracking-wider mb-1">
                      Privilege 01
                    </div>
                    <h4 className="font-headline font-black text-base uppercase text-[#121316]">
                      Launch Escrow-Backed Research Campaigns
                    </h4>
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                      Propose genuine engineering projects under the club banner. Campaigns inherit the club's verification badge, parent institution credentials ({collegeName}), and double-entry milestone escrow accounts.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleLaunchCampaign}
                      className="w-full py-2.5 bg-[#FFF9F2] hover:bg-[#FE4E1A] hover:text-white text-[#FE4E1A] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Propose Project Now</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Capability 2: Reserve Lab Equipment */}
                <div className="bg-white border-3 border-[#121316] shadow-[5px_5px_0px_#0F534A] p-6 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-[#0F534A]/10 border-2 border-[#121316] flex items-center justify-center mb-4">
                      <Wrench className="w-6 h-6 text-[#0F534A]" />
                    </div>
                    <div className="text-[10px] font-headline font-black uppercase text-[#0F534A] tracking-wider mb-1">
                      Privilege 02
                    </div>
                    <h4 className="font-headline font-black text-base uppercase text-[#121316]">
                      Reserve Prototyping Hardware & Lab Benches
                    </h4>
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                      Verified members get priority booking for high-end equipment like 3D printer clusters, 5-axis CNC mills, logic analyzers, and testbeds in {preset.labLocation}.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <a
                      href="#lab-reservation-desk"
                      className="w-full py-2.5 bg-[#9EFC5F]/20 hover:bg-[#0F534A] hover:text-white text-[#0F534A] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center"
                    >
                      <span>Go to Reservation Desk</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>

                {/* Capability 3: Milestone Evidence & Disbursement */}
                <div className="bg-white border-3 border-[#121316] shadow-[5px_5px_0px_#4717AE] p-6 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-[#4717AE]/10 border-2 border-[#121316] flex items-center justify-center mb-4">
                      <FileText className="w-6 h-6 text-[#4717AE]" />
                    </div>
                    <div className="text-[10px] font-headline font-black uppercase text-[#4717AE] tracking-wider mb-1">
                      Privilege 03
                    </div>
                    <h4 className="font-headline font-black text-base uppercase text-[#121316]">
                      Submit Milestone Evidence for Escrow Payouts
                    </h4>
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                      Collaborate on live projects and upload BOM invoices, test footage, and CAD files. Approvals trigger direct disbursements from the platform's immutable escrow ledger.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowEvidenceModal(true)}
                      className="w-full py-2.5 bg-[#4717AE]/10 hover:bg-[#4717AE] hover:text-white text-[#4717AE] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Evidence Guidelines</span>
                      <CheckCheck className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Capability 4: Verified Credential */}
                <div className="bg-white border-3 border-[#121316] shadow-[5px_5px_0px_#18D7E8] p-6 flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 bg-[#18D7E8]/20 border-2 border-[#121316] flex items-center justify-center mb-4">
                      <Award className="w-6 h-6 text-[#0F534A]" />
                    </div>
                    <div className="text-[10px] font-headline font-black uppercase text-[#0F534A] tracking-wider mb-1">
                      Privilege 04
                    </div>
                    <h4 className="font-headline font-black text-base uppercase text-[#121316]">
                      Official Verified Researcher Credential
                    </h4>
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                      Earn a cryptographically verified researcher badge on your public DreamXec profile, validated against your university email (@vit.ac.in) and club membership history.
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowCredentialModal(true)}
                      className="w-full py-2.5 bg-[#18D7E8]/20 hover:bg-[#121316] hover:text-white text-[#121316] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Preview Digital Pass</span>
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Capability 5: Non-Dilutive Grant Pools */}
                <div className="bg-white border-3 border-[#121316] shadow-[5px_5px_0px_#FFDD33] p-6 flex flex-col justify-between md:col-span-2 lg:col-span-2">
                  <div>
                    <div className="w-12 h-12 bg-[#FFDD33]/30 border-2 border-[#121316] flex items-center justify-center mb-4">
                      <Building2 className="w-6 h-6 text-[#121316]" />
                    </div>
                    <div className="text-[10px] font-headline font-black uppercase text-[#0F534A] tracking-wider mb-1">
                      Privilege 05
                    </div>
                    <h4 className="font-headline font-black text-base uppercase text-[#121316]">
                      Access Dedicated Institutional Grant Pools & Competitions
                    </h4>
                    <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                      Members are eligible for direct matching funds from corporate endowments like the <strong>DreamX Funding Trust</strong> and government bodies like the <strong>National Innovation & Research Authority</strong> (up to ₹5,00,000 non-dilutive capital per initiative).
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                    <span className="text-[11px] font-mono text-gray-500">
                      Eligible for: National Innovation Challenge & Robocon Travel Grants
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('campaigns')}
                      className="px-4 py-2 bg-[#FFDD33] hover:bg-[#ffe247] text-[#121316] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <span>Explore Active Pools</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Interactive Lab Bench Reservation Desk */}
              <div id="lab-reservation-desk" className="bg-white border-4 border-[#0F534A] shadow-[8px_8px_0px_#121316] p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b-3 border-[#0F534A] gap-3">
                  <div>
                    <span className="text-[10px] font-headline font-black uppercase tracking-wider text-[#0F534A] bg-[#9EFC5F]/40 px-2.5 py-1 border border-[#121316]">
                      Institutional Hardware Access
                    </span>
                    <h3 className="font-headline font-black text-xl sm:text-2xl uppercase tracking-tight text-[#121316] mt-2">
                      {preset.labLocation} — Bench Reservation Desk
                    </h3>
                    <p className="text-xs text-gray-600 font-medium mt-1">
                      Select high-precision equipment, pick an available prototyping slot, and receive your digital access pass.
                    </p>
                  </div>
                  <div className="text-xs font-mono font-bold text-[#0F534A] bg-[#FFF9F2] p-2.5 border-2 border-[#121316] shrink-0">
                    Faculty Advisor: {preset.facultyAdvisor.name}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
                  {/* Reservation Form */}
                  <form onSubmit={handleBookEquipment} className="lg:col-span-7 space-y-4">
                    <div>
                      <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                        Select Prototyping Equipment / Testbed *
                      </label>
                      <select
                        value={selectedEquipment}
                        onChange={(e) => setSelectedEquipment(e.target.value)}
                        className="w-full px-4 py-3 bg-white border-3 border-[#0F534A] font-headline font-bold text-xs uppercase text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[3px_3px_0px_#0F534A]"
                      >
                        {preset.facilities.map((fac, idx) => (
                          <option key={idx} value={fac}>
                            {fac}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                          Reservation Window *
                        </label>
                        <select
                          value={selectedSlot}
                          onChange={(e) => setSelectedSlot(e.target.value)}
                          className="w-full px-4 py-3 bg-white border-3 border-[#0F534A] font-headline font-bold text-xs uppercase text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[3px_3px_0px_#0F534A]"
                        >
                          <option value="Today, 4:00 PM - 7:00 PM">Today, 4:00 PM - 7:00 PM</option>
                          <option value="Tomorrow, 10:00 AM - 1:00 PM">Tomorrow, 10:00 AM - 1:00 PM</option>
                          <option value="Tomorrow, 2:00 PM - 5:00 PM">Tomorrow, 2:00 PM - 5:00 PM</option>
                          <option value="Saturday Intensive, 10:00 AM - 4:00 PM">Saturday Intensive, 10:00 AM - 4:00 PM</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                          Student Roll / ID
                        </label>
                        <input
                          type="text"
                          value={rollNumber}
                          onChange={(e) => setRollNumber(e.target.value)}
                          placeholder="e.g. 12015089"
                          className="w-full px-4 py-3 border-3 border-[#0F534A] font-headline font-bold text-xs uppercase text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[3px_3px_0px_#0F534A]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                        Project & Prototyping Purpose
                      </label>
                      <input
                        type="text"
                        value={bookingPurpose}
                        onChange={(e) => setBookingPurpose(e.target.value)}
                        placeholder="e.g. PCB SMD Soldering & RTK-GPS Sensor Integration"
                        className="w-full px-4 py-3 border-3 border-[#0F534A] font-headline font-bold text-xs text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[3px_3px_0px_#0F534A]"
                      />
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={!isMember}
                        className={`w-full py-3.5 font-headline font-black text-xs uppercase tracking-wider border-3 border-[#121316] shadow-[4px_4px_0px_#121316] transition-all flex items-center justify-center gap-2 cursor-pointer ${
                          isMember
                            ? 'bg-[#9EFC5F] text-[#0F534A] hover:bg-[#85ee42] active:translate-x-0.5 active:translate-y-0.5'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Laptop className="w-4 h-4" />
                        <span>{isMember ? 'Confirm Lab Bench Reservation' : 'Join Club to Reserve Equipment'}</span>
                      </button>
                      {!isMember && (
                        <p className="text-[11px] text-gray-500 text-center mt-2 font-medium">
                          Only verified members can reserve campus hardware. Click <strong>"Join Club"</strong> at the top to enroll.
                        </p>
                      )}
                    </div>
                  </form>

                  {/* Pass Preview or Confirmed Ticket */}
                  <div className="lg:col-span-5 bg-[#FCFBF7] border-3 border-[#121316] p-5 flex flex-col justify-between shadow-[4px_4px_0px_#0F534A]">
                    {bookedPass ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b-2 border-[#121316]">
                          <span className="text-[10px] font-headline font-black bg-[#9EFC5F] text-[#0F534A] px-2 py-0.5 border border-[#121316]">
                            ✓ RESERVATION CONFIRMED
                          </span>
                          <span className="font-mono text-xs font-bold text-[#FE4E1A]">
                            {bookedPass.passId}
                          </span>
                        </div>

                        <div>
                          <div className="text-[10px] text-gray-500 font-bold uppercase">Reserved Hardware</div>
                          <div className="font-headline font-black text-sm text-[#121316] mt-0.5">
                            {bookedPass.equipment}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase">Time Slot</div>
                            <div className="font-bold text-[#0F534A] mt-0.5">{bookedPass.slot}</div>
                          </div>
                          <div>
                            <div className="text-[10px] text-gray-500 font-bold uppercase">Issued To</div>
                            <div className="font-bold text-[#121316] mt-0.5 truncate">{bookedPass.issuedTo}</div>
                          </div>
                        </div>

                        <div className="p-3 bg-white border-2 border-[#121316] flex items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="text-[10px] font-bold text-gray-500">Security Validation</div>
                            <div className="font-mono text-[11px] font-bold text-[#0F534A]">
                              QR: DX-NITKKR-PASS-{bookedPass.passId.slice(-4)}
                            </div>
                          </div>
                          <QrCode className="w-8 h-8 text-[#0F534A] shrink-0" />
                        </div>

                        <div className="text-[10px] text-gray-500 font-medium leading-relaxed">
                          Show this pass to the lab technician at {preset.labLocation} on entry.
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 space-y-3">
                        <div className="w-12 h-12 bg-white border-2 border-[#121316] rounded-full flex items-center justify-center mx-auto text-[#0F534A]">
                          <QrCode className="w-6 h-6" />
                        </div>
                        <div className="font-headline font-black text-xs uppercase text-[#121316]">
                          Digital Pass Preview
                        </div>
                        <p className="text-[11px] text-gray-500 max-w-xs mx-auto leading-relaxed">
                          Fill out the form on the left to generate your confirmed lab access token and QR pass.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>
          )}

        </section>

        {/* ── MODAL: VERIFIED DIGITAL CREDENTIAL ── */}
        {showCredentialModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white border-4 border-[#121316] shadow-[10px_10px_0px_#0F534A] max-w-md w-full p-6 sm:p-8 relative">
              <button
                type="button"
                onClick={() => setShowCredentialModal(false)}
                className="absolute top-4 right-4 p-1.5 bg-gray-100 hover:bg-gray-200 border-2 border-[#121316] cursor-pointer"
              >
                <X className="w-4 h-4 text-[#121316]" />
              </button>

              <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#9EFC5F] border-2 border-[#121316] text-[#0F534A] font-headline font-black text-[10px] uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Institutional Credential</span>
                </div>

                <div className="w-20 h-20 rounded-full bg-[#0F534A] text-white font-headline font-black text-2xl flex items-center justify-center border-3 border-[#121316] mx-auto shadow-[4px_4px_0px_#FFDD33]">
                  {user?.name?.slice(0, 2) || user?.fullName?.slice(0, 2) || 'DX'}
                </div>

                <div>
                  <h3 className="font-headline font-black text-xl uppercase text-[#121316]">
                    {user?.name || user?.fullName || 'Student Researcher'}
                  </h3>
                  <p className="text-xs text-[#FE4E1A] font-bold font-headline uppercase mt-0.5">
                    {isMember ? 'Active Club Researcher' : 'Prospective Member'}
                  </p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">
                    {user?.email || 'verified.student@vit.ac.in'}
                  </p>
                </div>

                <div className="p-4 bg-[#FFF9F2] border-2 border-[#121316] text-left space-y-2 text-xs">
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-gray-500 font-medium">Chapter:</span>
                    <span className="font-bold text-[#121316] truncate max-w-[200px]">{club.name}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-gray-500 font-medium">Affiliation:</span>
                    <span className="font-bold text-[#0F534A]">{collegeName}</span>
                  </div>
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-gray-500 font-medium">Ledger Certificate:</span>
                    <span className="font-mono font-bold text-[#4717AE]">DX-CERT-{club.slug?.slice(0, 6).toUpperCase() || '7789'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">Status:</span>
                    <span className="font-headline font-black text-[#0F534A] bg-[#9EFC5F]/40 px-1.5 py-0.5 border border-[#121316]">
                      {isMember ? 'ACTIVE MEMBER' : 'PENDING ENROLLMENT'}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Credential link copied to clipboard!');
                    }}
                    className="flex-1 py-2.5 bg-[#0F534A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#0c423b] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5 text-[#9EFC5F]" />
                    <span>Copy Verification Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCredentialModal(false)}
                    className="py-2.5 px-4 bg-gray-100 text-[#121316] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] hover:bg-gray-200 cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: MILESTONE EVIDENCE GUIDELINES ── */}
        {showEvidenceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white border-4 border-[#121316] shadow-[10px_10px_0px_#4717AE] max-w-lg w-full p-6 sm:p-8 relative">
              <button
                type="button"
                onClick={() => setShowEvidenceModal(false)}
                className="absolute top-4 right-4 p-1.5 bg-gray-100 hover:bg-gray-200 border-2 border-[#121316] cursor-pointer"
              >
                <X className="w-4 h-4 text-[#121316]" />
              </button>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-[#4717AE] bg-[#FEB3FC]/30 px-2.5 py-1 border border-[#121316]">
                    Escrow Governance
                  </span>
                  <h3 className="font-headline font-black text-xl uppercase tracking-tight text-[#121316] mt-2">
                    Milestone Evidence & Deliverables Desk
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    To trigger disbursement from the double-entry escrow account (<code className="font-mono text-[11px] bg-gray-100 px-1 border border-gray-300">2010_CAMPAIGN_ESCROW</code>), teams must submit verified evidence for each tranche:
                  </p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-[#FFF9F2] border-2 border-[#121316] flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#0F534A] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      1
                    </div>
                    <div>
                      <div className="font-headline font-black text-[#121316] uppercase">BOM Invoices & Procurement Receipts</div>
                      <div className="text-[11px] text-gray-600 mt-0.5">Itemized GST receipts matching approved bill-of-materials components.</div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FFF9F2] border-2 border-[#121316] flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#FE4E1A] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      2
                    </div>
                    <div>
                      <div className="font-headline font-black text-[#121316] uppercase">On-Site Demonstration Video</div>
                      <div className="text-[11px] text-gray-600 mt-0.5">Uncut high-definition test footage showing prototype operational telemetry.</div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FFF9F2] border-2 border-[#121316] flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#4717AE] text-white font-bold flex items-center justify-center shrink-0 text-xs">
                      3
                    </div>
                    <div>
                      <div className="font-headline font-black text-[#121316] uppercase">Git Commits & Open CAD Files</div>
                      <div className="text-[11px] text-gray-600 mt-0.5">Repository links with working firmware, ROS2 packages, and PCB schematics.</div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#FFF9F2] border-2 border-[#121316] flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#18D7E8] text-[#121316] font-bold flex items-center justify-center shrink-0 text-xs">
                      4
                    </div>
                    <div>
                      <div className="font-headline font-black text-[#121316] uppercase">Faculty Mentor Endorsement</div>
                      <div className="text-[11px] text-gray-600 mt-0.5">Formal sign-off by {preset.facultyAdvisor.name} approving tranche completion.</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEvidenceModal(false);
                      setActiveTab('campaigns');
                    }}
                    className="flex-1 py-2.5 bg-[#0F534A] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#0c423b] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View Club Campaigns</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowEvidenceModal(false)}
                    className="py-2.5 px-4 bg-gray-100 text-[#121316] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] hover:bg-gray-200 cursor-pointer"
                  >
                    Got It
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {canEditClub && club && (
          <EditClubProfileModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            club={club}
            onProfileUpdated={(updatedClub) => {
              setClub(updatedClub);
            }}
          />
        )}

        {/* ── MODAL: ROLE-BASED CLUB ONBOARDING WORKFLOW LAUNCHER ── */}
        {showJoinRoleModal && club && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white border-4 border-[#121316] shadow-[10px_10px_0px_#FE4E1A] max-w-lg w-full p-6 sm:p-8 relative">
              <button
                type="button"
                onClick={() => setShowJoinRoleModal(false)}
                className="absolute top-4 right-4 p-1.5 bg-gray-100 hover:bg-gray-200 border-2 border-[#121316] cursor-pointer"
              >
                <X className="w-4 h-4 text-[#121316]" />
              </button>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-white bg-[#FE4E1A] px-2.5 py-1 border border-[#121316] inline-block">
                    Exact Role-Based Workflow
                  </span>
                  <h3 className="font-headline font-black text-xl uppercase tracking-tight text-[#121316] mt-2">
                    Join {club.name}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 font-medium">
                    Clubs strictly require an approved institutional role and verification workflow. Select your role to begin:
                  </p>
                </div>

                {/* Role Choices */}
                <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                  {(club.allowedRoles && club.allowedRoles.length > 0
                    ? club.allowedRoles
                    : ['STUDENT', 'STUDENT_PRESIDENT', 'RESEARCHER']
                  ).map((roleKey) => {
                    const isSelected = selectedJoinRole === roleKey;
                    const roleUpper = roleKey.toUpperCase();

                    const roleDetails: Record<string, { label: string; desc: string; icon: string }> = {
                      STUDENT: {
                        label: 'Student Researcher / Member',
                        desc: 'Join technical divisions, prototype in the lab, and collaborate on funded research projects.',
                        icon: '🎓',
                      },
                      STUDENT_PRESIDENT: {
                        label: 'Student President & Chapter Lead',
                        desc: 'Lead the executive committee, manage equipment, and coordinate with faculty advisors.',
                        icon: '🏛️',
                      },
                      RESEARCHER: {
                        label: 'Lab Research Investigator',
                        desc: 'Lead grant milestones, conduct experiment protocols, and mentor division students.',
                        icon: '🔬',
                      },
                      MENTOR: {
                        label: 'Technical Club Mentor',
                        desc: 'Guide engineering architecture, code reviews, and industry sponsorship.',
                        icon: '🧑‍🏫',
                      },
                      ORG_ADMIN: {
                        label: 'Campus Chapter Administrator',
                        desc: 'Oversee institutional compliance, lab reservations, and student verification rosters.',
                        icon: '⚙️',
                      },
                    };

                    const details = roleDetails[roleUpper] || {
                      label: roleUpper.replace(/_/g, ' '),
                      desc: `Complete official role verification for ${roleUpper.replace(/_/g, ' ')}.`,
                      icon: '🪪',
                    };

                    return (
                      <div
                        key={roleKey}
                        onClick={() => setSelectedJoinRole(roleKey)}
                        className={`p-3.5 border-2 cursor-pointer transition-all flex items-start gap-3 ${
                          isSelected
                            ? 'bg-[#FFDD33]/20 border-[#121316] shadow-[3px_3px_0_#121316]'
                            : 'bg-white border-gray-200 hover:border-[#121316]'
                        }`}
                      >
                        <span className="text-2xl shrink-0 mt-0.5">{details.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-headline font-black text-xs uppercase text-[#0F534A]">
                              {details.label}
                            </h4>
                            <div
                              className={`w-4 h-4 rounded-full border-2 border-[#121316] flex items-center justify-center ${
                                isSelected ? 'bg-[#FE4E1A]' : 'bg-white'
                              }`}
                            >
                              {isSelected && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                          </div>
                          <p className="text-[11px] text-gray-600 mt-1 font-medium leading-relaxed">
                            {details.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-3 bg-[#FCFBF7] border border-[#121316] text-[11px] text-gray-700 font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#0F534A] shrink-0" />
                  <span>
                    Your verification workflow will be launched under dual-custody governance.
                  </span>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmRoleJoin}
                    disabled={isJoining}
                    className="flex-1 py-3 bg-[#FE4E1A] hover:bg-[#F4002C] text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[3px_3px_0px_#121316] flex items-center justify-center gap-2 cursor-pointer transition-all hover:-translate-x-0.5 hover:-translate-y-0.5"
                  >
                    {isJoining ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Initiating Workflow...</span>
                      </>
                    ) : (
                      <>
                        <span>Start {selectedJoinRole.replace(/_/g, ' ')} Workflow</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowJoinRoleModal(false)}
                    className="py-3 px-4 bg-gray-100 text-[#121316] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] hover:bg-gray-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <FooterContent />
      </div>
    </>
  );
}