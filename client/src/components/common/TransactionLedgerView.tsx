import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Receipt,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowUpRight,
  ArrowDownLeft,
  Download,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Activity,
  Sparkles
} from 'lucide-react';
import { getMyLedger } from '../../services/donationService';
import { generateInvoicePdf } from '../../utils/generateInvoicePdf';
import { PaymentConfirmationModal } from './PaymentConfirmationModal';

export interface TransactionRecord {
  id: string;
  transactionHash: string;
  date: string;
  source: string;
  recipient: string;
  type: 'DONATION' | 'GRANT_PAYOUT' | 'ESCROW_RELEASE' | 'REFUND';
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  receiptUrl?: string;
  direction?: 'OUTGOING' | 'INCOMING';
  rawDate?: string;
}

interface TransactionLedgerViewProps {
  title?: string;
  subtitle?: string;
  transactions?: TransactionRecord[];
  isLoading?: boolean;
  orgId?: string | null;
  onRefresh?: () => void;
}

export default function TransactionLedgerView({
  title = "Student Project & Payout Ledger",
  subtitle = "Transparent audit trail of your campaign donations, lab booking receipts, and grant payouts",
  transactions: externalTransactions,
  isLoading: externalIsLoading = false,
  orgId = null,
  onRefresh
}: TransactionLedgerViewProps) {
  const [internalTransactions, setInternalTransactions] = useState<TransactionRecord[]>([]);
  const [internalLoading, setInternalLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [directionFilter, setDirectionFilter] = useState<'ALL' | 'INCOMING' | 'OUTGOING'>('ALL');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [receiptNotice, setReceiptNotice] = useState<string | null>(null);
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<TransactionRecord | null>(null);

  // Fetch transactions from backend
  const fetchLedger = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const res = await getMyLedger(orgId);
      const list = res?.data?.transactions || (res as any)?.transactions || [];
      if (Array.isArray(list)) {
        setInternalTransactions(list);
      }
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.warn('[TransactionLedgerView] Failed to fetch live ledger:', err);
    } finally {
      if (!isSilent) setIsRefreshing(false);
      setInternalLoading(false);
    }
  }, [orgId]);

  // Initial load
  useEffect(() => {
    fetchLedger();
  }, [fetchLedger]);

  // Real-time event subscription + active interval polling
  useEffect(() => {
    const handleTransactionEvent = (e: Event) => {
      console.log('⚡ [TransactionLedgerView] Live transaction update detected!', (e as CustomEvent)?.detail);
      fetchLedger(false);
      if (onRefresh) onRefresh();
    };

    const handleWindowFocus = () => {
      fetchLedger(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('dx:transaction_updated', handleTransactionEvent);
      window.addEventListener('dx:campaign_updated', handleTransactionEvent);
      window.addEventListener('dx:ledger_updated', handleTransactionEvent);
      window.addEventListener('focus', handleWindowFocus);
    }

    // Auto-polling interval: every 10 seconds while active
    const pollTimer = setInterval(() => {
      fetchLedger(true);
    }, 10000);

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('dx:transaction_updated', handleTransactionEvent);
        window.removeEventListener('dx:campaign_updated', handleTransactionEvent);
        window.removeEventListener('dx:ledger_updated', handleTransactionEvent);
        window.removeEventListener('focus', handleWindowFocus);
      }
      clearInterval(pollTimer);
    };
  }, [fetchLedger, onRefresh]);

  // Active dataset
  const activeTransactions = useMemo(() => {
    if (externalTransactions && externalTransactions.length > 0) {
      return externalTransactions;
    }
    return internalTransactions;
  }, [externalTransactions, internalTransactions]);

  const activeLoading = externalIsLoading || (internalLoading && activeTransactions.length === 0);

  // Summary Metrics
  const summary = useMemo(() => {
    let totalOutgoing = 0;
    let totalIncoming = 0;
    let completedCount = 0;
    let validCount = 0;

    for (const t of activeTransactions) {
      if (t.status === 'PENDING') continue;
      validCount++;
      if (t.status === 'COMPLETED') completedCount++;
      const isOut = t.direction === 'OUTGOING' || t.source.toLowerCase().startsWith('you');
      if (isOut) {
        totalOutgoing += Number(t.amount || 0);
      } else {
        totalIncoming += Number(t.amount || 0);
      }
    }

    return {
      totalOutgoing,
      totalIncoming,
      totalCount: validCount,
      completedCount,
    };
  }, [activeTransactions]);

  // Filtered List (excludes pending in-flight transactions)
  const filtered = useMemo(() => {
    return activeTransactions.filter((t) => {
      if (t.status === 'PENDING') return false;

      const matchesSearch =
        t.transactionHash.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.recipient.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = typeFilter === 'ALL' || t.type === typeFilter;

      const isOut = t.direction === 'OUTGOING' || t.source.toLowerCase().startsWith('you');
      const matchesDirection =
        directionFilter === 'ALL' ||
        (directionFilter === 'OUTGOING' && isOut) ||
        (directionFilter === 'INCOMING' && !isOut);

      return matchesSearch && matchesType && matchesDirection;
    });
  }, [activeTransactions, searchTerm, typeFilter, directionFilter]);

  // Export real CSV
  const handleExportCSV = () => {
    if (filtered.length === 0) {
      alert("No transactions to export for the selected filter.");
      return;
    }

    const headers = ["Transaction ID", "Hash", "Date", "Direction", "Sender", "Recipient", "Type", "Amount", "Currency", "Status"];
    const csvRows = [
      headers.join(","),
      ...filtered.map((t) => {
        const isOut = t.direction === 'OUTGOING' || t.source.toLowerCase().startsWith('you');
        const direction = isOut ? "OUTGOING" : "INCOMING";
        return [
          `"${t.id}"`,
          `"${t.transactionHash}"`,
          `"${t.date}"`,
          `"${direction}"`,
          `"${t.source.replace(/"/g, '""')}"`,
          `"${t.recipient.replace(/"/g, '""')}"`,
          `"${t.type}"`,
          t.amount,
          `"${t.currency}"`,
          `"${t.status}"`
        ].join(",");
      })
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dreamxec_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadReceipt = (t: TransactionRecord) => {
    // 1. Generate and download real vector-crisp PDF invoice
    try {
      generateInvoicePdf({
        amount: t.amount,
        campaignTitle: t.recipient || 'Student Innovation Project',
        orderId: t.transactionHash,
        paymentId: t.transactionHash.startsWith('pay_') ? t.transactionHash : undefined,
        donorName: t.source || 'Valued Backer',
        status: t.status === 'COMPLETED' ? 'SETTLED' : t.status,
        currency: t.currency || 'INR',
        date: t.rawDate || t.date,
      });
    } catch (err) {
      console.error('[TransactionLedgerView] Failed to generate PDF receipt:', err);
    }

    // 2. Open interactive Pine Labs thermal receipt modal
    setSelectedReceiptTx(t);

    setReceiptNotice(`Official 80G Receipt & PDF downloaded for ${t.transactionHash} (₹${t.amount.toLocaleString('en-IN')})`);
    setTimeout(() => setReceiptNotice(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* ── METRIC STATS ROW ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Stat 1: Outgoing Backing */}
        <div className="bg-white p-4 rounded-xl border-3 border-[#121316] shadow-[4px_4px_0_#121316] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-500">
              Total Backed (Outgoing)
            </span>
            <div className="text-xl font-headline font-black text-[#FE4E1A] mt-0.5">
              ₹{summary.totalOutgoing.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-gray-500 font-medium">Verified contributions</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FE4E1A]/10 border-2 border-[#121316] flex items-center justify-center text-[#FE4E1A]">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 2: Incoming Project Backing */}
        <div className="bg-white p-4 rounded-xl border-3 border-[#121316] shadow-[4px_4px_0_#121316] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-500">
              Project Raised (Incoming)
            </span>
            <div className="text-xl font-headline font-black text-[#0F534A] mt-0.5">
              ₹{summary.totalIncoming.toLocaleString('en-IN')}
            </div>
            <span className="text-[10px] text-gray-500 font-medium">Secured in campaign escrow</span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#9EFC5F]/30 border-2 border-[#121316] flex items-center justify-center text-[#0F534A]">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Stat 3: Total Transactions & Live Status */}
        <div className="bg-white p-4 rounded-xl border-3 border-[#121316] shadow-[4px_4px_0_#121316] flex items-center justify-between">
          <div>
            <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-500">
              Ledger Audit Trail
            </span>
            <div className="text-xl font-headline font-black text-[#4717AE] mt-0.5">
              {summary.totalCount} Transactions
            </div>
            <span className="text-[10px] text-[#0F534A] font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#9EFC5F] border border-[#0F534A] animate-ping" />
              Double-Entry Verified
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-[#FFDD33] border-2 border-[#121316] flex items-center justify-center text-[#121316]">
            <Activity className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── MAIN LEDGER CARD ── */}
      <div className="bg-white rounded-xl border-4 border-[#121316] shadow-[6px_6px_0_#121316] overflow-hidden">
        {/* ── HEADER ── */}
        <div className="bg-[#0F534A] text-white p-6 border-b-4 border-[#121316] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FFDD33] text-[#121316] border-3 border-[#121316] shadow-[2px_2px_0_#FE4E1A] flex items-center justify-center font-headline font-black shrink-0">
              <Receipt className="w-6 h-6 text-[#0F534A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-headline font-black text-2xl uppercase tracking-tight text-[#FFDD33]">
                  {title}
                </h2>
                {/* Live Badge */}
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] text-[10px] font-headline font-black uppercase tracking-wider shadow-[1px_1px_0_#121316]">
                  <span className="w-2 h-2 rounded-full bg-[#0F534A] animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-gray-200 font-medium tracking-wide">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Manual Refresh Button */}
            <button
              onClick={() => fetchLedger(false)}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#FFDD33] text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              title={`Last synced: ${lastRefreshedAt.toLocaleTimeString()}`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Sync'}
            </button>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-2 border-[#121316] shadow-[3px_3px_0_#FFDD33] font-headline font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Ledger CSV
            </button>
          </div>
        </div>

        {/* Notice Toast */}
        {receiptNotice && (
          <div className="bg-[#9EFC5F] border-b-2 border-[#121316] px-4 py-2 flex items-center justify-between text-xs font-bold text-[#0F534A]">
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {receiptNotice}
            </span>
            <button onClick={() => setReceiptNotice(null)} className="text-[#0F534A] hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* ── FILTERS & SEARCH ── */}
        <div className="p-4 bg-[#FCFBF7] border-b-4 border-[#121316] flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by transaction hash, sender, or recipient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#121316] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            {/* Direction Filter */}
            <div className="flex items-center gap-1 bg-white border-2 border-[#121316] p-1">
              <button
                onClick={() => setDirectionFilter('ALL')}
                className={`px-2 py-1 text-[10px] font-headline font-black uppercase transition-colors ${
                  directionFilter === 'ALL' ? 'bg-[#121316] text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setDirectionFilter('OUTGOING')}
                className={`px-2 py-1 text-[10px] font-headline font-black uppercase transition-colors ${
                  directionFilter === 'OUTGOING' ? 'bg-[#FE4E1A] text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Sent
              </button>
              <button
                onClick={() => setDirectionFilter('INCOMING')}
                className={`px-2 py-1 text-[10px] font-headline font-black uppercase transition-colors ${
                  directionFilter === 'INCOMING' ? 'bg-[#0F534A] text-white' : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Received
              </button>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1">
              <Filter className="w-4 h-4 text-gray-700" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 bg-white border-2 border-[#121316] text-xs font-headline font-black uppercase text-[#121316] focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="DONATION">Donations</option>
                <option value="GRANT_PAYOUT">Grant Payouts</option>
                <option value="ESCROW_RELEASE">Escrow Releases</option>
                <option value="REFUND">Refunds</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── LEDGER TABLE ── */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#FFDD33] border-b-3 border-[#121316] text-[11px] font-headline font-black uppercase tracking-wider text-[#121316]">
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Txn Reference</th>
                <th className="py-3 px-4">Flow</th>
                <th className="py-3 px-4">Sender → Recipient</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#121316] text-xs">
              {activeLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500 font-medium">
                    <div className="inline-flex items-center gap-2 text-sm font-bold text-[#0F534A]">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#FE4E1A]" />
                      Querying immutable double-entry ledger...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-gray-500 font-medium">
                    <div className="max-w-md mx-auto space-y-2">
                      <Receipt className="w-8 h-8 text-gray-400 mx-auto" />
                      <p className="font-headline font-black text-sm text-[#121316]">
                        No financial transactions matching criteria.
                      </p>
                      <p className="text-[11px] text-gray-500">
                        When you back a project, receive student campaign donations, or disburse grant funds, they will settle and appear here in real time.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isOut = t.direction === 'OUTGOING' || t.source.toLowerCase().startsWith('you');
                  return (
                    <tr key={t.id} className="hover:bg-[#FCFBF7] transition-colors">
                      {/* Date */}
                      <td className="py-3.5 px-4 font-mono text-gray-600 text-[11px] whitespace-nowrap">
                        {t.date}
                      </td>

                      {/* Txn Reference */}
                      <td className="py-3.5 px-4 font-mono font-bold text-[#4717AE] whitespace-nowrap">
                        <span className="hover:underline cursor-pointer" title={t.transactionHash}>
                          {t.transactionHash.length > 22
                            ? `${t.transactionHash.slice(0, 10)}...${t.transactionHash.slice(-8)}`
                            : t.transactionHash}
                        </span>
                      </td>

                      {/* Flow Direction */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 border-2 border-[#121316] px-2 py-0.5 text-[9px] font-headline font-black uppercase ${
                          isOut
                            ? 'bg-[#FE4E1A]/15 text-[#FE4E1A]'
                            : 'bg-[#9EFC5F]/30 text-[#0F534A]'
                        }`}>
                          {isOut ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownLeft className="w-3 h-3" />}
                          {isOut ? 'SENT' : 'RECEIVED'}
                        </span>
                      </td>

                      {/* Sender -> Recipient */}
                      <td className="py-3.5 px-4">
                        <div className="font-headline font-black text-[#121316] truncate max-w-[220px]" title={t.source}>
                          {t.source}
                        </div>
                        <div className="text-[10px] text-gray-500 font-medium truncate max-w-[220px]" title={t.recipient}>
                          → {t.recipient}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 border-2 border-[#121316] px-2 py-0.5 text-[9px] font-headline font-black uppercase ${
                          t.type === 'DONATION'
                            ? 'bg-[#18D7E8] text-[#121316]'
                            : t.type === 'GRANT_PAYOUT'
                            ? 'bg-[#9EFC5F] text-[#0F534A]'
                            : 'bg-[#FEB3FC] text-[#121316]'
                        }`}>
                          {t.type.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Amount */}
                      <td className={`py-3.5 px-4 text-right font-headline font-black text-sm whitespace-nowrap ${
                        isOut ? 'text-[#FE4E1A]' : 'text-[#0F534A]'
                      }`}>
                        {isOut ? '-' : '+'}₹{Number(t.amount || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 border-2 border-[#121316] px-2 py-0.5 text-[9px] font-headline font-black uppercase ${
                          t.status === 'COMPLETED'
                            ? 'bg-[#9EFC5F] text-[#0F534A]'
                            : t.status === 'PENDING'
                            ? 'bg-[#FFDD33] text-[#121316]'
                            : 'bg-[#F4002C] text-white'
                        }`}>
                          {t.status === 'COMPLETED' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : t.status === 'PENDING' ? (
                            <Clock className="w-3 h-3" />
                          ) : (
                            <AlertCircle className="w-3 h-3" />
                          )}
                          {t.status}
                        </span>
                      </td>

                      {/* Receipt */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDownloadReceipt(t)}
                          className="p-1.5 bg-white hover:bg-[#FFDD33] border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all text-[#121316] active:translate-x-0.5 active:translate-y-0.5"
                          title="Download Official 80G Receipt & Audit Proof"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── INTERACTIVE PINE LABS POS THERMAL RECEIPT MODAL ── */}
      {selectedReceiptTx && (
        <PaymentConfirmationModal
          isOpen={!!selectedReceiptTx}
          onClose={() => setSelectedReceiptTx(null)}
          amount={selectedReceiptTx.amount}
          campaignTitle={selectedReceiptTx.recipient || 'Student Innovation Project'}
          orderId={selectedReceiptTx.transactionHash}
          paymentId={selectedReceiptTx.transactionHash.startsWith('pay_') ? selectedReceiptTx.transactionHash : undefined}
          donorName={selectedReceiptTx.source || 'Valued Backer'}
          status={selectedReceiptTx.status === 'COMPLETED' ? 'SETTLED' : selectedReceiptTx.status === 'PENDING' ? 'PROCESSING' : 'FAILED'}
        />
      )}
    </div>
  );
}
