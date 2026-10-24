import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getCampaignUrl } from '../utils/campaignRouting';
import toast from 'react-hot-toast';
import {
  Heart,
  Search,
  Filter,
  ExternalLink,
  Download,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Layers,
  ArrowRight,
  Sparkles,
  FileText,
  Printer,
  X,
  Building,
  Award,
  AlertCircle,
} from 'lucide-react';
import {
  getMyDonations,
  getDonationSummary,
  get80GReceipt,
  getCSRUtilisationReport,
  type Donation,
  type DonationSummary,
  type Receipt80G,
} from '../services/donationService';
import { generate80GTaxReceiptPdf } from '../utils/generate80GTaxReceiptPdf';
import { generateCSRUtilisationReportPdf } from '../utils/generateCSRUtilisationReportPdf';
import Official80GTaxReceiptModal from './donations/Official80GTaxReceiptModal';
import type { User } from '../types';
import SEO from './SEO';

interface DonorDashboardProps {
  currentUser?: User | null;
  onLogin?: () => void;
}

export default function DonorDashboard({ currentUser, onLogin }: DonorDashboardProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentTabParam = searchParams.get('tab');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [summary, setSummary] = useState<DonationSummary>({
    totalAmount: 0,
    totalDonated: 0,
    donationsCount: 0,
    projectsSupported: 0,
    campaignsBacked: 0,
    categoriesSupported: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'CAMPAIGNS' | 'TRANSACTIONS' | 'ESCROW'>('ALL');
  const [selectedReceiptDonation, setSelectedReceiptDonation] = useState<Donation | null>(null);
  const [selectedReceiptData, setSelectedReceiptData] = useState<Receipt80G | null>(null);

  const handleOpenReceiptModal = async (donation: Donation) => {
    setSelectedReceiptDonation(donation);
    setSelectedReceiptData(null);
    try {
      const res = await get80GReceipt(donation.id);
      const receipt = (res.data as any)?.receipt;
      if (receipt) setSelectedReceiptData(receipt);
    } catch (err) {
      console.warn('[DonorDashboard] Prefetch receipt error:', err);
    }
  };

  const [downloading80G, setDownloading80G] = useState(false);
  const [downloadingCSRId, setDownloadingCSRId] = useState<string | null>(null);

  const handleDownload80GPdf = async (donationId: string) => {
    setDownloading80G(true);
    const toastId = toast.loading('Generating statutory Section 80G Certificate PDF...');
    try {
      const res = await get80GReceipt(donationId);
      const receipt = (res.data as any)?.receipt;
      if (!receipt) throw new Error('Receipt data not returned.');
      await generate80GTaxReceiptPdf(receipt);
      toast.success('Section 80G Tax Exemption Certificate downloaded!', { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to download 80G PDF', { id: toastId });
    } finally {
      setDownloading80G(false);
    }
  };

  const handleDownloadCSRPdf = async (campaignId: string) => {
    setDownloadingCSRId(campaignId);
    const toastId = toast.loading('Generating GFR-19A CSR Utilisation Report PDF...');
    try {
      const res = await getCSRUtilisationReport(campaignId);
      const report = (res.data as any)?.utilisationReport;
      if (!report) throw new Error('Utilisation report data not returned.');
      await generateCSRUtilisationReportPdf(report);
      toast.success('GFR-19A Statutory Utilisation Report downloaded!', { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate CSR report PDF', { id: toastId });
    } finally {
      setDownloadingCSRId(null);
    }
  };

  const activeOrgId = (currentUser as any)?.activeProfile?.orgId;
  const [profileOnly, setProfileOnly] = useState(false);

  const fetchDonorData = async () => {
    setLoading(true);
    try {
      const orgIdToPass = profileOnly ? activeOrgId : null;
      const [donationsRes, summaryRes] = await Promise.allSettled([
        getMyDonations(orgIdToPass),
        getDonationSummary(orgIdToPass),
      ]);

      if (donationsRes.status === 'fulfilled') {
        const val: any = donationsRes.value;
        const rawList =
          val?.donations ||
          val?.data?.donations ||
          val?.data ||
          [];
        setDonations(Array.isArray(rawList) ? rawList : []);
      }

      if (summaryRes.status === 'fulfilled') {
        const val: any = summaryRes.value;
        const rawSummary =
          val?.summary ||
          val?.data?.summary ||
          val?.data ||
          val ||
          null;
        if (rawSummary) {
          setSummary({
            totalAmount: Number(rawSummary.totalAmount ?? rawSummary.totalDonated ?? 0),
            totalDonated: Number(rawSummary.totalDonated ?? rawSummary.totalAmount ?? 0),
            donationsCount: Number(rawSummary.donationsCount ?? 0),
            projectsSupported: Number(rawSummary.projectsSupported ?? rawSummary.campaignsBacked ?? 0),
            campaignsBacked: Number(rawSummary.campaignsBacked ?? rawSummary.projectsSupported ?? 0),
            categoriesSupported: Number(rawSummary.categoriesSupported ?? 0),
          });
        }
      }
    } catch (err: any) {
      console.error('Failed to load donor data:', err);
      toast.error('Failed to refresh donor dashboard information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonorData();
  }, [profileOnly, activeOrgId]);

  // Synchronize activeTab with URL ?tab= query parameter
  useEffect(() => {
    if (!currentTabParam) return;
    const lower = currentTabParam.toLowerCase();
    if (lower === 'ledger' || lower === 'transactions' || lower === 'tax') {
      setActiveTab('TRANSACTIONS');
    } else if (lower === 'campaigns' || lower === 'backed') {
      setActiveTab('CAMPAIGNS');
    } else if (lower === 'escrow' || lower === 'milestones') {
      setActiveTab('ESCROW');
    } else if (lower === 'all') {
      setActiveTab('ALL');
    }
  }, [currentTabParam]);

  // Backed Campaigns aggregation (unique campaigns)
  const backedCampaigns = useMemo(() => {
    const map = new Map<string, { campaign: NonNullable<Donation['campaign']>; totalContributed: number; count: number; latestDate: string }>();

    for (const d of donations) {
      const statusUpper = (d.paymentStatus || 'SUCCEEDED').toUpperCase();
      if (statusUpper === 'PENDING' || statusUpper === 'PROCESSING' || statusUpper === 'FAILED') continue;
      const c = d.campaign;
      if (!c || !c.id) continue;
      const existing = map.get(c.id);
      if (existing) {
        existing.totalContributed += Number(d.amount || 0);
        existing.count += 1;
        if (new Date(d.createdAt) > new Date(existing.latestDate)) {
          existing.latestDate = d.createdAt;
        }
      } else {
        map.set(c.id, {
          campaign: c,
          totalContributed: Number(d.amount || 0),
          count: 1,
          latestDate: d.createdAt,
        });
      }
    }

    return Array.from(map.values());
  }, [donations]);

  // Aggregate funded milestones across backed campaigns
  const escrowMilestones = useMemo(() => {
    const list: Array<{
      campaignTitle: string;
      campaignId: string;
      milestone: {
        id: string;
        title: string;
        description?: string;
        targetAmount?: number;
        status?: string;
        sequenceOrder?: number;
      };
    }> = [];

    for (const item of backedCampaigns) {
      if (item.campaign.milestones && Array.isArray(item.campaign.milestones)) {
        for (const m of item.campaign.milestones) {
          list.push({
            campaignTitle: item.campaign.title,
            campaignId: item.campaign.id,
            milestone: m,
          });
        }
      }
    }

    return list;
  }, [backedCampaigns]);

  // Search filtered donations (strictly excludes pending/processing transactions)
  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      const statusUpper = (d.paymentStatus || 'SUCCEEDED').toUpperCase();
      if (statusUpper === 'PENDING' || statusUpper === 'PROCESSING') {
        return false;
      }
      const title = d.campaign?.title || d.userProject?.title || '';
      const orderId = d.orderId || '';
      const paymentId = d.paymentId || '';
      const matchesSearch =
        !searchQuery ||
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        paymentId.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [donations, searchQuery]);

  // Search filtered campaigns
  const filteredCampaigns = useMemo(() => {
    return backedCampaigns.filter((item) => {
      const title = item.campaign.title || '';
      const org = item.campaign.tenant?.name || '';
      const matchesSearch =
        !searchQuery ||
        title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        org.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [backedCampaigns, searchQuery]);

  // CSV statement exporter
  const handleExportCSV = () => {
    if (filteredDonations.length === 0) {
      toast.error('No finalized donation records available to export.');
      return;
    }

    const headers = '"Donation ID","Campaign Title","Institution","Amount (INR)","Payment Status","Payment Ref","Date"\n';
    const rows = filteredDonations
      .map((d) => {
        const title = (d.campaign?.title || d.userProject?.title || 'General Grant').replace(/"/g, '""');
        const org = (d.campaign?.tenant?.name || 'DreamXec Ecosystem').replace(/"/g, '""');
        const amt = Number(d.amount || 0);
        const status = d.paymentStatus || 'SUCCEEDED';
        const ref = d.paymentId || d.orderId || 'N/A';
        const date = new Date(d.createdAt).toLocaleDateString('en-IN');
        return `"${d.id}","${title}","${org}",${amt},"${status}","${ref}","${date}"`;
      })
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dreamxec-contributions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Contribution statement downloaded successfully.');
  };

  const formatCurrency = (amt: number) => {
    return `₹${amt.toLocaleString('en-IN')}`;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <>
      <SEO
        title="Donor Dashboard | DreamXec Governance Hub"
        description="Inspect your verified contributions, track milestone releases in smart escrow, and download 80G tax exemption certificates."
      />

      <div className="min-h-screen bg-[#FCFBF7] text-[#121316] pb-24">
        {/* ── TOP HERO BANNER ── */}
        <div className="bg-[#0F534A] border-b-5 border-[#4717AE] text-white pt-10 pb-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Navigation & Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 bg-[#FFDD33] text-[#0F534A] border-2 border-[#121316] shadow-[3px_3px_0px_#121316] px-3.5 py-1 font-headline font-black text-xs uppercase tracking-wider">
                    <span>★</span> Patron & Donor Hub
                  </div>
                  {(currentUser as any)?.activeProfile && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="inline-flex items-center gap-1.5 bg-white/20 text-[#FFF9F2] border border-white/40 px-3 py-1 text-xs font-bold uppercase tracking-wider">
                        <span className="w-2 h-2 rounded-full bg-[#9EFC5F]"></span>
                        Profile: {(currentUser as any).activeProfile.orgName || (currentUser as any).activeProfile.role?.replace(/_/g, ' ')}
                      </div>
                      <button
                        type="button"
                        onClick={() => setProfileOnly(!profileOnly)}
                        className={`text-[11px] font-headline font-black uppercase tracking-wider px-3 py-1 border-2 border-[#121316] shadow-[2px_2px_0_#121316] cursor-pointer transition-all ${
                          profileOnly
                            ? 'bg-[#FFDD33] text-[#121316]'
                            : 'bg-white text-[#0F534A] hover:bg-[#9EFC5F]'
                        }`}
                      >
                        {profileOnly ? 'Filtering this Org ✓' : 'Filter by this Org'}
                      </button>
                    </div>
                  )}
                </div>
                <h1 className="font-headline font-black text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight leading-tight">
                  Donor <span className="text-[#FE4E1A]">Dashboard</span>
                </h1>
                <p className="text-sm sm:text-base text-[#FFF9F2] font-medium max-w-2xl">
                  {(currentUser as any)?.activeProfile?.orgName
                    ? `Contributions, smart escrow allocations, and tax-deductible receipts for ${(currentUser as any).activeProfile.orgName}.`
                    : 'Inspect your verified contributions, track milestone releases in dual-custody escrow, and download 80G tax exemption certificates.'}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <Link
                  to="/campaigns"
                  className="bg-white text-[#121316] hover:bg-[#FFDD33] px-4 py-2.5 font-headline font-black text-xs uppercase tracking-wider border-3 border-[#121316] shadow-[3px_3px_0px_#121316] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 cursor-pointer inline-flex items-center gap-1.5"
                >
                  ← Browse Marketplace
                </Link>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="bg-[#FE4E1A] hover:bg-[#ff6333] text-white px-5 py-2.5 font-headline font-black text-xs uppercase tracking-wider border-3 border-white shadow-[3px_3px_0px_#121316] transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Export CSV Statement
                </button>
              </div>
            </div>

            {/* Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-[#121316]/40 border-2 border-white/30 p-3.5 shadow-[2px_2px_0_#000]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FFDD33]">Total Contributed</p>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {formatCurrency(summary.totalAmount || summary.totalDonated || 0)}
                </p>
                <p className="text-[10px] text-white/70 font-medium mt-0.5">Dual-custody protected</p>
              </div>

              <div className="bg-[#121316]/40 border-2 border-white/30 p-3.5 shadow-[2px_2px_0_#000]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#9EFC5F]">Campaigns Backed</p>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {summary.projectsSupported || backedCampaigns.length}
                </p>
                <p className="text-[10px] text-white/70 font-medium mt-0.5">Groundbreaking projects</p>
              </div>

              <div className="bg-[#121316]/40 border-2 border-white/30 p-3.5 shadow-[2px_2px_0_#000]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#18D7E8]">Escrow Milestones</p>
                <p className="text-2xl sm:text-3xl font-black text-white">
                  {escrowMilestones.length}
                </p>
                <p className="text-[10px] text-white/70 font-medium mt-0.5">Tranches under governance</p>
              </div>

              <div className="bg-[#121316]/40 border-2 border-white/30 p-3.5 shadow-[2px_2px_0_#000]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#FEB3FC]">80G Exemption</p>
                <p className="text-2xl sm:text-3xl font-black text-white">100% Eligible</p>
                <p className="text-[10px] text-white/70 font-medium mt-0.5">Indian IT Act Sec 80G</p>
              </div>
            </div>

          </div>
        </div>

        {/* ── CONTROLS & FILTER BAR ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-4">
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
            
            {/* Search Bar */}
            <div className="w-full md:w-80 relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search campaigns, receipts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white uppercase tracking-wider"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto flex-nowrap w-full md:w-auto pb-1 md:pb-0">
              <Filter className="w-4 h-4 text-[#0F534A] flex-shrink-0" />
              {[
                { key: 'ALL', label: 'All Activity' },
                { key: 'CAMPAIGNS', label: `Backed Campaigns (${backedCampaigns.length})` },
                { key: 'TRANSACTIONS', label: `Transactions & Receipts (${donations.length})` },
                { key: 'ESCROW', label: `Escrow Tracker (${escrowMilestones.length})` },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-3 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] transition-all cursor-pointer whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.key
                      ? 'bg-[#4717AE] text-white shadow-[2px_2px_0_#121316]'
                      : 'bg-white text-[#121316] hover:bg-[#FFDD33]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

          </div>
        </div>

        {/* ── MAIN CONTENT AREA ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          {loading ? (
            <div className="bg-white border-3 border-[#121316] p-12 text-center shadow-[4px_4px_0_#121316] space-y-4">
              <div className="w-12 h-12 border-4 border-[#0F534A] border-t-[#FE4E1A] rounded-full animate-spin mx-auto"></div>
              <p className="font-headline font-black text-sm uppercase tracking-wider text-[#0F534A]">
                Synchronizing Donor Ledger & Escrow Data...
              </p>
            </div>
          ) : donations.length === 0 ? (
            /* Empty State */
            <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] p-12 text-center max-w-2xl mx-auto space-y-6">
              <div className="w-20 h-20 bg-[#FFDD33] border-3 border-[#121316] shadow-[4px_4px_0_#121316] flex items-center justify-center mx-auto text-[#0F534A]">
                <Heart className="w-10 h-10 fill-current" />
              </div>
              <div className="space-y-2">
                <h2 className="font-headline font-black text-2xl uppercase tracking-tight text-[#0F534A]">
                  No Contributions Recorded Yet
                </h2>
                <p className="text-sm text-gray-600 font-medium">
                  {(currentUser as any)?.activeProfile?.orgName
                    ? `No campaigns have been backed yet under the active profile "${(currentUser as any).activeProfile.orgName}".`
                    : 'Explore the DreamXec marketplace to discover and fund vetted student-led deep tech projects and social innovations.'}
                </p>
              </div>
              <div className="pt-2">
                <Link
                  to="/campaigns"
                  className="bg-[#FE4E1A] hover:bg-[#ff6333] text-white px-6 py-3 font-headline font-black text-xs uppercase tracking-wider border-3 border-[#121316] shadow-[4px_4px_0_#121316] transition-all inline-flex items-center gap-2 hover:-translate-x-0.5 hover:-translate-y-0.5"
                >
                  <Sparkles className="w-4 h-4" /> Discover Groundbreaking Campaigns
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-10">

              {/* ── SECTION 1: BACKED CAMPAIGNS (PORTFOLIO) ── */}
              {(activeTab === 'ALL' || activeTab === 'CAMPAIGNS') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-3 border-[#121316] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 bg-[#FE4E1A] border border-[#121316]"></div>
                      <h2 className="font-headline font-black text-lg sm:text-xl uppercase tracking-tight text-[#0F534A]">
                        Backed Campaigns ({filteredCampaigns.length})
                      </h2>
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Portfolio Impact
                    </span>
                  </div>

                  {filteredCampaigns.length === 0 ? (
                    <div className="bg-white border-2 border-[#121316] p-8 text-center text-sm font-bold text-gray-500">
                      No backed campaigns match your search query.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredCampaigns.map(({ campaign, totalContributed, count }) => {
                        const target = Number(campaign.targetAmount || 1);
                        const raised = Number(campaign.currentRaisedAmount || 0);
                        const progressPct = Math.min(100, Math.round((raised / target) * 100));

                        return (
                          <div
                            key={campaign.id}
                            className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] flex flex-col justify-between hover:-translate-y-1 transition-transform"
                          >
                            {/* Campaign Cover */}
                            <div className="relative h-44 border-b-3 border-[#121316] bg-gray-100 overflow-hidden">
                              <img
                                src={
                                  campaign.coverImageUrl ||
                                  campaign.imageUrl ||
                                  'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80'
                                }
                                alt={campaign.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 bg-[#4717AE] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                                {campaign.category?.replace(/_/g, ' ') || 'INNOVATION'}
                              </div>
                              <div className="absolute top-2 right-2 bg-[#FFDD33] text-[#0F534A] border-2 border-[#121316] shadow-[2px_2px_0_#121316] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                                {campaign.status || 'LIVE'}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                              <div className="space-y-2">
                                <p className="text-[11px] font-bold text-[#0F534A] uppercase tracking-wider inline-flex items-center gap-1">
                                  <Building className="w-3.5 h-3.5" />
                                  {campaign.tenant?.name || 'Academic Institution'}
                                </p>
                                <h3 className="font-headline font-black text-base uppercase leading-tight line-clamp-2">
                                  {campaign.title}
                                </h3>
                              </div>

                              {/* Progress bar */}
                              <div className="space-y-1.5 pt-2">
                                <div className="flex justify-between text-xs font-bold">
                                  <span className="text-gray-600">Funded: {progressPct}%</span>
                                  <span className="text-[#0F534A]">₹{raised.toLocaleString('en-IN')} of ₹{target.toLocaleString('en-IN')}</span>
                                </div>
                                <div className="h-3 w-full bg-gray-200 border-2 border-[#121316] overflow-hidden">
                                  <div
                                    className="h-full bg-[#9EFC5F]"
                                    style={{ width: `${progressPct}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Donor's Contribution Pill */}
                              <div className="bg-[#EFF6FF] border-2 border-[#3B82F6] p-3 flex items-center justify-between">
                                <div>
                                  <p className="text-[10px] font-black text-[#1E40AF] uppercase tracking-wider">Your Contribution</p>
                                  <p className="font-headline font-black text-base text-[#1E40AF]">
                                    {formatCurrency(totalContributed)}
                                  </p>
                                </div>
                                <span className="bg-white text-[#1E40AF] border border-[#3B82F6] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                                  {count} donation{count > 1 ? 's' : ''}
                                </span>
                              </div>

                              {/* Action Link & CSR Export */}
                              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                                {getCampaignUrl(campaign.id).startsWith('http') ? (
                                  <a
                                    href={getCampaignUrl(campaign.id)}
                                    className="flex-1 bg-white hover:bg-[#FFDD33] text-[#121316] py-2 text-center font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all inline-flex items-center justify-center gap-1.5"
                                  >
                                    Campaign Page <ArrowRight className="w-3.5 h-3.5" />
                                  </a>
                                ) : (
                                  <Link
                                    to={getCampaignUrl(campaign.id)}
                                    className="flex-1 bg-white hover:bg-[#FFDD33] text-[#121316] py-2 text-center font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all inline-flex items-center justify-center gap-1.5"
                                  >
                                    Campaign Page <ArrowRight className="w-3.5 h-3.5" />
                                  </Link>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDownloadCSRPdf(campaign.id)}
                                  disabled={downloadingCSRId === campaign.id}
                                  className="bg-[#0F534A] hover:bg-[#0b3d36] text-white py-2 px-3 text-center font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                                  title="Download GFR-19A Statutory Utilisation Report"
                                >
                                  <FileText className="w-3.5 h-3.5" /> CSR Report
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── SECTION 2: TRANSACTION LEDGER & 80G RECEIPTS ── */}
              {(activeTab === 'ALL' || activeTab === 'TRANSACTIONS') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-3 border-[#121316] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 bg-[#4717AE] border border-[#121316]"></div>
                      <h2 className="font-headline font-black text-lg sm:text-xl uppercase tracking-tight text-[#0F534A]">
                        Verified Contributions & 80G Receipts ({filteredDonations.length})
                      </h2>
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Immutable Payment Ledger
                    </span>
                  </div>

                  {filteredDonations.length === 0 ? (
                    <div className="bg-white border-2 border-[#121316] p-8 text-center text-sm font-bold text-gray-500">
                      No contribution records match your search.
                    </div>
                  ) : (
                    <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-[#0F534A] text-white border-b-3 border-[#121316] font-headline font-black uppercase tracking-wider">
                            <th className="p-3.5">Date</th>
                            <th className="p-3.5">Campaign</th>
                            <th className="p-3.5">Order / Gateway Ref</th>
                            <th className="p-3.5">Amount</th>
                            <th className="p-3.5">Status</th>
                            <th className="p-3.5 text-right">Tax Exemption</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-[#121316]/20 font-medium">
                          {filteredDonations.map((d) => {
                            const statusUpper = (d.paymentStatus || 'SUCCEEDED').toUpperCase();
                            const isSucceeded = ['SUCCEEDED', 'PAID', 'CAPTURED', 'SUCCESS'].includes(statusUpper);
                            const isFailed = ['FAILED', 'EXPIRED', 'CANCELLED', 'VOID'].includes(statusUpper);

                            return (
                              <tr key={d.id} className="hover:bg-[#FCFBF7] transition-colors">
                                <td className="p-3.5 whitespace-nowrap font-bold text-gray-700">
                                  {formatDate(d.createdAt)}
                                </td>
                                <td className="p-3.5 font-bold text-[#121316] max-w-xs truncate">
                                  {d.campaign?.title || d.userProject?.title || 'Ecosystem Support'}
                                </td>
                                <td className="p-3.5 font-mono text-[11px] text-gray-600 whitespace-nowrap">
                                  {d.paymentId || d.orderId || `TXN_${d.id.slice(0, 8).toUpperCase()}`}
                                </td>
                                <td className="p-3.5 font-headline font-black text-sm text-[#0F534A] whitespace-nowrap">
                                  {formatCurrency(Number(d.amount))}
                                </td>
                                <td className="p-3.5 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border-2 border-[#121316] shadow-[1px_1px_0_#121316] ${
                                      isSucceeded
                                        ? 'bg-[#9EFC5F] text-[#0F534A]'
                                        : isFailed
                                        ? 'bg-[#F4002C] text-white'
                                        : 'bg-[#FFDD33] text-[#121316]'
                                    }`}
                                  >
                                    {isSucceeded ? (
                                      <CheckCircle2 className="w-3 h-3" />
                                    ) : isFailed ? (
                                      <AlertCircle className="w-3 h-3" />
                                    ) : (
                                      <Clock className="w-3 h-3" />
                                    )}
                                    {isFailed ? 'FAILED' : (d.paymentStatus || 'SUCCEEDED')}
                                  </span>
                                </td>
                                <td className="p-3.5 text-right whitespace-nowrap">
                                  <button
                                    type="button"
                                    disabled={!isSucceeded}
                                    onClick={() => handleOpenReceiptModal(d)}
                                    className={`px-3 py-1 font-headline font-black text-[11px] uppercase tracking-wider border-2 border-[#121316] transition-all inline-flex items-center gap-1.5 ${
                                      isSucceeded
                                        ? 'bg-white hover:bg-[#FFDD33] text-[#121316] shadow-[2px_2px_0_#121316] cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5'
                                        : 'bg-gray-100 text-gray-400 border-gray-300 shadow-none cursor-not-allowed opacity-60'
                                    }`}
                                    title={isSucceeded ? 'View statutory 80G tax receipt' : 'Receipt available only after payment is completed'}
                                  >
                                    <FileText className={`w-3.5 h-3.5 ${isSucceeded ? 'text-[#FE4E1A]' : 'text-gray-400'}`} /> 80G Receipt
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── SECTION 3: ESCROW MILESTONES TRACKER ── */}
              {(activeTab === 'ALL' || activeTab === 'ESCROW') && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b-3 border-[#121316] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 bg-[#9EFC5F] border border-[#121316]"></div>
                      <h2 className="font-headline font-black text-lg sm:text-xl uppercase tracking-tight text-[#0F534A]">
                        Smart Escrow Milestone Pipeline ({escrowMilestones.length})
                      </h2>
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Dual-Custody Governance
                    </span>
                  </div>

                  {escrowMilestones.length === 0 ? (
                    <div className="bg-white border-2 border-[#121316] p-8 text-center text-sm font-bold text-gray-500">
                      No active milestone tranches found for your backed campaigns yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {escrowMilestones.map(({ campaignTitle, campaignId, milestone }, idx) => {
                        const statusUpper = (milestone.status || 'PENDING').toUpperCase();
                        const isCompleted = ['COMPLETED', 'DISBURSED', 'APPROVED'].includes(statusUpper);
                        const isInProgress = ['IN_PROGRESS', 'UNDER_REVIEW', 'ACTIVE'].includes(statusUpper);

                        return (
                          <div
                            key={milestone.id || `escrow_${idx}`}
                            className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-4 flex flex-col justify-between space-y-3"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider bg-[#FFDD33] text-[#0F534A] border border-[#121316] px-2 py-0.5">
                                  Milestone #{milestone.sequenceOrder || idx + 1}
                                </span>
                                <span
                                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 border border-[#121316] ${
                                    isCompleted
                                      ? 'bg-[#9EFC5F] text-[#0F534A]'
                                      : isInProgress
                                      ? 'bg-[#EFF6FF] text-[#1E40AF]'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}
                                >
                                  {statusUpper}
                                </span>
                              </div>

                              <h4 className="font-headline font-black text-sm uppercase leading-tight pt-1">
                                {milestone.title}
                              </h4>
                              <p className="text-xs text-gray-600 font-medium line-clamp-2">
                                {milestone.description || 'Milestone deliverable under dual-custody verification.'}
                              </p>
                            </div>

                            <div className="pt-2 border-t-2 border-[#121316]/10 flex items-center justify-between">
                              <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase">Tranche Budget</p>
                                <p className="font-headline font-black text-sm text-[#0F534A]">
                                  {formatCurrency(Number(milestone.targetAmount || 0))}
                                </p>
                              </div>
                              {getCampaignUrl(campaignId).startsWith('http') ? (
                                <a
                                  href={getCampaignUrl(campaignId)}
                                  className="text-xs font-headline font-black uppercase tracking-wider text-[#4717AE] hover:underline inline-flex items-center gap-1"
                                >
                                  View Campaign <ArrowRight className="w-3 h-3" />
                                </a>
                              ) : (
                                <Link
                                  to={getCampaignUrl(campaignId)}
                                  className="text-xs font-headline font-black uppercase tracking-wider text-[#4717AE] hover:underline inline-flex items-center gap-1"
                                >
                                  View Campaign <ArrowRight className="w-3 h-3" />
                                </Link>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Escrow Guarantee Callout */}
                  <div className="bg-[#FCFBF7] border-3 border-[#0F534A] shadow-[4px_4px_0_#9EFC5F] p-4 sm:p-5 flex items-start gap-4">
                    <ShieldCheck className="w-8 h-8 text-[#0F534A] flex-shrink-0 mt-0.5" />
                    <div className="space-y-1 text-xs">
                      <p className="font-headline font-black uppercase text-[#0F534A] tracking-wider text-sm">
                        DreamXec Dual-Custody Escrow Guarantee
                      </p>
                      <p className="text-gray-700 font-medium leading-relaxed">
                        Your contributed funds are secured in milestone-gated multi-signature vault accounts. 
                        Tranches are released to student innovators strictly after verified review and sign-off 
                        by institutional mentors and administrative committees.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

        {/* ── OFFICIAL 80G TAX EXEMPTION CERTIFICATE (FORM 10BE COMPLIANT) ── */}
        {selectedReceiptDonation && (
          <Official80GTaxReceiptModal
            donation={selectedReceiptDonation}
            receiptData={selectedReceiptData}
            onClose={() => {
              setSelectedReceiptDonation(null);
              setSelectedReceiptData(null);
            }}
            currentUser={currentUser}
          />
        )}
      </div>
    </>
  );
}