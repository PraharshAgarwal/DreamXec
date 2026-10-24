import React, { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Rocket,
  Search,
  Filter,
  Check,
  X,
  Eye,
  Clock,
  ArrowUpDown,
  ExternalLink,
  Award,
  AlertTriangle,
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import AdminProjectDetails from './AdminProjectDetails';
import Pagination from './Pagination';
import { getAllProjects, verifyUserProject } from '../../services/adminService';
import SEO from '../SEO';
import UserAvatar from '../common/UserAvatar';

export default function AdminCampaigns() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Campaign for Inspection Modal
  const [selectedProject, setSelectedProject] = useState<{ id: string; type: 'user' } | null>(null);

  // Reject Modal State
  const [rejectModalCampaign, setRejectModalCampaign] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'createdAt',
    direction: 'desc',
  });

  useEffect(() => {
    fetchCampaigns();
  }, [activeTab, page]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await getAllProjects({
        page,
        limit: 20,
        status: activeTab === 'ALL' ? undefined : (activeTab as any),
      });

      const list =
        res.data?.userProjects?.data ||
        (res.data as any)?.campaigns ||
        (res as any)?.data?.projects ||
        [];

      setCampaigns(list);
      setPagination(
        res.data?.userProjects?.pagination || {
          totalPages: Math.ceil(list.length / 20) || 1,
          total: list.length,
        }
      );
    } catch (error) {
      console.error('Fetch campaigns error:', error);
      toast.error('Failed to load campaigns list.');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // Local Sorting & Filtering
  const sortedCampaigns = useMemo(() => {
    let sortable = campaigns.filter((c) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.title?.toLowerCase().includes(q) ||
        c.student?.name?.toLowerCase().includes(q) ||
        c.user?.name?.toLowerCase().includes(q) ||
        c.category?.toLowerCase().includes(q)
      );
    });

    sortable.sort((a, b) => {
      if (sortConfig.key === 'amountRaised') {
        const amtA = Number(a.amountRaised ?? a.currentAmount ?? 0);
        const amtB = Number(b.amountRaised ?? b.currentAmount ?? 0);
        return sortConfig.direction === 'asc' ? amtA - amtB : amtB - amtA;
      }
      if (sortConfig.key === 'studentName') {
        const nameA = a.user?.name || a.student?.name || '';
        const nameB = b.user?.name || b.student?.name || '';
        return sortConfig.direction === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      }
      if (sortConfig.key === 'status') {
        const statusA = a.status || '';
        const statusB = b.status || '';
        return sortConfig.direction === 'asc' ? statusA.localeCompare(statusB) : statusB.localeCompare(statusA);
      }
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
    });

    return sortable;
  }, [campaigns, sortConfig, searchQuery]);

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    const toastId = toast.loading('Verifying and approving campaign...');
    try {
      await verifyUserProject(id, { status: 'APPROVED' });
      toast.success('🎉 Campaign verified & published live!', { id: toastId });
      fetchCampaigns();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to approve campaign', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModalCampaign || !rejectionReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    setActionLoading(true);
    const toastId = toast.loading('Submitting revision feedback...');
    try {
      await verifyUserProject(rejectModalCampaign.id, {
        status: 'REJECTED',
        reason: rejectionReason.trim(),
      });
      toast.success('Campaign rejected with feedback recorded.', { id: toastId });
      setRejectModalCampaign(null);
      setRejectionReason('');
      fetchCampaigns();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to reject campaign', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Campaign Governance & Approvals | DreamX Admin"
        description="Verify student proposals, inspect milestones, and govern marketplace campaigns."
      />

      <div className="flex min-h-screen bg-[#FCFBF7] text-[#121316]">
        <AdminSidebar activeTab="campaigns" />

        {selectedProject && (
          <AdminProjectDetails
            projectId={selectedProject.id}
            projectType={selectedProject.type}
            onClose={() => {
              setSelectedProject(null);
              fetchCampaigns();
            }}
          />
        )}

        <div className="flex-1 min-w-0 overflow-y-auto px-6 lg:px-10 py-8 space-y-6">
          {/* Header Title Banner */}
          <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
                <Rocket className="w-3.5 h-3.5" /> Campaign Governance Workbench
              </div>
              <h1 className="text-3xl font-headline font-black text-[#0F534A] uppercase tracking-tight">
                Campaign Verification & Catalog
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                Verify student campaign submissions, inspect milestone roadmap tranches, and monitor live fundraising progress.
              </p>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex bg-[#FCFBF7] p-1.5 border-3 border-[#121316] shadow-[3px_3px_0_#121316] gap-1 overflow-x-auto">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-[#FE4E1A] text-white border-[#121316] shadow-[2px_2px_0_#121316]'
                      : 'border-transparent text-gray-700 hover:bg-white'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Search Toolbar */}
          <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-4 flex items-center justify-between gap-4">
            <div className="w-full max-w-md relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search campaigns by title, creator..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white uppercase tracking-wider"
              />
            </div>

            <div className="text-xs font-mono font-bold text-gray-600">
              Showing <span className="text-[#0F534A]">{sortedCampaigns.length}</span> Campaigns
            </div>
          </div>

          {/* Main Table Card */}
          <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#4717AE] overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-[#0F534A] font-headline font-black text-xl animate-pulse uppercase">
                Loading campaigns...
              </div>
            ) : sortedCampaigns.length === 0 ? (
              <div className="p-16 text-center text-gray-500 font-headline font-bold text-base space-y-2">
                <AlertTriangle className="w-8 h-8 text-[#FE4E1A] mx-auto" />
                <p className="uppercase">No campaigns found matching filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#0F534A] text-white font-headline font-black uppercase tracking-wider border-b-3 border-[#121316]">
                    <tr>
                      <th
                        className="p-4 cursor-pointer hover:bg-[#0c433c] transition-colors"
                        onClick={() => handleSort('createdAt')}
                      >
                        Date {sortConfig.key === 'createdAt' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="p-4">Campaign Title</th>
                      <th
                        className="p-4 cursor-pointer hover:bg-[#0c433c] transition-colors"
                        onClick={() => handleSort('studentName')}
                      >
                        Student Creator {sortConfig.key === 'studentName' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th
                        className="p-4 cursor-pointer hover:bg-[#0c433c] transition-colors"
                        onClick={() => handleSort('amountRaised')}
                      >
                        Target / Raised {sortConfig.key === 'amountRaised' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th
                        className="p-4 cursor-pointer hover:bg-[#0c433c] transition-colors"
                        onClick={() => handleSort('status')}
                      >
                        Status {sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
                      </th>
                      <th className="p-4 text-right">Verification Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-200 font-medium">
                    {sortedCampaigns.map((c: any) => {
                      const isPending = c.status === 'PENDING' || c.status === 'PENDING_VERIFICATION' || c.status === 'SUBMITTED';
                      const isApproved = c.status === 'APPROVED' || c.status === 'LIVE';

                      return (
                        <tr key={c.id} className="hover:bg-[#FCFBF7] transition-colors">
                          <td className="p-4 text-gray-500 font-mono">
                            {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="p-4">
                            <span className="font-headline font-black text-sm text-[#0F534A] uppercase block">
                              {c.title}
                            </span>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              <span className="text-[10px] bg-[#FCFBF7] text-[#0F534A] border border-[#0F534A] px-1.5 py-0.5 font-bold uppercase">
                                {c.category || 'Innovation'}
                              </span>
                              <span className="text-[10px] bg-gray-100 text-gray-700 border border-gray-300 px-1.5 py-0.5 font-bold uppercase">
                                {c.stage || 'Discovery'}
                              </span>
                              {(c.members?.length > 1 || c.teamMembers?.length > 0) && (
                                <span className="text-[10px] bg-[#FFF9F2] text-[#FE4E1A] border border-[#FE4E1A] px-1.5 py-0.5 font-bold uppercase">
                                  👥 {c.members?.length || c.teamMembers?.length || 1} Members
                                </span>
                              )}
                              <span className="text-[10px] bg-[#FCFBF7] text-gray-600 border border-gray-300 px-1.5 py-0.5 font-mono">
                                🎯 {c.milestones?.length || 0} Tranches
                              </span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <UserAvatar
                                user={c.student || c.user}
                                src={c.student?.avatar || c.user?.avatar}
                                name={c.user?.name || c.student?.name}
                                username={c.user?.username || c.student?.username}
                                size="sm"
                                shape="circle"
                              />
                              <div className="min-w-0">
                                <span className="font-bold text-gray-800 block text-xs truncate">
                                  {c.user?.name || c.student?.name || 'Student Creator'}
                                </span>
                                <span className="text-[10px] text-gray-500 font-mono block truncate">
                                  {c.user?.email || c.student?.email || c.tenant?.name || ''}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className="font-mono font-bold text-[#0F534A] block">
                              Goal: ₹{(Number(c.targetAmount ?? c.goalAmount ?? 0)).toLocaleString('en-IN')}
                            </span>
                            <span className="font-mono font-bold text-[#FE4E1A] text-[11px]">
                              Raised: ₹{(Number(c.amountRaised ?? c.currentAmount ?? 0)).toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`inline-block px-2.5 py-0.5 text-[9px] font-headline font-black uppercase border-2 border-[#121316] ${
                                isApproved
                                  ? 'bg-[#9EFC5F] text-[#0F534A]'
                                  : c.status === 'REJECTED'
                                  ? 'bg-[#F4002C] text-white'
                                  : 'bg-[#FFDD33] text-[#121316]'
                              }`}
                            >
                              {c.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              <button
                                onClick={() => setSelectedProject({ id: c.id, type: 'user' })}
                                className="px-3 py-1.5 bg-[#4717AE] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#350f87]"
                              >
                                Review
                              </button>

                              {isPending && (
                                <>
                                  <button
                                    onClick={() => handleApprove(c.id)}
                                    disabled={actionLoading}
                                    className="px-3 py-1.5 bg-[#0F534A] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#FE4E1A] hover:bg-[#0b3d36]"
                                  >
                                    Approve ✓
                                  </button>
                                  <button
                                    onClick={() => setRejectModalCampaign(c)}
                                    disabled={actionLoading}
                                    className="px-3 py-1.5 bg-[#F4002C] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#c90024]"
                                  >
                                    Reject ✗
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-4 border-t-3 border-[#121316] bg-[#FCFBF7]">
              <Pagination page={page} totalPages={pagination.totalPages || 1} setPage={setPage} />
            </div>
          </div>
        </div>

        {/* Rejection Feedback Modal */}
        {rejectModalCampaign && (
          <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-4 border-[#121316] shadow-[10px_10px_0_#F4002C] max-w-md w-full p-6 space-y-4">
              <div className="space-y-1 text-center">
                <div className="w-12 h-12 bg-[#F4002C] text-white border-2 border-[#121316] flex items-center justify-center mx-auto text-xl shadow-[2px_2px_0_#121316] font-black">
                  ✗
                </div>
                <h3 className="font-headline font-black text-xl text-[#121316] uppercase">
                  Reject Campaign
                </h3>
                <p className="text-xs text-gray-600 font-medium">
                  Provide revision requirements for {rejectModalCampaign.title}.
                </p>
              </div>

              <div>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Budget breakdown requires itemization for phase 2..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-3 text-xs font-medium border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-[#121316]">
                <button
                  type="button"
                  onClick={() => setRejectModalCampaign(null)}
                  className="px-4 py-2 text-xs font-headline font-black uppercase bg-gray-100 border-2 border-[#121316]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  disabled={actionLoading || !rejectionReason.trim()}
                  className="px-5 py-2 text-xs font-headline font-black uppercase bg-[#F4002C] text-white border-2 border-[#121316] shadow-[3px_3px_0_#121316] disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Reject Campaign ✗'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}