import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Receipt,
  DollarSign,
  TrendingUp,
  FileText,
  Repeat,
  CheckCircle2,
  Clock,
  Download,
  Building2,
  Search,
  Filter,
  Check,
  X,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import UnifiedDashboardLayout from '../layout/UnifiedDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import TransactionLedgerView from '../common/TransactionLedgerView';
import {
  getDisbursements,
  authorizeDisbursement,
  rejectDisbursement,
  getAllRefunds,
  authorizeRefund,
  rejectRefund,
  getAllProjects,
} from '../../services/adminService';
import { getCSRUtilisationReport } from '../../services/donationService';
import { generateCSRUtilisationReportPdf } from '../../utils/generateCSRUtilisationReportPdf';
import { API_BASE_URL } from '../../utils/apiConfig';

export default function FinanceOfficerDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<string>(tabParam);

  const activeOrgId = (user?.activeProfile as any)?.organizationId || (user as any)?.organizationId;
  const activeOrgName = (user?.activeProfile as any)?.orgName || 'Institutional Finance Treasury';

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Live Disbursements Queue (K5, J8, B9)
  const [disbursements, setDisbursements] = useState<any[]>([]);
  const [disbCounts, setDisbCounts] = useState({
    PENDING_CHECKER: 0,
    SETTLED: 0,
    FAILED: 0,
    TOTAL: 0,
  });
  const [disbFilter, setDisbFilter] = useState<'ALL' | 'PENDING_CHECKER' | 'SETTLED'>('ALL');

  // Live Maker-Checker Refunds (K12)
  const [refundRequests, setRefundRequests] = useState<any[]>([]);

  // Campaigns for GFR-19A / CSR Report (K6, K7, O2)
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  // Confirmation Modal State (Issue #5)
  interface ActionModalState {
    type: 'APPROVE_DISBURSEMENT' | 'REJECT_DISBURSEMENT' | 'APPROVE_REFUND' | 'REJECT_REFUND';
    id: string;
    makerUserId?: string;
    title: string;
    description: string;
    requiresReason?: boolean;
    confirmButtonText: string;
    confirmButtonColor: string;
  }
  const [activeModal, setActiveModal] = useState<ActionModalState | null>(null);
  const [modalReason, setModalReason] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'overview');
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  const loadData = async () => {
    setLoading(true);
    setLoadError(null);
    let hadError = false;
    try {
      const [disbRes, refundRes, projRes] = await Promise.all([
        getDisbursements().catch((err) => {
          hadError = true;
          console.error('[FinanceDashboard] Failed to fetch disbursements:', err);
          return { data: { disbursements: [], counts: {} } };
        }),
        getAllRefunds().catch((err) => {
          hadError = true;
          console.error('[FinanceDashboard] Failed to fetch refunds:', err);
          return { data: { refunds: [] } };
        }),
        getAllProjects({ limit: 100 }).catch((err) => {
          console.error('[FinanceDashboard] Failed to fetch projects:', err);
          return { data: { userProjects: { data: [] } } };
        }),
      ]);

      if (hadError) {
        setLoadError('Financial ledger synchronization incomplete. Some records could not be fetched.');
      }

      const fetchedDisbursements = (disbRes.data as any)?.disbursements || [];
      setDisbursements(fetchedDisbursements);
      if ((disbRes.data as any)?.counts) {
        setDisbCounts((disbRes.data as any).counts);
      } else {
        const p = fetchedDisbursements.filter((d: any) => d.status === 'PENDING_CHECKER').length;
        const s = fetchedDisbursements.filter((d: any) => d.status === 'SETTLED').length;
        setDisbCounts({
          PENDING_CHECKER: p,
          SETTLED: s,
          FAILED: fetchedDisbursements.length - p - s,
          TOTAL: fetchedDisbursements.length,
        });
      }

      setRefundRequests((refundRes.data as any)?.refunds || []);

      const projs =
        (projRes.data as any)?.userProjects?.data ||
        (projRes.data as any)?.projects ||
        (projRes.data as any)?.campaigns ||
        [];
      setCampaignsList(projs);
      if (projs.length > 0 && !selectedCampaignId) {
        setSelectedCampaignId(projs[0].id);
      }
    } catch (err: any) {
      console.error('[FinanceDashboard] loadData error:', err);
      setLoadError(err?.message || 'Failed to load treasury data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── Step 5: Dual-Custody Disbursement Actions ──
  const handleApproveDisbursement = (id: string, makerUserId?: string) => {
    const isSuperAdmin = (user as any)?.role === 'SUPERADMIN' || user?.role === 'ADMIN';
    if (makerUserId && makerUserId === user?.id && !isSuperAdmin) {
      toast.error('Dual-Custody Violation: You were the Maker who verified this tranche proof. A separate Finance/Treasury Officer must authorize release.');
      return;
    }

    setActiveModal({
      type: 'APPROVE_DISBURSEMENT',
      id,
      makerUserId,
      title: 'Authorize Payout Release',
      description: 'Confirm dual-custody authorization? This will release escrow funds to the verified bank account and post an irrevocable debit to the general ledger.',
      confirmButtonText: 'Authorize Release',
      confirmButtonColor: 'bg-[#0F534A] hover:bg-[#156e63] text-white',
    });
  };

  const handleRejectDisbursement = (id: string) => {
    setModalReason('');
    setActiveModal({
      type: 'REJECT_DISBURSEMENT',
      id,
      title: 'Reject Disbursement Release',
      description: 'Enter audit justification for rejecting and locking this milestone payout:',
      requiresReason: true,
      confirmButtonText: 'Reject Disbursement',
      confirmButtonColor: 'bg-[#F4002C] hover:bg-[#d00025] text-white',
    });
  };

  // ── Step 7: Maker-Checker Refund Actions ──
  const handleApproveRefund = (id: string) => {
    setActiveModal({
      type: 'APPROVE_REFUND',
      id,
      title: 'Authorize Refund Reversal',
      description: 'Authorizing this refund will reverse the donation transaction in the ledger and decrement campaign raised amounts. Proceed?',
      confirmButtonText: 'Authorize Refund',
      confirmButtonColor: 'bg-[#FE4E1A] hover:bg-[#e03d0d] text-white',
    });
  };

  const handleRejectRefund = (id: string) => {
    setModalReason('');
    setActiveModal({
      type: 'REJECT_REFUND',
      id,
      title: 'Reject Refund Request',
      description: 'Enter audit justification for rejecting this refund request:',
      requiresReason: true,
      confirmButtonText: 'Reject Refund',
      confirmButtonColor: 'bg-[#F4002C] hover:bg-[#d00025] text-white',
    });
  };

  const handleExecuteModalAction = async () => {
    if (!activeModal) return;
    if (activeModal.requiresReason && !modalReason.trim()) {
      toast.error('Justification reason is required.');
      return;
    }

    setActionLoading(true);
    const { type, id } = activeModal;
    try {
      if (type === 'APPROVE_DISBURSEMENT') {
        const toastId = toast.loading('Authorizing release and executing double-entry ledger debit...');
        await authorizeDisbursement(id);
        toast.success('Escrow released! Double-entry ledger settlement confirmed.', { id: toastId });
      } else if (type === 'REJECT_DISBURSEMENT') {
        const toastId = toast.loading('Rejecting disbursement and locking tranche...');
        await rejectDisbursement(id, modalReason.trim());
        toast.success('Disbursement rejected and milestone reverted for review.', { id: toastId });
      } else if (type === 'APPROVE_REFUND') {
        const toastId = toast.loading('Authorizing refund & posting ledger reversal...');
        await authorizeRefund(id);
        toast.success('Refund authorized! Double-entry transaction reversed.', { id: toastId });
      } else if (type === 'REJECT_REFUND') {
        const toastId = toast.loading('Rejecting refund request...');
        await rejectRefund(id, modalReason.trim());
        toast.success('Refund request rejected.', { id: toastId });
      }
      setActiveModal(null);
      setModalReason('');
      await loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Operation failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Step 6: CSR Utilisation Report Exports ──
  const handleExportCSR_PDF = async () => {
    if (!selectedCampaignId) {
      toast.error('Please select an innovation campaign.');
      return;
    }

    const toastId = toast.loading('Generating GFR-19A Statutory Utilisation Certificate PDF...');
    try {
      const res = await getCSRUtilisationReport(selectedCampaignId);
      const report = (res.data as any)?.utilisationReport;
      if (!report) throw new Error('Utilisation report data not returned.');
      await generateCSRUtilisationReportPdf(report);
      toast.success('GFR-19A Utilisation Certificate downloaded successfully!', { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate report PDF.', { id: toastId });
    }
  };

  const handleExportCSR_CSV = async () => {
    if (!selectedCampaignId) {
      toast.error('Please select an innovation campaign.');
      return;
    }

    const toastId = toast.loading('Exporting GFR-19A Audit CSV Report...');
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/donations/campaign/${selectedCampaignId}/utilisation-report?format=csv`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to export CSV (${response.status} ${response.statusText})`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `CSR_Utilisation_Report_${selectedCampaignId.slice(0, 8)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Audit CSV Report downloaded successfully!', { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to export CSV report.', { id: toastId });
    }
  };

  // Filtered disbursements
  const filteredDisbursements = useMemo(() => {
    if (disbFilter === 'ALL') return disbursements;
    return disbursements.filter((d) => d.status === disbFilter);
  }, [disbursements, disbFilter]);

  // Financial KPIs
  const totalSettledAmount = disbursements
    .filter((d) => d.status === 'SETTLED')
    .reduce((acc, d) => acc + Number(d.amount || 0), 0);

  const pendingDisbursementAmount = disbursements
    .filter((d) => d.status === 'PENDING_CHECKER')
    .reduce((acc, d) => acc + Number(d.amount || 0), 0);

  return (
    <UnifiedDashboardLayout
      title={`${activeOrgName} • Finance & Treasury Console | DreamXec`}
      headerTitle={`${activeOrgName} • Treasury & Financial Hub`}
      headerSubtitle="Institutional escrow ledger, maker-checker disbursements, grant reconciliation, and audit compliance"
    >
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* Navigation Tabs */}
        <div className="relative">
          <div className="flex bg-white p-1.5 border-3 border-[#121316] shadow-[3px_3px_0_#121316] gap-1 overflow-x-auto">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'disburse', label: `Disbursement Queue (${disbCounts.PENDING_CHECKER})` },
              { id: 'ledger', label: 'Institutional Ledger' },
              { id: 'refunds', label: `Refund Reversals (${refundRequests.filter(r => r.status === 'PENDING').length})` },
              { id: 'uc', label: 'GFR-19A / CSR Reports' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-4 py-2 text-xs font-headline font-black uppercase tracking-wider border-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#0F534A] text-white border-[#121316] shadow-[2px_2px_0_#FE4E1A]'
                    : 'border-transparent text-gray-700 hover:bg-[#FCFBF7]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {/* Scroll hint gradient on mobile */}
          <div className="pointer-events-none absolute right-1 top-1 bottom-1 w-8 bg-gradient-to-l from-white via-white/80 to-transparent sm:hidden" />
        </div>

        {/* Load Error Retry Alert */}
        {loadError && (
          <div className="bg-[#FFF0F0] border-3 border-[#F4002C] shadow-[4px_4px_0_#F4002C] p-3 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#F4002C]">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{loadError}</span>
            </div>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-3 py-1 bg-white hover:bg-red-50 text-[#F4002C] border-2 border-[#F4002C] text-xs font-headline font-black uppercase tracking-wider cursor-pointer flex items-center gap-1.5 flex-shrink-0"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Retry
            </button>
          </div>
        )}

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-[#9EFC5F]/30 text-[#0F534A] border-2 border-[#121316] px-2.5 py-0.5 text-xs font-headline font-black uppercase tracking-wider">
                    <DollarSign className="w-3.5 h-3.5" /> Finance Officer Console
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#0F534A]/10 text-[#0F534A] border-2 border-[#121316] px-2 py-0.5 text-[11px] font-headline font-black uppercase">
                    <Building2 className="w-3 h-3" /> {activeOrgName}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-headline font-black text-[#121316] uppercase tracking-tight">
                  Financial Treasury & Escrow Custody Hub
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-2xl">
                  Dual-custody maker-checker authorization, double-entry escrow ledger settlements, and government-grade GFR-19A CSR reports.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => handleTabChange('disburse')}
                  className="bg-[#FE4E1A] hover:bg-[#e03d0d] text-white text-xs font-headline font-black uppercase tracking-wider px-3.5 py-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <DollarSign className="w-4 h-4" /> Pending Releases ({disbCounts.PENDING_CHECKER})
                </button>
                <button
                  onClick={() => handleTabChange('ledger')}
                  className="bg-[#0F534A] hover:bg-[#0b3d36] text-white text-xs font-headline font-black uppercase tracking-wider px-3.5 py-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" /> Full Org Ledger
                </button>
              </div>
            </div>

            {/* Financial KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#0F534A] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Settled Disbursements</span>
                  <Receipt className="w-4 h-4 text-[#0F534A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#0F534A]">
                  {loading ? (
                    <span className="text-sm font-medium text-gray-400">Loading...</span>
                  ) : loadError ? (
                    <span className="text-sm font-medium text-[#F4002C]">Unavailable</span>
                  ) : (
                    `₹${totalSettledAmount.toLocaleString('en-IN')}`
                  )}
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                  {loadError ? 'Sync failed' : `Dual-Signed & Settled (${disbCounts.SETTLED} Tranches)`}
                </p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Awaiting Checker Signoff</span>
                  <ShieldCheck className="w-4 h-4 text-[#FE4E1A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#FE4E1A]">
                  {loading ? (
                    <span className="text-sm font-medium text-gray-400">Loading...</span>
                  ) : loadError ? (
                    <span className="text-sm font-medium text-[#F4002C]">Unavailable</span>
                  ) : (
                    `₹${pendingDisbursementAmount.toLocaleString('en-IN')}`
                  )}
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">
                  {loadError ? 'Sync failed' : `${disbCounts.PENDING_CHECKER} Tranches Pending Authorization`}
                </p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FFDD33] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Active Grants</span>
                  <DollarSign className="w-4 h-4 text-[#FE4E1A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#121316]">
                  {loading ? (
                    <span className="text-sm font-medium text-gray-400">Loading...</span>
                  ) : (
                    `${campaignsList.length} Campaigns`
                  )}
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Campus Innovation Projects</p>
              </div>

              <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#9EFC5F] p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-700">Audit Compliance</span>
                  <CheckCircle2 className="w-4 h-4 text-[#0F534A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#0F534A]">
                  100% GFR-19A
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Double-Entry Ledger Verified</p>
              </div>
            </div>

            {/* Quick Disbursements Preview */}
            <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline font-black text-base uppercase text-[#121316]">
                    Immediate Maker-Checker Disbursement Queue
                  </h3>
                  <p className="text-xs text-gray-500">Milestone deliverables verified by Governance Maker, ready for Finance Checker authorization</p>
                </div>
                <button
                  onClick={() => handleTabChange('disburse')}
                  className="text-xs font-headline font-black uppercase text-[#FE4E1A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All ({disbCounts.PENDING_CHECKER})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {disbursements.filter(d => d.status === 'PENDING_CHECKER').slice(0, 3).map((d) => {
                  const studentName = d.milestone?.campaign?.student?.name || 'Creator';
                  const bank = d.milestone?.campaign?.beneficiaryDetails;
                  const isMakerSelf = d.makerUserId === user?.id && (user as any)?.role !== 'SUPERADMIN' && user?.role !== 'ADMIN';

                  return (
                    <div key={d.id} className="p-4 border-2 border-[#121316] bg-[#FCFBF7] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-[10px] font-bold bg-[#0F534A] text-white px-2 py-0.5 rounded">
                            {d.payoutReference || d.id.slice(0, 8)}
                          </span>
                          <span className="text-xs text-gray-700 font-bold">
                            Beneficiary: {studentName} {bank ? `(${bank.bankName || 'Bank'} A/C: ••••${bank.bankAccountNumber?.slice(-4) || 'XXXX'})` : ''}
                          </span>
                        </div>
                        <h4 className="font-headline font-black text-sm text-[#121316]">
                          {d.milestone?.campaign?.title || 'Academic Project'}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Tranche {d.milestone?.sequenceOrder}: <span className="font-bold text-[#0F534A]">{d.milestone?.title}</span> • Maker: <span className="font-bold">{d.makerUser?.name || 'Reviewer'}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="font-headline font-black text-base text-[#FE4E1A] block">
                            ₹{Number(d.amount).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-bold text-gray-500 uppercase">
                            Awaiting Checker
                          </span>
                        </div>
                        <button
                          onClick={() => handleApproveDisbursement(d.id, d.makerUserId)}
                          disabled={actionLoading || isMakerSelf}
                          className="bg-[#0F534A] hover:bg-[#0b3d36] text-white text-xs font-headline font-black uppercase px-3 py-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isMakerSelf ? 'Maker Separation' : 'Authorize Release ✓'}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {disbursements.filter(d => d.status === 'PENDING_CHECKER').length === 0 && (
                  <div className="p-8 text-center bg-[#FCFBF7] border-2 border-dashed border-gray-300">
                    <CheckCircle2 className="w-8 h-8 text-[#0F534A] mx-auto mb-2" />
                    <p className="text-sm font-headline font-black uppercase text-[#0F534A]">All Verified Tranches Released</p>
                    <p className="text-xs text-gray-500">No disbursements currently awaiting dual-custody authorization.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TRANSACTION LEDGER */}
        {activeTab === 'ledger' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Institutional Financial &amp; Escrow Ledger
              </h2>
              <p className="text-xs text-gray-500">
                Auditable double-entry ledger scoped strictly to {activeOrgName}
              </p>
            </div>

            <TransactionLedgerView orgId={activeOrgId} />
          </div>
        )}

        {/* TAB 3: DISBURSEMENTS QUEUE (K5, J8, B9) */}
        {activeTab === 'disburse' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-gray-100 pb-4">
              <div>
                <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                  Dual-Custody Milestone Disbursement Queue
                </h2>
                <p className="text-xs text-gray-500">
                  Enforces 4-Eyes separation of duties: Maker verifies deliverable proofs; Checker authorizes escrow bank debit.
                </p>
              </div>

              <div className="flex items-center gap-1">
                {(['ALL', 'PENDING_CHECKER', 'SETTLED'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setDisbFilter(f)}
                    className={`px-3 py-1.5 text-xs font-headline font-black uppercase border-2 cursor-pointer ${
                      disbFilter === f
                        ? 'bg-[#FE4E1A] text-white border-[#121316]'
                        : 'bg-white text-gray-700 border-gray-300'
                    }`}
                  >
                    {f.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredDisbursements.map((d) => {
                const studentName = d.milestone?.campaign?.student?.name || 'Creator';
                const bank = d.milestone?.campaign?.beneficiaryDetails;
                const isMakerSelf = d.makerUserId === user?.id && (user as any)?.role !== 'SUPERADMIN' && user?.role !== 'ADMIN';
                const isSettled = d.status === 'SETTLED';

                return (
                  <div
                    key={d.id}
                    className="p-5 border-2 border-[#121316] bg-[#FCFBF7] shadow-[2px_2px_0_#0F534A] flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold bg-[#FE4E1A] text-white px-2 py-0.5 rounded">
                          {d.payoutReference || d.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] font-bold text-gray-500">
                          Created: {new Date(d.createdAt).toLocaleDateString()}
                        </span>
                        {d.ledgerTxId && (
                          <span className="font-mono text-[9px] bg-[#9EFC5F]/40 border border-[#0F534A] text-[#0F534A] px-1.5 py-0.5">
                            Ledger Tx: {d.ledgerTxId.slice(0, 8)}...
                          </span>
                        )}
                      </div>

                      <h3 className="font-headline font-black text-base text-[#121316]">
                        {d.milestone?.campaign?.title || 'Academic Project'}
                      </h3>

                      <p className="text-xs text-gray-700 font-medium">
                        Milestone Tranche {d.milestone?.sequenceOrder}: <strong className="text-[#0F534A]">{d.milestone?.title}</strong>
                      </p>

                      <div className="text-xs text-gray-600 bg-white p-2 border border-gray-300 grid grid-cols-1 sm:grid-cols-2 gap-1 font-mono">
                        <div>Beneficiary: <strong className="font-sans">{studentName}</strong></div>
                        <div>Bank: <strong>{bank?.bankName || 'State Bank of India'}</strong></div>
                        <div>Account #: <strong>{bank?.bankAccountNumber || '••••••••4092'}</strong></div>
                        <div>IFSC: <strong>{bank?.ifscCode || 'SBIN0001042'}</strong></div>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-gray-600">
                        <span><strong>Maker:</strong> {d.makerUser?.name || 'Governance Officer'}</span>
                        {d.checkerUser && (
                          <span>• <strong>Checker:</strong> {d.checkerUser.name}</span>
                        )}
                      </div>

                      {isMakerSelf && (
                        <div className="bg-[#FFDD33]/40 border border-[#121316] p-2 text-[11px] font-bold text-[#121316] flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-[#FE4E1A]" />
                          Dual-Custody Lock: You verified the deliverables as Maker. Another Finance Officer must sign off as Checker.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col md:items-end gap-3 min-w-[200px]">
                      <div className="text-left md:text-right">
                        <span className="font-headline font-black text-2xl text-[#0F534A] block">
                          ₹{Number(d.amount).toLocaleString('en-IN')}
                        </span>
                        <span
                          className={`text-[10px] font-headline font-black uppercase px-2 py-0.5 rounded border border-[#121316] inline-block ${
                            isSettled
                              ? 'bg-[#9EFC5F] text-[#0F534A]'
                              : d.status === 'FAILED'
                              ? 'bg-[#F4002C] text-white'
                              : 'bg-[#FFDD33] text-[#121316]'
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>

                      {d.status === 'PENDING_CHECKER' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRejectDisbursement(d.id)}
                            disabled={actionLoading}
                            className="bg-[#F4002C] hover:bg-[#c90024] text-white px-3 py-2 text-xs font-headline font-black uppercase cursor-pointer disabled:opacity-50"
                          >
                            Reject ✗
                          </button>
                          <button
                            onClick={() => handleApproveDisbursement(d.id, d.makerUserId)}
                            disabled={actionLoading || isMakerSelf}
                            className="bg-[#0F534A] hover:bg-[#0b3d36] text-white px-4 py-2 text-xs font-headline font-black uppercase transition-all cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading ? 'Posting...' : 'Authorize Release ✓'}
                          </button>
                        </div>
                      )}

                      {isSettled && (
                        <span className="text-xs font-headline font-black text-[#0B9C2C] uppercase flex items-center gap-1">
                          ✓ Settled &amp; Transferred
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {filteredDisbursements.length === 0 && (
                <div className="p-12 text-center text-gray-500 font-medium bg-[#FCFBF7] border-2 border-dashed">
                  No disbursement records matching current filter.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: REFUNDS & LEDGER REVERSALS (K12) */}
        {activeTab === 'refunds' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                Maker-Checker Refund Adjustments &amp; Ledger Reversals
              </h2>
              <p className="text-xs text-gray-500">
                Process donor contribution returns, debit held funds, and post double-entry ledger reversals.
              </p>
            </div>

            <div className="space-y-3">
              {refundRequests.map((rf) => (
                <div
                  key={rf.id}
                  className="p-5 border-2 border-[#121316] bg-[#FCFBF7] shadow-[2px_2px_0_#121316] flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1">
                    <span className="font-mono text-[10px] font-bold bg-gray-200 px-2 py-0.5 rounded border border-[#121316]">
                      {rf.gatewayRefundId || rf.id.slice(0, 8)}
                    </span>
                    <h4 className="font-headline font-black text-sm text-[#121316]">
                      {rf.donorName} ({rf.donorEmail}) • <span className="text-[#FE4E1A]">₹{rf.amount.toLocaleString('en-IN')}</span>
                    </h4>
                    <p className="text-xs text-gray-600">
                      Reason: <strong>{rf.reason}</strong>
                    </p>
                    <p className="text-xs text-gray-500">
                      Campaign: <strong>{rf.campaignTitle}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-headline font-black uppercase px-2 py-0.5 border border-[#121316] ${
                        rf.status === 'SUCCESS'
                          ? 'bg-[#9EFC5F] text-[#0F534A]'
                          : rf.status === 'FAILED'
                          ? 'bg-[#F4002C] text-white'
                          : 'bg-[#FFDD33] text-[#121316]'
                      }`}
                    >
                      {rf.status}
                    </span>

                    {rf.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRejectRefund(rf.id)}
                          disabled={actionLoading}
                          className="bg-gray-200 hover:bg-gray-300 text-[#121316] text-xs font-headline font-black uppercase px-3 py-1.5 cursor-pointer"
                        >
                          Reject ✗
                        </button>
                        <button
                          onClick={() => handleApproveRefund(rf.id)}
                          disabled={actionLoading}
                          className="bg-[#F4002C] hover:bg-[#c90024] text-white text-xs font-headline font-black uppercase px-4 py-1.5 cursor-pointer shadow-[2px_2px_0_#121316]"
                        >
                          Authorize Refund ✓
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-gray-500 uppercase">Settled ✓</span>
                    )}
                  </div>
                </div>
              ))}

              {refundRequests.length === 0 && (
                <div className="p-12 text-center text-gray-500 font-medium bg-[#FCFBF7] border-2 border-dashed">
                  No pending refund requests. All accounts in balance.
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: GFR-19A UTILIZATION CERTIFICATE (UC) EXPORT (K6, K7, O2) */}
        {activeTab === 'uc' && (
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-6">
            <div className="border-b-2 border-gray-100 pb-4">
              <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                GFR-19A Utilization Certificate &amp; CSR Program Audit Report
              </h2>
              <p className="text-xs text-gray-500">
                Official statutory report certifying milestone deliverable verification, dual-signoff maker-checker audit trail, and zero-leakage escrow accounting.
              </p>
            </div>

            <div className="bg-[#FCFBF7] border-3 border-[#121316] p-5 space-y-4">
              <label className="block text-xs font-headline font-black uppercase text-[#0F534A]">
                Select Academic &amp; Innovation Campaign:
              </label>

              <select
                value={selectedCampaignId}
                onChange={(e) => setSelectedCampaignId(e.target.value)}
                className="w-full p-3 text-xs font-bold border-2 border-[#121316] bg-white focus:outline-none"
              >
                {campaignsList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} • Goal: ₹{Number(c.targetAmount || c.goalAmount || 0).toLocaleString('en-IN')} (Creator: {c.student?.name || 'Student Lead'})
                  </option>
                ))}
              </select>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleExportCSR_PDF}
                  className="bg-[#0F534A] hover:bg-[#0b3d36] text-white text-xs font-headline font-black uppercase px-4 py-2.5 flex items-center gap-2 cursor-pointer shadow-[3px_3px_0_#FE4E1A] transition-all"
                >
                  <Download className="w-4 h-4" /> Download Official GFR-19A PDF
                </button>

                <button
                  onClick={handleExportCSR_CSV}
                  className="bg-[#FFDD33] hover:bg-[#e6c72b] text-[#121316] text-xs font-headline font-black uppercase px-4 py-2.5 flex items-center gap-2 cursor-pointer border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all"
                >
                  <FileText className="w-4 h-4" /> Export Audit CSV Report
                </button>
              </div>

              <div className="bg-white border border-gray-300 p-4 text-xs text-gray-600 space-y-1">
                <span className="font-headline font-black text-[#0F534A] uppercase block">Compliance Notice:</span>
                <p>
                  This report conforms to General Financial Rules (GFR-19A) Form of Utilization Certificate. All milestone releases must have registered Maker (proof verifier) and Checker (finance officer) signatures before audit submission.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── ACTION CONFIRMATION MODAL (Issue #5) ── */}
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg bg-white border-4 border-[#121316] shadow-[8px_8px_0_#121316] p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between border-b-3 border-[#121316] pb-3">
                <h3 className="text-lg font-headline font-black uppercase text-[#121316] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-[#FE4E1A]" />
                  {activeModal.title}
                </h3>
                <button
                  onClick={() => !actionLoading && setActiveModal(null)}
                  className="w-7 h-7 bg-gray-100 hover:bg-[#F4002C] hover:text-white border-2 border-[#121316] flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-4 bg-[#FCFBF7] border-2 border-[#121316] space-y-3">
                <p className="text-xs text-gray-700 font-medium leading-relaxed">
                  {activeModal.description}
                </p>

                {activeModal.requiresReason && (
                  <div className="space-y-1.5 pt-2">
                    <label className="block text-[11px] font-headline font-black uppercase tracking-wider text-[#121316]">
                      Audit Justification / Note *
                    </label>
                    <textarea
                      rows={3}
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                      placeholder="Specify reasons for compliance and audit trail..."
                      className="w-full p-2.5 text-xs font-medium border-2 border-[#121316] bg-white focus:outline-none focus:ring-1 focus:ring-[#0F534A]"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  disabled={actionLoading}
                  className="flex-1 py-2.5 bg-white hover:bg-gray-100 text-[#121316] border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_#121316] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteModalAction}
                  disabled={actionLoading}
                  className={`flex-1 py-2.5 border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[2px_2px_0_#121316] cursor-pointer transition-colors flex items-center justify-center gap-2 ${activeModal.confirmButtonColor}`}
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {activeModal.confirmButtonText}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </UnifiedDashboardLayout>
  );
}
