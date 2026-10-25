import React, { useEffect, useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import {
  UserCheck,
  ShieldCheck,
  Check,
  X,
  Undo,
  MessageSquare,
  Search,
  Eye,
  FileText,
  AlertTriangle,
  ExternalLink,
  Upload,
  Building,
  Database,
  Lock,
} from 'lucide-react';
import AdminSidebar from './AdminSidebar';
import {
  getStudentVerifications,
  approveStudentVerification,
  rejectStudentVerification,
  revokeStudentVerification,
  approveAllMatchedStudentVerifications,
  uploadRosterCsv,
  uploadCorporateMcaCsv,
  verifyCorporateCin,
} from '../../services/adminService';
import SEO from '../SEO';

export default function AdminStudentVerifications({ embedded = false }: { embedded?: boolean }) {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  // Proof Preview Modal
  const [previewingVerification, setPreviewingVerification] = useState<any | null>(null);

  // Rejection Modal
  const [rejectingItem, setRejectingItem] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Institutional Roster Upload Modal (X3)
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [rosterInstitution, setRosterInstitution] = useState('');
  const [rosterCsvText, setRosterCsvText] = useState('');
  const [rosterUploading, setRosterUploading] = useState(false);

  // MCA Corporate Master Modal (X3)
  const [isCorporateModalOpen, setIsCorporateModalOpen] = useState(false);
  const [corporateCsvText, setCorporateCsvText] = useState('');
  const [corporateUploading, setCorporateUploading] = useState(false);
  const [corporateTab, setCorporateTab] = useState<'UPLOAD' | 'LOOKUP'>('UPLOAD');
  const [testCin, setTestCin] = useState('');
  const [testCompanyName, setTestCompanyName] = useState('');
  const [cinVerifying, setCinVerifying] = useState(false);
  const [cinResult, setCinResult] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, [filter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getStudentVerifications(filter === 'ALL' ? '' : filter);
      const payload = res as any;
      let itemsList: any[] = [];

      if (Array.isArray(payload)) itemsList = payload;
      else if (Array.isArray(payload?.data)) itemsList = payload.data;
      else if (Array.isArray(payload?.verifications)) itemsList = payload.verifications;
      else if (payload?.data && Array.isArray(payload.data.verifications)) itemsList = payload.data.verifications;

      setVerifications(itemsList);
    } catch (error) {
      console.error('Fetch verifications error:', error);
      toast.error('Failed to load student verification requests.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    const toastId = toast.loading('Approving verification and granting verified badge...');
    try {
      await approveStudentVerification(id);
      toast.success('🎉 Student identity verified! Badge granted.', { id: toastId });
      setPreviewingVerification(null);
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Verification approval failed.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveAllMatched = async () => {
    setActionLoading(true);
    const toastId = toast.loading('Batch approving all auto-matched verification requests...');
    try {
      const res: any = await approveAllMatchedStudentVerifications();
      toast.success(res?.message || 'Auto-matched requests successfully approved!', { id: toastId });
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to batch approve matched requests.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingItem || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    setActionLoading(true);
    const toastId = toast.loading('Recording rejection feedback...');
    try {
      await rejectStudentVerification(rejectingItem.id, rejectionReason.trim());
      toast.success('Verification request rejected.', { id: toastId });
      setRejectingItem(null);
      setRejectionReason('');
      setPreviewingVerification(null);
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reject verification.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this student verification badge?')) return;
    setActionLoading(true);
    const toastId = toast.loading('Revoking student verification badge...');
    try {
      await revokeStudentVerification(id, 'Verification revoked by institutional administrator.');
      toast.success('Student verification revoked.', { id: toastId });
      loadData();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to revoke verification.', { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendWhatsApp = (number: string, name: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    const message = `Hello ${name}, this is DreamXec Governance Support regarding your student verification request.`;
    window.open(`https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleRosterFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setRosterCsvText((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleCorporateFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setCorporateCsvText((event.target?.result as string) || '');
    };
    reader.readAsText(file);
  };

  const handleUploadRoster = async () => {
    if (!rosterCsvText.trim()) {
      toast.error('Please upload a CSV file or paste roster content.');
      return;
    }
    setRosterUploading(true);
    const toastId = toast.loading('Hashing roster roll numbers with sha256 and indexing...');
    try {
      const res: any = await uploadRosterCsv({
        csvText: rosterCsvText,
        institution: rosterInstitution.trim() || undefined,
      });
      toast.success(res?.message || 'Roster successfully indexed with sha256 verification!', { id: toastId });
      setIsRosterModalOpen(false);
      setRosterCsvText('');
      loadData();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload institutional roster.', { id: toastId });
    } finally {
      setRosterUploading(false);
    }
  };

  const handleUploadCorporateMca = async () => {
    if (!corporateCsvText.trim()) {
      toast.error('Please upload an MCA CSV or paste corporate records.');
      return;
    }
    setCorporateUploading(true);
    const toastId = toast.loading('Validating 21-character CIN formats and indexing MCA master...');
    try {
      const res: any = await uploadCorporateMcaCsv({
        csvText: corporateCsvText,
      });
      toast.success(res?.message || 'Corporate MCA Master successfully updated!', { id: toastId });
      setIsCorporateModalOpen(false);
      setCorporateCsvText('');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to upload MCA CSV.', { id: toastId });
    } finally {
      setCorporateUploading(false);
    }
  };

  const handleVerifyCinLookup = async () => {
    if (!testCin.trim()) {
      toast.error('Please enter a 21-character MCA CIN to verify.');
      return;
    }
    setCinVerifying(true);
    try {
      const res: any = await verifyCorporateCin(testCin.trim(), testCompanyName.trim() || undefined);
      setCinResult(res);
      if (res.verified) {
        toast.success(res.message || 'CIN verification passed!');
      } else {
        toast.error(res.message || 'CIN format invalid.');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Verification lookup failed.');
    } finally {
      setCinVerifying(false);
    }
  };

  const filteredVerifications = useMemo(() => {
    return verifications.filter((v) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        v.user?.name?.toLowerCase().includes(q) ||
        v.user?.email?.toLowerCase().includes(q) ||
        v.rollNumber?.toLowerCase().includes(q) ||
        v.branch?.toLowerCase().includes(q) ||
        v.institution?.toLowerCase().includes(q)
      );
    });
  }, [verifications, searchQuery]);

  const content = (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#4717AE] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5" /> KYC & Identity Vetting
          </div>
          <h1 className="text-3xl font-headline font-black text-[#0F534A] uppercase tracking-tight">
            Student Identity Verification Workbench
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 font-medium">
            Review submitted college ID cards, institutional enrollment details, and grant verified student creator status.
          </p>
        </div>

        {/* TABS */}
        <div className="flex bg-[#FCFBF7] p-1.5 border-3 border-[#121316] shadow-[3px_3px_0_#121316] gap-1 overflow-x-auto">
          {['ALL', 'PENDING', 'VERIFIED', 'REJECTED'].map((tab) => (
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
            placeholder="Search by student name, roll number, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white uppercase tracking-wider"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsRosterModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0_#121316] text-xs font-headline font-black uppercase hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-[#FE4E1A]" /> Upload Roster (CSV)
          </button>

          <button
            onClick={() => setIsCorporateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0_#121316] text-xs font-headline font-black uppercase hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
          >
            <Building className="w-3.5 h-3.5 text-[#4717AE]" /> MCA Corporate Master
          </button>

          {verifications.filter((v) => v.status === 'PENDING' && v.rosterMatchStatus === 'AUTO_MATCHED').length > 0 && (
            <button
              onClick={handleApproveAllMatched}
              disabled={actionLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] shadow-[2px_2px_0_#121316] text-xs font-headline font-black uppercase hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" /> One-Click Approve Matched ({verifications.filter((v) => v.status === 'PENDING' && v.rosterMatchStatus === 'AUTO_MATCHED').length})
            </button>
          )}

          <div className="text-xs font-mono font-bold text-gray-600 ml-auto">
            Showing <span className="text-[#4717AE]">{filteredVerifications.length}</span> Records
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#0F534A] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-[#0F534A] font-headline font-black text-xl animate-pulse uppercase">
            Loading verification requests...
          </div>
        ) : filteredVerifications.length === 0 ? (
          <div className="p-16 text-center text-gray-500 font-headline font-bold text-base space-y-2">
            <AlertTriangle className="w-8 h-8 text-[#4717AE] mx-auto" />
            <p className="uppercase">No verification requests found in this view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#0F534A] text-white font-headline font-black uppercase tracking-wider border-b-3 border-[#121316]">
                <tr>
                  <th className="p-4">Student</th>
                  <th className="p-4">Roll Number / Branch</th>
                  <th className="p-4">Institution</th>
                  <th className="p-4">Roster Match</th>
                  <th className="p-4">Submitted Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Document Proofs</th>
                  <th className="p-4 text-right">Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-200 font-medium">
                {filteredVerifications.map((v) => (
                  <tr key={v.id} className="hover:bg-[#FCFBF7] transition-colors">
                    <td className="p-4">
                      <div className="font-headline font-black text-sm text-[#0F534A] uppercase">
                        {v.user?.name || 'Student Applicant'}
                      </div>
                      <div className="text-xs text-gray-500 font-mono">{v.user?.email}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-mono text-xs font-bold text-[#121316]">{v.rollNumber}</div>
                      <div className="text-[11px] text-gray-600 font-semibold">{v.branch} - {v.year}</div>
                    </td>
                    <td className="p-4 font-bold text-gray-700">
                      {v.institution || 'VIT Chennai'}
                    </td>
                    <td className="p-4">
                      {v.rosterMatchSource === 'ROSTER_SHA256_MATCH' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-headline font-black uppercase border-2 border-[#121316] bg-[#9EFC5F] text-[#0F534A] shadow-[1px_1px_0_#121316]">
                          <Lock className="w-2.5 h-2.5" /> SHA-256 Roster Matched
                        </span>
                      ) : v.rosterMatchStatus === 'AUTO_MATCHED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-headline font-black uppercase border-2 border-[#121316] bg-[#9EFC5F] text-[#0F534A]">
                          ✓ Auto-Matched
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[9px] font-headline font-black uppercase border-2 border-[#121316] bg-[#FFDD33] text-[#121316]">
                          ⚠ Needs Review
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-500 font-mono">
                      {new Date(v.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[9px] font-headline font-black uppercase border-2 border-[#121316] ${
                          v.status === 'VERIFIED'
                            ? 'bg-[#9EFC5F] text-[#0F534A]'
                            : v.status === 'REJECTED'
                            ? 'bg-[#F4002C] text-white'
                            : 'bg-[#FFDD33] text-[#121316]'
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 items-center flex-wrap">
                        {v.collegeIdCardUrl ? (
                          <button
                            onClick={() => setPreviewingVerification(v)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#4717AE] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] text-[10px] font-headline font-black uppercase hover:bg-[#350f87]"
                          >
                            <Eye className="w-3 h-3" /> View ID Card
                          </button>
                        ) : (
                          <span className="text-gray-400 font-mono text-[10px]">No file</span>
                        )}

                        {v.paymentScreenshotUrl && (
                          <a
                            href={v.paymentScreenshotUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 bg-white text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0_#121316] text-[10px] font-headline font-black uppercase hover:bg-[#FFDD33]"
                          >
                            <ExternalLink className="w-3 h-3" /> Receipt
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 items-center">
                        {v.whatsappNumber && (
                          <button
                            onClick={() => handleSendWhatsApp(v.whatsappNumber, v.user?.name)}
                            className="p-1.5 bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#8cee4f] transition-all cursor-pointer"
                            title="Chat on WhatsApp"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {v.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(v.id)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#0F534A] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#4717AE] hover:bg-[#0b3d36]"
                            >
                              <Check className="w-3.5 h-3.5" /> Approve ✓
                            </button>
                            <button
                              onClick={() => setRejectingItem(v)}
                              disabled={actionLoading}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#F4002C] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#c90024]"
                            >
                              <X className="w-3.5 h-3.5" /> Reject ✗
                            </button>
                          </>
                        )}

                        {v.status === 'VERIFIED' && (
                          <button
                            onClick={() => handleRevoke(v.id)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#FFDD33] text-[#121316] text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#FE4E1A] hover:text-white"
                          >
                            <Undo className="w-3.5 h-3.5" /> Revoke Badge
                          </button>
                        )}

                        {v.status === 'REJECTED' && (
                          <button
                            onClick={() => handleApprove(v.id)}
                            disabled={actionLoading}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#9EFC5F] text-[#0F534A] text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#121316] hover:bg-[#8cee4f]"
                          >
                            <Check className="w-3.5 h-3.5" /> Re-Verify
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ID Card Proof Modal */}
      {previewingVerification && (
        <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-4 border-[#121316] shadow-[10px_10px_0_#4717AE] max-w-xl w-full p-6 space-y-4 relative">
            <button
              onClick={() => setPreviewingVerification(null)}
              className="absolute top-4 right-4 bg-[#FFDD33] text-[#121316] border-2 border-[#121316] p-1.5 hover:bg-[#FE4E1A] hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <div className="inline-block bg-[#4717AE] text-white border-2 border-[#121316] px-2 py-0.5 text-[9px] font-headline font-black uppercase">
                Dual-Custody KYC Identity Inspection
              </div>
              <h3 className="font-headline font-black text-xl text-[#0F534A] uppercase">
                {previewingVerification.user?.name}
              </h3>
              <p className="text-xs text-gray-600 font-mono">
                {previewingVerification.institution} • Roll: {previewingVerification.rollNumber} • {previewingVerification.branch}
              </p>
            </div>

            {/* Govt ID details */}
            <div className="p-3 bg-[#FCFBF7] border-2 border-[#121316] text-xs grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase">Govt ID Type:</span>
                <p className="font-headline font-black text-xs text-[#121316]">{previewingVerification.govtDocType || 'Aadhaar Card'}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-500 uppercase">Govt ID Number:</span>
                <p className="font-mono text-xs font-bold text-[#0F534A]">{previewingVerification.govtDocNumber || '—'}</p>
              </div>
            </div>

            {/* Side-by-side previews */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-headline font-black uppercase text-[#0F534A]">
                    {previewingVerification.govtDocType || 'Government ID'} Scan
                  </span>
                  {previewingVerification.govtDocUrl && (
                    <a
                      href={previewingVerification.govtDocUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] font-bold text-[#FE4E1A] hover:underline"
                    >
                      Full Scan ↗
                    </a>
                  )}
                </div>
                <div className="h-52 w-full border-2 border-[#121316] bg-gray-100 flex items-center justify-center overflow-hidden p-1">
                  {previewingVerification.govtDocUrl ? (
                    <img
                      src={previewingVerification.govtDocUrl}
                      alt="Government ID"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-400 font-bold">No Government ID uploaded</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-headline font-black uppercase text-[#0F534A]">
                    Student ID Card
                  </span>
                  {previewingVerification.collegeIdCardUrl && (
                    <a
                      href={previewingVerification.collegeIdCardUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[9px] font-bold text-[#4717AE] hover:underline"
                    >
                      Full Scan ↗
                    </a>
                  )}
                </div>
                <div className="h-52 w-full border-2 border-[#121316] bg-gray-100 flex items-center justify-center overflow-hidden p-1">
                  {previewingVerification.collegeIdCardUrl ? (
                    <img
                      src={previewingVerification.collegeIdCardUrl}
                      alt="Student ID Card"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[10px] text-gray-400 font-bold">No Student ID uploaded</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t-2 border-[#121316]">
              {previewingVerification.whatsappNumber && (
                <button
                  onClick={() => handleSendWhatsApp(previewingVerification.whatsappNumber, previewingVerification.user?.name)}
                  className="inline-flex items-center gap-1.5 bg-[#9EFC5F] text-[#0F534A] px-3.5 py-1.5 text-xs font-headline font-black uppercase border-2 border-[#121316]"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setRejectingItem(previewingVerification);
                    setPreviewingVerification(null);
                  }}
                  className="px-4 py-1.5 bg-[#F4002C] text-white text-xs font-headline font-black uppercase border-2 border-[#121316]"
                >
                  Reject ID ✗
                </button>
                <button
                  onClick={() => handleApprove(previewingVerification.id)}
                  className="px-4 py-1.5 bg-[#0F534A] text-white text-xs font-headline font-black uppercase border-2 border-[#121316] shadow-[2px_2px_0_#4717AE]"
                >
                  Approve ✓
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-[110] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border-4 border-[#121316] shadow-[10px_10px_0_#F4002C] max-w-md w-full p-6 space-y-4">
            <div className="space-y-1 text-center">
              <div className="w-12 h-12 bg-[#F4002C] text-white border-2 border-[#121316] flex items-center justify-center mx-auto text-xl shadow-[2px_2px_0_#121316] font-black">
                ✗
              </div>
              <h3 className="font-headline font-black text-xl text-[#121316] uppercase">
                Reject Student Verification
              </h3>
              <p className="text-xs text-gray-600 font-medium">
                Provide feedback explaining why the submitted ID was invalid.
              </p>
            </div>

            <div>
              <textarea
                rows={4}
                required
                placeholder="e.g. ID card image is blurred, please re-upload clear photo..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
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
                disabled={actionLoading || !rejectionReason.trim()}
                className="px-5 py-2 text-xs font-headline font-black uppercase bg-[#F4002C] text-white border-2 border-[#121316] shadow-[3px_3px_0_#121316] disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Verification ✗'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSTITUTIONAL ROSTER CSV MODAL (X3) */}
      {isRosterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border-4 border-[#121316] shadow-[8px_8px_0_#FE4E1A] max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#FE4E1A] text-white flex items-center justify-center border-2 border-[#121316] font-black">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-lg text-[#121316] uppercase">
                    Institutional Roster Upload (SHA-256)
                  </h3>
                  <p className="text-[11px] text-gray-500 font-semibold">
                    Annexure 1 (X3) • Cryptographic student enrollment verification
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRosterModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center border-2 border-[#121316] font-black hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#9EFC5F]/20 border-2 border-[#0F534A] p-3 text-xs text-[#0F534A] space-y-1">
              <div className="font-headline font-black uppercase flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> Privacy-Preserving Matching
              </div>
              <p className="text-[11px] leading-relaxed">
                Candidate roll numbers and names are processed into cryptographic <code className="font-mono font-bold">sha256(rollNumber + name)</code> digests. Matching student verification applications are automatically set to <span className="font-bold uppercase">AUTO_MATCHED</span>.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                  Institution Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. VIT Chennai, IIT Delhi"
                  value={rosterInstitution}
                  onChange={(e) => setRosterInstitution(e.target.value)}
                  className="w-full p-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                  Upload CSV File
                </label>
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleRosterFileUpload}
                  className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-[#121316] file:text-xs file:font-headline file:font-black file:uppercase file:bg-[#FFDD33] file:cursor-pointer border-2 border-[#121316] p-1.5 bg-[#FCFBF7]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-headline font-black uppercase text-[#121316]">
                    Or Paste CSV Data Directly
                  </label>
                  <span className="text-[10px] text-gray-500 font-mono">Format: rollNumber,name,email,department,year</span>
                </div>
                <textarea
                  rows={5}
                  placeholder={`rollNumber,name,email,department,year\n21BCE1001,Aarav Sharma,aarav@vit.ac.in,Computer Science,3rd Year\n22BME1045,Priya Patel,priya@vit.ac.in,Mechanical,2nd Year`}
                  value={rosterCsvText}
                  onChange={(e) => setRosterCsvText(e.target.value)}
                  className="w-full p-2.5 font-mono text-xs border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t-2 border-[#121316]">
              <button
                type="button"
                onClick={() => setIsRosterModalOpen(false)}
                className="px-4 py-2 text-xs font-headline font-black uppercase bg-gray-100 border-2 border-[#121316]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUploadRoster}
                disabled={rosterUploading || !rosterCsvText.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-headline font-black uppercase bg-[#FE4E1A] text-white border-2 border-[#121316] shadow-[3px_3px_0_#121316] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 cursor-pointer"
              >
                {rosterUploading ? 'Hashing with SHA-256...' : 'Upload & Compute SHA-256 Hashes ⚡'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MCA CORPORATE MASTER DIRECTORY MODAL (X3) */}
      {isCorporateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white border-4 border-[#121316] shadow-[8px_8px_0_#4717AE] max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#121316] pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#4717AE] text-white flex items-center justify-center border-2 border-[#121316] font-black">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-headline font-black text-lg text-[#121316] uppercase">
                    MCA Corporate Master Registry (X3)
                  </h3>
                  <p className="text-[11px] text-gray-500 font-semibold">
                    Ministry of Corporate Affairs CIN Verification & Master Directory
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCorporateModalOpen(false)}
                className="w-7 h-7 flex items-center justify-center border-2 border-[#121316] font-black hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* TAB SELECTOR */}
            <div className="flex border-2 border-[#121316] bg-[#FCFBF7] p-1 gap-1">
              <button
                type="button"
                onClick={() => setCorporateTab('UPLOAD')}
                className={`flex-1 py-1.5 text-xs font-headline font-black uppercase text-center border-2 transition-all cursor-pointer ${
                  corporateTab === 'UPLOAD'
                    ? 'bg-[#4717AE] text-white border-[#121316] shadow-[2px_2px_0_#121316]'
                    : 'border-transparent text-gray-700 hover:bg-white'
                }`}
              >
                Upload Master CSV
              </button>
              <button
                type="button"
                onClick={() => setCorporateTab('LOOKUP')}
                className={`flex-1 py-1.5 text-xs font-headline font-black uppercase text-center border-2 transition-all cursor-pointer ${
                  corporateTab === 'LOOKUP'
                    ? 'bg-[#4717AE] text-white border-[#121316] shadow-[2px_2px_0_#121316]'
                    : 'border-transparent text-gray-700 hover:bg-white'
                }`}
              >
                Live CIN Verification Lookup
              </button>
            </div>

            {corporateTab === 'UPLOAD' ? (
              <div className="space-y-3">
                <div className="bg-[#18D7E8]/20 border-2 border-[#121316] p-2.5 text-xs font-medium text-gray-800">
                  <span className="font-bold">21-Character CIN Format:</span> Standard Ministry of Corporate Affairs format:
                  <code className="font-mono font-bold ml-1 bg-white px-1.5 py-0.5 border border-[#121316]">
                    ^[L|U][0-9]{'{5}'}[A-Z]{'{2}'}[0-9]{'{4}'}[A-Z]{'{3}'}[0-9]{'{6}'}$
                  </code>
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                    Select MCA Master CSV
                  </label>
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCorporateFileUpload}
                    className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:border-2 file:border-[#121316] file:text-xs file:font-headline file:font-black file:uppercase file:bg-[#FFDD33] file:cursor-pointer border-2 border-[#121316] p-1.5 bg-[#FCFBF7]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-headline font-black uppercase text-[#121316]">
                      Or Paste MCA CSV Records
                    </label>
                    <span className="text-[10px] text-gray-500 font-mono">cin,companyName,roc,companyClass,status</span>
                  </div>
                  <textarea
                    rows={4}
                    placeholder={`cin,companyName,roc,companyClass,status\nU72900KA2021PTC145678,Tata Consultancy Services Enterprise Labs,ROC Bangalore,Private,Active\nL65190MH2000PLC123456,HDFC Bank Corporate CSR Trust,ROC Mumbai,Public,Active`}
                    value={corporateCsvText}
                    onChange={(e) => setCorporateCsvText(e.target.value)}
                    className="w-full p-2.5 font-mono text-xs border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-[#121316]">
                  <button
                    type="button"
                    onClick={() => setIsCorporateModalOpen(false)}
                    className="px-4 py-2 text-xs font-headline font-black uppercase bg-gray-100 border-2 border-[#121316]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUploadCorporateMca}
                    disabled={corporateUploading || !corporateCsvText.trim()}
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-headline font-black uppercase bg-[#4717AE] text-white border-2 border-[#121316] shadow-[3px_3px_0_#121316] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {corporateUploading ? 'Validating CINs...' : 'Register Corporate Master 🏢'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                      Corporate Identification Number (CIN) *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. U72900KA2021PTC145678"
                      value={testCin}
                      onChange={(e) => setTestCin(e.target.value.toUpperCase())}
                      className="w-full p-2.5 font-mono text-xs font-bold uppercase tracking-wider border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                    />
                    <span className="text-[10px] text-gray-500 font-mono">Exactly 21 characters alphanumeric</span>
                  </div>

                  <div>
                    <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-1">
                      Company / Organization Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Infosys Technologies Limited"
                      value={testCompanyName}
                      onChange={(e) => setTestCompanyName(e.target.value)}
                      className="w-full p-2 text-xs font-bold border-2 border-[#121316] bg-[#FCFBF7] focus:outline-none focus:bg-white"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleVerifyCinLookup}
                    disabled={cinVerifying || !testCin.trim()}
                    className="w-full py-2.5 text-xs font-headline font-black uppercase bg-[#0F534A] text-white border-2 border-[#121316] shadow-[3px_3px_0_#121316] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {cinVerifying ? 'Searching MCA Master...' : 'Verify Corporate Entity Against MCA 🔍'}
                  </button>
                </div>

                {cinResult && (
                  <div className={`p-4 border-3 border-[#121316] ${cinResult.verified ? 'bg-[#9EFC5F]/20' : 'bg-red-50'} space-y-2`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 border-2 border-[#121316] flex items-center justify-center font-black text-xs ${cinResult.verified ? 'bg-[#9EFC5F] text-[#0F534A]' : 'bg-[#F4002C] text-white'}`}>
                        {cinResult.verified ? '✓' : '✗'}
                      </div>
                      <div className="font-headline font-black uppercase text-xs">
                        {cinResult.verified ? 'MCA Corporate Identity Verified' : 'CIN Verification Failed'}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-gray-700">
                      {cinResult.message}
                    </div>
                    {cinResult.data && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-300 font-mono text-[11px]">
                        <div><span className="text-gray-500">CIN:</span> {cinResult.data.cin}</div>
                        <div><span className="text-gray-500">Class:</span> {cinResult.data.companyClass}</div>
                        <div><span className="text-gray-500">Name:</span> {cinResult.data.companyName}</div>
                        <div><span className="text-gray-500">Status:</span> {cinResult.data.mcaStatus}</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <>
      <SEO
        title="Student KYC Verifications | DreamX Admin"
        description="Verify student identities, college ID proofs, and enrollments."
      />
      <div className="flex min-h-screen bg-[#FCFBF7] text-[#121316]">
        <AdminSidebar activeTab="verifications" />
        <main className="flex-1 min-w-0 overflow-y-auto px-6 lg:px-10 py-8">
          {content}
        </main>
      </div>
    </>
  );
}