import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  UserCheck,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import {
  getFacultyEndorsementQueue,
  moderateFacultyEndorsement,
} from '../../services/adminService';

interface AdminFacultyEndorsementsProps {
  embedded?: boolean;
}

export default function AdminFacultyEndorsements({ embedded = false }: AdminFacultyEndorsementsProps) {
  const [endorsements, setEndorsements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Reject Modal
  const [rejectingItem, setRejectingItem] = useState<any | null>(null);
  const [rejectionFeedback, setRejectionFeedback] = useState('');

  useEffect(() => {
    loadEndorsements();
  }, [filter]);

  const loadEndorsements = async () => {
    try {
      setLoading(true);
      const res = await getFacultyEndorsementQueue(filter);
      const list = res?.data?.endorsements || (Array.isArray(res?.data) ? res.data : []);
      setEndorsements(list);
    } catch (err: any) {
      console.error('Fetch endorsements error:', err);
      toast.error('Failed to load faculty endorsements queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, campaignTitle: string) => {
    setActionLoading(true);
    const toastId = toast.loading(`Approving endorsement for "${campaignTitle}"...`);
    try {
      await moderateFacultyEndorsement(id, 'APPROVE');
      toast.success('🎉 Faculty endorsement approved! Campaign advanced to verification.', { id: toastId });
      loadEndorsements();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve faculty endorsement.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingItem) return;
    setActionLoading(true);
    const toastId = toast.loading('Recording endorsement rejection...');
    try {
      await moderateFacultyEndorsement(rejectingItem.id, 'REJECT', rejectionFeedback.trim() || undefined);
      toast.success('Endorsement rejected with administrative feedback.', { id: toastId });
      setRejectingItem(null);
      setRejectionFeedback('');
      loadEndorsements();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to reject endorsement.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredEndorsements = useMemo(() => {
    return endorsements.filter((e) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        e.campaign?.title?.toLowerCase().includes(q) ||
        e.campaign?.student?.fullName?.toLowerCase().includes(q) ||
        e.endorser?.fullName?.toLowerCase().includes(q) ||
        e.endorser?.email?.toLowerCase().includes(q) ||
        e.designation?.toLowerCase().includes(q)
      );
    });
  }, [endorsements, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#4717AE] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-[#FE4E1A]" /> Academic Governance • L14
          </div>
          <h1 className="text-3xl font-headline font-black text-[#0F534A] uppercase tracking-tight">
            Faculty Endorsement Moderation Queue
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium">
            Review professor, dean, and mentor endorsement sign-offs before student campaigns become publicly fundable.
          </p>
        </div>

        {/* TABS */}
        <div className="flex bg-[#FCFBF7] p-1.5 border-3 border-[#121316] shadow-[3px_3px_0_#121316] gap-1 overflow-x-auto">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
                filter === tab
                  ? 'bg-[#4717AE] text-white border-[#121316] shadow-[2px_2px_0_#121316]'
                  : 'border-transparent text-gray-700 hover:bg-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="w-full max-w-md relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by campaign title, student creator, faculty endorser..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white uppercase tracking-wider"
          />
        </div>

        <div className="text-xs font-mono font-bold text-gray-600">
          Showing <span className="text-[#4717AE]">{filteredEndorsements.length}</span> Endorsements
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-[#0F534A] font-headline font-black text-xl animate-pulse uppercase">
            Loading faculty endorsements...
          </div>
        ) : filteredEndorsements.length === 0 ? (
          <div className="p-16 text-center text-gray-500 font-headline font-bold text-base space-y-2">
            <AlertTriangle className="w-8 h-8 text-[#4717AE] mx-auto" />
            <p className="uppercase">No faculty endorsement requests found for this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#0F534A] text-white font-headline font-black uppercase tracking-wider border-b-3 border-[#121316]">
                <tr>
                  <th className="p-4">Target Campaign</th>
                  <th className="p-4">Student Creator</th>
                  <th className="p-4">Faculty Endorser</th>
                  <th className="p-4">Endorsement Letter / Statement</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Moderation Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-200 font-medium">
                {filteredEndorsements.map((e) => (
                  <tr key={e.id} className="hover:bg-[#FCFBF7] transition-colors">
                    <td className="p-4">
                      <div className="font-headline font-black text-sm text-[#121316] uppercase line-clamp-1">
                        {e.campaign?.title || 'Student Project'}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        Target: ₹{Number(e.campaign?.targetAmount || 0).toLocaleString()} • {e.campaign?.category || 'Innovation'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-headline font-bold text-xs text-[#0F534A] uppercase">
                        {e.campaign?.student?.fullName || 'Student Applicant'}
                      </div>
                      <div className="text-[11px] text-gray-500 font-mono">
                        {e.campaign?.student?.email || '—'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-headline font-black text-xs text-[#4717AE] uppercase">
                        {e.endorser?.fullName || 'Faculty Member'}
                      </div>
                      <div className="text-[11px] text-gray-600 font-semibold">
                        {e.designation || 'Faculty Endorser'}
                      </div>
                      <div className="text-[10px] text-gray-500 font-mono">
                        {e.endorser?.email}
                      </div>
                    </td>
                    <td className="p-4 max-w-xs">
                      {e.comments ? (
                        <div className="bg-[#FCFBF7] border border-gray-300 p-2 text-[11px] italic text-gray-700 line-clamp-3">
                          "{e.comments}"
                        </div>
                      ) : (
                        <span className="text-gray-400 italic">No narrative statement provided</span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500 font-mono text-[11px]">
                      {e.endorsedAt ? new Date(e.endorsedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[9px] font-headline font-black uppercase border-2 border-[#121316] ${
                          e.status === 'APPROVED'
                            ? 'bg-[#9EFC5F] text-[#0F534A]'
                            : e.status === 'REJECTED'
                            ? 'bg-[#F4002C] text-white'
                            : 'bg-[#FFDD33] text-[#121316]'
                        }`}
                      >
                        {e.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {e.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(e.id, e.campaign?.title)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] shadow-[2px_2px_0_#121316] text-xs font-headline font-black uppercase hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Advance
                          </button>
                          <button
                            onClick={() => setRejectingItem(e)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#F4002C] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] text-xs font-headline font-black uppercase hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400 font-mono text-[11px] uppercase">
                          Moderation Complete
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REJECT ENDORSEMENT MODAL */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border-4 border-[#121316] shadow-[8px_8px_0_#F4002C] max-w-md w-full p-6 space-y-4">
            <div className="space-y-1 text-center">
              <div className="w-12 h-12 bg-[#F4002C] text-white border-2 border-[#121316] flex items-center justify-center mx-auto text-xl shadow-[2px_2px_0_#121316] font-black">
                ✕
              </div>
              <h3 className="font-headline font-black text-xl text-[#121316] uppercase">
                Reject Faculty Endorsement
              </h3>
              <p className="text-xs text-gray-600 font-medium">
                Provide administrative feedback explaining why this faculty endorsement cannot be verified.
              </p>
            </div>

            <div>
              <textarea
                rows={4}
                placeholder="e.g. Faculty institutional credentials could not be verified with university directory..."
                value={rejectionFeedback}
                onChange={(e) => setRejectionFeedback(e.target.value)}
                className="w-full p-3 text-xs font-medium border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-[#121316]">
              <button
                type="button"
                onClick={() => setRejectingItem(null)}
                className="px-4 py-2 text-xs font-headline font-black uppercase bg-gray-100 border-2 border-[#121316]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={actionLoading}
                className="px-5 py-2 text-xs font-headline font-black uppercase bg-[#F4002C] text-white border-2 border-[#121316] shadow-[3px_3px_0_#121316] disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Recording...' : 'Reject Endorsement ✗'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
