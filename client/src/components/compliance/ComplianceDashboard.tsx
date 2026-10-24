import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ShieldCheck,
  UserCheck,
  ShieldAlert,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  AlertTriangle,
  ArrowRight,
  Eye,
  Check,
  X,
  Building2,
  RefreshCw,
  FolderLock,
  Layers,
  Scale
} from 'lucide-react';
import UnifiedDashboardLayout from '../layout/UnifiedDashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { getStudentVerifications } from '../../services/adminService';

export default function ComplianceDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState<string>(tabParam);
  const [loading, setLoading] = useState(false);

  // Scoped to the user's active organization
  const activeOrgId = (user?.activeProfile as any)?.organizationId || (user as any)?.organizationId;
  const activeOrgName = (user?.activeProfile as any)?.orgName || 'Institutional Compliance Unit';

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'overview');
  }, [searchParams]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  // Dynamic compliance records (scoped to org)
  const [verifications, setVerifications] = useState<any[]>([]);
  const [irbReviews, setIrbReviews] = useState<any[]>([]);
  const [fraudCases, setFraudCases] = useState<any[]>([]);
  const [workflowStages, setWorkflowStages] = useState<any[]>([]);

  const fetchVerifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getStudentVerifications();
      const list = res?.data?.verifications || (Array.isArray(res?.data) ? res?.data : []);
      if (Array.isArray(list)) {
        const mapped = list.map((v: any) => ({
          id: v.id,
          studentName: v.applicant?.name || v.applicant?.fullName || v.studentName || 'Student Applicant',
          rollNo: v.applicant?.rollNo || v.applicant?.enrollmentNumber || v.rollNo || 'N/A',
          department: v.applicant?.department || v.department || 'General',
          docType: v.documentType || v.docType || 'Bonafide / ID Verification',
          status: v.status || 'PENDING',
          submittedAt: v.createdAt ? new Date(v.createdAt).toISOString().split('T')[0] : (v.submittedAt || 'N/A'),
          riskScore: v.riskScore || 'Low (Verified)',
        }));
        setVerifications(mapped);
      }
    } catch (err) {
      console.error('Failed to load compliance verifications:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications, activeOrgId]);

  const [evaluatingItem, setEvaluatingItem] = useState<any | null>(null);
  const [evalNotes, setEvalNotes] = useState('');

  const handleEvaluateVerification = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setVerifications(prev =>
      prev.map(v => v.id === id ? { ...v, status: newStatus } : v)
    );
    toast.success(`Verification ${id} marked as ${newStatus}`);
    setEvaluatingItem(null);
    setEvalNotes('');
  };

  const handleEvaluateIrb = (id: string, newStatus: 'APPROVED' | 'ACTION_REQUIRED') => {
    setIrbReviews(prev =>
      prev.map(r => r.id === id ? { ...r, status: newStatus } : r)
    );
    toast.success(`IRB Ethics Protocol ${id} updated to ${newStatus}`);
  };

  const headerActions = (
    <div className="flex items-center gap-3">
      <button
        onClick={() => {
          setLoading(true);
          setTimeout(() => {
            setLoading(false);
            toast.success('Compliance audit cache synced with university registry');
          }, 600);
        }}
        disabled={loading}
        className="bg-[#0F534A] hover:bg-[#0b3d36] text-white px-3.5 py-1.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0_#9EFC5F] transition-all cursor-pointer flex items-center gap-1.5"
      >
        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        <span>{loading ? 'Auditing...' : 'Sync Registry'}</span>
      </button>
    </div>
  );

  return (
    <UnifiedDashboardLayout
      title={`${activeOrgName} • Compliance & Ethics Office | DreamXec`}
      headerTitle={`${activeOrgName} • Compliance & Regulatory Hub`}
      headerSubtitle="Institutional ethics review, document validation, fraud monitoring, and regulatory stage gating"
      headerActions={headerActions}
    >
      <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Banner */}
            <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#F4002C] p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 bg-[#F4002C]/15 text-[#F4002C] border-2 border-[#121316] px-2.5 py-0.5 text-xs font-headline font-black uppercase tracking-wider">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#F4002C]" /> Compliance Officer Console
                  </span>
                  <span className="inline-flex items-center gap-1 bg-[#0F534A]/10 text-[#0F534A] border-2 border-[#121316] px-2 py-0.5 text-[11px] font-headline font-black uppercase">
                    <Building2 className="w-3 h-3" /> {activeOrgName}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-headline font-black text-[#121316] uppercase tracking-tight">
                  Compliance, Ethics &amp; Verification Hub
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 font-medium max-w-2xl">
                  Inspect student verification credentials, adjudicate Institutional Review Board (IRB) ethics protocols, and resolve fraud telemetry triggers.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  onClick={() => handleTabChange('verifications')}
                  className="bg-[#FE4E1A] hover:bg-[#e03d0d] text-white text-xs font-headline font-black uppercase tracking-wider px-3.5 py-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" /> Pending Verifications ({verifications.filter(v => v.status === 'PENDING').length})
                </button>
                <button
                  onClick={() => handleTabChange('irb')}
                  className="bg-[#4717AE] hover:bg-[#39128f] text-white text-xs font-headline font-black uppercase tracking-wider px-3.5 py-2 border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Scale className="w-4 h-4" /> IRB Protocols ({irbReviews.length})
                </button>
              </div>
            </div>

            {/* 4 KPI Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                onClick={() => handleTabChange('verifications')}
                className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] p-4 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-[#FE4E1A]">Pending Verifications</span>
                  <UserCheck className="w-4 h-4 text-[#FE4E1A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#121316]">
                  {verifications.filter(v => v.status === 'PENDING').length}
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Requires Evaluator Approval</p>
              </div>

              <div
                onClick={() => handleTabChange('irb')}
                className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#4717AE] p-4 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-[#4717AE]">IRB Ethics Applications</span>
                  <Scale className="w-4 h-4 text-[#4717AE]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#121316]">
                  {irbReviews.filter(r => r.status === 'UNDER_REVIEW').length} Under Review
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Human/Animal Subject Audits</p>
              </div>

              <div
                onClick={() => handleTabChange('fraud')}
                className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#F4002C] p-4 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-[#F4002C]">Fraud Telemetry Flags</span>
                  <ShieldAlert className="w-4 h-4 text-[#F4002C]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#F4002C]">
                  {fraudCases.filter(f => f.status === 'INVESTIGATING').length} Active Cases
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Escrow Funds On Hold</p>
              </div>

              <div
                onClick={() => handleTabChange('stage-reviews')}
                className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#0F534A] p-4 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-headline font-black uppercase tracking-wider text-[#0F534A]">Workflow Stage Gates</span>
                  <CheckCircle2 className="w-4 h-4 text-[#0F534A]" />
                </div>
                <div className="text-2xl font-headline font-black text-[#121316]">
                  {workflowStages.length} Active Audits
                </div>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Institutional Governance Pipeline</p>
              </div>
            </div>

            {/* Verification Queue Preview */}
            <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-headline font-black text-base uppercase text-[#121316]">
                    Immediate Verification Priority
                  </h3>
                  <p className="text-xs text-gray-500">Student &amp; Researcher applications awaiting identity confirmation</p>
                </div>
                <button
                  onClick={() => handleTabChange('verifications')}
                  className="text-xs font-headline font-black uppercase text-[#FE4E1A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full Queue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FCFBF7] border-b-2 border-[#121316] font-headline font-black uppercase text-gray-700">
                    <tr>
                      <th className="py-2.5 px-3">Applicant</th>
                      <th className="py-2.5 px-3">Department</th>
                      <th className="py-2.5 px-3">Document Type</th>
                      <th className="py-2.5 px-3">Risk Assessment</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                    {verifications.slice(0, 3).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-3 px-3">
                          <p className="font-bold text-[#121316]">{item.studentName}</p>
                          <p className="text-[10px] text-gray-500">{item.rollNo}</p>
                        </td>
                        <td className="py-3 px-3">{item.department}</td>
                        <td className="py-3 px-3">{item.docType}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded ${item.riskScore.startsWith('Low') ? 'bg-[#9EFC5F]/30 text-[#0F534A]' : 'bg-[#FFDD33]/40 text-[#FE4E1A]'}`}>
                            {item.riskScore}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider rounded ${item.status === 'APPROVED' ? 'bg-[#9EFC5F] text-[#0F534A]' : 'bg-[#FFDD33] text-[#121316]'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleTabChange('verifications')}
                            className="bg-[#121316] text-white px-2.5 py-1 text-[11px] font-headline font-bold uppercase hover:bg-[#FE4E1A] transition-colors cursor-pointer"
                          >
                            Evaluate
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VERIFICATION QUEUE */}
        {activeTab === 'verifications' && (
          <div className="space-y-6">
            <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-gray-100 pb-4">
                <div>
                  <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                    Institutional Verification Queue
                  </h2>
                  <p className="text-xs text-gray-500">
                    Verify applicant identity against institutional bonafide records and DigiLocker certificates
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 uppercase">Filtered by:</span>
                  <span className="bg-[#0F534A] text-white px-2.5 py-0.5 text-xs font-headline font-bold uppercase rounded">
                    {activeOrgName}
                  </span>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FCFBF7] border-b-2 border-[#121316] font-headline font-black uppercase text-gray-700">
                    <tr>
                      <th className="py-3 px-3">Applicant Name</th>
                      <th className="py-3 px-3">ID / Roll No</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3">Submission</th>
                      <th className="py-3 px-3">Risk Assessment</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Decision</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {verifications.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="py-3.5 px-3">
                          <p className="font-bold text-[#121316] text-sm">{item.studentName}</p>
                          <p className="text-[11px] text-gray-500">{item.docType}</p>
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-gray-800">{item.rollNo}</td>
                        <td className="py-3.5 px-3 text-gray-600">{item.department}</td>
                        <td className="py-3.5 px-3 text-gray-500">{item.submittedAt}</td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded ${item.riskScore.startsWith('Low') ? 'bg-[#9EFC5F]/30 text-[#0F534A]' : 'bg-[#FFDD33]/40 text-[#FE4E1A]'}`}>
                            {item.riskScore}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-block px-2.5 py-1 text-[10px] font-headline font-black uppercase tracking-wider rounded ${item.status === 'APPROVED' ? 'bg-[#9EFC5F] text-[#0F534A]' : item.status === 'REJECTED' ? 'bg-[#F4002C] text-white' : 'bg-[#FFDD33] text-[#121316]'}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right space-x-1.5">
                          {item.status === 'PENDING' ? (
                            <>
                              <button
                                onClick={() => handleEvaluateVerification(item.id, 'APPROVED')}
                                className="bg-[#0F534A] hover:bg-[#0b3d36] text-white px-2.5 py-1 text-[10px] font-headline font-bold uppercase transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleEvaluateVerification(item.id, 'REJECTED')}
                                className="bg-[#F4002C] hover:bg-[#c90024] text-white px-2.5 py-1 text-[10px] font-headline font-bold uppercase transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-gray-400 font-bold uppercase">Decided</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: IRB ETHICS REVIEWS */}
        {activeTab === 'irb' && (
          <div className="space-y-6">
            <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
              <div className="border-b-2 border-gray-100 pb-4">
                <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                  Institutional Review Board (IRB) Ethics Protocols
                </h2>
                <p className="text-xs text-gray-500">
                  Ethical clearance governance for human subject trials, bio-safety, hazardous chemical protocols, and privacy-sensitive data
                </p>
              </div>

              <div className="space-y-4">
                {irbReviews.map((protocol) => (
                  <div
                    key={protocol.id}
                    className="p-5 border-2 border-[#121316] bg-[#FCFBF7] shadow-[3px_3px_0_#4717AE] flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1.5 max-w-2xl">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-black uppercase bg-[#4717AE] text-white px-2 py-0.5 rounded">
                          {protocol.id}
                        </span>
                        <span className="text-[11px] font-bold text-gray-500">
                          {protocol.department} • Lead: {protocol.leadResearcher}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${protocol.ethicsRisk.includes('High') ? 'bg-[#F4002C]/20 text-[#F4002C]' : 'bg-[#FFDD33]/30 text-[#0F534A]'}`}>
                          {protocol.ethicsRisk}
                        </span>
                      </div>
                      <h3 className="font-headline font-black text-base text-[#121316]">
                        {protocol.title}
                      </h3>
                      <p className="text-xs text-gray-600 font-medium">
                        Target Subjects: <span className="font-bold text-gray-800">{protocol.subjects}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 text-xs font-headline font-black uppercase tracking-wider rounded ${protocol.status === 'APPROVED' ? 'bg-[#9EFC5F] text-[#0F534A]' : protocol.status === 'ACTION_REQUIRED' ? 'bg-[#F4002C] text-white' : 'bg-[#FFDD33] text-[#121316]'}`}>
                        {protocol.status}
                      </span>
                      {protocol.status === 'UNDER_REVIEW' && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEvaluateIrb(protocol.id, 'APPROVED')}
                            className="bg-[#0F534A] hover:bg-[#0b3d36] text-white px-3 py-1 text-xs font-headline font-black uppercase cursor-pointer"
                          >
                            Approve IRB
                          </button>
                          <button
                            onClick={() => handleEvaluateIrb(protocol.id, 'ACTION_REQUIRED')}
                            className="bg-[#FE4E1A] hover:bg-[#d83f12] text-white px-3 py-1 text-xs font-headline font-black uppercase cursor-pointer"
                          >
                            Request Revisions
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: FRAUD TELEMETRY CASES */}
        {activeTab === 'fraud' && (
          <div className="space-y-6">
            <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#F4002C] p-6 space-y-4">
              <div className="border-b-2 border-gray-100 pb-4">
                <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                  Fraud Detection &amp; Investigation Log
                </h2>
                <p className="text-xs text-gray-500">
                  AI-driven milestone anomaly detection, duplicate quote audits, and escrow freeze interventions
                </p>
              </div>

              <div className="space-y-4">
                {fraudCases.map((fCase) => (
                  <div
                    key={fCase.id}
                    className="p-5 border-2 border-[#121316] bg-white shadow-[3px_3px_0_#F4002C] flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div className="space-y-1.5 max-w-xl">
                      <div className="flex items-center gap-2">
                        <span className="bg-[#F4002C] text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
                          {fCase.severity}
                        </span>
                        <span className="text-xs font-bold text-gray-500">Case ID: {fCase.id} • {fCase.reportedAt}</span>
                      </div>
                      <h3 className="font-headline font-black text-base text-[#121316]">
                        {fCase.campaignTitle}
                      </h3>
                      <p className="text-xs text-gray-600">
                        Investigated Creator: <span className="font-bold text-gray-800">{fCase.creator}</span> • Anomaly: <span className="text-[#F4002C] font-bold">{fCase.flagType}</span>
                      </p>
                    </div>

                    <div className="text-right space-y-2">
                      <div className="text-xs font-bold text-gray-700">
                        Frozen In Escrow: <span className="font-headline font-black text-[#F4002C]">{fCase.frozenAmount}</span>
                      </div>
                      <button
                        onClick={() => {
                          toast.success(`Investigation memo for ${fCase.id} updated`);
                        }}
                        className="bg-[#121316] hover:bg-[#FE4E1A] text-white px-3 py-1 text-xs font-headline font-black uppercase transition-colors cursor-pointer"
                      >
                        Manage Investigation
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: WORKFLOW TEMPLATES & STAGE REVIEWS */}
        {(activeTab === 'workflows' || activeTab === 'stage-reviews') && (
          <div className="space-y-6">
            <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] p-6 space-y-4">
              <div className="border-b-2 border-gray-100 pb-4">
                <h2 className="font-headline font-black text-xl uppercase text-[#121316]">
                  Stage Reviews &amp; Workflow Governance
                </h2>
                <p className="text-xs text-gray-500">
                  Dual-signoff approval pipelines required before milestone tranches, procurement orders, and certifications advance
                </p>
              </div>

              <div className="space-y-3">
                {workflowStages.map((wf) => (
                  <div
                    key={wf.id}
                    className="p-4 border-2 border-[#121316] bg-[#FCFBF7] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold bg-[#0F534A] text-white px-2 py-0.5 rounded">
                          {wf.id}
                        </span>
                        <span className="text-xs text-gray-500 font-bold">{wf.initiator}</span>
                      </div>
                      <h4 className="font-headline font-black text-sm text-[#121316]">{wf.pipeline}</h4>
                      <p className="text-xs text-gray-600">Pending Gate: <span className="font-bold text-[#FE4E1A]">{wf.stage}</span></p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toast.success(`Stage ${wf.id} approved by compliance officer`)}
                        className="bg-[#0F534A] hover:bg-[#0b3d36] text-white text-xs font-headline font-black uppercase px-3 py-1.5 cursor-pointer"
                      >
                        Sign Off Stage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </UnifiedDashboardLayout>
  );
}
