import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  Clock,
  ArrowRight,
  Rocket,
  UserCheck,
  LayoutDashboard,
  CheckCircle2,
  AlertTriangle,
  IndianRupee,
  TrendingUp,
  FileCheck,
  Eye,
  Users,
} from 'lucide-react';
import apiRequest from '../../services/api';
import { Skeleton, LeetCodeCardSkeleton, LeetCodeMetricSkeleton, LeetCodeBannerSkeleton } from '../common/LeetCodeSkeleton';

let overviewCache: { stats: any; verifs: any[] } | null = null;

export const DxPlatformOverview: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(
    overviewCache?.stats || {
      pendingVerifications: 0,
      pendingCampaigns: 0,
      liveCampaigns: 0,
      fundsRaised: 0,
      orgRegistrations: 0,
    }
  );
  const [pendingVerifList, setPendingVerifList] = useState<any[]>(overviewCache?.verifs || []);
  const [loading, setLoading] = useState<boolean>(!overviewCache);

  useEffect(() => {
    const fetchOverviewData = async () => {
      if (!overviewCache) {
        setLoading(true);
      }
      try {
        const [statsRes, verifRes, orgRes, campRes] = await Promise.all([
          apiRequest<any>('/admin/stats').catch(() => null),
          apiRequest<any>('/dx-admin/verifications', { params: { status: 'PENDING' } }).catch(() => null),
          apiRequest<any>('/dx-admin/onboarding/orgs').catch(() => null),
          apiRequest<any>('/campaigns/pending-review').catch(() => null),
        ]);

        const adminStats = statsRes?.data?.stats || statsRes?.data || {};
        const verifs = verifRes?.data?.verifications || verifRes?.results || [];
        const orgs = orgRes?.data?.organizations || orgRes?.results || [];
        const camps = campRes?.data?.campaigns || campRes?.campaigns || [];

        const newStats = {
          pendingVerifications: Array.isArray(verifs) && verifs.length > 0 ? verifs.length : (adminStats.pendingVerifications ?? 0),
          pendingCampaigns: Array.isArray(camps) && camps.length > 0 ? camps.length : (adminStats.pendingCampaigns ?? 0),
          liveCampaigns: adminStats.liveCampaigns ?? 0,
          fundsRaised: adminStats.totalAmountRaised ?? 0,
          orgRegistrations: Array.isArray(orgs) ? orgs.length : 0,
        };
        const newVerifs = Array.isArray(verifs) ? verifs.slice(0, 3) : [];

        overviewCache = { stats: newStats, verifs: newVerifs };
        setStats(newStats);
        setPendingVerifList(newVerifs);
      } catch (err) {
        console.error('Error loading Platform Overview metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverviewData();
  }, []);

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER BANNER ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-3 py-0.5 text-xs font-headline font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#0F534A]" /> Single Source of Truth Governance Matrix
          </div>
          <h1 className="text-2xl sm:text-4xl font-headline font-black text-[#0F534A] uppercase tracking-tight">
            DX Platform Governance &amp; Administration
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-2xl">
            Centralized administrative access control, manual verification task queues, organization onboarding, and dynamic role workflows.
          </p>
        </div>

        <button
          onClick={() => navigate('/dx-admin/org-control')}
          className="flex items-center gap-2 bg-[#FE4E1A] hover:bg-[#0F534A] text-white text-xs sm:text-sm font-headline font-black uppercase tracking-wider px-5 py-3 border-3 border-[#121316] shadow-[4px_4px_0_#121316] transition-all cursor-pointer flex-shrink-0"
        >
          <Building2 className="w-4 h-4" /> Onboard New Institution <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* ── ACTION QUEUE PENDING ALERT BANNER ── */}
      {loading ? (
        <LeetCodeBannerSkeleton />
      ) : (
        <div className="bg-[#FCFBF7] border-4 border-[#121316] shadow-[6px_6px_0_#FE4E1A] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FE4E1A] text-white font-headline font-black text-[10px] uppercase tracking-widest border border-[#121316]">
              <AlertTriangle className="w-3.5 h-3.5" /> Action Queue Pending
            </span>
            <h2 className="text-xl font-headline font-black text-[#121316] uppercase tracking-tight">
              Verification Approvals Awaiting Action
            </h2>
            <p className="text-xs text-gray-600 font-medium">
              You have <strong className="text-[#FE4E1A]">{stats.pendingCampaigns} pending campaign(s)</strong> and{' '}
              <strong className="text-[#0F534A]">{stats.pendingVerifications} user verification request(s)</strong> awaiting institutional review.
            </p>
          </div>

          <button
            onClick={() => navigate('/dx-admin/users-approvals')}
            className="px-6 py-3 bg-[#4717AE] hover:bg-[#FE4E1A] text-white font-headline font-black text-xs uppercase tracking-wider border-3 border-[#121316] shadow-[4px_4px_0_#121316] transition-all cursor-pointer flex items-center gap-2 flex-shrink-0"
          >
            Verify Users ({stats.pendingVerifications}) →
          </button>
        </div>
      )}

      {/* ── 4 CORE METRICS CARDS ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <>
            <LeetCodeMetricSkeleton />
            <LeetCodeMetricSkeleton />
            <LeetCodeMetricSkeleton />
            <LeetCodeMetricSkeleton />
          </>
        ) : (
          <>
            {/* Card 1: Pending Campaigns */}
            <div
              onClick={() => navigate('/dx-admin/campaigns-approvals')}
              className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0_#FE4E1A] cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-headline font-black uppercase text-[#FE4E1A] tracking-wider">
                  Pending Campaigns
                </span>
                <Clock className="w-5 h-5 text-[#FE4E1A]" />
              </div>
              <div className="text-3xl font-headline font-black text-[#121316] mt-2">
                {stats.pendingCampaigns}
              </div>
              <div className="text-[11px] text-gray-500 font-medium mt-1">Awaiting marketplace verification</div>
            </div>

            {/* Card 2: User KYC Requests */}
            <div
              onClick={() => navigate('/dx-admin/users-approvals')}
              className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0_#4717AE] cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-headline font-black uppercase text-[#4717AE] tracking-wider">
                  User KYC Requests
                </span>
                <Users className="w-5 h-5 text-[#4717AE]" />
              </div>
              <div className="text-3xl font-headline font-black text-[#121316] mt-2">
                {stats.pendingVerifications}
              </div>
              <div className="text-[11px] text-gray-500 font-medium mt-1">Student &amp; ID verification queue</div>
            </div>

            {/* Card 3: Live Campaigns */}
            <div
              onClick={() => navigate('/dx-admin/campaigns-approvals')}
              className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0_#0F534A] cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-headline font-black uppercase text-[#0F534A] tracking-wider">
                  Live Campaigns
                </span>
                <Rocket className="w-5 h-5 text-[#0F534A]" />
              </div>
              <div className="text-3xl font-headline font-black text-[#121316] mt-2">
                {stats.liveCampaigns}
              </div>
              <div className="text-[11px] text-gray-500 font-medium mt-1">Actively raising student funds</div>
            </div>

            {/* Card 4: Funds Raised */}
            <div
              onClick={() => navigate('/dx-admin/ledger')}
              className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0_#FFDD33] cursor-pointer hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-headline font-black uppercase text-gray-600 tracking-wider">
                  Funds Raised
                </span>
                <IndianRupee className="w-5 h-5 text-[#0F534A]" />
              </div>
              <div className="text-3xl font-headline font-black text-[#0F534A] mt-2">
                ₹{stats.fundsRaised.toLocaleString()}
              </div>
              <div className="text-[11px] text-gray-500 font-medium mt-1">Protected in Institutional escrow</div>
            </div>
          </>
        )}
      </div>

      {/* ── CAMPAIGN PROPOSALS AWAITING VERIFICATION SECTION ── */}
      {loading ? (
        <LeetCodeCardSkeleton />
      ) : (
        <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-6 space-y-4">
          <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
            <div>
              <span className="text-[10px] font-headline font-black uppercase tracking-wider bg-[#FFDD33] text-[#121316] px-2.5 py-0.5 border border-[#121316]">
                MAKER-CHECKER REVIEW
              </span>
              <h3 className="text-base font-headline font-black text-[#121316] uppercase mt-1">
                CAMPAIGN PROPOSALS AWAITING VERIFICATION ({stats.pendingCampaigns})
              </h3>
            </div>

            <button
              onClick={() => navigate('/dx-admin/campaigns-approvals')}
              className="text-xs font-headline font-black text-[#FE4E1A] hover:underline uppercase flex items-center gap-1 cursor-pointer"
            >
              OPEN FULL REVIEW CONSOLE →
            </button>
          </div>

          {stats.pendingCampaigns === 0 ? (
            <div className="p-8 text-center space-y-2 border-2 border-dashed border-[#121316] bg-[#FCFBF7]">
              <CheckCircle2 className="w-10 h-10 text-[#0F534A] mx-auto" />
              <h4 className="text-sm font-headline font-black uppercase text-[#121316]">CAMPAIGN QUEUE IS CLEAR!</h4>
              <p className="text-xs text-gray-500 font-medium">All student and researcher campaigns have been verified.</p>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border-2 border-[#121316] flex items-center justify-between text-xs font-bold">
              <span>You have {stats.pendingCampaigns} pending campaign proposal(s) waiting for approval.</span>
              <button
                onClick={() => navigate('/dx-admin/campaigns-approvals')}
                className="px-4 py-2 bg-[#FE4E1A] text-white font-headline font-black text-xs uppercase border border-[#121316]"
              >
                Review Proposals →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── PENDING STUDENT VERIFICATION REQUESTS SECTION ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#4717AE] p-6 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
          <div>
            <span className="text-[10px] font-headline font-black uppercase tracking-wider bg-[#4717AE] text-white px-2.5 py-0.5 border border-[#121316]">
              KYC &amp; IDENTITY VERIFICATION
            </span>
            <h3 className="text-base font-headline font-black text-[#121316] uppercase mt-1">
              PENDING STUDENT VERIFICATION REQUESTS ({stats.pendingVerifications})
            </h3>
          </div>

          <button
            onClick={() => navigate('/dx-admin/users-approvals')}
            className="text-xs font-headline font-black text-[#4717AE] hover:underline uppercase flex items-center gap-1 cursor-pointer"
          >
            MANAGE ALL VERIFICATIONS →
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            <LeetCodeCardSkeleton />
            <LeetCodeCardSkeleton />
          </div>
        ) : pendingVerifList.length > 0 ? (
          <div className="space-y-3">
            {pendingVerifList.map((verif) => (
              <div
                key={verif.id}
                className="p-4 bg-[#FCFBF7] border-2 border-[#121316] flex items-center justify-between gap-4 shadow-[2px_2px_0_#121316]"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-[#0F534A] text-white text-[10px] font-headline font-black uppercase border border-[#121316]">
                      {verif.applicant?.role || 'STUDENT'}
                    </span>
                    <span className="text-xs font-headline font-black text-[#121316]">
                      {verif.applicant?.name || 'Onboarding User'}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">({verif.applicant?.email})</span>
                  </div>
                  <div className="text-[11px] font-bold text-[#0F534A]">
                    Institution: {verif.applicant?.organizationName || 'N/A'}
                  </div>
                </div>

                <button
                  onClick={() => navigate('/dx-admin/users-approvals')}
                  className="px-4 py-2 bg-[#FFDD33] hover:bg-[#FE4E1A] hover:text-white text-[#121316] font-headline font-black text-xs uppercase border-2 border-[#121316] transition cursor-pointer shadow-[2px_2px_0_#121316] flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" /> Inspect Proofs →
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center space-y-2 border-2 border-dashed border-[#121316] bg-[#FCFBF7]">
            <CheckCircle2 className="w-10 h-10 text-[#0F534A] mx-auto" />
            <h4 className="text-sm font-headline font-black uppercase text-[#121316]">VERIFICATION QUEUE IS CLEAR!</h4>
            <p className="text-xs text-gray-500 font-medium">There are no user verification requests pending review.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DxPlatformOverview;
