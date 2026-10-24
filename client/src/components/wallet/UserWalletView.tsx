import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Landmark,
  ShieldCheck,
  Building2,
  ExternalLink,
  ChevronRight,
  Info,
  X,
  CreditCard,
  AlertTriangle,
  History,
  Lock,
  Sparkles,
  Wifi,
  Percent,
  Check,
  Zap,
  Plus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  walletService,
  type WalletEligibility,
  type WithdrawalRecord,
} from '../../services/walletService';
import type { UserAccountVaultItem } from '../../services/vaultService';
import { AccountVaultModal } from '../vault/AccountVaultModal';
import { Link } from 'react-router-dom';
import apiRequest from '../../services/api';

interface UserWalletViewProps {
  onOpenLedgerTab?: () => void;
}

// Guard: simulation tools are strictly disabled in production builds
const isDev = import.meta.env.DEV === true;

export default function UserWalletView({ onOpenLedgerTab }: UserWalletViewProps) {
  // State
  const [eligibility, setEligibility] = useState<WalletEligibility | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Form State
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState<boolean>(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);

  // Load Wallet Data
  const loadWalletData = useCallback(async (showToast = false) => {
    try {
      setIsRefreshing(true);
      const [eligRes, withdrRes] = await Promise.all([
        walletService.getEligibility(),
        walletService.getMyWithdrawals({ limit: 50 }),
      ]);

      setEligibility(eligRes);
      setWithdrawals(withdrRes.withdrawals || []);
      setLastRefreshedAt(new Date());

      // Auto-select primary or first verified bank account if not selected
      setSelectedAccountId((prev) => {
        if (!prev && eligRes.bankAccounts?.length > 0) {
          const primary = eligRes.bankAccounts.find((a) => a.isPrimary) || eligRes.bankAccounts[0];
          return primary.id;
        }
        return prev;
      });

      if (showToast) {
        toast.success('Wallet & ledger balance synchronized with platform escrow.');
      }
    } catch (err: any) {
      console.error('[UserWalletView] Failed to load data:', err);
      toast.error(err.message || 'Failed to sync ledger balance.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadWalletData();
  }, [loadWalletData]);

  // Derived values
  const availableBalance = Number(eligibility?.availableBalance || 0);
  const totalBalance = Number(eligibility?.totalBalance || 0);
  const pendingHolds = Number(eligibility?.pendingWithdrawals || 0);
  const minWithdrawal = Number(eligibility?.minAmount || 500);

  const selectedAccount = useMemo(() => {
    return eligibility?.bankAccounts?.find((a) => a.id === selectedAccountId) || null;
  }, [eligibility?.bankAccounts, selectedAccountId]);

  const parsedAmount = Math.round((parseFloat(withdrawAmount) || 0) * 100) / 100;
  const remainingAfter = Math.max(0, Math.round((availableBalance - parsedAmount) * 100) / 100);
  // If less than ₹500 remains in the wallet after this payout, auto-sweep it into the payout
  const isSweepingRemainder = parsedAmount >= minWithdrawal && remainingAfter > 0 && remainingAfter < minWithdrawal;
  const effectivePayoutAmount = isSweepingRemainder ? availableBalance : parsedAmount;
  const isAmountValid = parsedAmount >= minWithdrawal && parsedAmount <= availableBalance;

  // Percentage & Amount Presets
  const handleSetRatio = (ratio: number) => {
    const computed = Math.min(availableBalance, Math.floor(availableBalance * ratio));
    setWithdrawAmount(computed > 0 ? computed.toString() : '');
  };

  const handleSetPreset = (amt: number) => {
    const capped = Math.min(amt, availableBalance);
    setWithdrawAmount(capped.toString());
  };

  const handleSetMax = () => {
    setWithdrawAmount(availableBalance.toString());
  };

  // Submit Withdrawal
  const handleInitiateWithdrawal = async () => {
    if (!isAmountValid || !selectedAccountId) {
      toast.error(`Please enter an amount between ₹${minWithdrawal} and ₹${availableBalance.toLocaleString('en-IN')}`);
      return;
    }
    setIsConfirmModalOpen(true);
  };

  const handleConfirmWithdrawal = async () => {
    if (!selectedAccountId || effectivePayoutAmount < minWithdrawal) return;

    setIsSubmitting(true);
    try {
      const res = await walletService.requestWithdrawal({
        amount: effectivePayoutAmount,
        vaultAccountId: selectedAccountId,
      });

      toast.success(`Withdrawal request for ₹${Number(res.amount).toLocaleString('en-IN')} submitted successfully!`);
      setIsConfirmModalOpen(false);
      setWithdrawAmount('');
      // Reload fresh ledger balance
      await loadWalletData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit withdrawal request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Withdrawal
  const handleCancelWithdrawal = async (id: string) => {
    setCancellingId(id);
    setConfirmCancelId(null);
    try {
      await walletService.cancelWithdrawal(id);
      toast.success('Withdrawal cancelled. Funds restored to available balance.');
      await loadWalletData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to cancel withdrawal.');
    } finally {
      setCancellingId(null);
    }
  };

  const [simulatingId, setSimulatingId] = useState<string | null>(null);

  // Dev simulation helper for bank webhook responses (Settlement vs Reversal)
  // ONLY available in non-production builds — never shown in production
  const handleSimulateWebhook = isDev
    ? async (id: string, action: 'SETTLE' | 'FAIL') => {
        setSimulatingId(id);
        try {
          if (action === 'SETTLE') {
            await apiRequest('/withdrawals/webhook', {
              method: 'POST',
              body: JSON.stringify({
                event: 'payout.processed',
                payload: {
                  payout: {
                    entity: {
                      id: `pout_sim_${Date.now()}`,
                      reference_id: id,
                      status: 'processed',
                      utr: `UTR${Date.now()}`,
                    },
                  },
                },
              }),
            });
            toast.success('Bank Webhook: Transfer settled and escrow discharged!');
          } else {
            await apiRequest('/withdrawals/webhook', {
              method: 'POST',
              body: JSON.stringify({
                event: 'payout.failed',
                payload: {
                  payout: {
                    entity: {
                      id: `pout_sim_${Date.now()}`,
                      reference_id: id,
                      status: 'failed',
                      failure_reason: 'Simulated banking network rejection',
                    },
                  },
                },
              }),
            });
            toast.success('Bank Webhook: Transfer failed, held funds restored to wallet!');
          }
          await loadWalletData();
        } catch (err: any) {
          toast.error(err.message || 'Simulation failed.');
        } finally {
          setSimulatingId(null);
        }
      }
    : async (_id: string, _action: 'SETTLE' | 'FAIL') => {}; // no-op in production

  // Status Badge Helper
  const renderStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SETTLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] text-[10px] font-headline font-black uppercase shadow-[2px_2px_0_#121316]">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#0F534A]" /> Settled (In Bank)
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#18D7E8] text-[#121316] border-2 border-[#121316] text-[10px] font-headline font-black uppercase shadow-[2px_2px_0_#121316]">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#121316]" /> Bank In-Flight
          </span>
        );
      case 'REQUESTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] text-[10px] font-headline font-black uppercase shadow-[2px_2px_0_#121316]">
            <Clock className="w-3.5 h-3.5 text-[#121316]" /> Debit Hold Active
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-200 text-gray-700 border-2 border-[#121316] text-[10px] font-headline font-black uppercase">
            Cancelled / Released
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#F4002C] text-white border-2 border-[#121316] text-[10px] font-headline font-black uppercase shadow-[2px_2px_0_#121316]">
            <AlertCircle className="w-3.5 h-3.5 text-white" /> Failed / Reversed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 border-2 border-[#121316] text-[10px] font-headline font-black uppercase">
            {status}
          </span>
        );
    }
  };

  // Helper to render live banking rail pipeline step circles
  const renderBankingRailTimeline = (status: string) => {
    const s = status.toUpperCase();
    const isRequestedDone = s === 'REQUESTED' || s === 'PROCESSING' || s === 'SETTLED';
    const isProcessingDone = s === 'PROCESSING' || s === 'SETTLED';
    const isSettledDone = s === 'SETTLED';
    const isFailed = s === 'FAILED';

    return (
      <div className="flex items-center gap-1.5 my-1" title={`Disbursement Rail Stage: ${status}`}>
        {/* Step 1: Hold Active */}
        <div className="flex items-center gap-1">
          <div
            className={`w-2.5 h-2.5 rounded-full border border-[#121316] ${
              s === 'CANCELLED'
                ? 'bg-gray-300'
                : isRequestedDone
                ? 'bg-[#9EFC5F]'
                : 'bg-gray-200'
            }`}
          />
          <span className="text-[9px] font-bold text-gray-500">Hold</span>
        </div>

        <ChevronRight className="w-3 h-3 text-gray-400" />

        {/* Step 2: Bank Gateway */}
        <div className="flex items-center gap-1">
          <div
            className={`w-2.5 h-2.5 rounded-full border border-[#121316] ${
              s === 'PROCESSING'
                ? 'bg-[#18D7E8] animate-pulse'
                : isSettledDone
                ? 'bg-[#9EFC5F]'
                : isFailed
                ? 'bg-[#F4002C]'
                : 'bg-gray-200'
            }`}
          />
          <span className="text-[9px] font-bold text-gray-500">IMPS</span>
        </div>

        <ChevronRight className="w-3 h-3 text-gray-400" />

        {/* Step 3: Settled in Bank */}
        <div className="flex items-center gap-1">
          <div
            className={`w-2.5 h-2.5 rounded-full border border-[#121316] ${
              isSettledDone ? 'bg-[#9EFC5F]' : 'bg-gray-200'
            }`}
          />
          <span className={`text-[9px] font-bold ${isSettledDone ? 'text-[#0F534A]' : 'text-gray-400'}`}>
            Vault
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* ── HEADER BANNER ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-6 sm:p-8 relative overflow-hidden bg-tactile-grid">
        <div className="absolute -right-8 -top-8 w-40 h-40 bg-[#FFDD33] border-4 border-[#121316] rounded-full -z-0 opacity-40 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0F534A] text-[#9EFC5F] border-2 border-[#121316] text-xs font-headline font-black uppercase tracking-wider shadow-[2px_2px_0_#121316]">
                <ShieldCheck className="w-4 h-4 text-[#9EFC5F]" />
                Double-Entry Institutional Ledger Verified
              </div>
              <span className="stamp-badge stamp-green text-xs">
                0% PLATFORM FEE
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-headline font-black text-[#121316] uppercase tracking-tight">
              Researcher Wallet & Payouts
            </h1>
            <p className="text-sm font-medium text-gray-700 max-w-2xl font-sans">
              Live stored-value claim backed 1:1 by platform escrow reserves. Disburse earned milestone tranches and research grants directly into your verified bank account.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <button
              onClick={() => loadWalletData(true)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-[#121316] border-3 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0_#121316] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#121316] transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-[#FE4E1A] ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Sync Ledger'}
            </button>
            {onOpenLedgerTab && (
              <button
                onClick={onOpenLedgerTab}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFDD33] text-[#121316] border-3 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0_#121316] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[1px_1px_0_#121316] transition-all cursor-pointer"
              >
                <History className="w-4 h-4 text-[#0F534A]" />
                Full Audit Trail
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI METRICS CARDS WITH TACTILE DESIGN ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance */}
        <div className="bg-[#9EFC5F] border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-6 flex flex-col justify-between space-y-4 relative overflow-hidden bg-tactile-dots-light">
          {/* Top sparkline bar */}
          <div className="flex items-center justify-between">
            <span className="font-headline font-black text-xs uppercase tracking-widest text-[#0F534A] bg-white border-2 border-[#121316] px-2.5 py-1 shadow-[2px_2px_0_#0F534A]">
              Available to Withdraw
            </span>
            <div className="w-10 h-10 bg-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] flex items-center justify-center">
              <Wallet className="w-5 h-5 text-[#0F534A]" />
            </div>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-headline font-black text-[#0F534A] tracking-tight">
              ₹{availableBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="inline-block w-2 h-2 rounded-full bg-[#0F534A] animate-ping" />
              <p className="text-[11px] font-bold text-[#0F534A]/90 uppercase">
                Liquid funds ready for direct NEFT / IMPS transfer
              </p>
            </div>
          </div>
          <div className="text-[10px] font-headline font-black uppercase text-[#0F534A] pt-2 border-t-2 border-[#0F534A]/25 flex items-center justify-between">
            <span>Minimum Payout: ₹{minWithdrawal}</span>
            <span className="bg-white/60 px-1.5 py-0.5 border border-[#0F534A]/30">Instant Settlement Rail</span>
          </div>
        </div>

        {/* Total Stored Value */}
        <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-6 flex flex-col justify-between space-y-4 relative overflow-hidden bg-tactile-dots-light">
          <div className="flex items-center justify-between">
            <span className="font-headline font-black text-xs uppercase tracking-widest text-gray-700 bg-[#FCFBF7] border-2 border-[#121316] px-2.5 py-1 shadow-[2px_2px_0_#121316]">
              Total Stored Value
            </span>
            <div className="w-10 h-10 bg-[#FFDD33] border-2 border-[#121316] shadow-[2px_2px_0_#121316] flex items-center justify-center">
              <Landmark className="w-5 h-5 text-[#121316]" />
            </div>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-headline font-black text-[#121316] tracking-tight">
              ₹{totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] font-bold text-gray-500 uppercase mt-1">
              Total cumulative liability owed across all grants & tranches
            </p>
          </div>
          <div className="text-[10px] font-headline font-black uppercase text-gray-600 pt-2 border-t-2 border-gray-200 flex items-center justify-between">
            <span className="text-[#0F534A] font-bold">100% Escrow Backed</span>
            <span className="stamp-badge stamp-green text-[9px] py-0">Solvency Verified</span>
          </div>
        </div>

        {/* In-Flight Debit Holds */}
        <div className="bg-[#FCFBF7] border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-6 flex flex-col justify-between space-y-4 relative overflow-hidden bg-tactile-dots-light">
          <div className="flex items-center justify-between">
            <span className="font-headline font-black text-xs uppercase tracking-widest text-[#FE4E1A] bg-white border-2 border-[#121316] px-2.5 py-1 shadow-[2px_2px_0_#FE4E1A]">
              In-Flight Debit Holds
            </span>
            <div className="w-10 h-10 bg-[#FE4E1A] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <p className="text-4xl sm:text-5xl font-headline font-black text-[#FE4E1A] tracking-tight">
              ₹{pendingHolds.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] font-bold text-gray-500 uppercase mt-1">
              Funds reserved in platform clearing for active payouts
            </p>
          </div>
          <div className="text-[10px] font-headline font-black uppercase text-gray-600 pt-2 border-t-2 border-gray-200 flex items-center justify-between">
            <span>Bank Processing Escrow</span>
            <span className="font-bold text-[#FE4E1A]">{eligibility?.inflightCount || 0} In-Flight Transfer(s)</span>
          </div>
        </div>
      </div>

      {/* ── WITHDRAWAL ACTION CONSOLE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Request Payout Form (7 cols) */}
        <div className="lg:col-span-7 bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b-3 border-[#121316] pb-4">
            <div>
              <span className="text-[10px] font-headline font-black uppercase text-[#FE4E1A] tracking-wider">
                Direct Disbursement
              </span>
              <h2 className="text-2xl font-headline font-black uppercase text-[#121316]">
                Initiate Bank Payout
              </h2>
            </div>
            <span className="bg-[#18D7E8] text-[#121316] border-2 border-[#121316] px-3 py-1 text-xs font-headline font-black uppercase shadow-[2px_2px_0_#121316]">
              Instant IMPS / UPI
            </span>
          </div>

          {/* Destination Account Selection: PHYSICAL EMBOSSED SMART BANK CARDS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-headline font-black text-xs uppercase tracking-wider text-[#121316] flex items-center gap-1.5">
                <Landmark className="w-4 h-4 text-[#0F534A]" />
                Select Destination Bank Account:
              </label>
              <button
                type="button"
                onClick={() => setIsVaultModalOpen(true)}
                className="text-[11px] font-headline font-black uppercase text-[#4717AE] hover:underline flex items-center gap-1 cursor-pointer"
              >
                + Add / Verify Account
              </button>
            </div>

            {(!eligibility?.bankAccounts || eligibility.bankAccounts.length === 0) ? (
              <div className="p-5 bg-[#FFF9E6] border-3 border-[#121316] shadow-[4px_4px_0_#121316] space-y-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-[#FE4E1A] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-headline font-black text-sm uppercase text-[#121316]">
                      No Verified Bank Account in Vault
                    </h4>
                    <p className="text-xs text-gray-700 font-medium mt-1">
                      To comply with RBI guidelines and prevent fraudulent disbursements, payouts are only made to bank accounts verified through our ₹1 Penny Drop protocol.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsVaultModalOpen(true)}
                  className="w-full py-3 bg-[#FFDD33] text-[#121316] border-3 border-[#121316] font-headline font-black text-xs uppercase tracking-widest shadow-[3px_3px_0_#121316] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 text-[#0F534A]" />
                  Verify Bank Account via ₹1 Penny Drop
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {eligibility.bankAccounts.map((acc) => {
                  const isSelected = acc.id === selectedAccountId;
                  const rawAcc = acc.bankAccountNumber || '';
                  const maskedFormatted = rawAcc
                    ? `•••• •••• •••• ${rawAcc.slice(-4)}`
                    : acc.upiId || '•••• •••• •••• ••••';

                  return (
                    <div
                      key={acc.id}
                      onClick={() => setSelectedAccountId(acc.id)}
                      className={`relative group cursor-pointer transition-all duration-200 overflow-hidden border-3 rounded-xl ${
                        isSelected
                          ? 'border-[#121316] shadow-[6px_6px_0_#FE4E1A] -translate-y-1'
                          : 'border-[#121316] shadow-[4px_4px_0_#121316] opacity-90 hover:opacity-100 hover:shadow-[5px_5px_0_#121316]'
                      }`}
                      style={{
                        background: 'linear-gradient(135deg, #181B1F 0%, #1D232A 50%, #0F534A 100%)',
                        color: '#FFFFFF',
                      }}
                    >
                      {/* Tactile grid texture */}
                      <div className="absolute inset-0 bg-tactile-grid opacity-15 pointer-events-none" />

                      <div className="p-5 relative z-10 space-y-4">
                        {/* Card Top: Bank Name, Chips, Badges */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-xs border border-white/20 flex items-center justify-center">
                              <Building2 className="w-4 h-4 text-[#9EFC5F]" />
                            </div>
                            <div>
                              <span className="font-headline font-black text-sm uppercase tracking-wider text-white block">
                                {acc.bankName || 'Verified Bank'}
                              </span>
                              <span className="text-[9px] font-mono text-[#9EFC5F] uppercase tracking-widest block">
                                Institutional Escrow Route
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {acc.isPrimary && (
                              <span className="bg-[#FFDD33] text-[#121316] text-[9px] font-headline font-black uppercase px-2 py-0.5 border border-[#121316] shadow-[1px_1px_0_#121316]">
                                Primary
                              </span>
                            )}
                            {acc.isVerified && (
                              <span className="bg-[#9EFC5F] text-[#0F534A] text-[9px] font-headline font-black uppercase px-2 py-0.5 border border-[#121316]">
                                KYC Verified
                              </span>
                            )}
                            <div
                              className={`w-6 h-6 rounded-full border-2 border-white flex items-center justify-center transition-all ${
                                isSelected ? 'bg-[#FE4E1A] scale-110 shadow-[0_0_8px_#FE4E1A]' : 'bg-black/40'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                            </div>
                          </div>
                        </div>

                        {/* Card Center: EMV Chip & Contactless & Hologram */}
                        <div className="flex items-center justify-between py-1">
                          <div className="flex items-center gap-3">
                            <div className="emv-chip">
                              <div className="emv-chip-core" />
                            </div>
                            <Wifi className="w-5 h-5 text-white/50 rotate-90" />
                          </div>

                          <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-white/20 hologram-shimmer shadow-sm">
                            <ShieldCheck className="w-3.5 h-3.5 text-[#121316]" />
                            <span className="text-[8px] font-headline font-black uppercase text-[#121316] tracking-tight">
                              RBI / NPCI SECURED
                            </span>
                          </div>
                        </div>

                        {/* Card Embossed Number */}
                        <div>
                          <p className="font-mono font-black text-lg sm:text-xl tracking-[0.18em] text-white/95 drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]">
                            {maskedFormatted}
                          </p>
                        </div>

                        {/* Card Bottom: Holder Name and IFSC */}
                        <div className="flex items-end justify-between border-t border-white/15 pt-2">
                          <div>
                            <span className="text-[8px] font-mono text-white/60 uppercase tracking-widest block">
                              ACCOUNT HOLDER
                            </span>
                            <span className="font-headline font-black text-xs uppercase tracking-wider text-white">
                              {acc.accountHolderName}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-[8px] font-mono text-white/60 uppercase tracking-widest block">
                              IFSC CODE
                            </span>
                            <span className="font-mono font-bold text-xs text-[#9EFC5F]">
                              {acc.ifscCode}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Selected Route Bottom Strip */}
                      {isSelected && (
                        <div className="bg-[#FE4E1A] text-white py-1 px-4 text-center font-headline font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 border-t border-[#121316]">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                          Target Destination for Next Disbursal
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Amount Input & Percentage Quick-Pills */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <label className="font-headline font-black text-xs uppercase tracking-wider text-[#121316]">
                Payout Amount (INR):
              </label>
              <span className="text-[11px] font-bold text-gray-500">
                Min: ₹{minWithdrawal} • Available: ₹{availableBalance.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-headline font-black text-2xl text-[#121316]">
                ₹
              </span>
              <input
                type="number"
                min={minWithdrawal}
                max={availableBalance}
                step="1"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="500"
                className="w-full pl-11 pr-4 py-4 bg-[#FCFBF7] border-3 border-[#121316] font-headline font-black text-2xl text-[#121316] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#FE4E1A] shadow-[4px_4px_0_#121316]"
              />
            </div>

            {/* Quick Ratio Percentage Buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-headline font-black uppercase text-gray-500 flex items-center gap-1">
                  <Percent className="w-3.5 h-3.5 text-[#FE4E1A]" />
                  Quick Ratio Calculator:
                </span>
                <span className="font-brush text-[#0F534A] text-xs">
                  Instant calculation
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '25%', ratio: 0.25 },
                  { label: '50%', ratio: 0.50 },
                  { label: '75%', ratio: 0.75 },
                  { label: '100% MAX', ratio: 1.0 },
                ].map(({ label, ratio }) => {
                  const calcAmt = Math.min(availableBalance, Math.floor(availableBalance * ratio));
                  const isDisabled = availableBalance < minWithdrawal || calcAmt < minWithdrawal;
                  const isSelected = parsedAmount === calcAmt && parsedAmount > 0;
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handleSetRatio(ratio)}
                      disabled={isDisabled}
                      className={`py-2 px-1 text-center font-headline font-black text-xs uppercase border-2 border-[#121316] transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FE4E1A] text-white shadow-[2px_2px_0_#121316] -translate-y-0.5'
                          : 'bg-white text-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#FFDD33] disabled:opacity-40 disabled:hover:bg-white'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Fixed Amount Presets */}
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[10px] font-headline font-black uppercase text-gray-500 mr-1">
                  Fixed:
                </span>
                {[500, 1000, 2500, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSetPreset(amt)}
                    disabled={amt > availableBalance}
                    className={`px-3 py-1.5 border-2 border-[#121316] text-xs font-headline font-black uppercase shadow-[2px_2px_0_#121316] transition-all cursor-pointer ${
                      parsedAmount === amt
                        ? 'bg-[#0F534A] text-[#9EFC5F]'
                        : 'bg-[#FCFBF7] text-[#121316] hover:bg-[#FFDD33] disabled:opacity-40 disabled:hover:bg-[#FCFBF7]'
                    }`}
                  >
                    ₹{amt.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            {/* Zero-Fee Guarantee Badge */}
            <div className="flex items-center justify-between p-3 bg-[#FFF9F2] border-2 border-[#121316] text-xs shadow-[2px_2px_0_#121316]">
              <div className="flex items-center gap-2">
                <span className="stamp-badge stamp-green text-xs">
                  0% FEE
                </span>
                <span className="font-bold text-[#121316]">
                  DreamXec absorbs all IMPS & NEFT gateway fees.
                </span>
              </div>
              <span className="font-headline font-black text-[#0F534A]">
                NET: ₹{effectivePayoutAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Auto-Sweep Notification Banner */}
            {isSweepingRemainder && (
              <div className="p-3.5 bg-[#E6F4EA] border-3 border-[#0F534A] shadow-[3px_3px_0_#0F534A] flex items-start gap-2.5 text-xs text-[#0F534A] animate-fadeIn">
                <Sparkles className="w-4 h-4 text-[#0F534A] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-headline font-black uppercase tracking-wide">
                    <span>Zero-Stranded Auto-Sweep Active</span>
                    <span className="bg-[#9EFC5F] text-[#0F534A] px-1.5 py-0.5 text-[9px] border border-[#0F534A]">
                      +₹{remainingAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <p className="font-medium text-gray-700 leading-relaxed font-sans">
                    Leaving ₹{remainingAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })} in your wallet would fall below the ₹{minWithdrawal} minimum withdrawal limit. We&apos;ve automatically swept this remainder into your payout so you receive the full <strong>₹{effectivePayoutAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</strong> without stranded funds.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Trigger */}
          <div className="pt-4 border-t-2 border-gray-200">
            <button
              type="button"
              onClick={handleInitiateWithdrawal}
              disabled={!isAmountValid || !selectedAccountId || isLoading}
              className="w-full py-4 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-3 border-[#121316] font-headline font-black text-base uppercase tracking-wider shadow-[5px_5px_0_#121316] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#121316] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
            >
              <ArrowUpRight className="w-6 h-6" />
              {isSweepingRemainder ? (
                <span>Request Full Payout of ₹{effectivePayoutAmount.toLocaleString('en-IN')}</span>
              ) : (
                <span>Request Payout of ₹{parsedAmount ? parsedAmount.toLocaleString('en-IN') : '0.00'}</span>
              )}
            </button>
            <p className="text-[11px] text-gray-500 font-medium text-center mt-2">
              Funds are held atomically via ledger debit hold (<code className="text-[#0F534A] font-mono">DR 2030 / CR 2025</code>) and processed via RazorpayX.
            </p>
          </div>
        </div>

        {/* Right: Architecture & Rules Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Institutional Double-Entry Visualizer Card */}
          <div className="bg-[#FCFBF7] border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#4717AE] text-white border-2 border-[#121316] flex items-center justify-center shadow-[2px_2px_0_#121316]">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-base uppercase text-[#121316]">
                    Double-Entry Architecture
                  </h3>
                  <span className="text-[10px] font-mono text-[#0F534A] uppercase tracking-widest block font-bold">
                    Cryptographic Escrow Pipeline
                  </span>
                </div>
              </div>
              <span className="font-brush text-[#FE4E1A] text-sm rotate-[-3deg] hidden sm:inline-block">
                Zero Double-Spend!
              </span>
            </div>

            <p className="text-xs text-gray-700 font-medium leading-relaxed font-sans">
              Unlike traditional apps with simple mutable balance counters, your DreamXec Wallet is an <strong>institutional double-entry liability account (<code className="font-mono text-[#0F534A]">2030_USER</code>)</strong>.
            </p>

            {/* Visual 3-Stage Pipeline Diagram */}
            <div className="space-y-2.5">
              {/* Step 1 */}
              <div className="p-3 bg-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] flex items-start gap-3">
                <div className="w-6 h-6 bg-[#9EFC5F] text-[#0F534A] border border-[#121316] flex items-center justify-center font-headline font-black text-[11px] shrink-0">
                  01
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-headline font-black text-xs uppercase text-[#121316]">
                      Milestone Grant Inflow
                    </span>
                    <span className="font-mono text-[9px] font-bold text-[#0F534A] bg-[#9EFC5F]/30 px-1 py-0.5 border border-[#0F534A]/30">
                      CR 2030_USER
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                    Platform escrow (<code className="font-mono text-[#0F534A]">1020_ESCROW_POOL</code>) credits your liability account upon verified milestone approval.
                  </p>
                </div>
              </div>

              {/* Connector Arrow */}
              <div className="flex justify-center -my-1 text-[#121316]">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>

              {/* Step 2 */}
              <div className="p-3 bg-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] flex items-start gap-3">
                <div className="w-6 h-6 bg-[#FFDD33] text-[#121316] border border-[#121316] flex items-center justify-center font-headline font-black text-[11px] shrink-0">
                  02
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-headline font-black text-xs uppercase text-[#121316]">
                      Atomic Debit Hold
                    </span>
                    <span className="font-mono text-[9px] font-bold text-[#FE4E1A] bg-[#FE4E1A]/15 px-1 py-0.5 border border-[#FE4E1A]/30">
                      DR 2030 / CR 2025
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                    Requesting a payout locks funds (<code className="font-mono text-[#FE4E1A]">2025_INFLIGHT</code>) to guarantee zero double-spending during bank transit.
                  </p>
                </div>
              </div>

              {/* Connector Arrow */}
              <div className="flex justify-center -my-1 text-[#121316]">
                <ArrowDown className="w-3.5 h-3.5" />
              </div>

              {/* Step 3 */}
              <div className="p-3 bg-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] flex items-start gap-3">
                <div className="w-6 h-6 bg-[#18D7E8] text-[#121316] border border-[#121316] flex items-center justify-center font-headline font-black text-[11px] shrink-0">
                  03
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-headline font-black text-xs uppercase text-[#121316]">
                      IMPS Bank Clearing
                    </span>
                    <span className="font-mono text-[9px] font-bold text-[#4717AE] bg-[#4717AE]/15 px-1 py-0.5 border border-[#4717AE]/30">
                      DR 2025 / CR 1020
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 font-medium mt-0.5">
                    RazorpayX routes funds to your bank. On settlement webhook, clearing liability discharges and funds arrive in your account.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-bold text-gray-600 pt-2 border-t border-gray-200">
              <span>Platform Escrow Reserve:</span>
              <span className="text-[#0F534A] font-headline font-black">1020_ESCROW_POOL</span>
            </div>
          </div>

          {/* Quick Policy Card */}
          <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-6 space-y-3">
            <h4 className="font-headline font-black text-sm uppercase text-[#121316] flex items-center gap-1.5">
              <Info className="w-4 h-4 text-[#FE4E1A]" />
              Disbursement Guarantees
            </h4>
            <div className="space-y-2 text-xs text-gray-600 font-medium">
              <p>• <strong>Instant Dispatch:</strong> IMPS transfers disburse immediately 24x7.</p>
              <p>• <strong>Zero Deductions:</strong> Researchers receive 100% of requested funds.</p>
              <p>• <strong>Reversal Protection:</strong> If receiving bank rejects deposit, funds automatically revert to your available balance.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── WITHDRAWAL HISTORY & AUDIT TRAIL ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-3 border-[#121316] pb-4">
          <div>
            <span className="text-[10px] font-headline font-black uppercase text-[#FE4E1A] tracking-wider">
              Disbursement History
            </span>
            <h3 className="text-2xl font-headline font-black uppercase text-[#121316]">
              Payout Requests & Settlements
            </h3>
          </div>
          <span className="text-xs font-bold text-gray-500">
            {withdrawals.length} Total Payout Record(s)
          </span>
        </div>

        {withdrawals.length === 0 ? (
          <div className="py-14 text-center bg-[#FCFBF7] border-3 border-dashed border-[#121316] space-y-3">
            <div className="w-12 h-12 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] shadow-[3px_3px_0_#121316] flex items-center justify-center mx-auto">
              <History className="w-6 h-6 text-[#121316]" />
            </div>
            <h4 className="font-headline font-black text-lg uppercase text-[#121316]">
              No Payout Requests Yet
            </h4>
            <p className="text-xs text-gray-600 font-medium max-w-sm mx-auto">
              When you submit a withdrawal request, you can monitor its real-time bank dispatch and settlement status here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-3 border-[#121316] bg-[#FCFBF7]">
                  <th className="p-3 text-xs font-headline font-black uppercase text-[#121316]">
                    Request Date
                  </th>
                  <th className="p-3 text-xs font-headline font-black uppercase text-[#121316]">
                    Reference / ID
                  </th>
                  <th className="p-3 text-xs font-headline font-black uppercase text-[#121316]">
                    Target Account
                  </th>
                  <th className="p-3 text-xs font-headline font-black uppercase text-[#121316] text-right">
                    Amount
                  </th>
                  <th className="p-3 text-xs font-headline font-black uppercase text-[#121316] text-center">
                    Rail Journey & Status
                  </th>
                  <th className="p-3 text-xs font-headline font-black uppercase text-[#121316] text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#121316]/10 text-xs font-medium text-gray-700">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-[#FCFBF7] transition-colors">
                    <td className="p-3 whitespace-nowrap">
                      {new Date(w.requestedAt || w.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="p-3 font-mono text-[11px] font-bold text-[#121316]">
                      #{w.id.slice(0, 8)}...
                      {w.utr && (
                        <span className="block text-[10px] text-[#0F534A] font-bold font-sans">
                          UTR: {w.utr}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <p className="font-bold text-[#121316]">{w.accountHolderName}</p>
                      <p className="text-[11px] text-gray-500">
                        {w.bankAccountNumber ? `••••${w.bankAccountNumber.slice(-4)}` : w.upiId || 'Direct Transfer'}
                        {w.ifscCode ? ` • ${w.ifscCode}` : ''}
                      </p>
                    </td>
                    <td className="p-3 text-right font-headline font-black text-sm text-[#121316]">
                      ₹{Number(w.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {renderStatusBadge(w.status)}
                        {renderBankingRailTimeline(w.status)}
                      </div>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      {w.status === 'REQUESTED' && (
                        confirmCancelId === w.id ? (
                          <div className="flex items-center justify-end gap-1.5 animate-in fade-in duration-150">
                            <button
                              type="button"
                              onClick={() => handleCancelWithdrawal(w.id)}
                              disabled={cancellingId === w.id}
                              className="px-2 py-1 bg-[#F4002C] text-white border-2 border-[#121316] text-[10px] font-headline font-black uppercase shadow-[2px_2px_0_#121316] transition-all disabled:opacity-50 cursor-pointer"
                            >
                              {cancellingId === w.id ? 'Releasing...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmCancelId(null)}
                              className="px-2 py-1 bg-white hover:bg-gray-100 text-[#121316] border-2 border-[#121316] text-[10px] font-headline font-black uppercase shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
                            >
                              Back
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmCancelId(w.id)}
                            className="px-2.5 py-1 bg-white hover:bg-[#F4002C] hover:text-white border-2 border-[#121316] text-[10px] font-headline font-black uppercase shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
                          >
                            Cancel & Release
                          </button>
                        )
                      )}
                      {w.status === 'SETTLED' && (
                        <span className="text-[10px] font-bold text-[#0F534A] flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F534A]" /> Disbursed
                        </span>
                      )}
                      {w.status === 'PROCESSING' && (
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-[#18D7E8]">
                            In Bank Queue
                          </span>
                          {isDev && (
                            <>
                              <button
                                onClick={() => handleSimulateWebhook(w.id, 'SETTLE')}
                                disabled={simulatingId === w.id}
                                className="px-2 py-0.5 bg-[#9EFC5F] hover:bg-[#0F534A] hover:text-white text-[#0F534A] border border-[#121316] text-[9px] font-headline font-black uppercase shadow-[1px_1px_0_#121316] transition-all disabled:opacity-50 cursor-pointer"
                                title="[DEV] Simulate bank confirming transfer settlement"
                              >
                                {simulatingId === w.id ? 'Settling...' : '⚙ Sim Settle'}
                              </button>
                              <button
                                onClick={() => handleSimulateWebhook(w.id, 'FAIL')}
                                disabled={simulatingId === w.id}
                                className="px-2 py-0.5 bg-[#FFF0F0] hover:bg-[#F4002C] hover:text-white text-[#F4002C] border border-[#121316] text-[9px] font-headline font-black uppercase shadow-[1px_1px_0_#121316] transition-all disabled:opacity-50 cursor-pointer"
                                title="[DEV] Simulate bank rejection and funds reversal back to balance"
                              >
                                ⚙ Sim Fail
                              </button>
                            </>
                          )}
                        </div>
                      )}

                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── CONFIRMATION MODAL ── */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-white border-4 border-[#121316] shadow-[8px_8px_0_#121316] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b-3 border-[#121316] pb-4">
              <h3 className="text-xl font-headline font-black uppercase text-[#121316] flex items-center gap-2">
                <AlertTriangle className="w-6 h-6 text-[#FE4E1A]" />
                Confirm Withdrawal
              </h3>
              <button
                onClick={() => setIsConfirmModalOpen(false)}
                className="w-8 h-8 bg-gray-100 hover:bg-[#F4002C] hover:text-white border-2 border-[#121316] flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-[#FCFBF7] border-3 border-[#121316] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-600 uppercase">
                  {isSweepingRemainder ? 'Total Disbursed Amount:' : 'Disbursement Amount:'}
                </span>
                <span className="text-2xl font-headline font-black text-[#FE4E1A]">
                  ₹{effectivePayoutAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {isSweepingRemainder && (
                <div className="p-2.5 bg-[#E6F4EA] border-2 border-[#0F534A] text-[11px] text-[#0F534A] space-y-1.5">
                  <div className="flex justify-between font-bold">
                    <span>Base Requested Amount:</span>
                    <span>₹{parsedAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between font-bold text-[#FE4E1A]">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#FE4E1A]" />
                      Auto-Swept Remainder (&lt; ₹{minWithdrawal}):
                    </span>
                    <span>+₹{remainingAfter.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <p className="text-[10px] text-gray-600 pt-1 border-t border-[#0F534A]/20 leading-tight">
                    <strong>Zero-Stranded Policy:</strong> Because leaving ₹{remainingAfter.toFixed(2)} in your wallet would fall below the ₹{minWithdrawal} minimum withdrawal limit, it was automatically added to this payout.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-200">
                <span className="font-bold text-gray-600 uppercase">Receiving Bank:</span>
                <span className="font-headline font-black text-[#121316]">{selectedAccount?.bankName || 'Verified Bank'}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-600 uppercase">Account Holder:</span>
                <span className="font-bold text-[#121316]">{selectedAccount?.accountHolderName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-600 uppercase">Account Number:</span>
                <span className="font-mono font-bold text-[#121316]">
                  {selectedAccount?.bankAccountNumber ? `••••${selectedAccount.bankAccountNumber.slice(-4)}` : selectedAccount?.upiId}
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#E6F4EA] border-2 border-[#0F534A] text-[11px] text-[#0F534A] font-medium leading-tight">
              <strong>Ledger Debit Hold Notice:</strong> Upon confirmation, ₹{effectivePayoutAmount.toLocaleString('en-IN')} will immediately be held against your liability account and dispatched to the banking rail via RazorpayX.
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmModalOpen(false)}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-white hover:bg-gray-100 text-[#121316] border-3 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0_#121316]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmWithdrawal}
                disabled={isSubmitting}
                className="flex-1 py-3 bg-[#9EFC5F] hover:bg-[#FE4E1A] hover:text-white text-[#0F534A] border-3 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[3px_3px_0_#121316] transition-colors flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Locking Funds...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirm & Disburse
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ACCOUNT VAULT MODAL (FOR ADDING NEW ACCOUNTS) ── */}
      <AccountVaultModal
        isOpen={isVaultModalOpen}
        onClose={() => {
          setIsVaultModalOpen(false);
          loadWalletData();
        }}
        onSelectAccount={(account) => {
          setSelectedAccountId(account.id);
          setIsVaultModalOpen(false);
          loadWalletData();
        }}
      />
    </div>
  );
}
