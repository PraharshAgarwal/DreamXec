import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  RefreshCw,
  Layers,
  Undo2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import apiRequest from '../../services/api';
import { LeetCodeCardSkeleton, LeetCodeMetricSkeleton } from '../common/LeetCodeSkeleton';

export const DxGlobalLedger: React.FC = () => {
  const [overview, setOverview] = useState<any>({
    totalGatewayClearing: 0,
    totalEscrowHeld: 0,
    totalUserStoredValue: 0,
    totalProtocolRevenue: 0,
    totalGatewayFees: 0,
    totalAccounts: 0,
    totalTransactions: 0,
  });
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [scopeFilter, setScopeFilter] = useState<string>('');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // Alert State
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLedgerData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await apiRequest<{
        overview: any;
        accounts: any[];
        transactions: any[];
        pagination: any;
      }>('/dx-admin/ledger/overview');

      if (res?.data) {
        setOverview(res.data.overview || {});
        setAccounts(res.data.accounts || []);
        setTransactions(res.data.transactions || []);
      }
    } catch (err: any) {
      console.error('Error fetching global ledger data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLedgerData();
  }, []);

  const handleReverseTransaction = async (txId: string) => {
    if (!window.confirm('Are you sure you want to reverse this ledger transaction? An inverse compensating journal will be posted.')) {
      return;
    }

    try {
      await apiRequest(`/dx-admin/ledger/transactions/${txId}/reverse`, {
        method: 'POST',
        body: JSON.stringify({ reason: 'Administrative user reversal from DX Admin' }),
      });
      setActionMessage({
        type: 'success',
        text: `Transaction #${txId.substring(0, 8)} reversed with compensating entry.`,
      });
      fetchLedgerData(true);
    } catch (err: any) {
      console.error('Error reversing transaction:', err);
      setActionMessage({
        type: 'error',
        text: err?.response?.data?.message || err.message || 'Failed to reverse transaction',
      });
    }
  };

  const filteredTxns = transactions.filter((t) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      t.id.toLowerCase().includes(searchLower) ||
      t.transactionType?.toLowerCase().includes(searchLower) ||
      t.referenceType?.toLowerCase().includes(searchLower) ||
      t.user?.fullName?.toLowerCase().includes(searchLower) ||
      t.organization?.name?.toLowerCase().includes(searchLower);

    const matchesStatus = !statusFilter || t.status === statusFilter;
    const matchesScope = !scopeFilter || t.scopeType === scopeFilter;

    return matchesSearch && matchesStatus && matchesScope;
  });

  return (
    <div className="space-y-6">
      {/* ── HEADER BANNER ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] p-6 sm:p-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-3 py-0.5 text-xs font-headline font-black uppercase tracking-wider">
            <Receipt className="w-4 h-4 text-[#0F534A]" /> Double-Entry Treasury &amp; Multi-Scope Ledger
          </div>
          <h1 className="text-2xl sm:text-4xl font-headline font-black text-[#0F534A] uppercase tracking-tight">
            DX Global Financial Ledger
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-2xl">
            Real-time audit trail of institutional research grants, escrow locked donations, milestone payout releases, and platform protocol fees across System, User, and Organization scopes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => fetchLedgerData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 bg-[#FCFBF7] hover:bg-gray-100 text-[#121316] text-xs sm:text-sm font-headline font-black uppercase tracking-wider px-4 py-3 border-3 border-[#121316] shadow-[4px_4px_0_#121316] transition-all cursor-pointer flex-shrink-0"
            title="Refresh Ledger Data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── ACTION NOTIFICATION ALERT ── */}
      {actionMessage && (
        <div
          className={`p-4 border-3 border-[#121316] shadow-[4px_4px_0_#121316] flex items-center justify-between animate-fadeIn ${
            actionMessage.type === 'success' ? 'bg-[#9EFC5F]/30 text-[#0F534A]' : 'bg-[#FEB3FC]/30 text-[#F4002C]'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-headline font-black uppercase">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#0F534A]" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#F4002C]" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-xs font-bold underline cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* ── CORE METRICS CARDS ── */}
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
            <div className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0_#FE4E1A] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-headline font-black uppercase text-[#FE4E1A] tracking-wider">
                  Total Gateway Inflow
                </span>
                <DollarSign className="w-5 h-5 text-[#FE4E1A]" />
              </div>
              <div className="text-3xl font-headline font-black text-[#121316] mt-2">
                ₹{Number(overview.totalGatewayClearing || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-gray-500 font-medium mt-1">Processed via Razorpay gateway clearing</div>
            </div>

            <div className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0_#0F534A] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-headline font-black uppercase text-[#0F534A] tracking-wider">
                  Campaign Research Escrow
                </span>
                <Lock className="w-5 h-5 text-[#0F534A]" />
              </div>
              <div className="text-3xl font-headline font-black text-[#0F534A] mt-2">
                ₹{Number(overview.totalEscrowHeld || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-gray-500 font-medium mt-1">Locked in campaign research accounts</div>
            </div>

            <div className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0_#4717AE] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-headline font-black uppercase text-[#4717AE] tracking-wider">
                  DX Protocol Revenue (3%)
                </span>
                <TrendingUp className="w-5 h-5 text-[#4717AE]" />
              </div>
              <div className="text-3xl font-headline font-black text-[#4717AE] mt-2">
                ₹{Number(overview.totalProtocolRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-gray-500 font-medium mt-1">Platform operational protocol pool</div>
            </div>

            <div className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0_#FFDD33] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-headline font-black uppercase text-gray-600 tracking-wider">
                  Gateway Processing Fees (2%)
                </span>
                <ShieldCheck className="w-5 h-5 text-[#0F534A]" />
              </div>
              <div className="text-3xl font-headline font-black text-[#121316] mt-2">
                ₹{Number(overview.totalGatewayFees || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-gray-500 font-medium mt-1">Surcharges &amp; transaction costs</div>
            </div>
          </>
        )}
      </div>

      {/* ── CHART OF ACCOUNTS (COA) OVERVIEW ACCORDION ── */}
      {accounts.length > 0 && (
        <div className="bg-white border-4 border-[#121316] shadow-[4px_4px_0_#121316] p-5 space-y-3">
          <div className="flex items-center justify-between border-b-2 border-[#121316] pb-2">
            <h3 className="text-sm font-headline font-black text-[#0F534A] uppercase flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#FE4E1A]" /> Chart of Accounts Balances ({accounts.length} Accounts)
            </h3>
            <span className="text-[10px] font-headline font-black text-[#121316] bg-[#FFDD33] px-2 py-0.5 border border-[#121316]">
              REAL-TIME SYNC
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {accounts.map((acc) => (
              <div key={acc.id} className="p-3 bg-[#FCFBF7] border-2 border-[#121316] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] font-bold text-[#121316]">{acc.accountNumber}</span>
                  <span
                    className={`text-[9px] font-headline font-black uppercase px-1.5 py-0.5 border border-[#121316] ${
                      acc.accountType === 'ASSET'
                        ? 'bg-[#18D7E8] text-[#121316]'
                        : acc.accountType === 'LIABILITY'
                        ? 'bg-[#FEB3FC] text-[#121316]'
                        : acc.accountType === 'REVENUE'
                        ? 'bg-[#9EFC5F] text-[#121316]'
                        : 'bg-[#FFDD33] text-[#121316]'
                    }`}
                  >
                    {acc.accountType}
                  </span>
                </div>
                <div className="text-xs font-bold text-gray-700 truncate">{acc.name}</div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                  <span className="text-[10px] text-gray-500 font-bold uppercase">{acc.scopeType}</span>
                  <span className="font-headline font-black text-sm text-[#0F534A]">
                    ₹{Number(acc.balanceCached || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 border-3 border-[#121316] shadow-[4px_4px_0_#0F534A]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search TXN ID, Type, Reference, or User..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-bold text-[#121316] placeholder-gray-400 focus:outline-none focus:border-[#FE4E1A]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-[#FCFBF7] px-3 py-2 border-2 border-[#121316]">
            <Filter className="w-4 h-4 text-gray-600" />
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="bg-transparent text-[#0F534A] text-xs font-headline font-black focus:outline-none cursor-pointer"
            >
              <option value="">All Scopes</option>
              <option value="SYSTEM">System Platform</option>
              <option value="USER">Individual User</option>
              <option value="ORGANIZATION">Organization</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-[#FCFBF7] px-3 py-2 border-2 border-[#121316]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-[#0F534A] text-xs font-headline font-black focus:outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="POSTED">POSTED (Active)</option>
              <option value="REVERSED">REVERSED</option>
              <option value="VOID">VOID</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── TRANSACTIONS TABLE ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-6 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
          <h3 className="text-base font-headline font-black text-[#121316] uppercase">
            IMMUTABLE JOURNAL ENTRIES &amp; TRANSACTIONS ({filteredTxns.length})
          </h3>
          <span className="text-xs font-headline font-black text-[#0F534A] uppercase bg-[#9EFC5F] px-2.5 py-0.5 border border-[#121316]">
            BALANCED ($\Sigma D = \Sigma C$)
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            <LeetCodeCardSkeleton />
            <LeetCodeCardSkeleton />
          </div>
        ) : filteredTxns.length === 0 ? (
          <div className="text-center py-12 bg-[#FCFBF7] border-2 border-dashed border-[#121316]">
            <Receipt className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <h4 className="text-sm font-headline font-black text-[#121316] uppercase">No Ledger Entries Found</h4>
            <p className="text-xs text-gray-500 mt-1 font-medium">No financial transactions match the selected filter criteria.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTxns.map((t) => {
              const isExpanded = expandedTxId === t.id;
              const legCount = t.entries?.length || 0;
              const totalAmount = t.entries?.find((e: any) => e.entryType === 'DEBIT')?.amount || t.metadata?.grossAmount || 0;

              return (
                <div
                  key={t.id}
                  className="border-3 border-[#121316] bg-[#FCFBF7] transition-all hover:bg-white"
                >
                  {/* Transaction Header Row */}
                  <div
                    onClick={() => setExpandedTxId(isExpanded ? null : t.id)}
                    className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-white p-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316] flex-shrink-0 mt-0.5">
                        <Receipt className="w-5 h-5 text-[#0F534A]" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-headline font-black text-xs sm:text-sm text-[#121316]">
                            {t.transactionType}
                          </span>
                          <span className="text-[10px] font-headline font-black uppercase px-2 py-0.5 border border-[#121316] bg-[#FFDD33] text-[#121316]">
                            {t.scopeType}
                          </span>
                          <span
                            className={`text-[10px] font-headline font-black uppercase px-2 py-0.5 border border-[#121316] ${
                              t.status === 'POSTED'
                                ? 'bg-[#9EFC5F] text-[#0F534A]'
                                : t.status === 'REVERSED'
                                ? 'bg-[#FEB3FC] text-[#F4002C]'
                                : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {t.status}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-gray-500 flex flex-wrap items-center gap-2">
                          <span>TX: {t.id.substring(0, 18)}...</span>
                          <span>•</span>
                          <span>Ref: {t.referenceType} ({t.referenceId ? t.referenceId.substring(0, 8) : 'N/A'})</span>
                          {t.user && (
                            <>
                              <span>•</span>
                              <span>By: {t.user.fullName || t.user.email}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between lg:justify-end gap-4">
                      <div className="text-right">
                        <div className="font-headline font-black text-base sm:text-lg text-[#0F534A]">
                          ₹{Number(totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-gray-400 font-mono">
                          {new Date(t.postedAt || t.createdAt).toLocaleString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {t.status === 'POSTED' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReverseTransaction(t.id);
                            }}
                            className="p-1.5 bg-[#FEB3FC] hover:bg-[#F4002C] hover:text-white border-2 border-[#121316] text-xs font-bold shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
                            title="Reverse Transaction"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button className="p-1 text-gray-600 hover:text-black">
                          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Multi-Leg Entries */}
                  {isExpanded && (
                    <div className="p-4 border-t-2 border-[#121316] bg-white space-y-3">
                      <div className="text-xs font-headline font-black text-[#0F534A] uppercase flex items-center justify-between">
                        <span>Journal Legs Breakdown ({legCount} Legs)</span>
                        <span className="font-mono text-[10px] text-gray-500">
                          Idempotency: {t.idempotencyKey || 'N/A'}
                        </span>
                      </div>

                      <div className="divide-y border-2 border-[#121316]">
                        {t.entries?.map((entry: any) => (
                          <div
                            key={entry.id}
                            className="p-2.5 flex items-center justify-between text-xs bg-[#FCFBF7]"
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`px-2 py-0.5 text-[9px] font-headline font-black uppercase border border-[#121316] ${
                                  entry.entryType === 'DEBIT'
                                    ? 'bg-[#FE4E1A] text-white'
                                    : 'bg-[#0F534A] text-white'
                                }`}
                              >
                                {entry.entryType}
                              </span>
                              <div>
                                <span className="font-headline font-bold text-[#121316]">
                                  {entry.account?.name || entry.account?.accountNumber || `Account #${entry.accountId.substring(0, 8)}`}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono ml-2">
                                  ({entry.account?.accountType})
                                </span>
                              </div>
                            </div>

                            <div className="font-headline font-black text-sm text-[#121316]">
                              ₹{Number(entry.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};

export default DxGlobalLedger;
