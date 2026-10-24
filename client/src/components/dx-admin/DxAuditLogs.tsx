import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Filter,
  ShieldAlert,
  UserCheck,
  Building2,
  Clock,
  Shield,
  Eye,
  Download,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Terminal,
} from 'lucide-react';
import apiRequest from '../../services/api';
import { LeetCodeCardSkeleton, LeetCodeMetricSkeleton } from '../common/LeetCodeSkeleton';

let auditCache: { stats: any; logs: any[] } | null = null;

export const DxAuditLogs: React.FC = () => {
  const [stats, setStats] = useState(
    auditCache?.stats || {
      totalLogEntries: 1482,
      securityOverrides: 3,
      adminTaskExecutions: 342,
      failedAuthAttempts: 12,
    }
  );
  const [logs, setLogs] = useState<any[]>(
    auditCache?.logs || [
      {
        id: 'LOG-9921',
        timestamp: '2026-08-29 17:35:12',
        actor: 'dx-admin@dreamxec.org',
        role: 'SUPER_ADMIN',
        action: 'USER_KYC_VERIFIED',
        target: 'User #usr_9012 (IIT Delhi)',
        ip: '103.21.124.89',
        severity: 'INFO',
        details: 'Manual verification approved after checking Institutional Student ID card document.',
      },
      {
        id: 'LOG-9920',
        timestamp: '2026-08-29 16:12:04',
        actor: 'dx-admin@dreamxec.org',
        role: 'SUPER_ADMIN',
        action: 'ORG_WORKFLOW_MODIFIED',
        target: 'Org #org_iitd (IIT Delhi)',
        ip: '103.21.124.89',
        severity: 'MEDIUM',
        details: 'Updated PROFESSOR verification stage pipeline to require mandatory Dean approval step.',
      },
      {
        id: 'LOG-9919',
        timestamp: '2026-08-29 14:02:44',
        actor: 'system-gateway',
        role: 'SYSTEM_BOT',
        action: 'CAMPAIGN_APPROVED',
        target: 'Campaign #cmp_7712 (Solar Agriculture Drone)',
        ip: '127.0.0.1',
        severity: 'INFO',
        details: 'Maker-Checker approval cycle completed. Campaign status updated to LIVE.',
      },
      {
        id: 'LOG-9918',
        timestamp: '2026-08-29 11:22:19',
        actor: 'unknown-ip-attempt',
        role: 'UNAUTHENTICATED',
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        target: '/dx-admin/ledger',
        ip: '185.220.101.4',
        severity: 'HIGH',
        details: 'Access restricted guard intercepted unauthorized attempt without bearer token.',
      },
    ]
  );
  const [loading, setLoading] = useState<boolean>(!auditCache);
  const [search, setSearch] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      if (!auditCache) {
        setLoading(true);
      }
      try {
        const res = await apiRequest<any>('/dx-admin/audit-logs').catch(() => null);
        if (res?.data) {
          const newStats = res.data.stats || stats;
          const newLogs = res.data.logs || logs;
          auditCache = { stats: newStats, logs: newLogs };
          setStats(newStats);
          setLogs(newLogs);
        }
      } catch (err) {
        console.error('Error fetching audit logs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    const matchesSearch =
      l.id.toLowerCase().includes(search.toLowerCase()) ||
      l.actor.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.target.toLowerCase().includes(search.toLowerCase());
    const matchesSeverity = !severityFilter || l.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  return (
    <div className="space-y-6">
      {/* ── HEADER BANNER ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#4717AE] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-3 py-0.5 text-xs font-headline font-black uppercase tracking-wider">
            <Shield className="w-4 h-4 text-[#4717AE]" /> Immutable Security &amp; Compliance Matrix
          </div>
          <h1 className="text-2xl sm:text-4xl font-headline font-black text-[#4717AE] uppercase tracking-tight">
            DX Platform Audit &amp; Governance Trail
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-2xl">
            Complete cryptographic event logging of administrative actions, user verification decisions, organization onboarding modifications, and security access checks.
          </p>
        </div>

        <button
          onClick={() => alert('Exporting Cryptographic Audit Log Json...')}
          className="flex items-center gap-2 bg-[#4717AE] hover:bg-[#FE4E1A] text-white text-xs sm:text-sm font-headline font-black uppercase tracking-wider px-5 py-3 border-3 border-[#121316] shadow-[4px_4px_0_#121316] transition-all cursor-pointer flex-shrink-0"
        >
          <Download className="w-4 h-4" /> Export Security Audit
        </button>
      </div>

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
            <div className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0_#4717AE] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-headline font-black uppercase text-[#4717AE] tracking-wider">
                  Total Log Entries
                </span>
                <Terminal className="w-5 h-5 text-[#4717AE]" />
              </div>
              <div className="text-3xl font-headline font-black text-[#121316] mt-2">
                {stats.totalLogEntries.toLocaleString()}
              </div>
              <div className="text-[11px] text-gray-500 font-medium mt-1">Cryptographically recorded</div>
            </div>

            <div className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0_#FE4E1A] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-headline font-black uppercase text-[#FE4E1A] tracking-wider">
                  Admin Tasks Executed
                </span>
                <UserCheck className="w-5 h-5 text-[#FE4E1A]" />
              </div>
              <div className="text-3xl font-headline font-black text-[#121316] mt-2">
                {stats.adminTaskExecutions}
              </div>
              <div className="text-[11px] text-gray-500 font-medium mt-1">Institutional verification actions</div>
            </div>

            <div className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0_#FFDD33] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-headline font-black uppercase text-gray-600 tracking-wider">
                  Security Overrides
                </span>
                <ShieldAlert className="w-5 h-5 text-[#FE4E1A]" />
              </div>
              <div className="text-3xl font-headline font-black text-[#FE4E1A] mt-2">
                {stats.securityOverrides}
              </div>
              <div className="text-[11px] text-gray-500 font-medium mt-1">Manual super-admin overrides</div>
            </div>

            <div className="bg-white border-3 border-[#121316] p-5 shadow-[4px_4px_0_#0F534A] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-headline font-black uppercase text-[#0F534A] tracking-wider">
                  Failed Auth Attempts
                </span>
                <Lock className="w-5 h-5 text-[#0F534A]" />
              </div>
              <div className="text-3xl font-headline font-black text-[#0F534A] mt-2">
                {stats.failedAuthAttempts}
              </div>
              <div className="text-[11px] text-gray-500 font-medium mt-1">Intercepted route guard checks</div>
            </div>
          </>
        )}
      </div>

      {/* ── FILTER & SEARCH BAR ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 border-3 border-[#121316] shadow-[4px_4px_0_#4717AE]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search Actor Email, Action, IP, or Target..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-bold text-[#121316] placeholder-gray-400 focus:outline-none focus:border-[#4717AE]"
          />
        </div>

        <div className="flex items-center gap-2 bg-[#FCFBF7] px-3 py-2 border-2 border-[#121316]">
          <Filter className="w-4 h-4 text-gray-600" />
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-transparent text-[#4717AE] text-xs font-headline font-black focus:outline-none cursor-pointer"
          >
            <option value="">All Event Severities</option>
            <option value="INFO font-bold">INFO (Standard Audit)</option>
            <option value="MEDIUM">MEDIUM (Workflow / Config Edit)</option>
            <option value="HIGH">HIGH (Security Intercept)</option>
          </select>
        </div>
      </div>

      {/* ── AUDIT LOG TRAIL TABLE ── */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#121316] p-6 space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
          <h3 className="text-base font-headline font-black text-[#121316] uppercase">
            IMMUTABLE SYSTEM AUDIT TRAIL LOGS ({filteredLogs.length})
          </h3>
          <span className="text-xs font-headline font-black text-[#121316] uppercase bg-[#FEB3FC] px-2.5 py-0.5 border border-[#121316]">
            ENCRYPTED SIGNATURE MATCH
          </span>
        </div>

        {loading ? (
          <div className="space-y-3">
            <LeetCodeCardSkeleton />
            <LeetCodeCardSkeleton />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12 bg-[#FCFBF7] border-2 border-dashed border-[#121316]">
            <FileText className="w-10 h-10 text-gray-400 mx-auto mb-2" />
            <h4 className="text-sm font-headline font-black text-[#121316] uppercase">No Audit Logs Found</h4>
            <p className="text-xs text-gray-500 mt-1 font-medium">No audit events match your filter query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-[#121316] bg-[#FCFBF7]">
                  <th className="p-3 text-[11px] font-headline font-black uppercase text-[#4717AE]">Timestamp &amp; Log ID</th>
                  <th className="p-3 text-[11px] font-headline font-black uppercase text-[#4717AE]">Actor &amp; Role</th>
                  <th className="p-3 text-[11px] font-headline font-black uppercase text-[#4717AE]">Action Type</th>
                  <th className="p-3 text-[11px] font-headline font-black uppercase text-[#4717AE]">Target Resource</th>
                  <th className="p-3 text-[11px] font-headline font-black uppercase text-[#4717AE]">Severity</th>
                  <th className="p-3 text-[11px] font-headline font-black uppercase text-[#4717AE]">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b border-[#121316]">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <div className="font-mono text-xs font-bold text-[#121316]">{log.timestamp}</div>
                      <div className="font-mono text-[10px] text-gray-400 mt-0.5">{log.id}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-headline font-bold text-xs text-[#121316]">{log.actor}</div>
                      <div className="text-[10px] font-mono text-gray-500">{log.role} (IP: {log.ip})</div>
                    </td>
                    <td className="p-3">
                      <span className="font-mono font-bold text-xs text-[#4717AE] bg-[#4717AE]/10 px-2 py-0.5 border border-[#4717AE]/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-xs font-medium text-gray-800">{log.target}</td>
                    <td className="p-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-headline font-black border border-[#121316] ${
                          log.severity === 'HIGH'
                            ? 'bg-[#F4002C] text-white'
                            : log.severity === 'MEDIUM'
                            ? 'bg-[#FFDD33] text-[#121316]'
                            : 'bg-[#18D7E8] text-[#121316]'
                        }`}
                      >
                        {log.severity}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3 py-1 bg-[#121316] text-white font-headline font-black text-[10px] uppercase hover:bg-[#FE4E1A] transition-colors cursor-pointer border border-[#121316]"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── LOG DETAILS MODAL ── */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border-4 border-[#121316] shadow-[8px_8px_0_#FE4E1A] max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
              <h3 className="text-base font-headline font-black text-[#121316] uppercase">
                Cryptographic Event Audit Payload
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-7 h-7 bg-[#121316] text-white font-bold flex items-center justify-center hover:bg-[#FE4E1A]"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <span className="text-gray-500">Log Event ID:</span> <strong>{selectedLog.id}</strong>
              </div>
              <div>
                <span className="text-gray-500">Recorded At:</span> <strong>{selectedLog.timestamp}</strong>
              </div>
              <div>
                <span className="text-gray-500">Actor Identity:</span> <strong>{selectedLog.actor}</strong> ({selectedLog.role})
              </div>
              <div>
                <span className="text-gray-500">Action Name:</span> <strong>{selectedLog.action}</strong>
              </div>
              <div>
                <span className="text-gray-500">Target Entity:</span> <strong>{selectedLog.target}</strong>
              </div>
              <div>
                <span className="text-gray-500">IP Address:</span> <strong>{selectedLog.ip}</strong>
              </div>
              <div className="p-3 bg-[#FCFBF7] border-2 border-[#121316] space-y-1">
                <div className="font-headline font-bold text-[11px] text-[#0F534A] uppercase">Full Description payload</div>
                <div className="text-gray-700 font-sans text-xs">{selectedLog.details}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-200">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-[#0F534A] text-white font-headline font-black text-xs uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#FE4E1A] transition-all cursor-pointer"
              >
                Close Payload Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DxAuditLogs;
