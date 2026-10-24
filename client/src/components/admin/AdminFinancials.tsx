import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Landmark,
  DollarSign,
  Check,
  X,
  ArrowUpDown,
  Search,
  Filter,
  AlertTriangle,
  Building2,
  Calendar,
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import Pagination from './Pagination';
import { getAdminDonations, getAdminWithdrawals, processWithdrawal } from '../../services/adminService';
import SEO from '../SEO';

export default function AdminFinancials({ embedded = false }: { embedded?: boolean }) {
  const [activeTab, setActiveTab] = useState<'donations' | 'pending_withdrawals' | 'completed_withdrawals'>('donations');

  const [donations, setDonations] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [page, setPage] = useState(1);
  const [donationsPagination, setDonationsPagination] = useState({ totalPages: 1, total: 0 });
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, page]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'donations') {
        const res = await getAdminDonations(page, 20);
        const data = res.data?.donations || res.data || [];
        setDonations(Array.isArray(data) ? data : data.data || []);
        if (res.data?.pagination) setDonationsPagination(res.data.pagination);
      } else {
        const res = await getAdminWithdrawals(activeTab === 'pending_withdrawals' ? 'pending' : 'approved');
        const data = res.data?.withdrawals || res.data || [];
        setWithdrawals(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to load financials', error);
      toast.error('Failed to load financial records.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedDonations = useMemo(() => {
    let sortable = donations.filter((d) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        d.donorName?.toLowerCase().includes(q) ||
        d.donorEmail?.toLowerCase().includes(q) ||
        d.projectTitle?.toLowerCase().includes(q) ||
        d.campaign?.title?.toLowerCase().includes(q)
      );
    });

    sortable.sort((a, b) => {
      if (sortConfig.key === 'amount') {
        return sortConfig.direction === 'asc'
          ? (a.amount ?? 0) - (b.amount ?? 0)
          : (b.amount ?? 0) - (a.amount ?? 0);
      }
      if (sortConfig.key === 'donorName') {
        const nameA = a.donorName || a.donor?.name || '';
        const nameB = b.donorName || b.donor?.name || '';
        return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    });
    return sortable;
  }, [donations, sortConfig, searchQuery]);

  const filteredWithdrawals = useMemo(() => {
    if (activeTab === 'pending_withdrawals') {
      return withdrawals.filter((w) => (w.status || '').toUpperCase() === 'PENDING');
    }
    if (activeTab === 'completed_withdrawals') {
      return withdrawals.filter((w) => (w.status || '').toUpperCase() !== 'PENDING');
    }
    return [];
  }, [withdrawals, activeTab]);

  const sortedWithdrawals = useMemo(() => {
    let sortable = filteredWithdrawals.filter((w) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        w.project?.title?.toLowerCase().includes(q) ||
        w.campaign?.title?.toLowerCase().includes(q) ||
        w.project?.user?.name?.toLowerCase().includes(q) ||
        w.campaign?.student?.name?.toLowerCase().includes(q)
      );
    });

    sortable.sort((a, b) => {
      if (sortConfig.key === 'amount') {
        return sortConfig.direction === 'asc'
          ? (a.amount ?? 0) - (b.amount ?? 0)
          : (b.amount ?? 0) - (a.amount ?? 0);
      }
      if (sortConfig.key === 'studentName') {
        const nameA = a.project?.user?.name || a.campaign?.student?.name || '';
        const nameB = b.project?.user?.name || b.campaign?.student?.name || '';
        return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    });
    return sortable;
  }, [filteredWithdrawals, sortConfig, searchQuery]);

  const withdrawalTotalPages = Math.ceil(sortedWithdrawals.length / 15) || 1;
  const paginatedWithdrawals = sortedWithdrawals.slice((page - 1) * 15, page * 15);

  const handleWithdrawalAction = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (!window.confirm(`Are you sure you want to mark this payout as ${status}?`)) return;
    const toastId = toast.loading(`Processing payout status (${status})...`);
    try {
      await processWithdrawal(id, status === 'APPROVED' ? 'approved' : 'rejected');
      toast.success(`Payout marked as ${status}.`, { id: toastId });
      fetchData();
    } catch (error: any) {
      toast.error(error?.message || 'Payout processing failed', { id: toastId });
    }
  };

  const content = (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
            <Landmark className="w-3.5 h-3.5" /> Institutional Ledger & Escrow
          </div>
          <h1 className="text-3xl font-headline font-black text-[#0F534A] uppercase tracking-tight">
            Financial Ledger & Escrow Releases
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium">
            Monitor captured platform donations, student milestone disbursement requests, and bank payouts.
          </p>
        </div>

        {/* Ledger Tabs */}
        <div className="flex bg-[#FCFBF7] p-1.5 border-3 border-[#121316] shadow-[3px_3px_0_#121316] gap-1 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('donations');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
              activeTab === 'donations'
                ? 'bg-[#0F534A] text-white border-[#121316] shadow-[2px_2px_0_#FE4E1A]'
                : 'border-transparent text-gray-700 hover:bg-white'
            }`}
          >
            Donations Log
          </button>
          <button
            onClick={() => {
              setActiveTab('pending_withdrawals');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
              activeTab === 'pending_withdrawals'
                ? 'bg-[#FE4E1A] text-white border-[#121316] shadow-[2px_2px_0_#121316]'
                : 'border-transparent text-gray-700 hover:bg-white'
            }`}
          >
            Pending Payouts
          </button>
          <button
            onClick={() => {
              setActiveTab('completed_withdrawals');
              setPage(1);
            }}
            className={`px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
              activeTab === 'completed_withdrawals'
                ? 'bg-[#4717AE] text-white border-[#121316] shadow-[2px_2px_0_#121316]'
                : 'border-transparent text-gray-700 hover:bg-white'
            }`}
          >
            Completed Payouts
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-4 flex items-center justify-between gap-4">
        <div className="w-full max-w-md relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search records by donor, campaign, student..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white uppercase tracking-wider"
          />
        </div>

        <button
          onClick={fetchData}
          className="px-4 py-2 bg-[#0F534A] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#FE4E1A] hover:bg-[#0b3d36] cursor-pointer"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#4717AE] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-[#0F534A] font-headline font-black text-xl animate-pulse uppercase">
            Loading ledger records...
          </div>
        ) : activeTab === 'donations' ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#0F534A] text-white font-headline font-black uppercase tracking-wider border-b-3 border-[#121316]">
                  <tr>
                    <th className="p-4">Donor</th>
                    <th className="p-4">Campaign Project</th>
                    <th
                      className="p-4 cursor-pointer hover:bg-[#0c433c]"
                      onClick={() => handleSort('amount')}
                    >
                      Contribution Amount {sortConfig.key === 'amount' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th
                      className="p-4 cursor-pointer hover:bg-[#0c433c]"
                      onClick={() => handleSort('createdAt')}
                    >
                      Date {sortConfig.key === 'createdAt' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-200 font-medium">
                  {sortedDonations.map((d: any) => (
                    <tr key={d.id} className="hover:bg-[#FCFBF7] transition-colors">
                      <td className="p-4">
                        <div className="font-headline font-black text-sm text-[#0F534A] uppercase">
                          {d.donorName || d.donor?.name || 'Anonymous Donor'}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">{d.donorEmail || d.donor?.email}</div>
                      </td>
                      <td className="p-4 font-bold text-gray-800">
                        {d.projectTitle || d.campaign?.title || 'General Platform Donation'}
                      </td>
                      <td className="p-4 font-mono font-black text-base text-[#0B9C2C]">
                        ₹{(Number(d.amount ?? 0)).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-gray-500 font-mono">
                        {d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t-3 border-[#121316] bg-[#FCFBF7]">
              <Pagination page={page} totalPages={donationsPagination.totalPages || 1} setPage={setPage} />
            </div>
          </>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-[#0F534A] text-white font-headline font-black uppercase tracking-wider border-b-3 border-[#121316]">
                  <tr>
                    <th className="p-4">Campaign / Student</th>
                    <th
                      className="p-4 cursor-pointer hover:bg-[#0c433c]"
                      onClick={() => handleSort('amount')}
                    >
                      Payout Amount {sortConfig.key === 'amount' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                    </th>
                    <th className="p-4">Request Date</th>
                    <th className="p-4">Bank Account Details</th>
                    {activeTab === 'pending_withdrawals' && <th className="p-4 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-200 font-medium">
                  {paginatedWithdrawals.map((w: any) => (
                    <tr key={w.id} className="hover:bg-[#FCFBF7] transition-colors">
                      <td className="p-4">
                        <div className="font-headline font-black text-sm text-[#0F534A] uppercase">
                          {w.project?.title || w.campaign?.title || 'Campaign'}
                        </div>
                        <div className="text-xs text-gray-600 font-bold">
                          Lead: {w.project?.user?.name || w.campaign?.student?.name || 'Student Creator'}
                        </div>
                      </td>
                      <td className="p-4 font-mono font-black text-base text-[#FE4E1A]">
                        ₹{(Number(w.amount ?? 0)).toLocaleString('en-IN')}
                      </td>
                      <td className="p-4 text-gray-500 font-mono">
                        {w.createdAt ? new Date(w.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-4 font-mono text-xs">
                        {w.bankDetails ? (
                          <div className="space-y-0.5">
                            <span className="font-bold text-[#121316] block">{w.bankDetails.bankName}</span>
                            <span className="text-gray-600">A/C: {w.bankDetails.accountNumber}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Direct IFSC Linked</span>
                        )}
                      </td>
                      {activeTab === 'pending_withdrawals' && (
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 items-center">
                            <button
                              onClick={() => handleWithdrawalAction(w.id, 'APPROVED')}
                              className="px-3 py-1.5 bg-[#0F534A] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#FE4E1A] hover:bg-[#0b3d36]"
                            >
                              Disburse ✓
                            </button>
                            <button
                              onClick={() => handleWithdrawalAction(w.id, 'REJECTED')}
                              className="px-3 py-1.5 bg-[#F4002C] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#c90024]"
                            >
                              Reject ✗
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t-3 border-[#121316] bg-[#FCFBF7]">
              <Pagination page={page} totalPages={withdrawalTotalPages} setPage={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );

  if (embedded) return content;

  return (
    <>
      <SEO
        title="Financials & Escrow Ledger | DreamX Admin"
        description="Review captured donations, manage student milestone disbursement requests, and process bank payouts."
      />
      <div className="flex min-h-screen bg-[#FCFBF7] text-[#121316]">
        <AdminSidebar activeTab="financials" />
        <main className="flex-1 min-w-0 overflow-y-auto px-6 lg:px-10 py-8">
          {content}
        </main>
      </div>
    </>
  );
}