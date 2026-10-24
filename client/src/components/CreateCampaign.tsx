import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, ShieldCheck, Sparkles, AlertCircle, Building2, Globe2, Clock, RotateCcw, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { campaignService } from '../services/campaignService';
import { sendJoinRequest } from '../services/clubService';
import { useAuth } from '@/context/AuthContext';
import { TactileNeobrutalistButton } from './ui/TactileNeobrutalistButton';
import { BrushAnnotation } from './ui/BrushAnnotation';
import { MediaDocumentUpload } from './common/MediaDocumentUpload';
import { MilestoneTrancheBuilder, MilestoneItem } from './create-campaign/MilestoneTrancheBuilder';
import { BeneficiaryEscrowConfig, BeneficiaryConfigData } from './create-campaign/BeneficiaryEscrowConfig';
import { SocialSharePreviewCard } from './create-campaign/SocialSharePreviewCard';

const STEPS = [
  { num: 1, label: 'Story & Pitch', desc: 'Title, Category & Funding Target' },
  { num: 2, label: 'Milestone Tranches', desc: 'Breakdown & Acceptance Criteria' },
  { num: 3, label: 'Beneficiary & Escrow', desc: 'Recipient Details & KYC Verification' },
  { num: 4, label: 'Media & Documents', desc: 'Cover Image, Video & Proposals' },
  { num: 5, label: 'Review & Submit', desc: 'Maker-Checker Legal Sign-off' },
];

export interface CreateCampaignProps {
  initialData?: any;
  onBack?: () => void;
  onSubmit?: (data: any) => Promise<void> | void;
}

export default function CreateCampaign({ initialData, onBack: customOnBack, onSubmit: customOnSubmit }: CreateCampaignProps = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryClubId = searchParams.get('clubId') || searchParams.get('organizationId') || '';
  const queryClubName = searchParams.get('clubName') || '';

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Club & Institutional Affiliation State
  const [organizationId, setOrganizationId] = useState(
    initialData?.organizationId ||
      initialData?.clubId ||
      queryClubId ||
      user?.activeProfile?.organizationId ||
      (user?.activeProfile as any)?.orgId ||
      ''
  );
  const [clubName, setClubName] = useState(
    initialData?.clubName ||
      queryClubName ||
      user?.activeProfile?.orgName ||
      (user?.activeProfile as any)?.name ||
      ''
  );
  const [isSendingJoinRequest, setIsSendingJoinRequest] = useState(false);
  const [joinRequested, setJoinRequested] = useState(false);

  // Sync active profile changes to form state
  useEffect(() => {
    if (user?.activeProfile) {
      const orgId = user.activeProfile.organizationId || (user.activeProfile as any).orgId || '';
      const name = user.activeProfile.orgName || (user.activeProfile as any).name || '';
      if (orgId && !queryClubId) {
        setOrganizationId(orgId);
        setClubName(name);
      }
    }
  }, [user?.activeProfile]);

  // Determine if the current user is an active verified member of the selected organization
  const isMemberOfSelectedClub = useMemo(() => {
    if (!organizationId) return true; // No organization selected -> Independent track
    if (!user) return false;

    // Check user.organizations
    if (Array.isArray(user.organizations)) {
      const match = user.organizations.find(
        (o) => o.id === organizationId || o.slug === organizationId
      );
      if (match) return true;
    }

    // Check user.availableProfiles
    if (Array.isArray((user as any).availableProfiles)) {
      const match = (user as any).availableProfiles.find(
        (p: any) =>
          (p.organizationId === organizationId || p.orgId === organizationId || p.orgSlug === organizationId) &&
          (!p.status || p.status === 'ACTIVE')
      );
      if (match) return true;
    }

    // Check user.activeProfile
    if (
      user.activeProfile?.organizationId === organizationId ||
      (user.activeProfile as any)?.orgSlug === organizationId
    ) {
      return true;
    }

    // Check user.memberships
    if (Array.isArray((user as any).memberships)) {
      const match = (user as any).memberships.find(
        (m: any) =>
          (m.organizationId === organizationId || m.organization?.slug === organizationId) &&
          m.status === 'ACTIVE'
      );
      if (match) return true;
    }

    return false;
  }, [organizationId, user]);

  // Extract all clubs where current user holds an active membership
  const userMemberClubs = useMemo(() => {
    if (!user) return [];
    const list: Array<{ id: string; name: string; slug?: string }> = [];

    const addClub = (id?: string, name?: string, slug?: string) => {
      if (id && name && !list.some((c) => c.id === id)) {
        list.push({ id, name, slug });
      }
    };

    if (Array.isArray(user.organizations)) {
      user.organizations.forEach((o) => {
        if (o.orgType === 'CLUB' || !o.orgType) {
          addClub(o.id, o.name, o.slug);
        }
      });
    }

    if (Array.isArray((user as any).availableProfiles)) {
      (user as any).availableProfiles.forEach((p: any) => {
        if ((p.orgType || '').toUpperCase() === 'CLUB' || !p.orgType) {
          addClub(p.organizationId || p.orgId, p.orgName || p.name, p.orgSlug || p.slug);
        }
      });
    }

    return list;
  }, [user]);

  // Form State
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [category, setCategory] = useState(initialData?.category || (queryClubId ? 'STARTUP_INNOVATION' : 'STARTUP_INNOVATION'));
  const [campaignType, setCampaignType] = useState<'INDIVIDUAL' | 'TEAM'>(initialData?.campaignType || 'INDIVIDUAL');
  const [stage, setStage] = useState(initialData?.stage || 'PROTOTYPE');
  const [goalAmount, setGoalAmount] = useState<number>(Number(initialData?.goalAmount || initialData?.targetAmount || 100000));
  const [minDonationAmount, setMinDonationAmount] = useState<number>(Number(initialData?.minDonationAmount || 100));
  const [currency, setCurrency] = useState(initialData?.currency || 'INR');
  const [shortDescription, setShortDescription] = useState(initialData?.shortDescription || initialData?.description || '');
  const [description, setDescription] = useState(initialData?.description || initialData?.storyMarkdown || '');

  // Team Members State
  const [teamMembers, setTeamMembers] = useState<Array<{ name: string; username?: string; role: string; email: string; userId?: string }>>(
    initialData?.teamMembers || []
  );
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberQuery, setNewMemberQuery] = useState('');
  const [isVerifyingMember, setIsVerifyingMember] = useState(false);

  const handleAddTeamMember = async () => {
    const rawQuery = newMemberQuery.trim();
    if (!rawQuery) {
      toast.error('Please enter the team member\'s @username or registered email.');
      return;
    }
    if (!newMemberRole.trim()) {
      toast.error('Please specify the team member\'s project role.');
      return;
    }

    const cleanHandle = rawQuery.replace(/^@/, '').toLowerCase();

    if (
      teamMembers.some(
        (m) =>
          m.email?.toLowerCase() === cleanHandle ||
          (m.username && m.username.toLowerCase() === cleanHandle)
      )
    ) {
      toast.error('This user is already added to your team.');
      return;
    }

    setIsVerifyingMember(true);
    const toastId = toast.loading('Verifying collaborator by username/email...');
    try {
      const res = await campaignService.lookupUser(rawQuery);
      const user = res.data?.user || (res as any)?.user;

      if (!user) {
        throw new Error(`No registered user found for "${rawQuery}"`);
      }

      setTeamMembers((prev) => [
        ...prev,
        {
          name: user.fullName || user.name || 'Member',
          username: user.username,
          role: newMemberRole.trim(),
          email: user.email,
          userId: user.id,
        },
      ]);

      toast.success(`✓ Verified: ${user.fullName || user.name} (@${user.username}) added to team!`, { id: toastId });
      setNewMemberRole('');
      setNewMemberQuery('');
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message || err?.message || `User "${rawQuery}" is not registered on DreamXec.`,
        { id: toastId }
      );
    } finally {
      setIsVerifyingMember(false);
    }
  };

  const handleRemoveTeamMember = (index: number) => {
    setTeamMembers((prev) => prev.filter((_, i) => i !== index));
  };

  // Media
  const [coverImageUrl, setCoverImageUrl] = useState(initialData?.coverImageUrl || initialData?.imageUrl || '');
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || '');
  const [presentationDeckUrl, setPresentationDeckUrl] = useState(initialData?.presentationDeckUrl || '');

  // Milestones State
  const [milestones, setMilestones] = useState<MilestoneItem[]>(
    Array.isArray(initialData?.milestones) && initialData.milestones.length > 0
      ? initialData.milestones.map((m: any, idx: number) => ({
          id: m.id || `m_${idx + 1}`,
          order: m.sequenceOrder || m.order || idx + 1,
          title: m.title || `Phase ${idx + 1}`,
          objective: m.description || m.objective || '',
          durationDays: Number(m.durationDays || 30),
          budget: Number(m.targetAmount ?? m.budget ?? m.amount ?? 0),
          acceptanceCriteria: Array.isArray(m.acceptanceCriteria)
            ? m.acceptanceCriteria
            : m.acceptanceCriteria
            ? [m.acceptanceCriteria]
            : [],
          requiredEvidenceTypes: Array.isArray(m.requiredEvidenceTypes)
            ? m.requiredEvidenceTypes
            : ['INVOICE', 'ON_SITE_PHOTO'],
        }))
      : [
          {
            id: 'm_1',
            order: 1,
            title: 'Phase 1: Architecture & Prototype Design',
            objective: 'Core prototype development and component assembly.',
            durationDays: 30,
            budget: 40000,
            acceptanceCriteria: ['CAD models and circuit schematics completed', 'Component procurement invoices verified'],
            requiredEvidenceTypes: ['INVOICE', 'ON_SITE_PHOTO'],
          },
          {
            id: 'm_2',
            order: 2,
            title: 'Phase 2: Working Prototype & Lab Testing',
            objective: 'Operational testing and performance benchmark in college laboratory.',
            durationDays: 45,
            budget: 60000,
            acceptanceCriteria: ['Live prototype demo video submitted', 'Faculty advisor inspection report signed'],
            requiredEvidenceTypes: ['VIDEO_WALKTHROUGH', 'INSPECTION_REPORT'],
          },
        ]
  );

  // Beneficiary Escrow State
  const [beneficiary, setBeneficiary] = useState<BeneficiaryConfigData>({
    recipientType: initialData?.beneficiaryDetails?.recipientType || 'INDIVIDUAL',
    accountHolderName: initialData?.beneficiaryDetails?.accountHolderName || '',
    bankAccountNumber: initialData?.beneficiaryDetails?.bankAccountNumber || '',
    ifscCode: initialData?.beneficiaryDetails?.ifscCode || '',
    upiId: initialData?.beneficiaryDetails?.upiId || '',
    kycDocumentUrl: initialData?.beneficiaryDetails?.kycDocumentUrl || '',
    orgRegistrationDocUrl: initialData?.beneficiaryDetails?.orgRegistrationDocUrl || '',
  });

  // Terms Agreement
  const [agreedToTerms, setAgreedToTerms] = useState(!!initialData);

  // ── DRAFT AUTO-SAVE CONFIGURATION (2-DAY EXPIRY) ──
  const DRAFT_STORAGE_PREFIX = 'dx_campaign_draft_v1';
  const DRAFT_EXPIRY_MS = 2 * 24 * 60 * 60 * 1000; // 48 hours (2 days)
  const draftKey = `${DRAFT_STORAGE_PREFIX}_${user?.id || 'guest'}`;

  const [restoredDraftTime, setRestoredDraftTime] = useState<number | null>(null);
  const [lastSavedTime, setLastSavedTime] = useState<number | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const isInitializedRef = useRef(false);

  const formatRemainingTime = (savedAt: number): string => {
    const elapsed = Date.now() - savedAt;
    const remaining = DRAFT_EXPIRY_MS - elapsed;
    if (remaining <= 0) return 'expired';
    const hours = Math.round(remaining / (1000 * 60 * 60));
    if (hours > 0) return `expires in ${hours}h`;
    const minutes = Math.max(1, Math.round(remaining / (1000 * 60)));
    return `expires in ${minutes}m`;
  };

  // 1. Initial Draft Restoration on mount (checks 2-day expiry)
  useEffect(() => {
    if (initialData) {
      isInitializedRef.current = true;
      return;
    }

    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft && typeof draft.savedAt === 'number') {
          if (Date.now() - draft.savedAt > DRAFT_EXPIRY_MS) {
            // Expired after 2 days
            localStorage.removeItem(draftKey);
          } else {
            // Restore form fields
            if (draft.step) setStep(draft.step);
            if (draft.title !== undefined) setTitle(draft.title);
            if (draft.slug !== undefined) setSlug(draft.slug);
            if (draft.category !== undefined) setCategory(draft.category);
            if (draft.campaignType !== undefined) setCampaignType(draft.campaignType);
            if (draft.stage !== undefined) setStage(draft.stage);
            if (draft.goalAmount !== undefined) setGoalAmount(draft.goalAmount);
            if (draft.minDonationAmount !== undefined) setMinDonationAmount(draft.minDonationAmount);
            if (draft.currency !== undefined) setCurrency(draft.currency);
            if (draft.shortDescription !== undefined) setShortDescription(draft.shortDescription);
            if (draft.description !== undefined) setDescription(draft.description);
            if (draft.organizationId !== undefined && !queryClubId) setOrganizationId(draft.organizationId);
            if (draft.clubName !== undefined && !queryClubName) setClubName(draft.clubName);
            if (Array.isArray(draft.teamMembers)) setTeamMembers(draft.teamMembers);
            if (draft.coverImageUrl !== undefined) setCoverImageUrl(draft.coverImageUrl);
            if (draft.videoUrl !== undefined) setVideoUrl(draft.videoUrl);
            if (draft.presentationDeckUrl !== undefined) setPresentationDeckUrl(draft.presentationDeckUrl);
            if (Array.isArray(draft.milestones) && draft.milestones.length > 0) setMilestones(draft.milestones);
            if (draft.beneficiary) setBeneficiary(draft.beneficiary);
            if (draft.agreedToTerms !== undefined) setAgreedToTerms(draft.agreedToTerms);

            setRestoredDraftTime(draft.savedAt);
            setLastSavedTime(draft.savedAt);
            toast.success('Restored unsaved draft (auto-saves for 2 days)', { duration: 3500 });
          }
        }
      }
    } catch (err) {
      console.warn('Failed to parse draft from localStorage:', err);
    } finally {
      isInitializedRef.current = true;
    }
  }, [draftKey, initialData, queryClubId, queryClubName]);

  // 2. Debounced auto-save to localStorage
  useEffect(() => {
    if (!isInitializedRef.current || initialData) return;

    // Only auto-save if user has typed something meaningful
    const hasContent =
      Boolean(title.trim()) ||
      Boolean(shortDescription.trim()) ||
      Boolean(description.trim()) ||
      Boolean(coverImageUrl.trim()) ||
      teamMembers.length > 0;

    if (!hasContent) return;

    const timer = setTimeout(() => {
      try {
        const now = Date.now();
        const draftPayload = {
          savedAt: now,
          step,
          title,
          slug,
          category,
          campaignType,
          stage,
          goalAmount,
          minDonationAmount,
          currency,
          shortDescription,
          description,
          organizationId,
          clubName,
          teamMembers,
          coverImageUrl,
          videoUrl,
          presentationDeckUrl,
          milestones,
          beneficiary,
          agreedToTerms,
        };
        localStorage.setItem(draftKey, JSON.stringify(draftPayload));
        setLastSavedTime(now);
      } catch (err) {
        console.warn('Draft auto-save failed:', err);
      }
    }, 800);

    return () => clearTimeout(timer);
  }, [
    draftKey,
    initialData,
    step,
    title,
    slug,
    category,
    campaignType,
    stage,
    goalAmount,
    minDonationAmount,
    currency,
    shortDescription,
    description,
    organizationId,
    clubName,
    teamMembers,
    coverImageUrl,
    videoUrl,
    presentationDeckUrl,
    milestones,
    beneficiary,
    agreedToTerms,
  ]);

  // 3. Discard draft handler
  const executeDiscardDraft = useCallback(() => {
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    setRestoredDraftTime(null);
    setLastSavedTime(null);
    setStep(1);
    setTitle('');
    setSlug('');
    setCategory('STARTUP_INNOVATION');
    setCampaignType('INDIVIDUAL');
    setStage('PROTOTYPE');
    setGoalAmount(100000);
    setMinDonationAmount(100);
    setCurrency('INR');
    setShortDescription('');
    setDescription('');
    setTeamMembers([]);
    setCoverImageUrl('');
    setVideoUrl('');
    setPresentationDeckUrl('');
    setMilestones([
      {
        id: 'm_1',
        order: 1,
        title: 'Phase 1: Architecture & Prototype Design',
        objective: 'Core prototype development and component assembly.',
        durationDays: 30,
        budget: 40000,
        acceptanceCriteria: ['CAD models and circuit schematics completed', 'Component procurement invoices verified'],
        requiredEvidenceTypes: ['INVOICE', 'ON_SITE_PHOTO'],
      },
      {
        id: 'm_2',
        order: 2,
        title: 'Phase 2: Working Prototype & Lab Testing',
        objective: 'Operational testing and performance benchmark in college laboratory.',
        durationDays: 45,
        budget: 60000,
        acceptanceCriteria: ['Live prototype demo video submitted', 'Faculty advisor inspection report signed'],
        requiredEvidenceTypes: ['VIDEO_WALKTHROUGH', 'INSPECTION_REPORT'],
      },
    ]);
    setBeneficiary({
      recipientType: 'INDIVIDUAL',
      accountHolderName: '',
      bankAccountNumber: '',
      ifscCode: '',
      upiId: '',
      kycDocumentUrl: '',
      orgRegistrationDocUrl: '',
    });
    setAgreedToTerms(false);
    toast.success('Draft discarded. Started fresh campaign.');
  }, [draftKey]);

  const handleDiscardDraft = useCallback(() => {
    setShowDiscardConfirm(true);
  }, []);

  // Auto-generate slug from title
  const handleTitleChange = (val: string) => {
    setTitle(val);
    const generated = val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(generated);
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (organizationId && !isMemberOfSelectedClub) {
        toast.error(`You must be an active verified member of "${clubName || 'this club'}" to proceed under its banner. Please request to join or switch to the Independent track.`);
        return false;
      }
      if (!title.trim() || title.length < 3) {
        toast.error('Campaign title must be at least 3 characters.');
        return false;
      }
      if (!goalAmount || goalAmount <= 0) {
        toast.error('Please enter a valid fundraising goal target.');
        return false;
      }
      if (!shortDescription.trim() || shortDescription.length < 10) {
        toast.error('Short description must be at least 10 characters.');
        return false;
      }
      return true;
    }

    if (currentStep === 2) {
      const milestoneSum = milestones.reduce((s, m) => s + (Number(m.budget) || 0), 0);
      if (Math.abs(goalAmount - milestoneSum) >= 1) {
        toast.error(`Milestones budget sum (₹${milestoneSum.toLocaleString()}) must equal Campaign Target (₹${goalAmount.toLocaleString()}).`);
        return false;
      }
      for (const m of milestones) {
        if (!m.title.trim()) {
          toast.error(`Please provide a title for Tranche #${m.order}.`);
          return false;
        }
        if (m.acceptanceCriteria.length === 0 || m.acceptanceCriteria.some(c => !c.trim())) {
          toast.error(`Tranche #${m.order} must have valid acceptance criteria.`);
          return false;
        }
      }
      return true;
    }

    if (currentStep === 3) {
      if (!beneficiary.accountHolderName.trim() || !beneficiary.bankAccountNumber.trim() || !beneficiary.ifscCode.trim()) {
        toast.error('Please complete all mandatory bank account fields for escrow releases.');
        return false;
      }
      if (beneficiary.isMinor) {
        if (!beneficiary.guardianName?.trim() || !beneficiary.guardianPhone?.trim()) {
          toast.error('Minor student creators require Parent/Guardian Name and Emergency Phone Number (O8, K11).');
          return false;
        }
        if (!beneficiary.guardianConsentUrl?.trim()) {
          toast.error('Please upload signed Parental / Guardian Consent form before proceeding (O8, K11).');
          return false;
        }
      }
      return true;
    }

    if (currentStep === 4) {
      if (!coverImageUrl) {
        toast.error('Please upload a 16:9 campaign cover image.');
        return false;
      }
      return true;
    }

    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep((s) => Math.min(s + 1, 5));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (step === 1 && customOnBack) {
      customOnBack();
      return;
    }
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!agreedToTerms) {
      toast.error('You must agree to the Maker-Checker verification terms.');
      return;
    }

    if (organizationId && !isMemberOfSelectedClub) {
      toast.error(`You must be an active verified member of "${clubName || 'this club'}" to launch an official club campaign.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const desc = description || shortDescription || title || "Campaign overview and execution plan.";
      const payload = {
        title,
        slug,
        category,
        campaignType,
        stage,
        goalAmount: Number(goalAmount),
        minDonationAmount: Number(minDonationAmount || 1),
        currency,
        shortDescription: shortDescription || desc.slice(0, 200),
        description: desc,
        organizationId: organizationId || undefined,
        clubId: organizationId || undefined,
        coverImageUrl: coverImageUrl || undefined,
        videoUrl: videoUrl || null,
        presentationDeckUrl: presentationDeckUrl || null,
        teamMembers,
        milestones: milestones.map((m, idx) => ({
          id: m.id && !m.id.startsWith('m_') ? m.id : undefined,
          title: m.title,
          description: m.objective || null,
          durationDays: Number(m.durationDays || 30),
          budget: Number(m.budget),
          sequenceOrder: Number(m.order || idx + 1),
          acceptanceCriteria: m.acceptanceCriteria || [],
          requiredEvidenceTypes: m.requiredEvidenceTypes || [],
        })),
        beneficiaryDetails: beneficiary,
      };

      if (customOnSubmit) {
        await customOnSubmit(payload);
        try {
          localStorage.removeItem(draftKey);
        } catch {}
        return;
      }

      const res = await campaignService.createCampaign(payload as any);
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      toast.success('Campaign initialized! Submitted for administrative verification.');

      const campaignId = res.data?.campaign?.id || (res as any)?.campaign?.id || res.data?.campaign?.slug;
      if (campaignId) {
        navigate(`/campaign/${campaignId}`);
      } else {
        navigate('/campaigns');
      }
    } catch (err: any) {
      console.error('Failed to create campaign:', err);
      toast.error(err.response?.data?.message || err.message || 'Failed to submit campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF7] pb-24">
      {/* ── HEADER BANNER ── */}
      <div className="bg-[#0F534A] border-b-5 border-[#4717AE] shadow-[0_6px_0px_#4717AE] text-white py-12 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <div className="inline-flex items-center gap-2 bg-[#FFDD33] text-[#0F534A] px-3 py-1 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                <ShieldCheck className="w-3.5 h-3.5" /> Maker-Checker Protected Creation
              </div>

              {/* ── ACTIVE PROFILE PILL WITH SWITCH BUTTON ── */}
              <div>
                <div className="inline-flex items-center gap-2 bg-white/20 text-[#FFF9F2] border border-white/40 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-[#9EFC5F]"></span>
                  <span className="max-w-[240px] truncate">
                    Profile:{' '}
                    {user?.activeProfile?.orgName
                      ? `${user.activeProfile.orgName} (${user.activeProfile.role?.replace(/_/g, ' ')})`
                      : (user as any)?.activeIdentityType === 'USER' || !user?.activeProfile
                      ? 'Independent Creator'
                      : user?.activeProfile?.role?.replace(/_/g, ' ') || 'Active Profile'}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/switch-profile', { state: { from: location.pathname || '/create' } })}
                    className="ml-1.5 bg-[#FFDD33] text-[#0F534A] hover:bg-[#ffe359] px-2 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider border border-[#121316] shadow-[1px_1px_0_#121316] cursor-pointer inline-flex items-center gap-1 transition-all"
                    title="Open Profile Switch Panel"
                  >
                    <span>Switch</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* ── DRAFT AUTO-SAVE STATUS PILL ── */}
              {!initialData && (
                <div className="inline-flex items-center gap-1.5 bg-[#121316]/40 text-[#FFF9F2] border border-white/30 px-2.5 py-1 text-xs font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#9EFC5F]" />
                  <span>
                    {lastSavedTime
                      ? `Draft saved (${formatRemainingTime(lastSavedTime)})`
                      : 'Auto-saving draft (2 days)'}
                  </span>
                  {(lastSavedTime || restoredDraftTime) && (
                    <button
                      type="button"
                      onClick={handleDiscardDraft}
                      className="ml-1 text-[#FFDD33] hover:text-[#FE4E1A] underline text-[10px] uppercase font-bold tracking-wider cursor-pointer"
                      title="Discard local draft and reset form"
                    >
                      Reset
                    </button>
                  )}
                </div>
              )}
            </div>

            <h1 className="font-headline font-black text-3xl sm:text-4xl uppercase tracking-tight">
              Create <span className="text-[#FE4E1A]">Milestone Campaign</span>
            </h1>
            <p className="text-sm text-[#FFF9F2] font-medium mt-1">
              Tie fundraising disbursements to verifiable project deliverables.
            </p>
          </div>

          <BrushAnnotation type="tag" color="yellow" rotate={-2} className="text-sm font-bold text-white bg-[#FE4E1A] p-2.5 border-2 border-white shadow-[3px_3px_0px_#121316]">
            Step {step} of 5: {STEPS[step - 1].label}
          </BrushAnnotation>
        </div>
      </div>

      {/* ── WIZARD PROGRESS STEPPER ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        <div className="bg-white border-4 border-[#0F534A] shadow-[6px_6px_0px_#4717AE] p-4">
          <div className="grid grid-cols-5 gap-2">
            {STEPS.map((s) => {
              const isPassed = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div
                  key={s.num}
                  onClick={() => s.num < step && setStep(s.num)}
                  className={`p-2.5 border-2 transition-all text-center select-none ${
                    s.num < step ? 'cursor-pointer' : ''
                  } ${
                    isPassed
                      ? 'bg-[#0F534A] text-white border-[#0F534A]'
                      : isCurrent
                      ? 'bg-[#FFDD33] text-[#121316] border-[#0F534A] shadow-[3px_3px_0px_#0F534A]'
                      : 'bg-gray-100 text-gray-400 border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1">
                    {isPassed ? <CheckCircle className="w-3.5 h-3.5 text-[#9EFC5F]" /> : <span className="text-xs font-black">#{s.num}</span>}
                  </div>
                  <p className="font-headline font-black text-[11px] uppercase tracking-wider truncate mt-1">
                    {s.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RESTORED DRAFT BANNER ── */}
      {restoredDraftTime && !initialData && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="bg-[#FFF9F2] border-3 border-[#0F534A] shadow-[4px_4px_0px_#FFDD33] p-3 sm:p-4 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 text-xs text-[#0F534A]">
              <Sparkles className="w-4 h-4 text-[#FE4E1A] flex-shrink-0" />
              <span>
                <strong className="font-headline font-black uppercase text-[#121316]">Draft Restored:</strong> We automatically reloaded your unsaved campaign pitch. Drafts persist for <strong>2 days</strong>.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRestoredDraftTime(null)}
                className="px-2.5 py-1 text-[11px] font-headline font-black uppercase text-[#0F534A] hover:bg-[#0F534A]/10 border border-[#0F534A] cursor-pointer"
              >
                Dismiss
              </button>
              <button
                type="button"
                onClick={handleDiscardDraft}
                className="px-2.5 py-1 text-[11px] font-headline font-black uppercase text-[#FE4E1A] hover:bg-red-50 border border-[#FE4E1A] cursor-pointer"
              >
                Discard Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN FORM CONTAINER ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="bg-white border-4 border-[#0F534A] shadow-[8px_8px_0px_#0F534A] p-6 sm:p-10">
          {/* STEP 1: STORY & PITCH */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="pb-4 border-b-3 border-[#0F534A]">
                <h2 className="font-headline font-black text-2xl uppercase text-[#0F534A]">
                  Step 1: Campaign Pitch & Scope
                </h2>
                <p className="text-xs text-gray-600 font-medium mt-1">
                  Define your core fundraising initiative, category, and target budget.
                </p>
              </div>

              {/* ── CLUB / INSTITUTIONAL AFFILIATION CARD ── */}
              {organizationId ? (
                isMemberOfSelectedClub ? (
                  // ✅ Verified Club Affiliation
                  <div className="p-4 bg-[#9EFC5F]/20 border-3 border-[#121316] shadow-[4px_4px_0px_#121316] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🏛️</span>
                      <div>
                        <div className="font-headline font-black text-[11px] uppercase tracking-wider text-[#0F534A]">
                          Verified Club Affiliation
                        </div>
                        <div className="font-headline font-black text-sm text-[#121316]">
                          {clubName || 'Campus Guild'}
                        </div>
                        <div className="text-[11px] text-gray-600 mt-0.5">
                          This campaign will be launched under the club banner and governed by its double-entry escrow ledger.
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className="text-[10px] font-headline font-black bg-[#0F534A] text-white px-3 py-1.5 uppercase tracking-wider border border-[#121316] shadow-[2px_2px_0px_#121316] whitespace-nowrap">
                        Escrow Linked
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setOrganizationId('');
                          setClubName('');
                          toast.success('Switched to Open / Independent Project track.');
                        }}
                        className="text-[10px] font-black uppercase text-gray-500 hover:text-red-600 underline cursor-pointer ml-1"
                        title="Detach from this club"
                      >
                        Detach
                      </button>
                    </div>
                  </div>
                ) : (
                  // ⚠️ NON-MEMBER RESTRICTION CARD with the 3 business pathways
                  <div className="p-5 bg-red-50/80 border-3 border-[#121316] shadow-[5px_5px_0px_#F4002C] space-y-4">
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">⚠️</span>
                      <div className="flex-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-[#F4002C] text-white border border-[#121316] mb-1.5">
                          Club Membership Required
                        </div>
                        <h3 className="font-headline font-black text-base uppercase text-[#121316]">
                          You are not an active member of {clubName || 'this club'}
                        </h3>
                        <p className="text-xs text-[#121316]/80 leading-relaxed mt-1">
                          Under DreamXec Dual-Custody rules, official club campaigns must be initiated by verified guild members. This guarantees institutional accountability, escrow compliance, and donor transparency.
                        </p>
                      </div>
                    </div>

                    <div className="p-3.5 bg-white border-2 border-[#121316] space-y-3">
                      <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
                        Choose How You Would Like to Proceed:
                      </span>

                      <div className="flex flex-wrap items-center gap-2.5">
                        {/* Pathway 1: Request to Join */}
                        <button
                          type="button"
                          disabled={isSendingJoinRequest || joinRequested}
                          onClick={async () => {
                            try {
                              setIsSendingJoinRequest(true);
                              await sendJoinRequest(organizationId);
                              setJoinRequested(true);
                              toast.success(`Membership request submitted to ${clubName || 'Club'} leadership!`);
                            } catch (err: any) {
                              toast.error(err.response?.data?.message || err.message || 'Failed to submit join request.');
                            } finally {
                              setIsSendingJoinRequest(false);
                            }
                          }}
                          className={`px-3.5 py-2 text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#121316] ${
                            joinRequested
                              ? 'bg-emerald-100 text-[#0F534A] border-2 border-[#0F534A]'
                              : 'bg-[#FFDD33] text-[#121316] hover:bg-yellow-300 border-2 border-[#121316]'
                          }`}
                        >
                          <span>{joinRequested ? '✓ Membership Requested' : '🤝 Request to Join Club'}</span>
                        </button>

                        {/* Pathway 2: Switch to Independent */}
                        <button
                          type="button"
                          onClick={() => {
                            setOrganizationId('');
                            setClubName('');
                            toast.success('Switched to Open / Independent Project track.');
                          }}
                          className="px-3.5 py-2 text-xs font-black uppercase tracking-wider text-white bg-[#0F534A] hover:bg-emerald-950 transition-all border-2 border-[#121316] shadow-[2px_2px_0px_#121316] cursor-pointer"
                        >
                          <span>🌐 Launch as Independent Project</span>
                        </button>

                        {/* Pathway 3: Refer new club */}
                        <button
                          type="button"
                          onClick={() => navigate('/refer-club')}
                          className="px-3 py-2 text-xs font-black uppercase tracking-wider text-[#121316] bg-gray-100 hover:bg-gray-200 transition-all border-2 border-[#121316] cursor-pointer"
                        >
                          <span>+ Refer Your Own Club ↗</span>
                        </button>
                      </div>

                      {/* Switch to another verified club if user holds other memberships */}
                      {userMemberClubs.length > 0 && (
                        <div className="pt-2.5 border-t border-dashed border-gray-300 flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase text-gray-500">
                            Or switch to your verified club:
                          </span>
                          <select
                            onChange={(e) => {
                              const target = userMemberClubs.find((c) => c.id === e.target.value);
                              if (target) {
                                setOrganizationId(target.id);
                                setClubName(target.name);
                                toast.success(`Switched to ${target.name}`);
                              }
                            }}
                            defaultValue=""
                            className="px-2.5 py-1 text-xs font-bold border-2 border-[#121316] bg-white cursor-pointer shadow-[2px_2px_0px_#121316]"
                          >
                            <option value="" disabled>Select from your clubs...</option>
                            {userMemberClubs.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )
              ) : (
                // 🌐 Independent Track with option to link an enrolled club
                <div className="p-4 bg-orange-50/70 border-3 border-[#121316] shadow-[4px_4px_0px_#FE4E1A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">🌐</span>
                    <div>
                      <div className="font-headline font-black text-[11px] uppercase tracking-wider text-[#FE4E1A]">
                        Open / Independent Track
                      </div>
                      <div className="text-xs text-[#121316] font-medium mt-0.5">
                        This campaign will be funded under individual milestone tranches without campus club dual-custody.
                      </div>
                    </div>
                  </div>

                  {userMemberClubs.length > 0 && (
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <span className="text-[10px] font-black uppercase text-[#121316]/70">Attach Club:</span>
                      <select
                        value={organizationId}
                        onChange={(e) => {
                          const target = userMemberClubs.find((c) => c.id === e.target.value);
                          if (target) {
                            setOrganizationId(target.id);
                            setClubName(target.name);
                            toast.success(`Attached to ${target.name}`);
                          }
                        }}
                        className="px-2.5 py-1 text-xs font-bold border-2 border-[#121316] bg-white cursor-pointer shadow-[2px_2px_0px_#121316]"
                      >
                        <option value="">Keep Independent</option>
                        {userMemberClubs.map((c) => (
                          <option key={c.id} value={c.id}>
                            🏛️ {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. Autonomous Solar Rover for Agricultural Soil Testing"
                  className="w-full px-4 py-3 border-3 border-[#0F534A] font-headline font-bold text-base text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[3px_3px_0px_#0F534A]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                    Initiative Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-3 border-[#0F534A] font-headline font-bold text-xs uppercase text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[3px_3px_0px_#0F534A]"
                  >
                    <option value="STARTUP_INNOVATION">Startup Innovation</option>
                    <option value="RESEARCH_GRANT">Research Grant &amp; Lab Project</option>
                    <option value="TUITION_FEE">Tuition &amp; Education Aid</option>
                    <option value="EMERGENCY_AID">Student Emergency Aid</option>
                    <option value="COMPETITION_TRAVEL">Hackathon &amp; Competition Travel</option>
                    <option value="EXTRACURRICULAR">Club &amp; Extracurricular Initiative</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                    Total Funding Goal ({currency}) *
                  </label>
                  <input
                    type="number"
                    value={goalAmount || ''}
                    onChange={(e) => setGoalAmount(Number(e.target.value))}
                    placeholder="e.g. 150000"
                    className="w-full px-4 py-3 border-3 border-[#0F534A] font-headline font-black text-base text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[3px_3px_0px_#0F534A]"
                  />
                </div>
              </div>

              {/* Campaign Type & Team Collaboration */}
              <div className="p-4 bg-[#FCFBF7] border-3 border-[#0F534A] shadow-[4px_4px_0px_#0F534A] space-y-4">
                <div>
                  <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-2">
                    Campaign Structure &amp; Team
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setCampaignType('INDIVIDUAL')}
                      className={`p-3 border-2 font-headline font-black text-xs uppercase transition-all ${
                        campaignType === 'INDIVIDUAL'
                          ? 'bg-[#0F534A] text-white border-[#0F534A] shadow-[3px_3px_0px_#121316]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      Solo Student Project
                    </button>
                    <button
                      type="button"
                      onClick={() => setCampaignType('TEAM')}
                      className={`p-3 border-2 font-headline font-black text-xs uppercase transition-all ${
                        campaignType === 'TEAM'
                          ? 'bg-[#FE4E1A] text-white border-[#121316] shadow-[3px_3px_0px_#121316]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      Collaborative Team (Roster)
                    </button>
                  </div>
                </div>

                {campaignType === 'TEAM' && (
                  <div className="pt-3 border-t-2 border-dashed border-[#0F534A]/30 space-y-3">
                    <p className="text-xs text-gray-700 font-bold">
                      Add verified co-founders and collaborators by DreamXec @username or registered email:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                      <div className="sm:col-span-3">
                        <input
                          type="text"
                          required
                          placeholder="Member @username or Registered Email *"
                          value={newMemberQuery}
                          onChange={(e) => setNewMemberQuery(e.target.value)}
                          className="w-full p-2.5 border-2 border-[#0F534A] text-xs font-bold bg-white focus:outline-none placeholder-gray-400"
                        />
                      </div>
                      <div className="sm:col-span-2 flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Role (e.g. Lead Dev)"
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value)}
                          className="flex-1 p-2.5 border-2 border-[#0F534A] text-xs font-bold bg-white focus:outline-none placeholder-gray-400"
                        />
                        <button
                          type="button"
                          disabled={isVerifyingMember}
                          onClick={handleAddTeamMember}
                          className="px-4 py-2.5 bg-[#9EFC5F] text-[#0F534A] font-headline font-black text-xs uppercase border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#86e844] cursor-pointer disabled:opacity-50 flex-shrink-0"
                        >
                          {isVerifyingMember ? 'Verifying...' : '+ Add'}
                        </button>
                      </div>
                    </div>

                    {teamMembers.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] font-headline font-black uppercase text-[#0F534A] block">
                          Verified Team Collaborators ({teamMembers.length}):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {teamMembers.map((tm, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between bg-white border-2 border-[#121316] p-2.5 text-xs shadow-[2px_2px_0px_#121316]"
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[#0B9C2C] font-bold">✓</span>
                                  <span className="font-headline font-black text-[#121316] truncate">{tm.name}</span>
                                  {tm.username && (
                                    <span className="px-1.5 py-0.5 bg-[#0F534A] text-[#9EFC5F] border border-[#121316] text-[9px] font-mono font-bold">
                                      @{tm.username}
                                    </span>
                                  )}
                                  <span className="px-1.5 py-0.5 bg-[#FFDD33] text-[#121316] border border-[#121316] text-[9px] font-black uppercase">
                                    {tm.role}
                                  </span>
                                </div>
                                <span className="text-[10px] font-mono text-gray-500 block truncate">{tm.email}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveTeamMember(idx)}
                                className="text-red-500 hover:text-red-700 font-bold p-1 ml-2 cursor-pointer flex-shrink-0"
                                title="Remove team member"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                  Executive Short Summary (500 max) *
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Provide a concise 2-line elevator pitch highlighting the project problem and impact..."
                  className="w-full px-4 py-3 border-3 border-[#0F534A] font-medium text-sm text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[3px_3px_0px_#0F534A]"
                />
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                  Detailed Project Story (Markdown Supported)
                </label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write your comprehensive story, technical background, problem statement, and roadmap..."
                  className="w-full px-4 py-3 border-3 border-[#0F534A] font-mono text-xs text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[3px_3px_0px_#0F534A]"
                />
              </div>
            </div>
          )}

          {/* STEP 2: MILESTONE TRANCHES */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="pb-4 border-b-3 border-[#0F534A]">
                <h2 className="font-headline font-black text-2xl uppercase text-[#0F534A]">
                  Step 2: Milestone Tranche Builder
                </h2>
                <p className="text-xs text-gray-600 font-medium mt-1">
                  Break your project into delivery milestones. Disbursements will release sequentially upon verification.
                </p>
              </div>

              <MilestoneTrancheBuilder
                milestones={milestones}
                totalGoal={goalAmount}
                currency={currency}
                onChange={setMilestones}
              />
            </div>
          )}

          {/* STEP 3: BENEFICIARY & ESCROW */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="pb-4 border-b-3 border-[#0F534A]">
                <h2 className="font-headline font-black text-2xl uppercase text-[#0F534A]">
                  Step 3: Beneficiary Entity & Escrow Routing
                </h2>
                <p className="text-xs text-gray-600 font-medium mt-1">
                  Configure recipient banking details and institutional KYC documents for automated settlement.
                </p>
              </div>

              <BeneficiaryEscrowConfig data={beneficiary} onChange={setBeneficiary} />
            </div>
          )}

          {/* STEP 4: MEDIA & PROOF PLAN */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="pb-4 border-b-3 border-[#0F534A]">
                <h2 className="font-headline font-black text-2xl uppercase text-[#0F534A]">
                  Step 4: Media, Visuals & Presentation Deck
                </h2>
                <p className="text-xs text-gray-600 font-medium mt-1">
                  Upload high-resolution campaign banners, explainer videos, and technical proposals.
                </p>
              </div>

              <MediaDocumentUpload
                label="Primary Cover Banner (16:9 Ratio) *"
                description="Upload high-res cover image for marketplace listing (PNG / JPG)"
                acceptedTypes="image"
                maxSizeMB={10}
                folder="campaigns/covers"
                value={coverImageUrl}
                onUploadSuccess={(res) => setCoverImageUrl(res.secureUrl)}
                onRemove={() => setCoverImageUrl('')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                    Pitch Video URL (YouTube / Cloudinary)
                  </label>
                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder="e.g. https://www.youtube.com/watch?v=..."
                    className="w-full px-4 py-3 border-3 border-[#0F534A] font-medium text-sm text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[3px_3px_0px_#0F534A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                    Presentation Deck / Proposal PDF URL
                  </label>
                  <input
                    type="text"
                    value={presentationDeckUrl}
                    onChange={(e) => setPresentationDeckUrl(e.target.value)}
                    placeholder="e.g. https://d315q9d42yekyc.cloudfront.net/campaigns/..."
                    className="w-full px-4 py-3 border-3 border-[#0F534A] font-medium text-sm text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[3px_3px_0px_#0F534A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: REVIEW & PUBLISH */}
          {step === 5 && (
            <div className="space-y-6">
              <div className="pb-4 border-b-3 border-[#0F534A]">
                <h2 className="font-headline font-black text-2xl uppercase text-[#0F534A]">
                  Step 5: Review & Maker-Checker Sign-off
                </h2>
                <p className="text-xs text-gray-600 font-medium mt-1">
                  Inspect your social unfurl card and confirm legal tranche disbursement terms.
                </p>
              </div>

              <SocialSharePreviewCard
                title={title}
                shortDescription={shortDescription}
                category={category}
                goalAmount={goalAmount}
                coverImageUrl={coverImageUrl}
                currency={currency}
              />

              {/* Legal Terms Checkbox */}
              <div className="p-5 bg-[#FFF9F2] border-3 border-[#0F534A] shadow-[4px_4px_0px_#0F534A] space-y-3">
                <div className="flex items-start gap-3">
                  <input
                    id="maker-checker-terms"
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => setAgreedToTerms(e.target.checked)}
                    className="w-5 h-5 mt-0.5 accent-[#FE4E1A] cursor-pointer"
                  />
                  <label htmlFor="maker-checker-terms" className="text-xs font-bold text-[#121316] cursor-pointer leading-relaxed">
                    I agree to the <a href="/terms-and-conditions" target="_blank" rel="noopener noreferrer" className="text-[#0F534A] underline font-black">Terms &amp; Conditions</a> and <a href="/donation-policy" target="_blank" rel="noopener noreferrer" className="text-[#0F534A] underline font-black">Donation &amp; Grant Policy</a>. I confirm that our team retains <strong>100% project intellectual property (IP)</strong> without institutional encumbrance, all team members are at least 16 years of age (with guardian/faculty guide sponsorship if under 18), and milestone grant disbursements are governed strictly by <strong>Maker-Checker dual-authorization</strong>.
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* ── STEPPER CONTROLS FOOTER ── */}
          <div className="flex items-center justify-between gap-4 mt-10 pt-6 border-t-3 border-[#0F534A]">
            {step > 1 ? (
              <TactileNeobrutalistButton
                type="button"
                variant="outline"
                onClick={handleBack}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
              >
                Back: Step {step - 1}
              </TactileNeobrutalistButton>
            ) : <div />}

            {step < 5 ? (
              <TactileNeobrutalistButton
                type="button"
                variant="primary"
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to Step {step + 1}
              </TactileNeobrutalistButton>
            ) : (
              <TactileNeobrutalistButton
                type="button"
                variant="purple"
                isLoading={isSubmitting}
                disabled={!agreedToTerms}
                onClick={handleSubmit}
                rightIcon={<Sparkles className="w-4 h-4" />}
              >
                Submit Campaign for Review ✦
              </TactileNeobrutalistButton>
            )}
          </div>
        </div>
      </div>

      {/* Discard Draft Neo-Brutalist Confirmation Modal */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FCFBF7] border-4 border-[#121316] shadow-[8px_8px_0_#F4002C] p-6 max-w-md w-full space-y-4">
            <h3 className="font-headline font-black text-xl uppercase text-[#F4002C]">
              Discard Saved Draft?
            </h3>
            <p className="text-xs text-gray-700 font-medium leading-relaxed">
              Are you sure you want to discard your saved campaign draft? All unsaved fields will be reset to default.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDiscardConfirm(false)}
                className="px-4 py-2 bg-white text-[#121316] border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0_#121316] hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Keep Draft
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDiscardConfirm(false);
                  executeDiscardDraft();
                }}
                className="px-4 py-2 bg-[#F4002C] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0_#121316] hover:bg-red-700 transition-colors cursor-pointer"
              >
                Yes, Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}