import React, { useEffect, useState } from 'react';
import {
  FileText,
  ShieldCheck,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  User,
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import Pagination from './Pagination';
import { getAuditLogs } from '@/services/adminService';
import SEO from '../SEO';

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterType, setFilterType] = useState('ALL');
  const [pagination, setPagination] = useState({ totalPages: 1, total: 0 });

  useEffect(() => {
    fetchLogs();
  }, [page, filterType]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getAuditLogs(page, 20, filterType === 'ALL' ? undefined : filterType);
      if (res && res.data) {
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination || { totalPages: 1, total: 0 });
      } else {
        setLogs([]);
      }
    } catch (error) {
      console.error('Fetch audit logs error', error);
      setLogs([]);
      setPagination({ totalPages: 1, total: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeClass = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('REJECT') || act.includes('BLOCK') || act.includes('DELETE')) {
      return 'bg-[#F4002C] text-white';
    }
    if (act.includes('APPROVE') || act.includes('VERIFY') || act.includes('CREATE')) {
      return 'bg-[#9EFC5F] text-[#0F534A]';
    }
    if (act.includes('WITHDRAWAL') || act.includes('PAYOUT')) {
      return 'bg-[#FFDD33] text-[#121316]';
    }
    return 'bg-[#4717AE] text-white';
  };

  return (
    <>
      <SEO
        title="Institutional Audit Trail | DreamX Admin"
        description="Immutable system activity records and administrative governance logs."
      />

      <div className="flex min-h-screen bg-[#FCFBF7] text-[#121316]">
        <AdminSidebar activeTab="audit-logs" />

        <main className="flex-1 min-w-0 overflow-y-auto px-6 lg:px-10 py-8 space-y-6">
          {/* Header Banner */}
          <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" /> Immutable Governance Trail
              </div>
              <h1 className="text-3xl font-headline font-black text-[#0F534A] uppercase tracking-tight">
                System Audit Trail & History
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                Cryptographically verifiable admin actions, verification decisions, and escrow changes.
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex bg-[#FCFBF7] p-1.5 border-3 border-[#121316] shadow-[3px_3px_0_#121316] gap-1 overflow-x-auto">
              {['ALL', 'User', 'UserProject', 'Milestone', 'Withdrawal'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setFilterType(type);
                    setPage(1);
                  }}
                  className={`px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 transition-all cursor-pointer ${
                    filterType === type
                      ? 'bg-[#4717AE] text-white border-[#121316] shadow-[2px_2px_0_#121316]'
                      : 'border-transparent text-gray-700 hover:bg-white'
                  }`}
                >
                  {type === 'ALL' ? 'All Logs' : type.replace('UserProject', 'Campaign')}
                </button>
              ))}
            </div>
          </div>

          {/* Main Table */}
          <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#4717AE] overflow-hidden">
            {loading ? (
              <div className="p-16 text-center text-[#0F534A] font-headline font-black text-xl animate-pulse uppercase">
                Loading audit trail records...
              </div>
            ) : logs.length === 0 ? (
              <div className="p-16 text-center text-gray-500 font-headline font-bold text-base space-y-2">
                <AlertTriangle className="w-8 h-8 text-[#FE4E1A] mx-auto" />
                <p className="uppercase">No audit records found matching filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-[#0F534A] text-white font-headline font-black uppercase tracking-wider border-b-3 border-[#121316]">
                    <tr>
                      <th className="p-4">Action</th>
                      <th className="p-4">Entity</th>
                      <th className="p-4">Admin Lead</th>
                      <th className="p-4">Event Details</th>
                      <th className="p-4 text-right">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-200 font-medium">
                    {logs.map((log: any) => (
                      <tr key={log.id} className="hover:bg-[#FCFBF7] transition-colors">
                        <td className="p-4">
                          <span
                            className={`inline-block px-2.5 py-0.5 text-[9px] font-headline font-black uppercase border-2 border-[#121316] ${getActionBadgeClass(
                              log.action
                            )}`}
                          >
                            {log.action?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-headline font-black text-sm text-[#0F534A] uppercase">
                            {log.entity}
                          </div>
                          <div className="text-[10px] text-gray-500 font-mono">
                            ID: {log.entityId ? log.entityId.slice(-8) : '—'}
                          </div>
                        </td>
                        <td className="p-4 font-bold text-gray-800">
                          {log.admin?.name || 'Institutional Admin'}
                        </td>
                        <td className="p-4 text-gray-600 font-mono text-[11px] max-w-xs truncate">
                          {log.details ? JSON.stringify(log.details) : '—'}
                        </td>
                        <td className="p-4 text-right text-gray-500 font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-4 border-t-3 border-[#121316] bg-[#FCFBF7]">
              <Pagination page={page} totalPages={pagination.totalPages || 1} setPage={setPage} />
            </div>
          </div>
        </main>
      </div>
    </>
  );
}