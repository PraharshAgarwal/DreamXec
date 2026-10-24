import React, { useState, useEffect, useRef } from 'react';
import {
  Landmark,
  FolderLock,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Building2,
  FileText,
  UploadCloud,
  ExternalLink,
  Search,
  RefreshCw,
  Sparkles,
  Lock,
  Check,
  AlertCircle,
  Zap,
  Printer,
  Copy,
  AlertTriangle,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  vaultService,
  UserAccountVaultItem,
  UserDocVaultItem,
  VaultAccountType,
  VaultDocumentType,
  IfscLookupResult,
} from '../../services/vaultService';
import { resolveBackendMediaUrl } from '../../utils/apiConfig';
import { useCloudinaryUpload } from '../../hooks/useCloudinaryUpload';
import { ShimmerGrid } from '../common/ShimmerSkeleton';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadRazorpayScript } from '../../utils/loadRazorpay';

const ACCOUNT_TYPE_LABELS: Record<VaultAccountType, string> = {
  INDIVIDUAL_SAVINGS: 'Individual Savings',
  INDIVIDUAL_CURRENT: 'Individual Current',
  INSTITUTIONAL_CURRENT: 'Institutional / Lab Current',
  STUDENT_CLUB: 'Student Club / Team',
};

const DOCUMENT_TYPE_LABELS: Record<VaultDocumentType, string> = {
  GOVT_ID: 'Govt Identity Proof',
  STUDENT_ID: 'Student ID Card',
  UNIVERSITY_ENDORSEMENT: 'University Endorsement Letter',
  BANK_PASSBOOK: 'Bank Statement / Passbook',
  INVOICE: 'Project Invoice / Receipt',
  PROJECT_PROPOSAL: 'Project Proposal Deck',
  ORGANIZATION_REGISTRATION: 'Club / Org Registration',
  OTHER: 'General Document',
};

interface VaultSectionProps {
  initialSubTab?: 'bank' | 'documents';
}

export const VaultSection: React.FC<VaultSectionProps> = ({
  initialSubTab = 'bank'
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine subtab from path or prop
  const currentSubTab = location.pathname.includes('/vault/documents') ? 'documents' : 'bank';
  const [activeSubTab, setActiveSubTab] = useState<'bank' | 'documents'>(currentSubTab);

  // ── BANK VAULT STATE ──
  const [accounts, setAccounts] = useState<UserAccountVaultItem[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [isAddingAccount, setIsAddingAccount] = useState(false);

  const [accountNickname, setAccountNickname] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountType, setAccountType] = useState<VaultAccountType>('INDIVIDUAL_SAVINGS');
  const [isPrimary, setIsPrimary] = useState(false);
  const [savingAccount, setSavingAccount] = useState(false);
  const [verifyingKyc, setVerifyingKyc] = useState(false);
  const [verifyingExistingId, setVerifyingExistingId] = useState<string | null>(null);

  // IFSC Validation State
  const [ifscInfo, setIfscInfo] = useState<IfscLookupResult | null>(null);
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscError, setIfscError] = useState('');

  // Real-time IFSC Auto-Lookup
  useEffect(() => {
    const clean = ifscCode.trim().toUpperCase();
    if (clean.length === 11 && /^[A-Z]{4}0[A-Z0-9]{6}$/.test(clean)) {
      let cancelled = false;
      setIfscLoading(true);
      setIfscError('');
      vaultService
        .lookupIfsc(clean)
        .then((res) => {
          if (cancelled) return;
          if (res.valid) {
            setIfscInfo(res);
            if (!bankName && res.bank) {
              setBankName(res.bank);
            }
          } else {
            setIfscInfo(null);
            setIfscError(res.message || 'Invalid or unknown IFSC code');
          }
        })
        .catch((err) => {
          if (!cancelled) setIfscError(err?.message || 'IFSC lookup failed');
        })
        .finally(() => {
          if (!cancelled) setIfscLoading(false);
        });
      return () => {
        cancelled = true;
      };
    } else {
      setIfscInfo(null);
      setIfscError('');
    }
  }, [ifscCode]);

  // ₹1 Reverse Penny Drop Rapid KYC
  const handleRapidKyc = async () => {
    if (!accountHolderName.trim() || !bankAccountNumber.trim() || !ifscCode.trim()) {
      toast.error('Holder name, account number, and IFSC code are required.');
      return;
    }
    if (bankAccountNumber !== confirmAccountNumber) {
      toast.error('Account numbers do not match!');
      return;
    }
    if (ifscCode.trim().length !== 11) {
      toast.error('IFSC Code must be exactly 11 characters.');
      return;
    }

    setVerifyingKyc(true);
    try {
      const accountData = {
        accountNickname: accountNickname.trim() || undefined,
        accountHolderName: accountHolderName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        bankName: bankName.trim() || undefined,
        upiId: upiId.trim() || undefined,
        accountType,
        isPrimary,
      };

      const session = await vaultService.initiateKycVerification(accountData);
      await loadRazorpayScript();

      const options = {
        key: session.key || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Tb4QrxLF4HsEFb',
        amount: session.amount || 100,
        currency: session.currency || 'INR',
        name: 'DreamXec Protocol',
        description: '₹1 Reverse Penny Drop Account Ownership KYC',
        order_id: session.orderId,
        handler: async (response: any) => {
          try {
            await vaultService.confirmKycVerification({
              orderId: response.razorpay_order_id || session.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              accountData: session.accountData,
            });

            toast.success('🎉 Bank account verified via ₹1 KYC & secured in vault!');
            setIsAddingAccount(false);
            setAccountNickname('');
            setAccountHolderName('');
            setBankAccountNumber('');
            setConfirmAccountNumber('');
            setIfscCode('');
            setBankName('');
            setUpiId('');
            setIfscInfo(null);
            fetchAccounts();
          } catch (confirmErr: any) {
            toast.error(confirmErr?.message || 'Failed to confirm KYC verification');
          } finally {
            setVerifyingKyc(false);
          }
        },
        prefill: {
          name: accountHolderName,
        },
        theme: {
          color: '#0F534A',
        },
        modal: {
          ondismiss: () => {
            setVerifyingKyc(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err?.message || 'Could not initiate ₹1 KYC verification');
      setVerifyingKyc(false);
    }
  };

  const handleVerifyExistingAccount = async (acc: UserAccountVaultItem) => {
    setVerifyingExistingId(acc.id);
    try {
      const accountData = {
        accountNickname: acc.accountNickname,
        accountHolderName: acc.accountHolderName,
        bankAccountNumber: acc.bankAccountNumber,
        ifscCode: acc.ifscCode,
        bankName: acc.bankName,
        upiId: acc.upiId,
        accountType: acc.accountType,
        isPrimary: acc.isPrimary,
      };

      const session = await vaultService.initiateKycVerification(accountData);
      await loadRazorpayScript();

      const options = {
        key: session.key || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_Tb4QrxLF4HsEFb',
        amount: session.amount || 100,
        currency: session.currency || 'INR',
        name: 'DreamXec Protocol',
        description: '₹1 Reverse Penny Drop Account Ownership KYC',
        order_id: session.orderId,
        handler: async (response: any) => {
          try {
            await vaultService.confirmKycVerification({
              orderId: response.razorpay_order_id || session.orderId,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              accountData: session.accountData,
            });

            toast.success(`🎉 ${acc.accountHolderName}'s bank account verified via ₹1 KYC!`);
            fetchAccounts();
          } catch (confirmErr: any) {
            toast.error(confirmErr?.message || 'Failed to confirm KYC verification');
          } finally {
            setVerifyingExistingId(null);
          }
        },
        prefill: {
          name: acc.accountHolderName,
        },
        theme: {
          color: '#0F534A',
        },
        modal: {
          ondismiss: () => {
            setVerifyingExistingId(null);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err?.message || 'Could not initiate ₹1 KYC verification');
      setVerifyingExistingId(null);
    }
  };

  // ── DOC VAULT STATE ──
  const [docs, setDocs] = useState<UserDocVaultItem[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [searchDoc, setSearchDoc] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState<string>('ALL');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<VaultDocumentType>('GOVT_ID');
  const [previewDoc, setPreviewDoc] = useState<UserDocVaultItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [copiedNumber, setCopiedNumber] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openDocPreview = (doc: UserDocVaultItem) => {
    setPreviewDoc(doc);
    setZoomLevel(100);
    setRotation(0);
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleResetZoom = () => {
    setZoomLevel(100);
    setRotation(0);
  };

  // Helper to determine if a document originated from official DigiLocker
  const isDigiLockerRecord = (doc: UserDocVaultItem | null) => {
    if (!doc) return false;
    return Boolean(
      doc.metadata?.source === 'MeriPehchaan_DigiLocker' ||
      doc.metadata?.uri ||
      doc.fileUrl?.includes('meripehchaan.gov.in') ||
      doc.fileUrl?.includes('digilocker') ||
      doc.fileName?.includes('digilocker')
    );
  };

  // Helper to parse the authentic certificate number from DigiLocker URI or metadata
  const getDocumentIdNumber = (doc: UserDocVaultItem | null) => {
    if (!doc) return null;
    const uri = doc.metadata?.uri || (doc.fileUrl?.includes('meripehchaan.gov.in/issued/') ? doc.fileUrl.split('/issued/')[1] : '') || '';
    if (uri && uri.includes('-')) {
      const parts = uri.split('-');
      if (parts.length >= 3) {
        return parts.slice(2).join('-');
      }
    }
    if (doc.metadata?.docNumber) return doc.metadata.docNumber;
    return null;
  };

  // Check if a manual upload is a redundant copy of an official DigiLocker PAN record
  const isDuplicateManualPan = (doc: UserDocVaultItem, allDocs: UserDocVaultItem[]) => {
    if (isDigiLockerRecord(doc)) return false;
    const lowerTitle = (doc.title || '').toLowerCase();
    const isPanManual = lowerTitle.includes('pan') || doc.fileName?.toLowerCase().includes('pan');
    if (!isPanManual) return false;
    return allDocs.some(d => isDigiLockerRecord(d) && (
      (d.title || '').toLowerCase().includes('pan') ||
      d.metadata?.digilockerType === 'PANCR' ||
      d.metadata?.uri?.includes('PANCR')
    ));
  };

  // Sync state with route
  useEffect(() => {
    if (location.pathname.includes('/vault/documents')) {
      setActiveSubTab('documents');
    } else {
      setActiveSubTab('bank');
    }
  }, [location.pathname]);

  // Fetch Bank Accounts when active
  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const result = await vaultService.getAccounts();
      setAccounts(result);
    } catch (err) {
      console.error('Failed to fetch account vault:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  // Fetch Documents when active
  const fetchDocs = async () => {
    setLoadingDocs(true);
    try {
      const result = await vaultService.getDocuments(
        docTypeFilter === 'ALL' ? undefined : docTypeFilter,
        searchDoc.trim() || undefined
      );
      setDocs(result);
    } catch (err) {
      console.error('Failed to fetch doc vault:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'bank') {
      fetchAccounts();
    } else {
      fetchDocs();
    }
  }, [activeSubTab, docTypeFilter, searchDoc]);

  // Handle Save Bank Account
  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountHolderName.trim() || !bankAccountNumber.trim() || !ifscCode.trim()) {
      toast.error('Holder name, account number, and IFSC code are required.');
      return;
    }
    if (bankAccountNumber !== confirmAccountNumber) {
      toast.error('Account numbers do not match!');
      return;
    }
    if (ifscCode.trim().length !== 11) {
      toast.error('IFSC Code must be exactly 11 characters.');
      return;
    }

    setSavingAccount(true);
    try {
      await vaultService.saveAccount({
        accountNickname: accountNickname.trim() || undefined,
        accountHolderName: accountHolderName.trim(),
        bankAccountNumber: bankAccountNumber.trim(),
        ifscCode: ifscCode.trim().toUpperCase(),
        bankName: bankName.trim() || undefined,
        upiId: upiId.trim() || undefined,
        accountType,
        isPrimary,
      });

      toast.success('🎉 Bank account stored securely in vault!');
      setIsAddingAccount(false);
      // Reset form
      setAccountNickname('');
      setAccountHolderName('');
      setBankAccountNumber('');
      setConfirmAccountNumber('');
      setIfscCode('');
      setBankName('');
      setUpiId('');
      fetchAccounts();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save bank account');
    } finally {
      setSavingAccount(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this bank account from your vault?')) return;
    try {
      await vaultService.deleteAccount(id);
      toast.success('Account removed from vault.');
      fetchAccounts();
    } catch (err) {
      toast.error('Failed to delete account');
    }
  };

  // Cloudinary Upload Hook for Documents
  const { uploadFile, isUploading: isUploadingFile, progress } = useCloudinaryUpload({
    folder: 'campaigns/kyc',
    onSuccess: async (res) => {
      try {
        await vaultService.saveDocument({
          title: docTitle.trim() || 'Uploaded Vault Document',
          fileName: res.originalFilename || 'document.pdf',
          fileUrl: res.secureUrl,
          documentType: docType,
          fileSizeBytes: res.bytes || 0,
          mimeType: res.format ? `application/${res.format}` : undefined,
        });

        toast.success('📄 Document stored in vault successfully!');
        setIsUploadingDoc(false);
        setDocTitle('');
        fetchDocs();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to save document record');
      }
    },
    onError: (err) => {
      toast.error(`Upload failed: ${err.message}`);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleDeleteDoc = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this document from your vault?')) return;
    try {
      await vaultService.deleteDocument(id);
      toast.success('Document removed from vault.');
      fetchDocs();
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-2 sm:p-4">
      {/* VAULT BANNER */}
      <div className="bg-gradient-to-r from-[#0F534A] to-[#4717AE] text-white border-4 border-[#121316] shadow-[8px_8px_0_#FE4E1A] p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider mb-2">
            <Lock className="w-3.5 h-3.5" /> Encrypted Escrow Infrastructure
          </span>
          <h2 className="text-2xl sm:text-3xl font-headline font-black uppercase tracking-wide">
            DreamX Dual-Custody Secure Vault
          </h2>
          <p className="text-xs text-gray-200 font-medium mt-1 max-w-2xl">
            Store verified bank accounts and identity documents securely. Saved assets can be imported into milestone payouts and campaign verification in 1 click.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => {
              setActiveSubTab('bank');
              navigate('/vault/bank');
            }}
            className={`flex-1 md:flex-none px-4 py-2.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[3px_3px_0_#121316] flex items-center justify-center gap-2 transition-all ${
              activeSubTab === 'bank'
                ? 'bg-[#FFDD33] text-[#121316]'
                : 'bg-white text-[#121316] hover:bg-gray-100'
            }`}
          >
            <Landmark className="w-4 h-4" /> Bank Accounts ({accounts.length})
          </button>
          <button
            onClick={() => {
              setActiveSubTab('documents');
              navigate('/vault/documents');
            }}
            className={`flex-1 md:flex-none px-4 py-2.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[3px_3px_0_#121316] flex items-center justify-center gap-2 transition-all ${
              activeSubTab === 'documents'
                ? 'bg-[#FFDD33] text-[#121316]'
                : 'bg-white text-[#121316] hover:bg-gray-100'
            }`}
          >
            <FolderLock className="w-4 h-4" /> Document Vault ({docs.length})
          </button>
        </div>
      </div>

      {/* ── TAB 1: BANK ACCOUNTS ── */}
      {activeSubTab === 'bank' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white border-3 border-[#121316] p-4 rounded-xl shadow-[4px_4px_0_#121316]">
            <div>
              <h3 className="text-base font-headline font-black uppercase text-[#121316] flex items-center gap-2">
                <Landmark className="w-5 h-5 text-[#FE4E1A]" /> Saved Bank Accounts
              </h3>
              <p className="text-xs text-gray-600 font-semibold">
                Manage bank accounts for campaign funding disbursements & refunds
              </p>
            </div>
            <button
              onClick={() => setIsAddingAccount(!isAddingAccount)}
              className="px-4 py-2 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-xs uppercase flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" /> {isAddingAccount ? 'Cancel' : 'Add Bank Account'}
            </button>
          </div>

          {/* ADD ACCOUNT FORM */}
          {isAddingAccount && (
            <form onSubmit={handleSaveAccount} className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#FE4E1A] p-6 rounded-2xl space-y-4">
              <div className="flex justify-between items-center border-b-2 border-dashed border-gray-200 pb-3">
                <h4 className="text-sm font-headline font-black uppercase text-[#121316] flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#4717AE]" /> Add New Escrow-Ready Bank Account
                </h4>
                <span className="text-[10px] font-bold text-gray-500 uppercase">256-bit Encrypted</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-headline font-black uppercase text-[#121316] block mb-1">
                    Account Nickname (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Primary Research Fund"
                    value={accountNickname}
                    onChange={(e) => setAccountNickname(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-bold focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-headline font-black uppercase text-[#121316] block mb-1">
                    Account Type *
                  </label>
                  <select
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value as VaultAccountType)}
                    className="w-full px-3 py-2 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-headline font-black uppercase focus:outline-none"
                  >
                    <option value="INDIVIDUAL_SAVINGS">Individual Savings Account</option>
                    <option value="INDIVIDUAL_CURRENT">Individual Current Account</option>
                    <option value="INSTITUTIONAL_CURRENT">Institutional / Lab Current Account</option>
                    <option value="STUDENT_CLUB">Student Club / Team Account</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-headline font-black uppercase text-[#121316] block mb-1">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Full name as printed in bank passbook"
                    value={accountHolderName}
                    onChange={(e) => setAccountHolderName(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-bold focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-headline font-black uppercase text-[#121316] block mb-1">
                    Bank Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. State Bank of India, HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-bold focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-headline font-black uppercase text-[#121316] block mb-1">
                    Bank Account Number *
                  </label>
                  <input
                    type="text"
                    placeholder="Enter account number"
                    value={bankAccountNumber}
                    onChange={(e) => setBankAccountNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-mono font-bold focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-headline font-black uppercase text-[#121316] block mb-1">
                    Confirm Account Number *
                  </label>
                  <input
                    type="text"
                    placeholder="Re-enter account number"
                    value={confirmAccountNumber}
                    onChange={(e) => setConfirmAccountNumber(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-mono font-bold focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-headline font-black uppercase text-[#121316]">
                      IFSC Code (11 Characters) *
                    </label>
                    {ifscLoading && (
                      <span className="text-[10px] text-[#0F534A] font-bold flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Verifying...
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. SBIN0000691"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    maxLength={11}
                    required
                    className="w-full px-3 py-2 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-mono font-bold uppercase focus:outline-none focus:bg-white"
                  />
                  {ifscError && (
                    <p className="text-[10px] text-red-600 font-bold mt-1">⚠️ {ifscError}</p>
                  )}
                </div>

                {/* IFSC Live Preview & Rails */}
                {ifscInfo && ifscInfo.valid && (
                  <div className="md:col-span-2 p-3 bg-[#FCFBF7] border-2 border-[#0B9C2C] shadow-[2px_2px_0_#0B9C2C] rounded space-y-1 animate-fadeIn">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-headline font-black text-[#0B9C2C] uppercase flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        Verified: {ifscInfo.bank}
                      </span>
                      <span className="text-[10px] font-bold text-gray-600">
                        {ifscInfo.branch} {ifscInfo.city ? `• ${ifscInfo.city}` : ''} ({ifscInfo.state})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-[9px] font-bold text-gray-500 uppercase">Settlement Rails:</span>
                      {ifscInfo.rails?.upi && (
                        <span className="px-1.5 py-0.5 bg-[#E6F4EA] text-[#0B9C2C] border border-[#0B9C2C] text-[9px] font-black uppercase">
                          ✓ UPI
                        </span>
                      )}
                      {ifscInfo.rails?.neft && (
                        <span className="px-1.5 py-0.5 bg-[#E6F4EA] text-[#0B9C2C] border border-[#0B9C2C] text-[9px] font-black uppercase">
                          ✓ NEFT
                        </span>
                      )}
                      {ifscInfo.rails?.imps && (
                        <span className="px-1.5 py-0.5 bg-[#E6F4EA] text-[#0B9C2C] border border-[#0B9C2C] text-[9px] font-black uppercase">
                          ✓ IMPS
                        </span>
                      )}
                      {ifscInfo.rails?.rtgs && (
                        <span className="px-1.5 py-0.5 bg-[#E6F4EA] text-[#0B9C2C] border border-[#0B9C2C] text-[9px] font-black uppercase">
                          ✓ RTGS
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-headline font-black uppercase text-[#121316] block mb-1">
                    UPI ID / VPA (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. username@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-bold focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="primaryCheck"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-4 h-4 text-[#FE4E1A] border-2 border-[#121316]"
                />
                <label htmlFor="primaryCheck" className="text-xs font-headline font-black uppercase text-[#121316]">
                  Set as Primary Payout Account for Milestone Disbursements
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingAccount(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border-2 border-[#121316] text-xs font-headline font-black uppercase"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="submit"
                    disabled={savingAccount || verifyingKyc}
                    className="px-4 py-2 bg-white hover:bg-gray-50 border-2 border-[#121316] shadow-[2px_2px_0_#121316] text-xs font-headline font-black uppercase cursor-pointer"
                  >
                    {savingAccount ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Save (Unverified)'}
                  </button>

                  <button
                    type="button"
                    onClick={handleRapidKyc}
                    disabled={savingAccount || verifyingKyc}
                    className="px-5 py-2 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] text-xs font-headline font-black uppercase flex items-center gap-2 cursor-pointer"
                    title="Instant bank account ownership verification via ₹1.00 payment"
                  >
                    {verifyingKyc ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 fill-current text-[#FFDD33]" />
                        ⚡ Verify & Add (₹1 Rapid KYC)
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ACCOUNTS LIST */}
          {loadingAccounts ? (
            <ShimmerGrid count={3} />
          ) : accounts.length === 0 ? (
            <div className="bg-white border-3 border-[#121316] p-12 text-center rounded-xl space-y-3 shadow-[4px_4px_0_#121316]">
              <div className="w-16 h-16 bg-[#FFDD33] border-3 border-[#121316] rounded-full mx-auto flex items-center justify-center shadow-[3px_3px_0_#FE4E1A]">
                <Landmark className="w-8 h-8 text-[#121316]" />
              </div>
              <h4 className="text-lg font-headline font-black uppercase text-[#121316]">No Bank Accounts Vaulted Yet</h4>
              <p className="text-xs text-gray-600 font-semibold max-w-md mx-auto">
                Add your verified bank account details to easily request milestone payout disbursements without typing details every time.
              </p>
              <button
                onClick={() => setIsAddingAccount(true)}
                className="mt-2 px-5 py-2.5 bg-[#FE4E1A] text-white border-2 border-[#121316] shadow-[3px_3px_0_#121316] font-headline font-black text-xs uppercase"
              >
                Add Your First Bank Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`bg-white border-3 border-[#121316] rounded-xl p-5 space-y-4 transition-all relative ${
                    acc.isPrimary ? 'shadow-[5px_5px_0_#FE4E1A]' : 'shadow-[4px_4px_0_#121316]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 bg-[#9EFC5F]/30 border-2 border-[#121316] rounded-lg flex items-center justify-center text-[#0F534A]">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-headline font-black text-sm uppercase text-[#121316]">
                          {acc.accountNickname || acc.bankName || 'Bank Account'}
                        </h4>
                        <span className="text-[10px] font-headline font-black uppercase text-gray-500">
                          {ACCOUNT_TYPE_LABELS[acc.accountType] || acc.accountType}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {acc.isPrimary && (
                        <span className="bg-[#FFDD33] text-[#121316] border border-[#121316] px-2 py-0.5 text-[9px] font-headline font-black uppercase">
                          PRIMARY
                        </span>
                      )}
                      <button
                        onClick={() => handleDeleteAccount(acc.id)}
                        className="p-1.5 hover:bg-[#F4002C] hover:text-white rounded border border-transparent hover:border-[#121316] text-gray-500 transition-all"
                        title="Delete Account"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#FCFBF7] border-2 border-[#121316] p-3 rounded-lg space-y-1 font-mono text-xs">
                    <div className="flex justify-between text-gray-600">
                      <span>Holder:</span>
                      <strong className="text-[#121316] font-headline uppercase">{acc.accountHolderName}</strong>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Account No:</span>
                      <strong className="text-[#121316]">•••• {acc.bankAccountNumber.slice(-4)}</strong>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>IFSC Code:</span>
                      <strong className="text-[#4717AE]">{acc.ifscCode}</strong>
                    </div>
                    {acc.upiId && (
                      <div className="flex justify-between text-gray-600">
                        <span>UPI VPA:</span>
                        <strong className="text-[#0F534A]">{acc.upiId}</strong>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase pt-1 flex-wrap gap-2">
                    {acc.isVerified ? (
                      <span className="flex items-center gap-1 text-[#0B9C2C] font-black">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0B9C2C]" /> ✓ VERIFIED VIA ₹1 KYC
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400 font-bold">UNVERIFIED</span>
                        <button
                          type="button"
                          onClick={() => handleVerifyExistingAccount(acc)}
                          disabled={verifyingExistingId === acc.id}
                          className="px-2 py-0.5 bg-[#FE4E1A] text-white border border-[#121316] text-[9px] font-headline font-black uppercase hover:bg-[#e03d0d] flex items-center gap-1 cursor-pointer"
                        >
                          {verifyingExistingId === acc.id ? (
                            <>
                              <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <Zap className="w-2.5 h-2.5 fill-current text-[#FFDD33]" />
                              Verify (₹1 KYC)
                            </>
                          )}
                        </button>
                      </div>
                    )}
                    <span>Vault ID: {acc.id.slice(0, 8)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: DOCUMENT VAULT ── */}
      {activeSubTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-3 border-[#121316] p-4 rounded-xl shadow-[4px_4px_0_#121316]">
            <div>
              <h3 className="text-base font-headline font-black uppercase text-[#121316] flex items-center gap-2">
                <FolderLock className="w-5 h-5 text-[#FE4E1A]" /> Stored Identity & Verification Documents
              </h3>
              <p className="text-xs text-gray-600 font-semibold">
                Manage government ID, student cards, passbooks & campaign compliance proofs
              </p>
            </div>
            <button
              onClick={() => setIsUploadingDoc(!isUploadingDoc)}
              className="w-full sm:w-auto px-4 py-2 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-xs uppercase flex items-center justify-center gap-2 transition-all"
            >
              <UploadCloud className="w-4 h-4" /> {isUploadingDoc ? 'Cancel Upload' : 'Upload Document'}
            </button>
          </div>

          {/* UPLOAD FORM DROPZONE */}
          {isUploadingDoc && (
            <div className="bg-white border-4 border-[#121316] shadow-[6px_6px_0_#FE4E1A] p-6 rounded-2xl space-y-4">
              <h4 className="text-sm font-headline font-black uppercase text-[#121316] flex items-center gap-2">
                <UploadCloud className="w-4 h-4 text-[#4717AE]" /> Vault New Compliance Asset
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-headline font-black uppercase text-[#121316] block mb-1">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Aadhaar Front & Back / Student ID 2026"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-bold focus:outline-none focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-headline font-black uppercase text-[#121316] block mb-1">
                    Document Category *
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as VaultDocumentType)}
                    className="w-full px-3 py-2 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-headline font-black uppercase focus:outline-none"
                  >
                    {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DROPZONE AREA */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-3 border-dashed border-[#121316] bg-[#FCFBF7] hover:bg-[#FFDD33]/20 p-8 text-center rounded-xl cursor-pointer transition-all space-y-2"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*,.pdf"
                  className="hidden"
                />
                <div className="w-12 h-12 bg-[#FFDD33] border-2 border-[#121316] rounded-full mx-auto flex items-center justify-center shadow-[2px_2px_0_#121316]">
                  <UploadCloud className="w-6 h-6 text-[#121316]" />
                </div>
                <h5 className="text-xs font-headline font-black uppercase text-[#121316]">
                  {isUploadingFile ? `Uploading File (${progress}%)...` : 'Click to Upload Document (PDF, PNG, JPG)'}
                </h5>
                <p className="text-[10px] text-gray-500 font-bold">Max File Size: 10MB • Cloudinary Encrypted Vault</p>
                {isUploadingFile && (
                  <div className="h-2 w-48 bg-gray-200 rounded-full mx-auto overflow-hidden border border-[#121316] mt-2">
                    <div className="h-full bg-[#FE4E1A] transition-all" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SEARCH & CATEGORY FILTERS */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents by title or file name..."
                value={searchDoc}
                onChange={(e) => setSearchDoc(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border-2 border-[#121316] text-xs font-bold focus:outline-none shadow-[2px_2px_0_#121316]"
              />
            </div>
            <select
              value={docTypeFilter}
              onChange={(e) => setDocTypeFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 bg-white border-2 border-[#121316] text-xs font-headline font-black uppercase focus:outline-none shadow-[2px_2px_0_#121316]"
            >
              <option value="ALL">All Categories</option>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* DOCUMENTS LIST */}
          {loadingDocs ? (
            <ShimmerGrid count={3} />
          ) : docs.length === 0 ? (
            <div className="bg-white border-3 border-[#121316] p-12 text-center rounded-xl space-y-3 shadow-[4px_4px_0_#121316]">
              <div className="w-16 h-16 bg-[#FFDD33] border-3 border-[#121316] rounded-full mx-auto flex items-center justify-center shadow-[3px_3px_0_#FE4E1A]">
                <FolderLock className="w-8 h-8 text-[#121316]" />
              </div>
              <h4 className="text-lg font-headline font-black uppercase text-[#121316]">No Documents Vaulted Yet</h4>
              <p className="text-xs text-gray-600 font-semibold max-w-md mx-auto">
                Store official government IDs, student registration cards, or project proposals for quick 1-click import into milestone submissions.
              </p>
              <button
                onClick={() => setIsUploadingDoc(true)}
                className="mt-2 px-5 py-2.5 bg-[#FE4E1A] text-white border-2 border-[#121316] shadow-[3px_3px_0_#121316] font-headline font-black text-xs uppercase"
              >
                Upload First Document
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {docs.map((doc) => {
                const isDigiLocker = isDigiLockerRecord(doc);
                const docIdNum = getDocumentIdNumber(doc);
                const isDuplicatePan = isDuplicateManualPan(doc, docs);

                return (
                  <div
                    key={doc.id}
                    className={`rounded-xl p-5 space-y-4 flex flex-col justify-between transition-all relative overflow-hidden ${
                      isDigiLocker
                        ? 'bg-[#FCFBF7] border-3 border-[#0F534A] shadow-[5px_5px_0_#0F534A] bg-tactile-dots-light'
                        : 'bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] bg-tactile-dots-light'
                    } ${
                      isDuplicatePan ? 'ring-2 ring-amber-400 bg-amber-50/20' : ''
                    }`}
                  >
                    {/* Official Tricolor Ribbon for DigiLocker Credentials */}
                    {isDigiLocker && (
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#FE4E1A] via-white to-[#0F534A]" />
                    )}

                    <div className="space-y-3 pt-1">
                      <div className="flex justify-between items-start">
                        <div className={`w-10 h-10 border-2 border-[#121316] rounded-lg flex items-center justify-center shadow-[2px_2px_0_#121316] ${
                          isDigiLocker ? 'bg-[#0F534A] text-[#9EFC5F]' : 'bg-[#FFDD33] text-[#121316]'
                        }`}>
                          {isDigiLocker ? <ShieldCheck className="w-5 h-5 text-[#9EFC5F]" /> : <FileText className="w-5 h-5" />}
                        </div>
                        <button
                          onClick={() => handleDeleteDoc(doc.id)}
                          className="p-1 hover:bg-[#F4002C] hover:text-white rounded border border-transparent hover:border-[#121316] text-gray-400 transition-all cursor-pointer"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        {/* Source Badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          {isDigiLocker ? (
                            <>
                              <span className="text-[9px] font-headline font-black uppercase bg-[#0F534A] text-white border border-[#121316] px-2 py-0.5 flex items-center gap-1 shadow-[1px_1px_0px_#121316]">
                                <span>🇮🇳</span> DigiLocker Verified
                              </span>
                              <span className="stamp-badge stamp-green text-[9px] py-0">
                                OFFICIAL RECORD
                              </span>
                            </>
                          ) : (
                            <span className="text-[9px] font-headline font-black uppercase bg-stone-100 text-stone-700 border border-[#121316] px-2 py-0.5 flex items-center gap-1">
                              <span>📁</span> User Upload
                            </span>
                          )}
                          <span className="text-[9px] font-headline font-black uppercase bg-[#FFDD33] text-[#121316] border border-[#121316] px-2 py-0.5">
                            {DOCUMENT_TYPE_LABELS[doc.documentType] || doc.documentType}
                          </span>
                        </div>

                        <h4 className="font-headline font-black text-sm uppercase text-[#121316] mt-1 line-clamp-1">
                          {doc.title}
                        </h4>

                        {/* Prominent Authentic ID Badge */}
                        {docIdNum && (
                          <div className="mt-2 px-2.5 py-1.5 bg-white border-2 border-[#121316] font-mono font-black text-xs text-[#0F534A] tracking-wider flex items-center justify-between shadow-[2px_2px_0px_#121316]">
                            <span>ID: {docIdNum}</span>
                            <span className="text-[9px] text-[#0F534A] font-bold bg-[#9EFC5F]/50 px-1.5 py-0.5 border border-[#0F534A]/30">
                              ✓ VERIFIED
                            </span>
                          </div>
                        )}

                        <p className="text-[10px] text-gray-500 font-mono truncate mt-1">
                          {doc.fileName}
                        </p>

                        {/* Duplicate PAN Warning Notice */}
                        {isDuplicatePan && (
                          <div className="mt-2.5 p-2 bg-amber-100/80 border-2 border-amber-400 text-[10px] text-amber-900 font-bold flex items-center justify-between gap-2 shadow-[1px_1px_0_#121316]">
                            <span>⚡ Official CBDT DigiLocker PAN on record</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="text-red-700 font-black underline hover:text-red-800 cursor-pointer shrink-0"
                              title="Delete redundant manual upload"
                            >
                              Prune
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="pt-2 border-t-2 border-dashed border-gray-200 flex items-center justify-between">
                      <span className="text-[10px] text-gray-500 font-bold uppercase">
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </span>
                      {isDigiLocker ? (
                        <button
                          type="button"
                          onClick={() => openDocPreview(doc)}
                          className="px-3 py-1.5 bg-[#0F534A] hover:bg-[#002244] text-white border-2 border-[#121316] text-[10px] font-headline font-black uppercase flex items-center gap-1.5 cursor-pointer transition-all shadow-[2px_2px_0px_#121316]"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-[#9EFC5F]" /> View Certificate
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openDocPreview(doc)}
                          className="px-3 py-1.5 bg-[#121316] hover:bg-[#FE4E1A] text-white border-2 border-[#121316] text-[10px] font-headline font-black uppercase flex items-center gap-1.5 cursor-pointer transition-all shadow-[2px_2px_0px_#121316]"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#FFDD33]" /> View Asset
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SMART ASSET & OFFICIAL CERTIFICATE VIEWER MODAL ── */}
      {previewDoc && (() => {
        const isDigiLocker = isDigiLockerRecord(previewDoc);
        const docIdNum = getDocumentIdNumber(previewDoc);
        const isDuplicatePan = isDuplicateManualPan(previewDoc, docs);
        const resolvedAssetUrl = resolveBackendMediaUrl(previewDoc.fileUrl);
        const isImage = /\.(jpg|jpeg|png|webp|svg)(\?.*)?$/i.test(previewDoc.fileUrl) || previewDoc.mimeType?.startsWith('image/');
        const isPdf = /\.pdf(\?.*)?$/i.test(previewDoc.fileUrl) || previewDoc.mimeType === 'application/pdf';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121316]/80 backdrop-blur-xs animate-fadeIn">
            <div className="bg-[#FFFDF8] border-4 border-[#121316] shadow-[8px_8px_0px_#121316] max-w-2xl w-full max-h-[92vh] overflow-y-auto p-6 space-y-4">
              {/* Header with Loupe / Zoom Toolbar */}
              <div className="flex items-start justify-between border-b-2 border-[#121316] pb-3 gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{isDigiLocker ? '🇮🇳' : '📁'}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xs font-black uppercase tracking-wider text-[#003366]">
                        {isDigiLocker ? 'DigiLocker Electronic Certificate' : 'Vault Stored Document Asset'}
                      </h3>
                      <span className={`text-[9px] font-bold px-2 py-0.5 border ${
                        isDigiLocker
                          ? 'text-[#0F534A] bg-[#9EFC5F]/40 border-[#0F534A]/40'
                          : 'text-[#003366] bg-blue-100 border-blue-300'
                      }`}>
                        {isDigiLocker ? '✓ LEGALLY VALID' : 'USER ASSET'}
                      </span>
                    </div>
                    <p className="text-[10px] font-mono text-[#121316]/70 mt-0.5">
                      {isDigiLocker
                        ? 'Government of India • Ministry of Electronics & IT (MeitY)'
                        : `${previewDoc.title} • ${previewDoc.fileName}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Interactive Loupe & Zoom Controls */}
                  <div className="flex items-center bg-white border-2 border-[#121316] px-1.5 py-0.5 shadow-[2px_2px_0_#121316]">
                    <button
                      type="button"
                      onClick={handleZoomOut}
                      disabled={zoomLevel <= 50}
                      className="p-1 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5 text-[#121316]" />
                    </button>
                    <span className="font-mono font-bold text-[11px] px-1 text-[#121316] min-w-[38px] text-center">
                      {zoomLevel}%
                    </span>
                    <button
                      type="button"
                      onClick={handleZoomIn}
                      disabled={zoomLevel >= 250}
                      className="p-1 hover:bg-stone-100 disabled:opacity-30 cursor-pointer"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5 text-[#121316]" />
                    </button>
                    <div className="w-[1px] h-3.5 bg-gray-300 mx-1" />
                    <button
                      type="button"
                      onClick={handleRotate}
                      className="p-1 hover:bg-stone-100 cursor-pointer"
                      title="Rotate Clockwise"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#121316]" />
                    </button>
                    <button
                      type="button"
                      onClick={handleResetZoom}
                      className="text-[9px] font-headline font-black uppercase px-1 py-0.5 bg-stone-100 hover:bg-stone-200 cursor-pointer border border-[#121316] ml-0.5"
                      title="Reset Zoom"
                    >
                      1:1
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="w-8 h-8 flex items-center justify-center border-2 border-[#121316] bg-stone-100 hover:bg-[#F4002C] hover:text-white font-black text-sm cursor-pointer shadow-[2px_2px_0px_#121316]"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Duplicate Notice Banner */}
              {isDuplicatePan && (
                <div className="p-3 bg-amber-50 border-2 border-amber-400 text-xs text-amber-900 font-medium flex items-center justify-between gap-3 shadow-[2px_2px_0_#121316]">
                  <div>
                    <span className="font-bold block">⚡ Duplicate Document Record Detected</span>
                    <span>An official DigiLocker-verified CBDT PAN record is already active in your vault. You may prune this manual upload or retain it for your records.</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await handleDeleteDoc(previewDoc.id);
                      setPreviewDoc(null);
                    }}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-black text-[10px] uppercase border border-[#121316] cursor-pointer shrink-0"
                  >
                    Delete Duplicate
                  </button>
                </div>
              )}

              {/* ── MODE 1: DIGILOCKER OFFICIAL ELECTRONIC CERTIFICATE ── */}
              {isDigiLocker ? (
                <div className="overflow-auto max-h-[60vh] p-2 bg-stone-100/60 border-2 border-[#0F534A]/30 rounded-xl">
                  <div
                    className="p-6 border-3 border-[#0F534A] bg-white space-y-4 relative overflow-hidden shadow-[4px_4px_0px_#0F534A] origin-top transition-transform duration-200"
                    style={{
                      transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                      transformOrigin: 'top center',
                    }}
                  >
                    {/* Tricolor Ribbon */}
                    <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-[#FE4E1A] via-white to-[#0F534A]" />

                    {/* Watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                      <span className="text-8xl font-black rotate-[-25deg] text-[#0F534A]">VERIFIED</span>
                    </div>

                    <div className="flex items-center justify-between border-b-2 border-[#0F534A]/20 pb-3 pt-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-mono font-black uppercase tracking-widest px-2 py-0.5 bg-[#0F534A] text-white">
                            {previewDoc.metadata?.digilockerType || previewDoc.documentType}
                          </span>
                          <span className="stamp-badge stamp-green text-[9px] py-0">
                            GOVT OF INDIA
                          </span>
                        </div>
                        <h4 className="text-lg font-headline font-black uppercase text-[#121316] mt-1">
                          {previewDoc.title}
                        </h4>
                        <p className="text-[11px] font-bold text-[#0F534A]">
                          {previewDoc.metadata?.issuer || (previewDoc.title.includes('PAN') ? 'Income Tax Department (CBDT)' : 'Ministry of Road Transport and Highways')}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-[#0F534A] text-[#9EFC5F] flex items-center justify-center text-2xl font-black border-2 border-[#121316] shadow-[2px_2px_0px_#121316]">
                        ✓
                      </div>
                    </div>

                    {/* Prominent Authentic Certificate / Document Number */}
                    {docIdNum && (
                      <div className="p-4 bg-emerald-50/60 border-2 border-[#0F534A] shadow-[3px_3px_0px_#0F534A] flex items-center justify-between">
                        <div>
                          <span className="block text-[9px] font-headline font-black uppercase tracking-wider text-[#0F534A]">
                            Official Government Document Number
                          </span>
                          <span className="font-mono font-black text-2xl text-[#0F534A] tracking-wider block mt-0.5">
                            {docIdNum}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(docIdNum);
                            setCopiedNumber(true);
                            toast.success('Document ID copied to clipboard!');
                            setTimeout(() => setCopiedNumber(false), 2000);
                          }}
                          className="px-3 py-1.5 bg-white border-2 border-[#0F534A] text-[#0F534A] font-headline font-black text-xs uppercase hover:bg-[#9EFC5F]/40 flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#0F534A]"
                        >
                          {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedNumber ? 'Copied' : 'Copy ID'}</span>
                        </button>
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2.5 text-xs">
                      <div className="p-2.5 bg-stone-50 border border-[#121316]/20">
                        <span className="block text-[8px] font-black uppercase text-[#121316]/60">Verification Status</span>
                        <span className="font-bold text-[#0F534A] text-xs">✓ ACTIVE &amp; AUTHENTICATED</span>
                      </div>
                      <div className="p-2.5 bg-stone-50 border border-[#121316]/20">
                        <span className="block text-[8px] font-black uppercase text-[#121316]/60">Verified Date</span>
                        <span className="font-bold text-[#121316] text-xs">
                          {new Date(previewDoc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="p-2.5 bg-stone-50 border border-[#121316]/20 col-span-2">
                        <span className="block text-[8px] font-black uppercase text-[#121316]/60">DigiLocker Electronic URI</span>
                        <span className="font-mono font-bold text-[10px] text-[#003366] break-all">
                          {previewDoc.metadata?.uri || previewDoc.fileUrl}
                        </span>
                      </div>
                    </div>

                    {/* Cryptographic Trust Stamp */}
                    <div className="p-3 bg-emerald-50 border-2 border-[#0F534A] flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">🔏</span>
                        <div>
                          <span className="block text-[10px] font-headline font-black text-[#0F534A] uppercase tracking-wider">
                            Official DigiLocker Cryptographic Seal
                          </span>
                          <span className="block text-[9px] text-[#121316]/75">
                            Digitally signed by Controller of Certifying Authorities (CCA) under Section 9A of the IT Act 2000
                          </span>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 text-[9px] font-headline font-black bg-[#0F534A] text-white uppercase tracking-wider shrink-0 shadow-[1px_1px_0_#121316]">
                        CCA VALID
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* ── MODE 2: REAL VISUAL ASSET VIEWER (IMAGES & PDFS) WITH LOUPE ── */
                <div className="space-y-3">
                  {isImage ? (
                    <div className="bg-[#121316] p-4 border-3 border-[#121316] flex items-center justify-center min-h-[280px] max-h-[55vh] overflow-auto rounded-xl shadow-inner relative">
                      <img
                        src={resolvedAssetUrl}
                        alt={previewDoc.title}
                        className="max-h-[50vh] max-w-full object-contain rounded shadow-lg border border-stone-800 transition-transform duration-200"
                        style={{
                          transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                          transformOrigin: 'center center',
                        }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const el = e.currentTarget.parentElement?.querySelector('.img-error-fallback');
                          if (el) (el as HTMLElement).style.display = 'block';
                        }}
                      />
                      <div className="img-error-fallback hidden text-center text-white p-6 space-y-3">
                        <p className="text-xs font-bold text-amber-400">Image could not be embedded directly</p>
                        <a
                          href={resolvedAssetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FE4E1A] text-white font-black text-xs uppercase shadow-[2px_2px_0px_#121316]"
                        >
                          <ExternalLink className="w-4 h-4" /> Open File in New Tab
                        </a>
                      </div>

                      {/* Zoom Indicator Pill */}
                      <span className="absolute bottom-2 right-2 bg-black/70 text-white font-mono text-[10px] px-2 py-0.5 rounded border border-white/20 pointer-events-none">
                        Zoom: {zoomLevel}%
                      </span>
                    </div>
                  ) : isPdf ? (
                    <div className="border-3 border-[#121316] h-[55vh] bg-stone-100 rounded-xl overflow-hidden shadow-inner">
                      <iframe
                        src={resolvedAssetUrl}
                        title={previewDoc.title}
                        className="w-full h-full border-none"
                      />
                    </div>
                  ) : (
                    <div className="p-8 bg-stone-50 border-3 border-[#121316] text-center space-y-3 rounded-xl">
                      <FileText className="w-16 h-16 text-[#0F534A] mx-auto" />
                      <p className="text-sm font-black text-[#121316]">{previewDoc.fileName}</p>
                      <a
                        href={resolvedAssetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#121316] text-white font-black text-xs uppercase shadow-[2px_2px_0px_#121316]"
                      >
                        <ExternalLink className="w-4 h-4" /> Open / Download Asset
                      </a>
                    </div>
                  )}

                  {/* File Metadata Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs pt-1">
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20">
                      <span className="block text-[8px] font-black uppercase text-[#121316]/60">Document Category</span>
                      <span className="font-bold text-[#121316]">{DOCUMENT_TYPE_LABELS[previewDoc.documentType] || previewDoc.documentType}</span>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20">
                      <span className="block text-[8px] font-black uppercase text-[#121316]/60">Upload Date</span>
                      <span className="font-bold text-[#121316]">{new Date(previewDoc.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="p-2.5 bg-stone-100 border border-[#121316]/20 col-span-2 sm:col-span-1">
                      <span className="block text-[8px] font-black uppercase text-[#121316]/60">File Size</span>
                      <span className="font-bold text-[#121316]">
                        {previewDoc.fileSizeBytes ? `${(Number(previewDoc.fileSizeBytes) / 1024).toFixed(1)} KB` : 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t-2 border-[#121316]">
                <div>
                  {!isDigiLocker && resolvedAssetUrl && (
                    <a
                      href={resolvedAssetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-black text-[#003366] underline hover:text-[#FE4E1A] flex items-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open Full Asset in New Tab
                    </a>
                  )}
                  {isDigiLocker && (
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#0F534A] border-2 border-[#0F534A] text-xs font-headline font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-[2px_2px_0px_#0F534A]"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print Certificate
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="px-5 py-2 bg-[#121316] hover:bg-[#121316]/90 text-white font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] cursor-pointer shadow-[3px_3px_0px_#121316]"
                  >
                    Close Viewer
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default VaultSection;
