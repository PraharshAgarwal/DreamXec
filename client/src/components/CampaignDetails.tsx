import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiRequest, { clearApiCache } from '../services/api';
import { API_BASE_URL } from '../utils/apiConfig';
import toast from 'react-hot-toast';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Heart,
  Share2,
  Users,
  Layers,
  MessageSquare,
  ShieldCheck,
  Star,
  ExternalLink,
  Play,
  FileText,
  Sparkles,
  Building2,
  UserCheck,
  Flame,
  ArrowLeft,
  Copy,
  Check,
  Clock,
  Lock,
  BookOpen,
  Zap,
} from 'lucide-react';
import type { Campaign, User } from '../types';
import ResearcherPassportModal from './passport/ResearcherPassportModal';
import { FooterContent } from '../sections/Footer/components/FooterContent';
import { campaignService } from '../services/campaignService';
import MobileDonateCTA from './MobileDonateCTA';
import DonateModal from './DonateModal';
import { addRecentCampaign } from '../lib/recentCampaigns';
import DiscoverySection from './DiscoverySection';
import YouTube from 'react-youtube';
import UserAvatar from './common/UserAvatar';
import {
  createRazorpayOrderAuthenticated,
  createRazorpayOrderGuest,
  verifyPayment,
} from '../services/donationService';
import { loadRazorpayScript, setupRazorpaySandboxFallback } from '../utils/loadRazorpay';
import { PaymentConfirmationModal } from './common/PaymentConfirmationModal';
import CommentSection from './comments/CommentSection';
import { Resizable } from 're-resizable';
import PublicMilestoneEcosystem from './milestones/PublicMilestoneEcosystem';
import SEO from '../components/SEO';
import { EndorsementsStream } from './campaigns/EndorsementsStream';
import { SocialShareModal } from './campaigns/SocialShareModal';
import { CampaignTeamManagementModal } from './campaigns/CampaignTeamManagementModal';
import MarkdownRenderer from './common/MarkdownRenderer';

interface CampaignDetailsProps {
  currentUser: User | null;
  campaigns?: Campaign[];
  onLogin?: () => void;
  onLogout?: () => void;
  onDonate?: (campaignId: string, amount: number) => void;
}

/* ─────────────────────────────────────────────
   FAQ ITEM  – neobrutalist accordion
───────────────────────────────────────────── */
const FAQItem = ({ faq }: { faq: { question: string; answer: string } }) => {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="bg-white border-3 border-[#0F534A] transition-all"
      style={{ boxShadow: open ? '4px 4px 0 #FE4E1A' : '3px 3px 0 #0F534A' }}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-4 sm:px-5 py-3 sm:py-4 text-left font-headline font-black text-[#0F534A] uppercase tracking-wide text-xs sm:text-sm md:text-base bg-white hover:bg-orange-50/50 transition-colors cursor-pointer"
      >
        <span className="pr-3 leading-snug">{faq.question}</span>
        <span
          className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-[#0F534A] text-white font-black text-sm sm:text-base transition-transform"
          style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        >
          +
        </span>
      </button>
      {open && (
        <div className="px-4 sm:px-5 pb-4 pt-2 border-t-2 border-dashed border-[#0F534A]/20 bg-[#FCFBF7]">
          <p className="text-gray-700 text-xs sm:text-sm md:text-base leading-relaxed font-medium">
            {faq.answer}
          </p>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────
   DESCRIPTION FORMATTER (RICH MARKDOWN ENGINE)
───────────────────────────────────────────── */
function CleanDescription({ description }: { description: string }) {
  return (
    <div className="w-full overflow-hidden">
      <MarkdownRenderer content={description} fallback={<NoDescription />} />
    </div>
  );
}

function NoDescription() {
  return (
    <div className="text-center py-10 px-4 border-2 border-dashed border-[#0F534A]/30 bg-[#FFF9F2]">
      <p className="text-[#0F534A] font-headline font-black uppercase tracking-widest text-xs sm:text-sm">
        No detailed description provided
      </p>
      <p className="text-gray-500 text-xs mt-1">
        Campaign updates and technical documentation will be published as milestones progress.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
const getYoutubeId = (url?: string) => {
  if (!url) return null;
  const regExp = /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/;
  const match = url.match(regExp);
  return match ? match[1] : null;
};

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isDesktop;
}

/* ─────────────────────────────────────────────
   SECTION CARD WRAPPER
───────────────────────────────────────────── */
const NeoCard = ({
  children,
  className = '',
  accentColor = '#0F534A',
}: {
  children: React.ReactNode;
  className?: string;
  accentColor?: string;
}) => (
  <div
    className={`bg-white border-3 border-[#0F534A] ${className}`}
    style={{ boxShadow: `5px 5px 0 ${accentColor}` }}
  >
    {children}
  </div>
);

/* ─────────────────────────────────────────────
   SECTION HEADING
───────────────────────────────────────────── */
const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="text-base sm:text-lg md:text-xl font-headline font-black text-[#0F534A] uppercase tracking-tight mb-4 flex items-center gap-2">
    <span className="inline-block w-2 sm:w-2.5 h-5 sm:h-6 bg-[#FE4E1A] flex-shrink-0" />
    {children}
  </h2>
);

/* ─────────────────────────────────────────────
   MAIN CAMPAIGN DETAILS COMPONENT
───────────────────────────────────────────── */
export default function CampaignDetails({
  currentUser,
  campaigns,
  onLogin,
  onLogout,
  onDonate,
}: CampaignDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [donationAmount, setDonationAmount] = useState('1000');
  const [email, setEmail] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('ALL');
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{
    amount: number;
    orderId: string;
    paymentId?: string;
    campaignTitle: string;
    donorName?: string;
    isAnonymous?: boolean;
    status?: 'PROCESSING' | 'SETTLED' | 'FAILED';
  }>({
    amount: 0,
    orderId: '',
    paymentId: '',
    campaignTitle: '',
    donorName: '',
    isAnonymous: false,
    status: 'PROCESSING',
  });
  const [copiedLink, setCopiedLink] = useState(false);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [isPassportModalOpen, setIsPassportModalOpen] = useState(false);
  const [similarCampaigns, setSimilarCampaigns] = useState<Campaign[]>([]);
  const [activeTab, setActiveTab] = useState<
    'about' | 'milestones' | 'endorsements' | 'discussion' | 'presentation' | 'video' | 'media' | 'faqs'
  >('about');
  const [deckWidth, setDeckWidth] = useState<number | string>('100%');
  const isDesktop = useIsDesktop();

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const API_BASE = API_BASE_URL;

  const mapPrismaCampaignToClient = (c: any): Campaign => {
    return {
      id: c.id,
      slug: c.slug,
      title: c.title,
      description: c.description || c.shortDescription || '',
      shortDescription: c.shortDescription || '',
      category: c.category || 'STARTUP_INNOVATION',
      stage: c.stage || 'DISCOVERY',
      goalAmount: Number(c.targetAmount || c.goalAmount || 0),
      targetAmount: Number(c.targetAmount || c.goalAmount || 0),
      currentAmount: Number(c.currentRaisedAmount || c.currentAmount || 0),
      currentRaisedAmount: Number(c.currentRaisedAmount || c.currentAmount || 0),
      raisedAmount: Number(c.currentRaisedAmount || c.currentAmount || 0),
      donorCount: c.donorCount || 0,
      currency: c.currency || 'INR',
      status: (c.status || 'LIVE').toLowerCase() as any,
      imageUrl: c.coverImageUrl || c.imageUrl,
      coverImageUrl: c.coverImageUrl || c.imageUrl,
      galleryImageUrls: c.galleryImageUrls || [],
      videoUrl: c.videoUrl || undefined,
      youtubeUrl: c.videoUrl || c.youtubeUrl || undefined,
      presentationDeckUrl: c.presentationDeckUrl,
      faqs: c.faqs || [],
      teamMembers: (c.teamMembers as any) || [],
      members: (c.members || []).map((m: any) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        title: m.title,
        joinedAt: m.joinedAt,
        user: m.user
          ? {
            id: m.user.id,
            name: m.user.name || m.user.fullName,
            username: m.user.username || null,
            email: m.user.email,
            avatar: m.user.avatar || m.user.profilePicture || m.user.profileMetadata?.avatarUrl,
            profilePicture: m.user.profilePicture || m.user.avatar || m.user.profileMetadata?.profilePicture,
            speciesIdentity: m.user.speciesIdentity || m.user.profileMetadata?.speciesIdentity,
          }
          : null,
      })),
      beneficiaryDetails: c.beneficiaryDetails || null,
      milestones: (c.milestones || []).map((m: any, idx: number) => ({
        id: m.id || `m_${idx}`,
        title: m.title,
        description: m.description || '',
        durationDays: m.durationDays || 30,
        budget: Number(m.targetAmount ?? m.budget ?? 0),
        targetAmount: Number(m.targetAmount ?? m.budget ?? 0),
        sequenceOrder: m.sequenceOrder ?? m.order ?? idx + 1,
        order: m.sequenceOrder ?? m.order ?? idx + 1,
        status: (m.status || 'PENDING').toUpperCase(),
        acceptanceCriteria: m.acceptanceCriteria || [],
        requiredEvidenceTypes: m.requiredEvidenceTypes || [],
        disbursedAt: m.disbursedAt,
      })) as any,
      endorsements: c.endorsements || [],
      student: c.student
        ? {
          id: c.student.id,
          name: c.student.fullName || c.student.name,
          username: c.student.username || null,
          email: c.student.email,
          avatar: c.student.avatar || c.student.profilePicture || c.student.profileMetadata?.avatarUrl,
          profilePicture: c.student.profilePicture || c.student.avatar || c.student.profileMetadata?.profilePicture,
          speciesIdentity: c.student.speciesIdentity || c.student.profileMetadata?.speciesIdentity,
        }
        : null,
      user: c.user || c.student || null,
      studentName: c.student?.fullName || c.student?.name || c.studentName || 'Student Lead',
      college: c.tenant?.name || c.institutionName || c.college || (c.organization?.name ? c.organization.name : 'Direct Research Initiative'),
      club: (c.organization || c.clubName || c.clubId) ? {
        id: c.organization?.id || c.clubId || '',
        name: c.organization?.name || c.clubName || '',
        college: c.tenant?.name || c.institutionName || c.college || '',
      } as any : undefined,
      userId: c.studentUserId || c.userId,
      createdAt: c.createdAt,
    };
  };

  const fetchCampaign = useCallback(async (retryCount = 0) => {
    if (!id) return;
    try {
      if (retryCount === 0) setLoading(true);
      const res = await campaignService.getCampaignDetails(id);
      if (res.data?.campaign) {
        setCampaign(mapPrismaCampaignToClient(res.data.campaign));
        setError(null);
      } else {
        setError('This campaign is not available');
      }
    } catch (err: any) {
      if (retryCount < 2) {
        setTimeout(() => {
          fetchCampaign(retryCount + 1);
        }, 700 * (retryCount + 1));
        return;
      }
      console.error('Failed to load campaign:', err);
      setError(err?.message || 'Failed to load campaign');
    } finally {
      if (retryCount === 0 || retryCount >= 2) {
        setLoading(false);
      }
    }
  }, [id]);

  const refreshCampaign = useCallback(async () => {
    try {
      clearApiCache('/campaigns');
      clearApiCache('campaign');
      const targetId = campaign?.slug || campaign?.id || id;
      if (!targetId) return;
      const res = await campaignService.getCampaignDetails(targetId, true);
      const fresh = res.data?.campaign || (res as any)?.campaign;
      if (fresh) {
        setCampaign(mapPrismaCampaignToClient(fresh));
      }
    } catch (err: any) {
      console.error('Failed to refresh campaign:', err);
    }
  }, [campaign?.slug, campaign?.id, id]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  // Real-time synchronization on payment events
  useEffect(() => {
    const handleCampaignUpdated = (e: any) => {
      const updatedCampaign = e.detail?.campaign;
      if (updatedCampaign) {
        if (
          updatedCampaign.id === campaign?.id ||
          updatedCampaign.slug === campaign?.slug ||
          updatedCampaign.id === id ||
          updatedCampaign.slug === id
        ) {
          setCampaign(mapPrismaCampaignToClient(updatedCampaign));
        }
      } else {
        refreshCampaign();
      }
    };
    window.addEventListener('dx:campaign_updated', handleCampaignUpdated);
    return () => window.removeEventListener('dx:campaign_updated', handleCampaignUpdated);
  }, [campaign?.id, campaign?.slug, id]);

  useEffect(() => {
    if (campaign) addRecentCampaign(campaign);
  }, [campaign]);

  useEffect(() => {
    if (campaign?.category) {
      campaignService
        .getPublicCampaigns({ category: campaign.category, limit: 6 })
        .then((res) => {
          const list = res.data?.campaigns || (res as any)?.campaigns || [];
          const filtered = list.filter((c: any) => c.id !== campaign.id);
          const mapped = filtered.map((c: any) => mapPrismaCampaignToClient(c));
          setSimilarCampaigns(mapped);
        })
        .catch((e) => console.warn('Failed to load similar campaigns:', e));
    }
  }, [campaign?.id, campaign?.category]);

  useEffect(() => {
    const checkWishlistStatus = async () => {
      const isDonorUser = currentUser?.role === 'donor' || currentUser?.role === 'DONOR';
      if (!isDonorUser || !id) return;
      try {
        const response = await apiRequest<{ isWishlisted: boolean }>(`/wishlist/check/${id}`);
        if (response.status === 'success' || response.success) {
          setIsWishlisted(Boolean(response.data?.isWishlisted ?? (response as any)?.isWishlisted));
        }
      } catch { }
    };
    if (campaign && currentUser) checkWishlistStatus();
  }, [currentUser, id, campaign]);

  const handleWishlistToggle = async () => {
    if (!currentUser) return navigate('/auth');
    setWishlistLoading(true);
    try {
      const response = await apiRequest<{ isWishlisted: boolean }>('/wishlist/toggle', {
        method: 'POST',
        body: JSON.stringify({ campaignId: id }),
      });
      if (response.status === 'success' || response.success) {
        const nextWishlisted = Boolean(response.data?.isWishlisted ?? (response as any)?.isWishlisted);
        setIsWishlisted(nextWishlisted);
        toast.success(nextWishlisted ? 'Added to Wishlist' : 'Removed from Wishlist');
      }
    } catch {
      toast.error('Failed to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    toast.success('Campaign link copied to clipboard!');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  /* ── Loading Skeleton ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFBF7]">
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FE4E1A] via-[#FFDD33] to-[#18D7E8]" />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="browse-skeleton-shimmer h-5 w-32 bg-gray-200" />
            <div className="text-gray-300">/</div>
            <div className="browse-skeleton-shimmer h-5 w-48 bg-gray-200" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border-3 border-[#0F534A] shadow-[6px_6px_0px_#0F534A] p-2 sm:p-3">
                <div className="browse-skeleton-shimmer w-full h-[280px] sm:h-[420px] bg-gray-200" />
              </div>
              <div className="bg-white border-3 border-[#0F534A] shadow-[5px_5px_0px_#FE4E1A] p-5 sm:p-7 space-y-4">
                <div className="flex gap-2">
                  <div className="browse-skeleton-shimmer h-6 w-28 bg-gray-200" />
                  <div className="browse-skeleton-shimmer h-6 w-24 bg-gray-200" />
                </div>
                <div className="browse-skeleton-shimmer h-8 sm:h-10 w-4/5 bg-gray-200" />
                <div className="browse-skeleton-shimmer h-4 w-full bg-gray-200" />
                <div className="browse-skeleton-shimmer h-4 w-2/3 bg-gray-200" />
              </div>
              <div className="flex gap-2 border-b-2 border-[#0F534A]/20 pb-2">
                <div className="browse-skeleton-shimmer h-10 w-28 bg-gray-200" />
                <div className="browse-skeleton-shimmer h-10 w-28 bg-gray-200" />
                <div className="browse-skeleton-shimmer h-10 w-28 bg-gray-200" />
              </div>
              <div className="bg-white border-3 border-[#0F534A] p-6 space-y-3">
                <div className="browse-skeleton-shimmer h-6 w-1/3 bg-gray-200 mb-4" />
                <div className="browse-skeleton-shimmer h-4 w-full bg-gray-200" />
                <div className="browse-skeleton-shimmer h-4 w-full bg-gray-200" />
                <div className="browse-skeleton-shimmer h-4 w-5/6 bg-gray-200" />
              </div>
            </div>
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white border-3 border-[#0F534A] shadow-[6px_6px_0px_#FE4E1A] p-5 sm:p-6 space-y-5">
                <div className="space-y-2">
                  <div className="browse-skeleton-shimmer h-4 w-24 bg-gray-200" />
                  <div className="browse-skeleton-shimmer h-9 w-40 bg-gray-200" />
                  <div className="browse-skeleton-shimmer h-3 w-full bg-gray-200" />
                </div>
                <div className="browse-skeleton-shimmer h-4 w-full bg-gray-200" />
                <div className="browse-skeleton-shimmer h-12 w-full bg-gray-200" />
                <div className="border-t-2 border-dashed border-gray-200 pt-4 space-y-2">
                  <div className="browse-skeleton-shimmer h-4 w-full bg-gray-200" />
                  <div className="browse-skeleton-shimmer h-4 w-3/4 bg-gray-200" />
                </div>
              </div>
            </div>
          </div>
        </main>
        <FooterContent />
      </div>
    );
  }

  /* ── Error ── */
  if (error || !campaign)
    return (
      <div className="min-h-screen bg-[#FCFBF7] flex items-center justify-center px-4">
        <div className="text-center p-8 max-w-sm w-full bg-white border-3 border-[#0F534A] shadow-[6px_6px_0px_#FE4E1A]">
          <div className="w-12 h-12 bg-[#FE4E1A] text-white flex items-center justify-center mx-auto mb-4 border-2 border-[#121316]">
            <span className="font-headline font-black text-xl">!</span>
          </div>
          <h2 className="text-lg font-headline font-black text-[#121316] uppercase mb-1">
            {error ? 'Campaign Error' : 'Campaign Not Found'}
          </h2>
          <p className="text-gray-600 text-xs mb-5 font-medium">
            {error || "This campaign doesn't exist or has been archived."}
          </p>
          <button
            onClick={() => navigate('/campaigns')}
            className="px-5 py-2 bg-[#0F534A] text-white font-headline font-black uppercase tracking-wider text-xs border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#0b3d36] cursor-pointer"
          >
            Explore Campaigns
          </button>
        </div>
      </div>
    );

  const currentAmount = Number(campaign.currentAmount ?? campaign.currentRaisedAmount ?? campaign.raisedAmount ?? 0);
  const goalAmount = Number(campaign.goalAmount ?? campaign.targetAmount ?? 0);
  const progressPercentage = goalAmount > 0 ? Math.min((currentAmount / goalAmount) * 100, 100) : 0;
  const remainingAmount = Math.max(goalAmount - currentAmount, 0);
  const isDonor = currentUser?.role === 'donor' || currentUser?.role === 'DONOR';
  const showMobileCTA = campaign.status === 'approved' || campaign.status === 'live';
  const deckIframeHeight = isDesktop ? 700 : 320;
  const milestones = campaign.milestones || [];
  const completedMilestones = milestones.filter(
    (m: any) => m.status === 'COMPLETED' || m.status === 'APPROVED' || m.status === 'VERIFIED'
  ).length;

  const handleDonate = () => setShowDonateModal(true);

  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(donationAmount);
    if (!amount || amount < 10) {
      toast.error('Minimum contribution amount is ₹10.');
      return;
    }
    try {
      let res;
      if (currentUser) {
        res = await createRazorpayOrderAuthenticated({
          amount,
          projectId: campaign.id,
          anonymous: isAnonymous,
        });
      } else {
        if (!email) throw new Error('Email required for guest backers');
        res = await createRazorpayOrderGuest({
          amount,
          projectId: campaign.id,
          email,
          anonymous: isAnonymous,
        });
      }

      const { orderId, amount: razorAmount, key } = res;
      if (!orderId || !key) throw new Error('Invalid payment order');

      const isOrgDomain =
        typeof window !== "undefined" &&
        (window.location.hostname.endsWith("dreamxec.org") ||
          new URLSearchParams(window.location.search).get("domain") === "dreamxec.org" ||
          localStorage.getItem("dx_client_domain") === "dreamxec.org");

      const options = {
        key,
        amount: razorAmount,
        currency: 'INR',
        order_id: orderId,
        name: 'DreamXec Academic Foundation',
        description: `Research Grant: ${campaign.title}`,
        prefill: currentUser ? { email: currentUser.email } : { email },
        handler: async (response: any) => {
          setShowDonateModal(false);
          const donorDisplayName =
            (currentUser as any)?.fullName ||
            currentUser?.name ||
            (email ? email.split('@')[0] : 'Valued Backer');

          // 1. Show confirmation modal IMMEDIATELY upon payment in Pending/Processing state
          setConfirmationData({
            amount,
            orderId: response.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            campaignTitle: campaign.title,
            donorName: isAnonymous ? 'Anonymous Backer' : donorDisplayName,
            isAnonymous,
            status: 'PROCESSING',
          });
          setShowConfirmationModal(true);
          // Reset form state so modal opens clean next time
          setDonationAmount('1000');
          setEmail('');
          setIsAnonymous(false);
          setSelectedMilestoneId('ALL');

          const startTime = Date.now();

          try {
            // 2. Direct database settlement via verifyPayment
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            // 3. Keep user in pending verification state for a natural, perceptible duration (~1200ms)
            // so the transition from pending to successful is visibly appreciated
            const elapsed = Date.now() - startTime;
            if (elapsed < 1200) {
              await new Promise((r) => setTimeout(r, 1200 - elapsed));
            }

            // 4. TRANSITION TO SUCCESSFUL / SETTLED!
            setConfirmationData((prev) => ({
              ...prev,
              status: 'SETTLED',
              paymentId: response.razorpay_payment_id || prev.paymentId,
            }));

            // Sync state strictly with genuine database campaign returned from server
            const fresh = verifyRes.data?.campaign || (verifyRes as any)?.campaign;
            if (fresh) {
              setCampaign(mapPrismaCampaignToClient(fresh));
            } else {
              await refreshCampaign();
            }

            toast.success('🎉 Pledge verified and allocated to escrow!');
          } catch (err: any) {
            console.error('Payment verification failed:', err);
            setConfirmationData((prev) => ({
              ...prev,
              status: 'FAILED',
            }));
            toast.error(err?.message || 'Payment verification failed. Please check your transaction.');
            await refreshCampaign();
          }
          setTimeout(refreshCampaign, 800);
        },
        theme: { color: isOrgDomain ? '#0F534A' : '#FE4E1A' },
      };

      await loadRazorpayScript();

      // If order is simulated or test fallback, route to built-in simulator rather than crashing official checkout.js with 400
      const isSimulatedOrder = !orderId.match(/^order_[a-zA-Z0-9]{14,}$/) || key.includes('dummy');
      if (isSimulatedOrder) {
        setupRazorpaySandboxFallback();
      }

      if (typeof (window as any).Razorpay === 'function') {
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } else {
        toast.error('Payment gateway unavailable. Please try again in a moment.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Payment initiation failed.');
    }
  };

  const isVideo = (url: string) =>
    ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'].some((ext) => url.toLowerCase().includes(ext));

  return (
    <>
      <SEO
        title={`${campaign.title} | DreamXec`}
        description={campaign.description?.slice(0, 160)}
        image={campaign.imageUrl}
        url={`https://dreamxec.org/campaign/${campaign.slug || campaign.id}`}
      />

      <div className="min-h-screen bg-[#FCFBF7] text-[#121316]">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 pb-24 lg:pb-16 space-y-6">
          {/* ── TOP BREADCRUMB & BACK NAV ── */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-headline font-bold uppercase">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#0F534A] border-2 border-[#0F534A] shadow-[2px_2px_0px_#0F534A] hover:bg-[#0F534A] hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>

            <div className="flex items-center gap-1.5 text-gray-500 text-[11px] overflow-hidden truncate">
              <Link to="/campaigns" className="hover:text-[#FE4E1A] transition">
                Campaigns
              </Link>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <span className="text-[#0F534A]">{campaign.category || 'Innovation'}</span>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <span className="text-gray-700 truncate max-w-[160px] sm:max-w-xs">{campaign.title}</span>
            </div>
          </div>

          {/* ── HERO BANNER & CREATOR CARD ── */}
          <div className="p-5 sm:p-6 md:p-8 bg-white border-3 sm:border-4 border-[#0F534A] shadow-[6px_6px_0px_#FE4E1A] space-y-4">
            {/* Category & Status Pills */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 bg-[#FFDD33] text-[#121316] border border-[#121316] font-headline font-black text-[11px] uppercase tracking-wider shadow-[1px_1px_0px_#121316]">
                  🏷️ {campaign.category || 'STARTUP_INNOVATION'}
                </span>

                <span className="px-2.5 py-1 bg-[#0F534A] text-[#9EFC5F] border border-[#121316] font-headline font-black text-[11px] uppercase tracking-wider shadow-[1px_1px_0px_#121316] inline-flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Student Initiative
                </span>

                <span className="px-2.5 py-1 bg-[#4717AE] text-white border border-[#121316] font-headline font-black text-[11px] uppercase tracking-wider shadow-[1px_1px_0px_#121316]">
                  Stage: {campaign.stage || 'DISCOVERY'}
                </span>

                <span className="px-2.5 py-1 bg-[#121316] text-[#FFDD33] border border-[#121316] font-headline font-black text-[11px] uppercase tracking-wider shadow-[1px_1px_0px_#121316] inline-flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-[#FFDD33]" /> Impact Score: 94/100
                </span>
              </div>

              {/* Wishlist Button */}
              {isDonor && (
                <button
                  type="button"
                  onClick={handleWishlistToggle}
                  disabled={wishlistLoading}
                  className={`px-3 py-1 text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0px_#121316] transition-all cursor-pointer inline-flex items-center gap-1 ${isWishlisted ? 'bg-red-50 text-red-600' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                  {isWishlisted ? 'Wishlisted' : 'Save'}
                </button>
              )}
            </div>

            {/* Campaign Headline */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-headline font-black text-[#121316] uppercase leading-tight tracking-tight">
              {campaign.title}
            </h1>

            {/* Tagline */}
            {campaign.shortDescription && (
              <p className="text-sm sm:text-base text-gray-700 font-medium leading-relaxed max-w-4xl">
                {campaign.shortDescription}
              </p>
            )}

            {/* Creator Profile Chip Grid */}
            <div className="pt-3 border-t-2 border-dashed border-gray-200 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <UserAvatar
                  user={campaign.student || (campaign as any).user}
                  src={campaign.student?.avatar || campaign.student?.profilePicture}
                  name={campaign.studentName}
                  username={campaign.student?.username}
                  size="md"
                  shape="neo"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-headline font-black text-xs sm:text-sm text-[#121316] uppercase">
                      {campaign.studentName}
                    </span>
                    {campaign.student?.username && (
                      <span className="text-[10px] text-[#FE4E1A] font-black">
                        @{campaign.student.username}
                      </span>
                    )}
                    <span className="px-1.5 py-0.5 bg-[#FE4E1A] text-white text-[9px] font-headline font-black uppercase">
                      👑 Lead Maker
                    </span>
                  </div>
                  <p className="text-[11px] font-bold text-[#0F534A] flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[#FE4E1A]" />
                    {campaign.college || campaign.club?.name || 'Direct Research Initiative'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {campaign.members && campaign.members.length > 0 && (
                  <div className="flex items-center gap-2 bg-[#FCFBF7] px-3 py-1.5 border border-[#0F534A]/40 text-xs font-bold text-gray-700">
                    <Users className="w-3.5 h-3.5 text-[#0F534A]" />
                    <span>{campaign.members.length} Collaborative Members</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsPassportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0F534A] text-[#9EFC5F] border-2 border-[#121316] text-xs font-headline font-black uppercase shadow-[2px_2px_0px_#121316] hover:bg-[#14665b] cursor-pointer transition-all"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Lead Maker Passport</span>
                </button>
              </div>
            </div>
          </div>

          {/* ── TWO COLUMN MAIN LAYOUT ── */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* ════════════════════════════════
                LEFT COLUMN: Hero Media & Tab Content
            ════════════════════════════════ */}
            <div className="w-full flex-1 min-w-0 space-y-6">
              {/* Media Display Container */}
              <div className="bg-white border-3 sm:border-4 border-[#0F534A] shadow-[6px_6px_0px_#0F534A] overflow-hidden">
                <img
                  src={campaign.imageUrl || '/assets/curious_student_hero.webp'}
                  alt={campaign.title}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/assets/curious_student_hero.webp';
                  }}
                  className="w-full h-56 sm:h-80 md:h-96 object-cover block"
                />
              </div>

              {/* ── UNIFIED NEOBRUTALIST TAB BAR ── */}
              <div className="flex flex-wrap gap-2 border-b-3 border-[#0F534A] pb-3">
                {[
                  { id: 'about', label: 'Overview & Story' },
                  { id: 'milestones', label: `Escrow Roadmap (${milestones.length})` },
                  { id: 'endorsements', label: `Faculty Endorsements (${(campaign as any).endorsements?.length || 0})` },
                  { id: 'discussion', label: '💬 Discussion Stream' },
                  ...(campaign.presentationDeckUrl ? [{ id: 'presentation', label: 'Pitch Deck' }] : []),
                  ...(campaign.youtubeUrl ? [{ id: 'video', label: 'Video Demo' }] : []),
                  ...(campaign.galleryImageUrls?.length > 0 ? [{ id: 'media', label: `Media (${campaign.galleryImageUrls.length})` }] : []),
                  ...(campaign.faqs?.length > 0 ? [{ id: 'faqs', label: `FAQs (${campaign.faqs.length})` }] : []),
                ].map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-3 sm:px-4 py-2 font-headline font-black uppercase text-xs sm:text-sm tracking-wider border-2 border-[#121316] transition-all cursor-pointer select-none ${isActive
                          ? 'bg-[#0F534A] text-white shadow-[3px_3px_0px_#FE4E1A] -translate-y-0.5'
                          : 'bg-white text-[#0F534A] hover:bg-[#FFDD33] hover:text-[#121316] shadow-[2px_2px_0px_#121316]'
                        }`}
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* ── TAB CONTENT ── */}

              {/* 1. About Tab */}
              {activeTab === 'about' && (
                <div className="space-y-6">
                  <NeoCard className="p-5 sm:p-6 md:p-8" accentColor="#0F534A">
                    <SectionHeading>Research Initiative Overview</SectionHeading>
                    <CleanDescription description={campaign.description} />
                  </NeoCard>

                  {/* Clean Navigational Action Cards to Dedicated Tabs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('milestones');
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                      className="p-4 bg-white border-3 border-[#0F534A] shadow-[4px_4px_0px_#FFDD33] hover:shadow-[5px_5px_0px_#FE4E1A] text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-headline font-black uppercase tracking-wider text-[#0F534A] bg-[#FFDD33] px-2 py-0.5 border border-[#121316]">
                          Execution Roadmap
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#FE4E1A] group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h4 className="font-headline font-black text-xs sm:text-sm text-[#121316] uppercase mt-2">
                        Inspect Escrow Roadmap ({milestones.length} Phases)
                      </h4>
                      <p className="text-gray-600 text-xs mt-1 font-medium">
                        Review scheduled tranches, acceptance criteria, and released laboratory evidence.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('discussion');
                        window.scrollTo({ top: 350, behavior: 'smooth' });
                      }}
                      className="p-4 bg-white border-3 border-[#0F534A] shadow-[4px_4px_0px_#FE4E1A] hover:shadow-[5px_5px_0px_#FFDD33] text-left transition-all group cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-headline font-black uppercase tracking-wider text-white bg-[#0F534A] px-2 py-0.5 border border-[#121316]">
                          Live Community Stream
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#FE4E1A] group-hover:translate-x-1 transition-transform" />
                      </div>
                      <h4 className="font-headline font-black text-xs sm:text-sm text-[#121316] uppercase mt-2">
                        Join Project Discussion
                      </h4>
                      <p className="text-gray-600 text-xs mt-1 font-medium">
                        Ask technical questions, give suggestions, and converse with the student maker team.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {/* 2. Escrow Milestones Tab */}
              {activeTab === 'milestones' && (
                <div className="space-y-4">
                  <PublicMilestoneEcosystem
                    campaign={campaign}
                    currentUser={currentUser}
                    onRefresh={fetchCampaign}
                  />
                </div>
              )}

              {/* 3. Endorsements Tab */}
              {activeTab === 'endorsements' && (
                <NeoCard className="p-5 sm:p-6 md:p-8" accentColor="#0F534A">
                  <EndorsementsStream
                    endorsements={(campaign as any).endorsements || []}
                    currentUser={currentUser}
                    onLogin={onLogin ? onLogin : () => navigate('/auth')}
                    onEndorse={async (end) => {
                      await campaignService.endorseCampaign(campaign.id, end);
                      await fetchCampaign();
                    }}
                  />
                </NeoCard>
              )}

              {/* 4. Discussion Stream Tab */}
              {activeTab === 'discussion' && (
                <NeoCard className="p-5 sm:p-6 md:p-8" accentColor="#FE4E1A">
                  <CommentSection
                    campaignId={campaign.id}
                    campaignOwnerId={campaign.userId}
                    currentUser={currentUser}
                    onLogin={onLogin ? onLogin : () => navigate('/auth')}
                  />
                </NeoCard>
              )}

              {/* 5. Pitch Deck Tab */}
              {activeTab === 'presentation' && campaign.presentationDeckUrl && (
                <NeoCard className="p-5 sm:p-6" accentColor="#0F534A">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <SectionHeading>Technical Pitch Deck</SectionHeading>
                    <a
                      href={campaign.presentationDeckUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-headline font-black uppercase text-[#FE4E1A] hover:underline"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Externally
                    </a>
                  </div>
                  <div className="w-full h-[550px] border-2 border-[#0F534A]">
                    <iframe
                      src={campaign.presentationDeckUrl}
                      className="w-full h-full border-none bg-white"
                      title="Presentation Deck"
                    />
                  </div>
                </NeoCard>
              )}

              {/* 6. Video Demo Tab */}
              {activeTab === 'video' && campaign.youtubeUrl && (
                <NeoCard className="p-5 sm:p-6" accentColor="#0F534A">
                  <SectionHeading>Prototype Demonstration Video</SectionHeading>
                  <div className="border-3 border-[#0F534A] shadow-[4px_4px_0px_#0F534A]">
                    <YouTube
                      videoId={getYoutubeId(campaign.youtubeUrl) || ''}
                      className="w-full"
                      iframeClassName="w-full aspect-video"
                      opts={{ width: '100%', height: 'auto', playerVars: { autoplay: 0 } }}
                    />
                  </div>
                </NeoCard>
              )}

              {/* 7. Gallery Media Tab */}
              {activeTab === 'media' && (
                <NeoCard className="p-5 sm:p-6" accentColor="#0F534A">
                  <SectionHeading>Project Gallery &amp; Schematics</SectionHeading>
                  {campaign?.galleryImageUrls && campaign.galleryImageUrls.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {campaign.galleryImageUrls.map((url, index) => (
                        <div
                          key={index}
                          className="aspect-square overflow-hidden border-2 border-[#0F534A] shadow-[3px_3px_0px_#FFDD33]"
                        >
                          {isVideo(url) ? (
                            <video src={url} controls className="w-full h-full object-cover" />
                          ) : (
                            <img
                              src={url}
                              alt={`Media ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 font-bold text-xs uppercase">No additional media uploaded.</p>
                  )}
                </NeoCard>
              )}

              {/* 8. FAQs Tab */}
              {activeTab === 'faqs' && campaign.faqs && campaign.faqs.length > 0 && (
                <NeoCard className="p-5 sm:p-6" accentColor="#0F534A">
                  <SectionHeading>Frequently Asked Questions</SectionHeading>
                  <div className="space-y-3">
                    {campaign.faqs.map((faq, index) => (
                      <FAQItem key={index} faq={faq} />
                    ))}
                  </div>
                </NeoCard>
              )}
            </div>

            {/* ════════════════════════════════
                RIGHT COLUMN: Financial & Support Sidebar
            ════════════════════════════════ */}
            <div className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 space-y-5 lg:sticky lg:top-20 self-start">
              {/* Financial Status Card */}
              <NeoCard className="p-5 sm:p-6" accentColor="#FE4E1A">
                {/* Raised vs Goal */}
                <div className="pb-4 border-b-2 border-dashed border-gray-200 space-y-1">
                  <span className="text-[10px] font-headline font-black uppercase text-gray-500 tracking-wider">
                    Total Funds Pledged into Escrow
                  </span>
                  <p className="text-3xl sm:text-4xl font-headline font-black text-[#0F534A] tracking-tight">
                    ₹{currentAmount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 font-bold">
                    raised of <strong className="text-[#FE4E1A] font-headline font-black">₹{goalAmount.toLocaleString()}</strong> goal
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="py-4 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-headline font-black uppercase">
                    <span className="text-[#0F534A]">{progressPercentage.toFixed(0)}% Funded</span>
                    <span className="text-gray-500">
                      {completedMilestones} / {milestones.length} Tranches Released
                    </span>
                  </div>
                  <div className="w-full h-4 bg-gray-100 border-2 border-[#121316] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0F534A] via-[#FE4E1A] to-[#9EFC5F] transition-all duration-700"
                      style={{ width: `${Math.max(progressPercentage, 4)}%` }}
                    />
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5 py-2">
                  <div className="p-3 bg-[#FFF9F2] border-2 border-[#0F534A] text-center">
                    <p className="text-base sm:text-lg font-headline font-black text-[#121316]">
                      ₹{remainingAmount.toLocaleString()}
                    </p>
                    <p className="text-[9px] font-headline font-black uppercase text-gray-500 tracking-wider">
                      Remaining Needed
                    </p>
                  </div>

                  <div className="p-3 bg-[#FCFBF7] border-2 border-[#0F534A] text-center">
                    <p className="text-base sm:text-lg font-headline font-black text-[#0F534A]">
                      {campaign.donorCount || 0}
                    </p>
                    <p className="text-[9px] font-headline font-black uppercase text-gray-500 tracking-wider">
                      Verified Backers
                    </p>
                  </div>
                </div>

                {/* Performance Rating Score */}
                <div className="my-3 p-3 bg-white border-2 border-dashed border-[#0F534A] flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-headline font-black uppercase text-gray-500">
                      Performance Score
                    </p>
                    <p className="text-xs text-gray-600 font-medium">Milestone Delivery Index</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-3.5 h-3.5 fill-[#FFDD33] text-[#121316]" />
                    ))}
                    <span className="font-headline font-black text-xs text-[#0F534A] ml-1">
                      5.0
                    </span>
                  </div>
                </div>

                {/* ── Selectable Donation Tiers (L4) ── */}
                <div className="pt-3 pb-2 space-y-3 border-t-2 border-dashed border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-headline font-black uppercase text-[#0F534A] tracking-wider">
                      Select Giving Tier (₹ INR)
                    </span>
                    <span className="text-[10px] font-bold text-gray-500">
                      Tax Exempt (80G)
                    </span>
                  </div>

                  {/* Tier Chips (L4) */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { label: '₹500', val: '500' },
                      { label: '₹1,000', val: '1000' },
                      { label: '₹2,500', val: '2500' },
                      { label: '₹5,000', val: '5000' },
                    ].map((tier) => {
                      const isSelected = donationAmount === tier.val;
                      return (
                        <button
                          key={tier.val}
                          type="button"
                          onClick={() => setDonationAmount(tier.val)}
                          className={`py-2 px-1 text-center font-headline font-black text-xs border-2 transition-all cursor-pointer ${isSelected
                              ? 'bg-[#FFDD33] text-[#121316] border-[#121316] shadow-[2px_2px_0px_#121316] scale-[1.02]'
                              : 'bg-white text-gray-700 border-gray-300 hover:border-[#0F534A]'
                            }`}
                        >
                          {tier.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Amount Field */}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-headline font-black text-xs text-[#0F534A]">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="100"
                      step="50"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="Enter custom amount..."
                      className="w-full pl-7 pr-3 py-2 bg-white border-2 border-[#121316] text-xs font-headline font-black text-[#121316] shadow-[2px_2px_0px_#121316] focus:outline-none focus:ring-1 focus:ring-[#FE4E1A]"
                    />
                  </div>
                </div>

                {/* Support CTA Button */}
                <div className="pt-2 space-y-2">
                  <button
                    type="button"
                    onClick={handleDonate}
                    className="w-full py-3.5 bg-[#FE4E1A] text-white font-headline font-black text-sm uppercase tracking-wider border-2 border-[#121316] shadow-[3px_3px_0px_#121316] hover:bg-[#e03d0d] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4 text-[#FFDD33]" />
                    Support This Initiative
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('endorsements')}
                    className="w-full py-2.5 bg-[#FFDD33] text-[#121316] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] hover:bg-[#ffe55b] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-4 h-4 text-[#0F534A]" />
                    Endorse As Faculty / Mentor
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('discussion')}
                    className="w-full py-2 bg-white text-[#0F534A] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#0F534A] shadow-[2px_2px_0px_#0F534A] hover:bg-[#FCFBF7] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <MessageSquare className="w-4 h-4 text-[#FE4E1A]" />
                    💬 Join Campaign Discussion
                  </button>
                </div>

                {/* Social Share Grid */}
                <div className="mt-4 pt-4 border-t-2 border-dashed border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-headline font-black uppercase text-gray-500 tracking-wider">
                      Share Initiative
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="text-[10px] font-headline font-black uppercase text-[#0F534A] hover:text-[#FE4E1A] inline-flex items-center gap-1 cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3 h-3 text-[#0B9C2C]" /> : <Copy className="w-3 h-3" />}
                      {copiedLink ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {[
                      {
                        name: 'LinkedIn',
                        bg: '#0A66C2',
                        action: () =>
                          window.open(
                            `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`,
                            '_blank'
                          ),
                      },
                      {
                        name: 'WhatsApp',
                        bg: '#25D366',
                        action: () =>
                          window.open(
                            `https://api.whatsapp.com/send?text=${encodeURIComponent(
                              `Check out "${campaign.title}" on DreamXec! ${window.location.href}`
                            )}`,
                            '_blank'
                          ),
                      },
                      {
                        name: 'X',
                        bg: '#121316',
                        action: () =>
                          window.open(
                            `https://twitter.com/intent/tweet?text=${encodeURIComponent(
                              `Check out "${campaign.title}" on DreamXec!`
                            )}&url=${encodeURIComponent(window.location.href)}`,
                            '_blank'
                          ),
                      },
                      {
                        name: 'Facebook',
                        bg: '#1877F2',
                        action: () =>
                          window.open(
                            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`,
                            '_blank'
                          ),
                      },
                    ].map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={item.action}
                        className="py-2 text-white font-headline font-black text-xs uppercase border border-[#121316] shadow-[1px_1px_0px_#121316] hover:opacity-90 cursor-pointer"
                        style={{ backgroundColor: item.bg }}
                      >
                        {item.name[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </NeoCard>

              {/* Collaborative Team Members Card */}
              <NeoCard className="p-5 sm:p-6" accentColor="#0F534A">
                <div className="flex items-center justify-between gap-2 pb-3 border-b-2 border-dashed border-gray-200">
                  <SectionHeading>Collaborative Team</SectionHeading>
                  {currentUser &&
                    (currentUser.id === campaign.userId ||
                      currentUser.role === 'ADMIN' ||
                      campaign.members?.some((m) => m.userId === currentUser.id && m.role === 'OWNER')) && (
                      <button
                        type="button"
                        onClick={() => setShowTeamModal(true)}
                        className="px-2.5 py-1 text-[10px] font-headline font-black uppercase bg-[#FFDD33] text-[#121316] border border-[#121316] shadow-[1px_1px_0px_#121316] hover:bg-[#ffe55b] cursor-pointer"
                      >
                        ⚙️ Roster
                      </button>
                    )}
                </div>

                <div className="mt-3 space-y-2.5">
                  {campaign.members && campaign.members.length > 0 ? (
                    campaign.members.map((member) => {
                      const isOwner = member.role === 'OWNER';
                      const displayName = member.user?.name || member.title || 'Collaborator';
                      return (
                        <div
                          key={member.id}
                          className="flex items-center gap-2.5 p-2 bg-white border border-[#0F534A]/30 shadow-[2px_2px_0px_#0F534A]/10"
                        >
                          <UserAvatar
                            user={member.user}
                            name={displayName}
                            username={member.user?.username}
                            size="sm"
                            shape="square"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <p className="font-headline font-black text-xs text-[#121316] truncate">
                                {displayName}
                              </p>
                              <span
                                className={`text-[8px] font-headline font-black uppercase px-1 py-0.5 border border-[#121316] ${isOwner ? 'bg-[#FE4E1A] text-white' : 'bg-[#4717AE] text-white'
                                  }`}
                              >
                                {isOwner ? '👑 Lead' : 'Member'}
                              </span>
                            </div>
                            <p className="text-[10px] text-gray-500 font-medium truncate">
                              {member.title || (isOwner ? 'Project Lead' : 'Team Collaborator')}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 bg-[#FCFBF7] border border-dashed border-[#0F534A]/30 text-xs text-gray-600 font-medium">
                      Project Lead: <strong>{campaign.studentName}</strong>
                    </div>
                  )}
                </div>
              </NeoCard>
            </div>
          </div>

          {/* ── DISCOVERY & SIMILAR CAMPAIGNS ── */}
          <DiscoverySection
            campaigns={similarCampaigns.length > 0 ? similarCampaigns : campaigns || []}
            currentCampaign={campaign}
          />
        </div>

        {/* ── MODALS ── */}
        <CampaignTeamManagementModal
          show={showTeamModal}
          onClose={() => setShowTeamModal(false)}
          campaignId={campaign.id}
          campaignTitle={campaign.title}
          currentUser={currentUser}
          onMembersUpdated={refreshCampaign}
        />

        <DonateModal
          show={showDonateModal}
          onClose={() => setShowDonateModal(false)}
          campaign={campaign}
          donationAmount={donationAmount}
          setDonationAmount={setDonationAmount}
          onSubmit={handleDonateSubmit}
          currentUser={currentUser}
          email={email}
          setEmail={setEmail}
          isAnonymous={isAnonymous}
          setIsAnonymous={setIsAnonymous}
          selectedMilestoneId={selectedMilestoneId}
          setSelectedMilestoneId={setSelectedMilestoneId}
        />

        {/* Instant Optimistic Confirmation & Escrow Allocation Modal */}
        <PaymentConfirmationModal
          isOpen={showConfirmationModal}
          onClose={() => setShowConfirmationModal(false)}
          amount={confirmationData.amount}
          campaignTitle={confirmationData.campaignTitle}
          orderId={confirmationData.orderId}
          paymentId={confirmationData.paymentId}
          donorName={confirmationData.donorName}
          isAnonymous={confirmationData.isAnonymous}
          status={confirmationData.status}
          onViewCampaign={() => {
            setShowConfirmationModal(false);
            refreshCampaign();
          }}
          onSettled={refreshCampaign}
        />

        <MobileDonateCTA
          visible={showMobileCTA}
          onDonateClick={handleDonate}
          currentAmount={currentAmount}
          goalAmount={goalAmount}
        />

        <FooterContent />
      </div>

      {/* Social Share Modal */}
      <SocialShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        campaignTitle={campaign.title}
        shortDescription={(campaign as any).shortDescription || campaign.description}
      />

      {/* Lead Maker Official Researcher Passport Modal */}
      <ResearcherPassportModal
        isOpen={isPassportModalOpen}
        onClose={() => setIsPassportModalOpen(false)}
        user={
          (campaign.student as any) || {
            id: campaign.userId || (campaign as any).studentUserId,
            name: campaign.studentName,
            fullName: campaign.studentName,
            role: 'STUDENT',
            avatar: campaign.student?.avatar,
            profilePicture: campaign.student?.profilePicture,
            college: campaign.college,
            kycStatus: 'VERIFIED',
            studentVerified: true,
          }
        }
      />
    </>
  );
}