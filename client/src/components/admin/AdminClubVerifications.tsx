import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  ShieldCheck,
  Check,
  X,
  Eye,
  Search,
  AlertTriangle,
  Award,
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import Pagination from './Pagination';
import {
  getClubVerifications,
  approveClubVerification,
  rejectClubVerification,
} from '../../services/adminService';
import VerificationDetailModal from './VerificationDetailModal';
import SEO from '../SEO';

export default function AdminClubVerifications() {
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination & Sorting State
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  });
  const itemsPerPage = 20;

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await getClubVerifications();
      const data = res.data as any;
      setItems(Array.isArray(data) ? data : data?.verifications || data?.data || []);
    } catch (e) {
      console.error('Failed to load club verifications:', e);
      toast.error('Failed to load club verifications.');
    } finally {
      setLoading(false);
    }
  }

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // Sort Logic
  const sortedItems = useMemo(() => {
    let sortable = items.filter((v) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        v.collegeName?.toLowerCase().includes(q) ||
        v.clubName?.toLowerCase().includes(q) ||
        v.presidentName?.toLowerCase().includes(q) ||
        v.studentEmail?.toLowerCase().includes(q)
      );
    });

    sortable.sort((a, b) => {
      if (sortConfig.key === 'clubName') {
        return sortConfig.direction === 'asc'
          ? (a.clubName || '').localeCompare(b.clubName || '')
          : (b.clubName || '').localeCompare(a.clubName || '');
      }
      if (sortConfig.key === 'studentName') {
        return sortConfig.direction === 'asc'
          ? (a.presidentName || '').localeCompare(b.presidentName || '')
          : (b.presidentName || '').localeCompare(a.presidentName || '');
      }
      if (sortConfig.key === 'status') {
        return sortConfig.direction === 'asc'
          ? (a.status || '').localeCompare(b.status || '')
          : (b.status || '').localeCompare(a.status || '');
      }
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    });
    return sortable;
  }, [items, sortConfig, searchQuery]);

  // Paginate Logic
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage) || 1;
  const paginatedItems = sortedItems.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  async function approve(id: string) {
    if (!window.confirm('Approve this club verification and upgrade user to Club Lead?')) return;
    const toastId = toast.loading('Approving club verification...');
    try {
      await approveClubVerification(id);
      toast.success('🎉 Club lead verified successfully!', { id: toastId });
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Approve failed', { id: toastId });
    }
  }

  async function reject(id: string, reason: string) {
    const toastId = toast.loading('Submitting rejection...');
    try {
      await rejectClubVerification(id, reason);
      toast.success('Club verification rejected.', { id: toastId });
      load();
    } catch (e: any) {
      toast.error(e?.message || 'Reject failed', { id: toastId });
    }
  }

  return (
    <>
      <SEO
        title="Club Verifications | DreamX Admin"
        description="Verify campus clubs, student chapters, and president authorizations."
      />

      <div className="flex min-h-screen bg-[#FCFBF7] text-[#121316]">
        <AdminSidebar activeTab="club-verifications" />

        <main className="flex-1 min-w-0 overflow-y-auto px-6 lg:px-10 py-8 space-y-6">
          {/* Header */}
          <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
                <Building2 className="w-3.5 h-3.5" /> Club & Society Vetting
              </div>
              <h1 className="text-3xl font-headline font-black text-[#0F534A] uppercase tracking-tight">
                Campus Club Verifications
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                Review faculty letters, club registration documents, and approve Student Presidents.
              </p>
            </div>

            <button
              onClick={load}
              className="px-5 py-2 bg-[#0F534A] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#FE4E1A] hover:bg-[#0b3d36] cursor-pointer"
            >
              🔄 Refresh List
            </button>
          </div>

          {/* Search Toolbar */}
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-4 flex items-center justify-between gap-4">
            <div className="w-full max-w-md relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by club name, institution, president..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white uppercase tracking-wider"
              />
            </div>

            <div className="text-xs font-mono font-bold text-gray-600">
              Showing <span className="text-[#0F534A]">{sortedItems.length}</span> Requests
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#FE4E1A] overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-[#0F534A] font-headline font-black text-xl animate-pulse uppercase">
                Loading requests...
              </div>
            ) : paginatedItems.length === 0 ? (
              <div className="p-16 text-center text-gray-500 font-headline font-bold text-base space-y-2">
                <AlertTriangle className="w-8 h-8 text-[#FE4E1A] mx-auto" />
                <p className="uppercase">No club verification requests found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#0F534A] text-white font-headline font-black uppercase tracking-wider border-b-3 border-[#121316]">
                    <tr>
                      <th
                        className="p-4 cursor-pointer hover:bg-[#0c433c]"
                        onClick={() => handleSort('createdAt')}
                      >
                        Date {sortConfig.key === 'createdAt' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th
                        className="p-4 cursor-pointer hover:bg-[#0c433c]"
                        onClick={() => handleSort('clubName')}
                      >
                        College / Club {sortConfig.key === 'clubName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th
                        className="p-4 cursor-pointer hover:bg-[#0c433c]"
                        onClick={() => handleSort('studentName')}
                      >
                        President {sortConfig.key === 'studentName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th
                        className="p-4 cursor-pointer hover:bg-[#0c433c]"
                        onClick={() => handleSort('status')}
                      >
                        Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-200 font-medium">
                    {paginatedItems.map((v) => (
                      <tr key={v.id} className="hover:bg-[#FCFBF7] transition-colors">
                        <td className="p-4 text-gray-500 font-mono">
                          {new Date(v.createdAt).toLocaleDateString()}
                        </td>
                        <td className="p-4">
                          <div className="font-headline font-black text-sm text-[#0F534A] uppercase">
                            {v.collegeName}
                          </div>
                          <div className="text-xs text-gray-600 font-bold">
                            {v.clubName || 'Club Name Not Set'}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-bold text-gray-800">{v.presidentName}</div>
                          <div className="text-xs text-gray-500 font-mono">{v.studentEmail}</div>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[9px] font-headline font-black uppercase border-2 border-[#121316] ${
                              v.status === 'APPROVED'
                                ? 'bg-[#9EFC5F] text-[#0F534A]'
                                : v.status === 'REJECTED'
                                ? 'bg-[#F4002C] text-white'
                                : 'bg-[#FFDD33] text-[#121316]'
                            }`}
                          >
                            {v.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelected(v)}
                              className="px-3 py-1.5 bg-[#4717AE] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#350f87]"
                            >
                              Inspect
                            </button>
                            {v.status === 'PENDING' && (
                              <>
                                <button
                                  onClick={() => approve(v.id)}
                                  className="px-3 py-1.5 bg-[#0F534A] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#FE4E1A] hover:bg-[#0b3d36]"
                                >
                                  Approve ✓
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('Enter rejection reason:');
                                    if (reason) reject(v.id, reason);
                                  }}
                                  className="px-3 py-1.5 bg-[#F4002C] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#c90024]"
                                >
                                  Reject ✗
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-4 border-t-3 border-[#121316] bg-[#FCFBF7]">
              <Pagination page={page} totalPages={totalPages} setPage={setPage} />
            </div>
          </div>
        </main>

        {selected && (
          <VerificationDetailModal
            verification={selected}
            onClose={() => setSelected(null)}
            onApprove={approve}
            onReject={reject}
          />
        )}
      </div>
    </>
  );
}