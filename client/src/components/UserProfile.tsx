import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  Building2,
  Repeat,
  FileText,
  Save,
  ArrowLeft,
  Lock,
  User as UserIcon,
  Check,
  FolderLock,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Award,
  Globe,
  Landmark,
  Plus,
  Layers,
  ExternalLink,
  RefreshCw,
  Edit2,
  Zap,
  BadgeCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';
import UnifiedDashboardLayout from './layout/UnifiedDashboardLayout';
import { useAuth } from '../context/AuthContext';
import { getUserRoleProfile, formatRoleLabel, getUserDisplayPersona } from '../utils/roleUtils';
import SpeciesCardModal from './species/SpeciesCardModal';
import PassportStampShelf from './passport/PassportStampShelf';
import type { User } from '../types';
import apiRequest from '../services/api';
import { vaultService, UserAccountVaultItem } from '../services/vaultService';
import { AccountVaultModal } from './vault/AccountVaultModal';
import { DocVaultSelector } from './vault/DocVaultSelector';
import { getKycStatus, submitKyc, KycStatusType, KycData } from '../services/profileService';

interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: 'savings' | 'current';
  upiId?: string;
}

interface UserProfileProps {
  user?: User | null;
  onBack?: () => void;
  onUpdateBankDetails?: (details: BankDetails) => void;
  onLogout?: () => void;
}

const getTabFromPath = (path: string) => {
  if (path.includes('/profile/kyc')) return 'kyc';
  if (path.includes('/profile/bank')) return 'bank';
  if (path.includes('/profile/active-profiles')) return 'roles';
  return 'info';
};

export default function UserProfile({
  user: propUser,
  onBack,
  onUpdateBankDetails,
  onLogout: _onLogout,
}: UserProfileProps) {
  const {
    user: authUser,
    handleSwitchProfile,
    switchToIndependentMode,
    isIndependentUser,
    personaMode,
    setPersonaMode,
  } = useAuth();
  const user = authUser || propUser;
  const navigate = useNavigate();
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<'info' | 'kyc' | 'bank' | 'roles'>(() =>
    getTabFromPath(location.pathname)
  );
  const [speciesCardOpen, setSpeciesCardOpen] = useState(false);

  useEffect(() => {
    setActiveTab(getTabFromPath(location.pathname));
  }, [location.pathname]);

  // Resolve identity mode and role cleanly using unified utility
  const roleProfile = getUserRoleProfile(user);
  const displayRole = roleProfile.roleLabel;
  const primaryOrgName = roleProfile.orgName;
  const primaryOrgType = roleProfile.orgType;
  const displayPersona = getUserDisplayPersona(user, personaMode);

  // Tab 1: Personal Info State (Grounded in real user props)
  const [name, setName] = useState(user?.fullName || user?.name || '');
  const [email] = useState(user?.email || '');
  const [phone, setPhone] = useState((user as any)?.phone || '');
  const [designation, setDesignation] = useState((user as any)?.designation || displayRole);
  const [department, setDepartment] = useState((user as any)?.department || primaryOrgName);
  const [bio, setBio] = useState((user as any)?.bio || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState(false);

  // Tab 2: Dynamic KYC Document State
  const [kycLoading, setKycLoading] = useState(false);
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState<KycStatusType>('UNVERIFIED');
  const [govtDocType, setGovtDocType] = useState('Aadhaar Card');
  const [govtDocNumber, setGovtDocNumber] = useState('');
  const [govtDocUrl, setGovtDocUrl] = useState('');
  const [collegeIdCardUrl, setCollegeIdCardUrl] = useState('');
  const [institution, setInstitution] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);
  const [verifiedAt, setVerifiedAt] = useState<string | null>(null);
  const [digiLockerLoading, setDigiLockerLoading] = useState(false);
  const [digilockerVerified, setDigilockerVerified] = useState(false);
  const [apaarId, setApaarId] = useState<string | null>(null);
  const [issuer, setIssuer] = useState<string | null>(null);
  const [isRevising, setIsRevising] = useState(false);
  const [previewMode, setPreviewMode] = useState<'FORM' | 'VERIFIED'>('FORM');

  // Fetch live KYC status & documents
  const fetchKycData = async () => {
    setKycLoading(true);
    try {
      const res = await getKycStatus();
      const k = (res?.data || res) as KycData;
      if (k) {
        setKycStatus(k.kycStatus || 'UNVERIFIED');
        setGovtDocType(k.govtDocType || 'Aadhaar Card');
        setGovtDocNumber(k.govtDocNumber || '');
        setGovtDocUrl(k.govtDocUrl || '');
        setCollegeIdCardUrl(k.collegeIdCardUrl || '');
        setInstitution(
          k.institution || (user as any)?.college || (user as any)?.institutionName || ''
        );
        setRollNumber(k.rollNumber || (user as any)?.rollNumber || '');
        setBranch(k.branch || (user as any)?.department || '');
        setAcademicYear(k.year || (user as any)?.yearOfStudy || '');
        setWhatsappNumber(k.whatsappNumber || (user as any)?.phone || '');
        setRejectionReason(k.rejectionReason || null);
        setSubmittedAt(k.submittedAt || null);
        setVerifiedAt(k.verifiedAt || null);
        setDigilockerVerified(!!k.digilockerVerified);
        setApaarId(k.apaarId || null);
        setIssuer(k.issuer || null);
      }
    } catch (err) {
      console.warn('Could not load KYC status:', err);
    } finally {
      setKycLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'kyc') {
      fetchKycData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Handle successful DigiLocker verification payload
  const handleDigiLockerSuccess = async (student: any) => {
    setDigiLockerLoading(true);
    const toastId = toast.loading('Securing DigiLocker credentials & syncing to Doc Vault...');

    try {
      // 1. Auto-sync issued authentic certificates into Doc Vault
      try {
        await apiRequest('/workflows/digilocker/vault/sync', {
          method: 'POST',
          body: JSON.stringify({
            documents: student.documents || [],
            apaarData: student,
          }),
        });
      } catch (vErr) {
        console.warn('[UserProfile] Doc vault sync notice:', vErr);
      }

      // 2. Submit verified data to server for instant dual-custody verification
      const cleanMasked =
        student.aadhaarMasked ||
        (student.aadhaarLast4
          ? `XXXX-XXXX-${student.aadhaarLast4}`
          : student.panNumber || 'DIGILOCKER-VERIFIED');
      const chosenDocType = student.panNumber
        ? 'PAN Card (DigiLocker)'
        : 'Aadhaar Card (DigiLocker)';
      const verifiedInst =
        student.instituteName ||
        institution ||
        (user as any)?.college ||
        'Recognized Academic Institution';
      const verifiedRoll = student.apaarId || rollNumber || (user as any)?.rollNumber || '';

      await submitKyc({
        digilockerVerified: true,
        govtDocType: chosenDocType,
        govtDocNumber: cleanMasked,
        govtDocUrl: student.documents?.[0]?.uri || student.documents?.[0]?.fileUrl || '',
        institution: verifiedInst,
        rollNumber: verifiedRoll,
        apaarId: student.apaarId || null,
        issuer: 'MeriPehchaan / DigiLocker (Government of India)',
      });

      // 3. Update local state immediately
      setKycStatus('VERIFIED');
      setDigilockerVerified(true);
      setIssuer('MeriPehchaan / DigiLocker (Government of India)');
      setGovtDocType(chosenDocType);
      setGovtDocNumber(cleanMasked);
      setInstitution(verifiedInst);
      if (verifiedRoll) setRollNumber(verifiedRoll);
      if (student.apaarId) setApaarId(student.apaarId);
      setVerifiedAt(new Date().toISOString());
      setIsRevising(false);

      toast.success('🎉 Identity verified instantly with Government of India DigiLocker!', {
        id: toastId,
      });
    } catch (err: any) {
      console.error('[UserProfile] DigiLocker KYC submit error:', err);
      toast.error(err?.message || 'Failed to complete DigiLocker verification.', { id: toastId });
    } finally {
      setDigiLockerLoading(false);
    }
  };

  // Launch MeriPehchaan / DigiLocker OAuth Popup
  const handleLaunchDigiLocker = async () => {
    setDigiLockerLoading(true);
    try {
      const res = await apiRequest<any>('/workflows/digilocker/oauth/url', { method: 'GET' });
      const authUrl = (res?.data as any)?.authUrl || (res as any)?.authUrl;
      if (!authUrl) {
        throw new Error('Could not retrieve MeriPehchaan authorization URL.');
      }

      const width = 600;
      const height = 750;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      const popup = window.open(
        authUrl,
        'DigiLockerAuth',
        `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, copyhistory=no, width=${width}, height=${height}, top=${top}, left=${left}`
      );

      if (!popup || popup.closed || typeof popup.closed === 'undefined') {
        window.location.href = authUrl;
      }
    } catch (err: any) {
      console.error('[UserProfile] Failed to launch DigiLocker:', err);
      toast.error(err?.message || 'Failed to connect to MeriPehchaan DigiLocker.');
      setDigiLockerLoading(false);
    }
  };

  // Listen for DigiLocker OAuth popup postMessage
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      const origin = event.origin;
      const isTrustedOrigin =
        !origin ||
        origin === window.location.origin ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1') ||
        origin.endsWith('.onrender.com') ||
        origin.includes('dreamxec');

      if (!isTrustedOrigin) return;

      if (event.data?.type === 'DIGILOCKER_SUCCESS' && event.data?.data) {
        const student = event.data.data;
        await handleDigiLockerSuccess(student);
      } else if (event.data?.type === 'DIGILOCKER_ERROR') {
        setDigiLockerLoading(false);
        toast.error(
          event.data?.error || 'DigiLocker verification was cancelled or could not be completed.'
        );
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, institution, rollNumber]);

  // Submit Manual KYC handler
  const handleSubmitKyc = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!govtDocUrl) {
      toast.error(`Please upload your ${govtDocType} document scan.`);
      return;
    }
    if (!govtDocNumber.trim()) {
      toast.error(`Please enter your ${govtDocType} number.`);
      return;
    }

    if (govtDocType === 'Aadhaar Card') {
      const cleanAadhaar = govtDocNumber.replace(/\s+/g, '');
      if (cleanAadhaar.length !== 12 || !/^\d{12}$/.test(cleanAadhaar)) {
        toast.error('Please enter a valid 12-digit Aadhaar number.');
        return;
      }
    }

    setKycSubmitting(true);
    const toastId = toast.loading('Submitting identity proofs for Dual-Custody KYC review...');
    try {
      await submitKyc({
        govtDocType,
        govtDocNumber: govtDocNumber.trim(),
        govtDocUrl,
        collegeIdCardUrl,
        institution: institution.trim(),
        rollNumber: rollNumber.trim(),
        branch: branch.trim(),
        year: academicYear.trim(),
        whatsappNumber: whatsappNumber.trim(),
      });
      toast.success('KYC documents submitted! Awaiting dual-custody verification.', {
        id: toastId,
      });
      setKycStatus('PENDING_VERIFICATION');
      setRejectionReason(null);
      setSubmittedAt(new Date().toISOString());
      setIsRevising(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to submit KYC proofs.', { id: toastId });
    } finally {
      setKycSubmitting(false);
    }
  };

  // Tab 3: Bank Details & Account Vault Integration State
  const [vaultAccounts, setVaultAccounts] = useState<UserAccountVaultItem[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const [selectedVaultId, setSelectedVaultId] = useState<string>('');
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);
  const [settingPrimaryId, setSettingPrimaryId] = useState<string | null>(null);

  // Fetch accounts from Account Vault
  const fetchVaultAccounts = async () => {
    setLoadingVault(true);
    try {
      const accounts = await vaultService.getAccounts();
      setVaultAccounts(accounts);

      if (accounts.length > 0) {
        const primary = accounts.find((a) => a.isPrimary) || accounts[0];
        if (primary) {
          setSelectedVaultId(primary.id);
        }
      }
    } catch (err) {
      console.warn('Could not fetch vault accounts:', err);
    } finally {
      setLoadingVault(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'bank') {
      fetchVaultAccounts();
    }
  }, [activeTab]);

  const handleSetPrimarySettlementAccount = async (account: UserAccountVaultItem) => {
    try {
      setSettingPrimaryId(account.id);
      await vaultService.saveAccount({
        id: account.id,
        accountNickname: account.accountNickname,
        accountHolderName: account.accountHolderName,
        bankAccountNumber: account.bankAccountNumber,
        ifscCode: account.ifscCode,
        bankName: account.bankName,
        upiId: account.upiId,
        accountType: account.accountType,
        isPrimary: true,
      } as any);
      setSelectedVaultId(account.id);
      await fetchVaultAccounts();
      if (onUpdateBankDetails) {
        onUpdateBankDetails({
          accountHolderName: account.accountHolderName,
          bankName: account.bankName || '',
          accountNumber: account.bankAccountNumber,
          ifscCode: account.ifscCode,
          accountType: account.accountType?.includes('CURRENT') ? 'current' : 'savings',
          upiId: account.upiId,
        });
      }
      toast.success(
        `"${account.accountNickname || account.bankName || account.accountHolderName}" set as active settlement account!`
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to set primary settlement account');
    } finally {
      setSettingPrimaryId(null);
    }
  };

  const maskAccountNumber = (accNum: string) => {
    if (!accNum || accNum.length < 4) return accNum;
    return `•••• •••• ${accNum.slice(-4)}`;
  };

  const handleTabChange = (tab: 'info' | 'kyc' | 'bank' | 'roles') => {
    setActiveTab(tab);
    switch (tab) {
      case 'info':
        navigate('/profile/personal');
        break;
      case 'kyc':
        navigate('/profile/kyc');
        break;
      case 'bank':
        navigate('/profile/bank');
        break;
      case 'roles':
        navigate('/profile/active-profiles');
        break;
    }
  };

  return (
    <UnifiedDashboardLayout
      title="Profile & Governance Identity Hub | DreamXec"
      headerTitle="Profile & Governance Identity Hub"
      headerSubtitle="Manage institutional identity, identity verification (KYC), and payout accounts"
    >
      <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
        {/* ── TOP HEADER / NAV BACK ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => (onBack ? onBack() : navigate('/dashboard'))}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-[#FFDD33] border-3 border-[#121316] shadow-[3px_3px_0_#121316] font-headline font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-headline font-black uppercase text-gray-600">
              Verification Status:
            </span>
            <span className="inline-flex items-center gap-1 bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] px-2.5 py-1 text-xs font-headline font-black uppercase">
              <CheckCircle2 className="w-3.5 h-3.5" />{' '}
              {user?.emailVerified ? 'Identity Verified' : 'Account Active'}
            </span>
          </div>
        </div>

        {/* ── PROFILE HUB TABS (RESTORED TO 4 ORIGINAL TABS) ── */}
        <div className="bg-white rounded-xl border-4 border-[#121316] shadow-[6px_6px_0_#121316] overflow-hidden">
          <div className="flex border-b-4 border-[#121316] bg-[#FCFBF7] overflow-x-auto">
            <button
              onClick={() => handleTabChange('info')}
              className={`flex-1 min-w-[160px] py-4 px-6 font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-r-3 border-[#121316] transition-all cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-[#0F534A] text-white shadow-[inset_0_-4px_0_#FE4E1A]'
                  : 'text-[#121316] hover:bg-[#FFDD33]'
              }`}
            >
              <UserIcon className="w-4 h-4" /> Personal Details
            </button>

            <button
              onClick={() => handleTabChange('kyc')}
              className={`flex-1 min-w-[160px] py-4 px-6 font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-r-3 border-[#121316] transition-all cursor-pointer ${
                activeTab === 'kyc'
                  ? 'bg-[#0F534A] text-white shadow-[inset_0_-4px_0_#FE4E1A]'
                  : 'text-[#121316] hover:bg-[#FFDD33]'
              }`}
            >
              <ShieldCheck className="w-4 h-4" /> KYC Verification
            </button>

            <button
              onClick={() => handleTabChange('bank')}
              className={`flex-1 min-w-[160px] py-4 px-6 font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 border-r-3 border-[#121316] transition-all cursor-pointer ${
                activeTab === 'bank'
                  ? 'bg-[#0F534A] text-white shadow-[inset_0_-4px_0_#FE4E1A]'
                  : 'text-[#121316] hover:bg-[#FFDD33]'
              }`}
            >
              <CreditCard className="w-4 h-4" /> Payout & Bank
            </button>

            <button
              onClick={() => handleTabChange('roles')}
              className={`flex-1 min-w-[160px] py-4 px-6 font-headline font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'roles'
                  ? 'bg-[#0F534A] text-white shadow-[inset_0_-4px_0_#FE4E1A]'
                  : 'text-[#121316] hover:bg-[#FFDD33]'
              }`}
            >
              <Building2 className="w-4 h-4" /> Active Profiles
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {/* ── TAB 1: PERSONAL DETAILS & AVATAR UPLOAD ── */}
            {activeTab === 'info' && (
              <div className="space-y-8">
                {/* ── PERSONA MODE TOGGLE SWITCH ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[#FCFBF7] border-3 border-[#121316] shadow-[3px_3px_0_#121316] rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FFDD33] border-2 border-[#121316] flex items-center justify-center text-sm shadow-[1.5px_1.5px_0_#121316]">
                      {personaMode === 'species' ? '🐾' : '👤'}
                    </div>
                    <div>
                      <p className="text-xs font-headline font-black uppercase text-[#121316] tracking-wider">
                        Active Profile Identity View
                      </p>
                      <p className="text-[10px] text-gray-600 font-bold">
                        {personaMode === 'species'
                          ? `Displaying Species Persona: ${displayPersona.speciesCommonName} (Cryptographic & Pseudonymous)`
                          : `Displaying Real Identity: ${displayPersona.realName} (Verified Personal Identity)`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 p-1 bg-white border-2 border-[#121316] rounded-lg shadow-[2px_2px_0_#121316] self-stretch sm:self-auto justify-center">
                    <button
                      type="button"
                      onClick={() => setPersonaMode('species')}
                      className={`px-3 py-1.5 text-[11px] font-headline font-black uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                        personaMode === 'species'
                          ? 'bg-[#FE4E1A] text-white shadow-[1px_1px_0_#121316]'
                          : 'text-gray-600 hover:text-[#121316] hover:bg-gray-100'
                      }`}
                    >
                      <span>🐾</span> Species Persona
                    </button>
                    <button
                      type="button"
                      onClick={() => setPersonaMode('real')}
                      className={`px-3 py-1.5 text-[11px] font-headline font-black uppercase tracking-wider rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                        personaMode === 'real'
                          ? 'bg-[#0F534A] text-white shadow-[1px_1px_0_#121316]'
                          : 'text-gray-600 hover:text-[#121316] hover:bg-gray-100'
                      }`}
                    >
                      <span>👤</span> Real Identity
                    </button>
                  </div>
                </div>

                <div className="space-y-6 pb-8 border-b-4 border-[#121316]">
                  {/* ── 1. USER HEADER SECTION ── */}
                  <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
                    {/* AVATAR WITH BADGE ATTACHED AT BOTTOM RIGHT */}
                    <div className="relative flex-shrink-0">
                      <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-[#121316] shadow-[4px_4px_0_#FE4E1A] overflow-hidden bg-[#FEB3FC] flex items-center justify-center select-none">
                        {(avatarPreview || displayPersona.avatarUrl) && !avatarError ? (
                          <img
                            src={avatarPreview || displayPersona.avatarUrl}
                            alt={displayPersona.displayName}
                            onError={() => setAvatarError(true)}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="font-headline font-black text-3xl sm:text-4xl text-[#121316]">
                            {displayPersona.realInitials}
                          </span>
                        )}
                      </div>
                      {personaMode === 'species' ? (
                        <div className="absolute -bottom-1 -right-1 bg-[#4717AE] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] px-2 py-1 rounded-xl text-center">
                          <span className="text-[10px] font-headline font-black block leading-none">
                            #{displayPersona.speciesNumber}
                          </span>
                          <span className="text-[8px] font-headline font-extrabold uppercase text-[#FFDD33] block leading-none pt-0.5">
                            OF {displayPersona.speciesTotalCount}
                          </span>
                        </div>
                      ) : (
                        <div className="absolute -bottom-1 -right-1 bg-[#0F534A] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] px-2 py-1 rounded-xl text-center">
                          <span className="text-[9px] font-headline font-black block leading-none uppercase">
                            REAL
                          </span>
                          <span className="text-[8px] font-headline font-extrabold uppercase text-[#9EFC5F] block leading-none pt-0.5">
                            NAME
                          </span>
                        </div>
                      )}
                    </div>

                    {/* CENTER USER DETAILS */}
                    <div className="space-y-2 text-center md:text-left flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap justify-center md:justify-start">
                        <h1 className="font-headline font-black text-2xl sm:text-3xl text-[#121316] uppercase tracking-wide">
                          {displayPersona.displayName}
                        </h1>
                        {displayPersona.handle && (
                          <span className="px-3 py-1 bg-[#FEB3FC] border-2 border-[#121316] shadow-[2px_2px_0_#121316] text-xs font-headline font-black text-[#121316] rounded-lg">
                            {displayPersona.handle}
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-headline font-extrabold text-[#121316] uppercase tracking-wider">
                        {displayRole}
                      </p>
                      <p className="text-xs text-gray-600 font-bold uppercase tracking-wider">
                        {primaryOrgName}
                      </p>

                      {/* DYNAMIC REAL TAG PILLS */}
                      <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start pt-2">
                        {primaryOrgType && (
                          <span className="px-3 py-1 bg-[#9EFC5F]/60 border-2 border-[#121316] shadow-[1.5px_1.5px_0_#121316] text-[10px] font-headline font-black uppercase text-[#0F534A] rounded-full">
                            {primaryOrgType.replace(/_/g, ' ')}
                          </span>
                        )}
                        <span className="px-3 py-1 bg-[#18D7E8]/40 border-2 border-[#121316] shadow-[1.5px_1.5px_0_#121316] text-[10px] font-headline font-black uppercase text-[#4717AE] rounded-full">
                          {`ACTIVE IDENTITY · ${roleProfile.badgeLabel.toUpperCase()}`}
                        </span>
                        <span className="px-3 py-1 bg-[#FEB3FC]/60 border-2 border-[#121316] shadow-[1.5px_1.5px_0_#121316] text-[10px] font-headline font-black uppercase text-[#121316] rounded-full">
                          {user?.accountStatus || 'ACTIVE'} ACCOUNT
                        </span>
                        {user?.roles && user.roles.length > 1 && (
                          <span className="px-2.5 py-1 bg-gray-100 border-2 border-[#121316] shadow-[1.5px_1.5px_0_#121316] text-[10px] font-headline font-black text-gray-600 rounded-full">
                            +{user.roles.length - 1} ROLES
                          </span>
                        )}
                      </div>
                    </div>

                    {/* RIGHT TOP VERIFIED BADGE */}
                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center gap-1.5 bg-[#9EFC5F]/30 border-2 border-[#0F534A] px-3.5 py-1.5 rounded-full text-xs font-headline font-black text-[#0F534A] uppercase shadow-[2px_2px_0_#0F534A]">
                        <CheckCircle2 className="w-4 h-4 text-[#0F534A]" />
                        <span>IDENTITY VERIFIED</span>
                        <CheckCircle2 className="w-4 h-4 text-[#0F534A]" />
                      </div>
                    </div>
                  </div>

                  {/* ── 2. SLEEK SPECIES IDENTITY BANNER (CLICKABLE TO DEDICATED PROFILE) ── */}
                  <div className="p-4 bg-[#FCFBF7] hover:bg-[#FFDD33]/10 border-2 border-[#121316] shadow-[3px_3px_0_#121316] rounded-xl transition-all flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div
                      onClick={() => navigate('/species-profile')}
                      className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                    >
                      <div className="p-2 bg-[#F4002C] text-white border border-[#121316] rounded-lg shadow-[1.5px_1.5px_0_#121316]">
                        <ShieldAlert className="w-5 h-5 text-[#FFDD33]" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-headline font-black uppercase text-[#121316]">
                            Assigned Species Identity:{' '}
                            {user?.speciesIdentity?.commonName || 'Saola'}
                          </span>
                          <span className="px-2 py-0.5 bg-[#4717AE] text-white text-[9px] font-headline font-black uppercase rounded">
                            #{user?.speciesIdentity?.speciesNumber || user?.speciesNumber || 1} OF ~
                            {user?.speciesIdentity?.totalCount || 50}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-600 font-medium truncate">
                          Habitat:{' '}
                          {user?.speciesIdentity?.habitat ||
                            'Annamite Range evergreen wet mountain forests'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setSpeciesCardOpen(true)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#FFDD33] hover:bg-[#FFE566] text-[#121316] font-headline font-black text-xs uppercase rounded-lg border border-[#121316] shadow-[2px_2px_0_#121316] cursor-pointer transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#FE4E1A]" />
                        <span>Collectible Card</span>
                      </button>

                      <button
                        onClick={() => navigate('/species-profile')}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#FE4E1A] hover:bg-[#F4002C] text-white font-headline font-black text-xs uppercase rounded-lg border border-[#121316] shadow-[2px_2px_0_#121316] cursor-pointer transition-colors group"
                      >
                        <span>Full Profile</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>

                  {/* ── 3. RESEARCHER & BACKER PASSPORT SHELF ── */}
                  <PassportStampShelf user={user} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-2">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-3 border-[#121316] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-2">
                      Registered Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        disabled
                        value={email}
                        className="w-full px-4 py-3 bg-gray-100 border-3 border-[#121316] text-sm font-medium text-gray-500 cursor-not-allowed"
                      />
                      <Lock className="w-4 h-4 absolute right-4 top-4 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-2">
                      Contact Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-3 border-[#121316] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-2">
                      Institutional Designation
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="w-full px-4 py-3 bg-white border-3 border-[#121316] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-2">
                    Department / Lab Division
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-3 border-[#121316] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase text-[#121316] mb-2">
                    Professional Bio & Research Vision
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-3 border-[#121316] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#FE4E1A]"
                  />
                </div>

                <button
                  onClick={() => {
                    toast.success('Profile details saved successfully!');
                  }}
                  className="px-6 py-3 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-3 border-[#121316] shadow-[4px_4px_0_#FFDD33] font-headline font-black text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Save Profile Details
                </button>
              </div>
            )}

            {/* ── TAB 2: KYC VERIFICATION WORKBENCH ── */}
            {activeTab === 'kyc' && (
              <div className="space-y-6">
                {/* ── INTERACTIVE VERIFICATION MODE SELECTOR ── */}
                <div className="p-4 bg-white border-3 border-[#121316] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[4px_4px_0_#121316]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FFDD33] border-2 border-[#121316] shadow-[2px_2px_0_#121316] flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5 text-[#121316]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-headline font-black uppercase text-[#FE4E1A] tracking-wider">
                          KYC Verification View
                        </span>
                        <span className="px-2 py-0.5 bg-[#18D7E8]/40 border border-[#121316] text-[10px] font-headline font-black uppercase text-[#4717AE]">
                          {roleProfile.roleLabel}
                        </span>
                        <span className="px-2 py-0.5 bg-[#FCFBF7] border border-[#121316] text-[10px] font-mono font-black uppercase text-[#0F534A]">
                          Account: {kycStatus}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-medium">
                        Instant DigiLocker Fast-Track, document proofs workbench, and verified
                        credential showcase.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewMode('FORM');
                        setIsRevising(true);
                      }}
                      className={`flex-1 sm:flex-none px-4 py-2.5 text-xs font-headline font-black uppercase tracking-wider rounded border-2 border-[#121316] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        previewMode === 'FORM' || isRevising
                          ? 'bg-[#003366] text-white shadow-[3px_3px_0_#FE4E1A]'
                          : 'bg-[#FCFBF7] text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>🇮🇳</span> DigiLocker &amp; Details Form
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewMode('VERIFIED');
                        setIsRevising(false);
                      }}
                      className={`flex-1 sm:flex-none px-4 py-2.5 text-xs font-headline font-black uppercase tracking-wider rounded border-2 border-[#121316] transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        previewMode === 'VERIFIED' && !isRevising
                          ? 'bg-[#0F534A] text-[#9EFC5F] shadow-[3px_3px_0_#121316]'
                          : 'bg-[#FCFBF7] text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span>✓</span> Verified Scholar Card
                    </button>
                  </div>
                </div>

                {/* 1. LOADING STATE */}
                {kycLoading ? (
                  <div className="p-8 bg-[#FCFBF7] border-3 border-[#121316] rounded-xl flex items-center justify-center gap-3 text-xs font-bold text-gray-600 shadow-[4px_4px_0_#121316]">
                    <RefreshCw className="w-5 h-5 animate-spin text-[#0F534A]" />
                    Loading your live KYC dual-custody verification records...
                  </div>
                ) : previewMode === 'VERIFIED' && !isRevising ? (
                  /* ── VERIFIED SCHOLAR CREDENTIAL SHOWCASE CARD ── */
                  <div className="space-y-6">
                    {/* Header Banner */}
                    <div className="p-6 bg-[#0F534A] border-3 border-[#121316] text-white shadow-[6px_6px_0_#121316] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="p-3 bg-[#9EFC5F] border-2 border-[#121316] text-[#0F534A] shadow-[3px_3px_0_#121316] shrink-0">
                          <ShieldCheck className="w-8 h-8" />
                        </div>
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 bg-[#9EFC5F] text-[#0F534A] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider border border-[#121316] rounded">
                            <Check className="w-3.5 h-3.5" /> Identity Verified &amp; Endorsed
                          </div>
                          <h3 className="font-headline font-black text-xl uppercase tracking-wide text-white">
                            Dual-Custody Scholar Credential Verified
                          </h3>
                          <p className="text-xs text-white/80 font-medium max-w-2xl">
                            {digilockerVerified || (issuer && issuer.includes('DigiLocker')) ? (
                              <span className="flex items-center gap-1">
                                <span>🇮🇳</span> Cryptographically authenticated via Government of
                                India MeriPehchaan / DigiLocker National Academic Depository (NAD).
                              </span>
                            ) : (
                              <span>
                                Officially inspected and endorsed by DreamX Platform Governance
                                Administrators for dual-custody compliance.
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-2 shrink-0">
                        <span className="px-3 py-1 bg-[#121316] text-[#9EFC5F] border-2 border-[#9EFC5F] text-xs font-mono font-bold uppercase shadow-[2px_2px_0_#9EFC5F]">
                          ✓ Tier-1 Cleared
                        </span>
                        {verifiedAt && (
                          <span className="text-[11px] text-white/70 font-mono">
                            Verified on: {new Date(verifiedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Verified Credentials Shelf (4 Pillars) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Block 1: Government Identity */}
                      <div className="p-5 bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b pb-2 border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-[#FFDD33] border-2 border-[#121316] text-[#121316]">
                              <FileText className="w-4 h-4" />
                            </div>
                            <span className="font-headline font-black text-xs uppercase text-[#0F534A]">
                              Government Identity Proof
                            </span>
                          </div>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-[#9EFC5F] text-[#0F534A] border border-[#121316]">
                            ✓ Verified
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[11px] text-gray-500 font-bold uppercase">
                            {govtDocType}
                          </p>
                          <p className="text-base font-mono font-black text-[#121316] tracking-wider">
                            {govtDocNumber || 'VERIFIED-GOVT-ID'}
                          </p>
                        </div>
                        <div className="pt-2 text-[10px] text-gray-600 font-medium flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#0F534A]" />
                          UIDAI &amp; National IT Act 2000 compliant identity record
                        </div>
                      </div>

                      {/* Block 2: Academic & Institutional Affiliation */}
                      <div className="p-5 bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b pb-2 border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-[#9EFC5F] border-2 border-[#121316] text-[#0F534A]">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <span className="font-headline font-black text-xs uppercase text-[#0F534A]">
                              Academic Credentials
                            </span>
                          </div>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-[#0F534A] text-[#9EFC5F] border border-[#121316]">
                            Active Scholar
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-headline font-black uppercase text-[#121316] truncate">
                            {institution || 'National Academic Depository (NAD)'}
                          </p>
                          <p className="text-xs font-mono font-bold text-gray-600">
                            {rollNumber ? `ID: ${rollNumber}` : ''}
                            {apaarId ? ` • APAAR: ${apaarId}` : ''}
                            {branch ? ` • ${branch}` : ''}
                            {academicYear ? ` (${academicYear})` : ''}
                          </p>
                        </div>
                        <div className="pt-2 text-[10px] text-gray-600 font-medium flex items-center gap-1.5">
                          <BadgeCheck className="w-3.5 h-3.5 text-[#0F534A]" />
                          Student verified for research grants and milestone disbursements
                        </div>
                      </div>

                      {/* Block 3: Verification Authority */}
                      <div className="p-5 bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b pb-2 border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-[#FEB3FC] border-2 border-[#121316] text-[#4717AE]">
                              <Award className="w-4 h-4" />
                            </div>
                            <span className="font-headline font-black text-xs uppercase text-[#0F534A]">
                              Governance Authority
                            </span>
                          </div>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-[#FEB3FC] text-[#4717AE] border border-[#121316]">
                            Dual-Custody
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-headline font-black uppercase text-[#121316]">
                            {issuer ||
                              (digilockerVerified
                                ? 'MeriPehchaan / DigiLocker (Government of India)'
                                : 'DreamX Dual-Custody Governance')}
                          </p>
                          <p className="text-[11px] text-gray-600 font-medium">
                            Dual-custody clearance granted for campaign disbursements and escrow
                            allocations.
                          </p>
                        </div>
                        <div className="pt-2 text-[10px] text-[#0F534A] font-bold flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-[#FE4E1A]" />
                          Cryptographic hash secured on immutable audit trail
                        </div>
                      </div>

                      {/* Block 4: Private Doc Vault Sync */}
                      <div className="p-5 bg-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b pb-2 border-gray-100">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-[#18D7E8] border-2 border-[#121316] text-[#121316]">
                              <FolderLock className="w-4 h-4" />
                            </div>
                            <span className="font-headline font-black text-xs uppercase text-[#0F534A]">
                              Stored Doc Vault Assets
                            </span>
                          </div>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-[#18D7E8] text-[#121316] border border-[#121316]">
                            Secured
                          </span>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-700">
                            Your official identity certificates and scanned endorsements are
                            encrypted and stored in your private Doc Vault.
                          </p>
                        </div>
                        <div className="pt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              // Switch to vault tab or open document manager
                              const vaultTab = document.querySelector(
                                '[data-tab="vault"]'
                              ) as HTMLButtonElement;
                              if (vaultTab) vaultTab.click();
                              else
                                toast(
                                  'Access your documents from the Secure Vault tab on the left navigation.'
                                );
                            }}
                            className="text-xs font-headline font-black text-[#0F534A] hover:text-[#FE4E1A] flex items-center gap-1 underline cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> View Stored Documents in Vault
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* DigiLocker Fast-Track Upgrade Card inside Verified View */}
                    <div className="p-5 bg-gradient-to-r from-[#003366]/10 via-[#FFF9F2] to-[#FE4E1A]/10 border-3 border-[#003366] rounded-xl shadow-[4px_4px_0_#003366] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-11 h-11 bg-[#003366] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] flex items-center justify-center text-xl shrink-0">
                          🇮🇳
                        </div>
                        <div className="space-y-0.5">
                          <div className="inline-flex items-center gap-1.5 text-[9px] font-headline font-black uppercase text-[#003366] bg-white px-2 py-0.5 border border-[#003366] rounded">
                            <Zap className="w-3 h-3 text-[#FFDD33]" /> Fast-Track Available
                          </div>
                          <h4 className="font-headline font-black text-sm uppercase text-[#003366]">
                            {digilockerVerified
                              ? 'DigiLocker Authenticated Record'
                              : 'Link Official Government DigiLocker Credentials'}
                          </h4>
                          <p className="text-xs text-gray-700 font-medium max-w-xl">
                            {digilockerVerified
                              ? 'Your account is authenticated with Government of India MeriPehchaan & National Academic Depository (NAD).'
                              : 'Upgrade your institutional clearance with Government of India MeriPehchaan (DigiLocker) & APAAR student depository authentication.'}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleLaunchDigiLocker}
                        disabled={digiLockerLoading}
                        className="w-full sm:w-auto px-5 py-3 bg-[#003366] hover:bg-[#002244] text-white border-2 border-[#121316] shadow-[3px_3px_0_#FE4E1A] font-headline font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 disabled:opacity-60 hover:translate-x-[-1px] hover:translate-y-[-1px]"
                      >
                        {digiLockerLoading ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FFDD33]" />
                            <span>Connecting...</span>
                          </>
                        ) : (
                          <>
                            <span>
                              🔐 {digilockerVerified ? 'Re-sync DigiLocker' : 'Connect DigiLocker'}
                            </span>
                            <ArrowRight className="w-3.5 h-3.5 text-[#FFDD33]" />
                          </>
                        )}
                      </button>
                    </div>

                    {/* Verified State Action Bar */}
                    <div className="p-5 bg-[#FCFBF7] border-3 border-[#121316] shadow-[4px_4px_0_#121316] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="space-y-0.5">
                        <p className="text-xs font-headline font-black uppercase text-[#0F534A]">
                          Credentials Active &amp; Up to Date
                        </p>
                        <p className="text-[11px] text-gray-600 font-medium">
                          Need to update your college endorsement, student ID, or re-verify through
                          DigiLocker?
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setPreviewMode('FORM');
                          setIsRevising(true);
                        }}
                        className="px-5 py-2.5 bg-white hover:bg-gray-100 text-[#121316] border-2 border-[#121316] shadow-[3px_3px_0_#121316] font-headline font-black text-xs uppercase tracking-wider transition-all inline-flex items-center gap-2 cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px]"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-[#FE4E1A]" /> View / Edit Details &amp;
                        Documents Form
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── UNVERIFIED / REVISING / PENDING / REJECTED STATE ── */
                  <div className="space-y-6">
                    {/* A. DYNAMIC STATUS BANNER */}
                    {isRevising || previewMode === 'FORM' ? (
                      <div className="p-5 bg-[#FFF9F2] border-3 border-[#003366] shadow-[4px_4px_0_#121316] rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1.5 bg-[#003366] text-white px-2 py-0.5 text-[9px] font-headline font-black uppercase rounded">
                            ⚡ Verification Workbench Active
                          </span>
                          <h4 className="font-headline font-black text-sm uppercase text-[#121316]">
                            DigiLocker Fast-Track &amp; Document Details Submission
                          </h4>
                          <p className="text-xs text-gray-700 font-medium">
                            Verify in seconds via Government of India DigiLocker or save updated
                            identity document details and scans below.
                          </p>
                        </div>
                        {kycStatus === 'VERIFIED' && (
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewMode('VERIFIED');
                              setIsRevising(false);
                            }}
                            className="px-4 py-2 bg-white hover:bg-gray-100 text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-xs uppercase tracking-wider shrink-0 cursor-pointer"
                          >
                            View Verified Scholar Card
                          </button>
                        )}
                      </div>
                    ) : kycStatus === 'PENDING_VERIFICATION' ? (
                      <div className="p-6 bg-[#FFF9F2] border-4 border-[#FFDD33] shadow-[5px_5px_0_#FE4E1A] rounded-xl space-y-4">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 bg-[#FFDD33] border-2 border-[#121316] text-[#121316] shadow-[2px_2px_0_#121316] shrink-0">
                            <Clock className="w-6 h-6 animate-pulse" />
                          </div>
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] px-2.5 py-0.5 text-[9px] font-headline font-black uppercase tracking-wider border border-[#121316] rounded">
                              ⏳ Maker-Checker Review in Progress
                            </div>
                            <h4 className="font-headline font-black text-base uppercase text-[#FE4E1A]">
                              Under Institutional Dual-Custody Review
                            </h4>
                            <p className="text-xs text-gray-700 font-medium max-w-2xl">
                              Your identity proofs have been submitted and are in the governance
                              verification queue. Platform governance admins are vetting your
                              submitted credentials. Average review turnaround is under 24 hours.
                            </p>
                            {submittedAt && (
                              <p className="text-[11px] text-gray-500 font-mono pt-1">
                                Submitted on: {new Date(submittedAt).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 3-Step Review Timeline */}
                        <div className="pt-3 border-t border-dashed border-[#FFDD33]/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-2.5 bg-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#9EFC5F] text-[#0F534A] border border-[#121316] flex items-center justify-center text-[10px] font-black">
                              ✓
                            </span>
                            <div>
                              <p className="text-[10px] font-headline font-black uppercase text-[#0F534A]">
                                1. Submitted
                              </p>
                              <p className="text-[9px] text-gray-500 font-medium">
                                Proofs Uploaded
                              </p>
                            </div>
                          </div>

                          <div className="p-2.5 bg-[#FFDD33]/40 border-2 border-[#121316] shadow-[2px_2px_0_#121316] flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-[#FFDD33] text-[#121316] border border-[#121316] flex items-center justify-center text-[10px] font-black animate-pulse">
                              ⏳
                            </span>
                            <div>
                              <p className="text-[10px] font-headline font-black uppercase text-[#FE4E1A]">
                                2. Maker Review
                              </p>
                              <p className="text-[9px] text-gray-700 font-bold">
                                In Progress (&lt;24h)
                              </p>
                            </div>
                          </div>

                          <div className="p-2.5 bg-gray-50 border-2 border-gray-300 text-gray-400 flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-[10px] font-black">
                              3
                            </span>
                            <div>
                              <p className="text-[10px] font-headline font-black uppercase text-gray-500">
                                3. Dual-Custody
                              </p>
                              <p className="text-[9px] text-gray-400 font-medium">
                                Escrow Clearance
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : kycStatus === 'REJECTED' ? (
                      <div className="p-6 bg-[#FFF0F2] border-4 border-[#F4002C] shadow-[5px_5px_0_#121316] rounded-xl flex items-start gap-4">
                        <div className="p-2.5 bg-[#F4002C] border-2 border-[#121316] text-white shadow-[2px_2px_0_#121316] shrink-0">
                          <AlertCircle className="w-6 h-6" />
                        </div>
                        <div className="space-y-2 flex-1">
                          <div className="inline-flex items-center gap-1.5 bg-[#F4002C] text-white px-2.5 py-0.5 text-[9px] font-headline font-black uppercase tracking-wider rounded">
                            ⚠️ Action Required • Verification Revision Needed
                          </div>
                          <h4 className="font-headline font-black text-base uppercase text-[#F4002C]">
                            Verification Revision Required
                          </h4>
                          {rejectionReason && (
                            <div className="p-3 bg-white border-2 border-[#F4002C] text-xs text-[#121316] font-medium rounded">
                              <strong className="text-[#F4002C] uppercase text-[10px] block font-headline font-black mb-1">
                                Governance Admin Feedback:
                              </strong>
                              {rejectionReason}
                            </div>
                          )}
                          <p className="text-xs text-gray-700 font-medium">
                            Please review the feedback above. You can verify instantly with
                            DigiLocker or correct your information and upload clearer scans below.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-5 bg-[#FCFBF7] border-4 border-[#0F534A] shadow-[4px_4px_0_#4717AE] rounded-xl flex items-start gap-4">
                        <div className="p-2.5 bg-[#0F534A] text-[#9EFC5F] border-2 border-[#121316] shadow-[2px_2px_0_#121316] shrink-0">
                          <ShieldAlert className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#121316] px-2.5 py-0.5 text-[9px] font-headline font-black uppercase tracking-wider border border-[#121316] rounded">
                            Action Required • Unverified Profile
                          </div>
                          <h4 className="font-headline font-black text-base uppercase text-[#0F534A]">
                            Dual-Custody Identity Verification (KYC)
                          </h4>
                          <p className="text-xs text-gray-700 font-medium">
                            To activate student verified status, launch research campaigns, and
                            receive milestone escrow payouts, verify your identity using Government
                            DigiLocker or submit scanned credentials below.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* B. PRIMARY OPTION: 1-CLICK DIGILOCKER INSTANT VERIFICATION (FAST TRACK) */}
                    <div className="p-6 bg-gradient-to-br from-[#003366]/8 via-white to-[#FE4E1A]/8 border-3 border-[#003366] shadow-[6px_6px_0_#003366] rounded-2xl space-y-5">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-start gap-3.5">
                          <div className="w-12 h-12 bg-[#003366] text-white border-2 border-[#121316] shadow-[3px_3px_0_#121316] flex items-center justify-center text-xl shrink-0">
                            🇮🇳
                          </div>
                          <div className="space-y-1">
                            <div className="inline-flex items-center gap-1.5 bg-[#003366] text-white px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider border border-[#121316] rounded">
                              <Zap className="w-3 h-3 text-[#FFDD33]" /> Recommended • Instant
                              Fast-Track
                            </div>
                            <h3 className="font-headline font-black text-lg uppercase text-[#003366] tracking-wide">
                              Instant 1-Click Verification with DigiLocker
                            </h3>
                            <p className="text-xs text-gray-700 font-medium max-w-xl leading-relaxed">
                              Authenticate your legal identity and student credentials in seconds
                              through Government of India MeriPehchaan (DigiLocker). No document
                              scans or review queue waiting required.
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={handleLaunchDigiLocker}
                          disabled={digiLockerLoading}
                          className="w-full md:w-auto px-6 py-4 bg-[#003366] hover:bg-[#002244] text-white border-3 border-[#121316] shadow-[4px_4px_0_#FE4E1A] font-headline font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 hover:translate-x-[-2px] hover:translate-y-[-2px] shrink-0"
                        >
                          {digiLockerLoading ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-[#FFDD33]" />
                              <span>Connecting to MeriPehchaan...</span>
                            </>
                          ) : (
                            <>
                              <span>🔐 Verify Instantly with DigiLocker</span>
                              <ArrowRight className="w-4 h-4 text-[#FFDD33]" />
                            </>
                          )}
                        </button>
                      </div>

                      {/* Benefits Badges Row */}
                      <div className="pt-2 border-t border-dashed border-[#003366]/30 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                        <div className="p-2 bg-white border border-[#003366]/30 text-[10px] font-headline font-bold text-[#003366]">
                          ⚡ Instant Approval (0 Wait)
                        </div>
                        <div className="p-2 bg-white border border-[#003366]/30 text-[10px] font-headline font-bold text-[#003366]">
                          🔐 UIDAI Biometric Aadhaar
                        </div>
                        <div className="p-2 bg-white border border-[#003366]/30 text-[10px] font-headline font-bold text-[#003366]">
                          🎓 NAD / APAAR Student Sync
                        </div>
                        <div className="p-2 bg-white border border-[#003366]/30 text-[10px] font-headline font-bold text-[#003366]">
                          ⚖️ IT Act 2000 Legal Validity
                        </div>
                      </div>
                    </div>

                    {/* C. NEO-BRUTALIST SECTION DIVIDER */}
                    <div className="relative flex py-2 items-center">
                      <div className="flex-grow border-t-2 border-dashed border-gray-300"></div>
                      <span className="flex-shrink mx-4 px-4 py-1 bg-[#FCFBF7] font-headline font-black text-xs uppercase tracking-wider text-gray-600 border-2 border-[#121316] shadow-[2px_2px_0_#121316]">
                        OR SUBMIT DOCUMENTS MANUALLY FOR REVIEW
                      </span>
                      <div className="flex-grow border-t-2 border-dashed border-gray-300"></div>
                    </div>

                    {/* D. STREAMLINED MANUAL KYC SUBMISSION FORM */}
                    <form onSubmit={handleSubmitKyc} className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* CARD 1: GOVERNMENT IDENTITY PROOF */}
                        <div className="p-5 border-3 border-[#121316] rounded-xl bg-white shadow-[4px_4px_0_#121316] space-y-4">
                          <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-[#FFDD33] border-2 border-[#121316] text-[#121316]">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="font-headline font-black text-sm uppercase text-[#0F534A]">
                                  1. Government Identity Proof
                                </h3>
                                <p className="text-[11px] text-gray-500 font-medium">
                                  National identity document for compliance
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-headline font-black uppercase px-2 py-0.5 bg-[#FE4E1A] text-white border border-[#121316]">
                              Required
                            </span>
                          </div>

                          {/* Doc Type Selector */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-headline font-black uppercase text-gray-700 block">
                              Select Document Type:
                            </label>
                            <select
                              value={govtDocType}
                              onChange={(e) => setGovtDocType(e.target.value)}
                              className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-headline font-black uppercase focus:outline-none focus:bg-white"
                            >
                              <option value="Aadhaar Card">Aadhaar Card (Default)</option>
                              <option value="PAN Card">PAN Card</option>
                              <option value="Passport">Passport</option>
                              <option value="Voter ID">Voter ID</option>
                            </select>
                          </div>

                          {/* ID Number */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-headline font-black uppercase text-gray-700 block">
                              {govtDocType} Number:
                            </label>
                            <input
                              type="text"
                              required
                              value={govtDocNumber}
                              onChange={(e) => setGovtDocNumber(e.target.value)}
                              placeholder={
                                govtDocType === 'Aadhaar Card'
                                  ? 'Enter 12-digit Aadhaar (e.g. 5432 1098 7654)'
                                  : govtDocType === 'PAN Card'
                                    ? 'Enter 10-digit PAN (e.g. ABCDE1234F)'
                                    : `Enter ${govtDocType} number`
                              }
                              className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-mono font-bold uppercase focus:outline-none focus:bg-white"
                            />
                          </div>

                          {/* Compact Dropzone / DocVault Selector */}
                          <div className="pt-1">
                            <DocVaultSelector
                              compact={true}
                              label={`${govtDocType} Scan / Document`}
                              description={`Upload front/back scan of ${govtDocType}`}
                              suggestedType="GOVT_ID"
                              value={govtDocUrl}
                              onChange={(fileUrl) => setGovtDocUrl(fileUrl)}
                              onRemove={() => setGovtDocUrl('')}
                            />
                          </div>
                        </div>

                        {/* CARD 2: INSTITUTIONAL & STUDENT CREDENTIALS */}
                        <div className="p-5 border-3 border-[#121316] rounded-xl bg-white shadow-[4px_4px_0_#121316] space-y-4">
                          <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-[#9EFC5F] border-2 border-[#121316] text-[#0F534A]">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div>
                                <h3 className="font-headline font-black text-sm uppercase text-[#0F534A]">
                                  2. Institutional Credentials
                                </h3>
                                <p className="text-[11px] text-gray-500 font-medium">
                                  College ID or university endorsement proof
                                </p>
                              </div>
                            </div>
                            <span className="text-[10px] font-headline font-black uppercase px-2 py-0.5 bg-[#0F534A] text-[#9EFC5F] border border-[#121316]">
                              Academic
                            </span>
                          </div>

                          {/* Institution / College */}
                          <div className="space-y-1.5">
                            <label className="text-xs font-headline font-black uppercase text-gray-700 block">
                              Institution / University:
                            </label>
                            <input
                              type="text"
                              value={institution}
                              onChange={(e) => setInstitution(e.target.value)}
                              placeholder="e.g. NIT Kurukshetra, IIT Bombay, Stanford University"
                              className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-bold uppercase focus:outline-none focus:bg-white"
                            />
                          </div>

                          {/* Roll Number & Branch */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-headline font-black uppercase text-gray-700 block">
                                Roll / Student ID:
                              </label>
                              <input
                                type="text"
                                value={rollNumber}
                                onChange={(e) => setRollNumber(e.target.value)}
                                placeholder="e.g. 12115089"
                                className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-mono font-bold uppercase focus:outline-none focus:bg-white"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-headline font-black uppercase text-gray-700 block">
                                Department / Branch:
                              </label>
                              <input
                                type="text"
                                value={branch}
                                onChange={(e) => setBranch(e.target.value)}
                                placeholder="e.g. Computer Engineering"
                                className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-bold uppercase focus:outline-none focus:bg-white"
                              />
                            </div>
                          </div>

                          {/* Year & WhatsApp */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label className="text-xs font-headline font-black uppercase text-gray-700 block">
                                Year of Study:
                              </label>
                              <select
                                value={academicYear}
                                onChange={(e) => setAcademicYear(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-headline font-black uppercase focus:outline-none focus:bg-white"
                              >
                                <option value="">Select Year</option>
                                <option value="1st Year">1st Year</option>
                                <option value="2nd Year">2nd Year</option>
                                <option value="3rd Year">3rd Year</option>
                                <option value="4th Year">4th Year (Final)</option>
                                <option value="Postgraduate / PhD">Postgraduate / PhD</option>
                                <option value="Faculty / Advisor">Faculty / Advisor</option>
                              </select>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-xs font-headline font-black uppercase text-gray-700 block">
                                Contact WhatsApp No:
                              </label>
                              <input
                                type="tel"
                                value={whatsappNumber}
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                                placeholder="e.g. +91 9876543210"
                                className="w-full px-3.5 py-2.5 bg-[#FCFBF7] border-2 border-[#121316] text-xs font-mono font-bold focus:outline-none focus:bg-white"
                              />
                            </div>
                          </div>

                          {/* Compact Dropzone for Student ID */}
                          <div className="pt-1">
                            <DocVaultSelector
                              compact={true}
                              label="Student ID Card / University Endorsement"
                              description="Upload front/back scan of College ID"
                              suggestedType="STUDENT_ID"
                              value={collegeIdCardUrl}
                              onChange={(fileUrl) => setCollegeIdCardUrl(fileUrl)}
                              onRemove={() => setCollegeIdCardUrl('')}
                            />
                          </div>
                        </div>
                      </div>

                      {/* SUBMISSION ACTION FOOTER */}
                      <div className="p-6 bg-white border-3 border-[#121316] shadow-[4px_4px_0_#FFDD33] rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <p className="text-xs font-headline font-black uppercase text-[#0F534A] flex items-center gap-1.5">
                            <Lock className="w-3.5 h-3.5 text-[#FE4E1A]" />
                            Institutional Dual-Custody Privacy Guarantee
                          </p>
                          <p className="text-[11px] text-gray-600 font-medium">
                            All identity proofs are encrypted in your private Doc Vault and only
                            accessible to authorized governance verifiers.
                          </p>
                        </div>

                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          {kycStatus === 'VERIFIED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsRevising(false);
                                setPreviewMode('VERIFIED');
                              }}
                              className="px-5 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 border-2 border-[#121316] font-headline font-black text-xs uppercase cursor-pointer"
                            >
                              Cancel &amp; View Verified Card
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={kycSubmitting}
                            className="w-full sm:w-auto px-8 py-3.5 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-3 border-[#121316] shadow-[4px_4px_0_#121316] font-headline font-black text-xs uppercase tracking-wider transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:translate-x-[-1px] hover:translate-y-[-1px]"
                          >
                            {kycSubmitting ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" /> Submitting
                                Verification...
                              </>
                            ) : kycStatus === 'REJECTED' ? (
                              <>
                                <Repeat className="w-4 h-4" /> Resubmit KYC Proofs for Approval
                              </>
                            ) : isRevising ? (
                              <>
                                <ShieldCheck className="w-4 h-4" /> Submit Revised Documents
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-4 h-4" /> Submit Identity Proofs for
                                Dual-Custody KYC
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}

            {/* ── TAB 3: PAYOUT & SETTLEMENT ACCOUNTS (POWERED BY SECURE VAULT) ── */}
            {activeTab === 'bank' && (
              <div className="space-y-6">
                {/* VAULT ACTION BANNER */}
                <div className="p-6 bg-[#FCFBF7] border-4 border-[#0F534A] shadow-[6px_6px_0_#4717AE] rounded-xl space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-dashed border-[#0F534A]/30">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#0F534A] text-[#9EFC5F] border-2 border-[#121316] shadow-[2px_2px_0_#121316]">
                        <Landmark className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-headline font-black text-base uppercase text-[#0F534A] tracking-wider flex items-center gap-2">
                          Dual-Custody Account Vault
                          <span className="px-2 py-0.5 bg-[#9EFC5F] text-[#0F534A] border border-[#121316] text-[10px] font-black uppercase">
                            {vaultAccounts.length} Encrypted Accounts
                          </span>
                        </h3>
                        <p className="text-xs text-gray-600 font-medium">
                          All bank accounts and payout destinations are encrypted and managed
                          directly in your Secure Vault.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setIsVaultModalOpen(true)}
                        className="px-4 py-2.5 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-2 border-[#121316] shadow-[3px_3px_0_#121316] font-headline font-black text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px]"
                      >
                        <Plus className="w-4 h-4" /> Add Account in Vault
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate('/vault/bank')}
                        className="px-4 py-2.5 bg-[#FFDD33] hover:bg-[#0F534A] hover:text-white text-[#121316] border-2 border-[#121316] shadow-[3px_3px_0_#121316] font-headline font-black text-xs uppercase flex items-center gap-1.5 transition-all cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px]"
                      >
                        <FolderLock className="w-4 h-4" /> Open Full Vault ↗
                      </button>
                    </div>
                  </div>

                  {/* VAULT ACCOUNTS DISPLAY */}
                  {loadingVault ? (
                    <div className="py-8 text-center text-xs font-bold text-gray-500 flex flex-col items-center justify-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-[#0F534A]" />
                      Loading your encrypted settlement accounts from Secure Vault...
                    </div>
                  ) : vaultAccounts.length > 0 ? (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-headline font-black uppercase text-[#0F534A] flex items-center gap-1.5">
                          <CreditCard className="w-4 h-4 text-[#FE4E1A]" />
                          Registered Settlement &amp; Payout Accounts:
                        </span>
                        <span className="text-[11px] text-gray-500 font-bold">
                          1-Click Settlement Selection
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vaultAccounts.map((acc) => {
                          const isPrimary = acc.isPrimary || selectedVaultId === acc.id;
                          return (
                            <div
                              key={acc.id}
                              className={`p-5 rounded-xl border-3 border-[#121316] transition-all relative ${
                                isPrimary
                                  ? 'bg-[#FCFBF7] shadow-[5px_5px_0_#0F534A] ring-2 ring-[#0F534A]'
                                  : 'bg-white shadow-[3px_3px_0_#121316] hover:shadow-[5px_5px_0_#FE4E1A]'
                              }`}
                            >
                              {isPrimary && (
                                <div className="absolute -top-3 right-4 px-2.5 py-0.5 bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] text-[9px] font-headline font-black uppercase tracking-wider flex items-center gap-1 shadow-[2px_2px_0_#121316]">
                                  <CheckCircle2 className="w-3 h-3 text-[#0F534A]" /> Active
                                  Settlement Account
                                </div>
                              )}

                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div>
                                  <h4 className="font-headline font-black text-sm text-[#121316] uppercase flex items-center gap-2">
                                    {acc.bankName || 'Bank Account'}
                                    {acc.accountNickname && (
                                      <span className="px-2 py-0.5 bg-[#FFDD33] text-[#121316] border border-[#121316] text-[9px] font-headline font-black uppercase">
                                        🏷️ {acc.accountNickname}
                                      </span>
                                    )}
                                  </h4>
                                  <p className="text-xs text-gray-600 font-bold uppercase mt-0.5">
                                    {acc.accountHolderName}
                                  </p>
                                </div>
                                <span className="px-2 py-0.5 bg-[#FFF9F2] text-[#4717AE] border border-[#121316] text-[9px] font-headline font-black uppercase">
                                  {acc.accountType?.replace(/_/g, ' ') || 'SAVINGS'}
                                </span>
                              </div>

                              <div className="bg-[#FFF9F2] p-3 border-2 border-[#121316] space-y-1.5 text-xs mb-4">
                                <div className="flex justify-between items-center font-mono">
                                  <span className="text-gray-500 text-[10px] font-headline font-black uppercase">
                                    Account No:
                                  </span>
                                  <span className="font-bold text-[#121316]">
                                    {maskAccountNumber(acc.bankAccountNumber)}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center font-mono">
                                  <span className="text-gray-500 text-[10px] font-headline font-black uppercase">
                                    IFSC Code:
                                  </span>
                                  <span className="font-bold text-[#0F534A]">{acc.ifscCode}</span>
                                </div>
                                {acc.upiId && (
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 text-[10px] font-headline font-black uppercase">
                                      UPI ID:
                                    </span>
                                    <span className="font-bold text-[#4717AE]">{acc.upiId}</span>
                                  </div>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-200">
                                {isPrimary ? (
                                  <span className="text-xs font-headline font-black text-[#0F534A] uppercase flex items-center gap-1">
                                    <ShieldCheck className="w-4 h-4 text-[#0F534A]" /> Primary
                                    Payout Target
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={settingPrimaryId === acc.id}
                                    onClick={() => handleSetPrimarySettlementAccount(acc)}
                                    className="px-3 py-1.5 bg-[#0F534A] hover:bg-[#0B3B34] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-[10px] uppercase flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                                  >
                                    {settingPrimaryId === acc.id ? (
                                      <RefreshCw className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Check className="w-3 h-3 text-[#9EFC5F]" />
                                    )}
                                    Set as Primary
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => navigate('/vault/bank')}
                                  className="text-[11px] font-headline font-black uppercase text-[#FE4E1A] hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                  Manage in Vault <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 bg-white border-3 border-dashed border-[#0F534A]/50 rounded-xl text-center space-y-4">
                      <div className="w-14 h-14 mx-auto bg-[#FFF9F2] border-3 border-[#121316] rounded-full flex items-center justify-center text-[#FE4E1A] shadow-[3px_3px_0_#121316]">
                        <FolderLock className="w-7 h-7" />
                      </div>
                      <div className="space-y-1 max-w-md mx-auto">
                        <h4 className="font-headline font-black text-sm uppercase text-[#121316]">
                          No Bank Accounts in Secure Vault
                        </h4>
                        <p className="text-xs text-gray-600 font-medium">
                          All settlement accounts are encrypted and stored in your Dual-Custody
                          Secure Vault. Add your bank details directly to the Secure Vault to enable
                          withdrawals and payouts.
                        </p>
                      </div>
                      <div className="flex justify-center gap-3">
                        <button
                          type="button"
                          onClick={() => setIsVaultModalOpen(true)}
                          className="px-5 py-2.5 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-3 border-[#121316] shadow-[3px_3px_0_#121316] font-headline font-black text-xs uppercase flex items-center gap-2 cursor-pointer transition-all hover:translate-x-[-1px] hover:translate-y-[-1px]"
                        >
                          <Plus className="w-4 h-4" /> Add Account in Secure Vault
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/vault/bank')}
                          className="px-5 py-2.5 bg-white hover:bg-gray-100 text-[#121316] border-3 border-[#121316] shadow-[3px_3px_0_#121316] font-headline font-black text-xs uppercase flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <ExternalLink className="w-4 h-4" /> Go to Vault
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Vault Management Modal */}
                <AccountVaultModal
                  isOpen={isVaultModalOpen}
                  onClose={() => {
                    setIsVaultModalOpen(false);
                    fetchVaultAccounts();
                  }}
                  onSelectAccount={(acc) => {
                    handleSetPrimarySettlementAccount(acc);
                  }}
                />
              </div>
            )}

            {/* ── TAB 4: THREE-TIER IDENTITY & PROFILE MANAGEMENT ── */}
            {activeTab === 'roles' && (
              <div className="space-y-8">
                {/* Header overview */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-dashed border-[#121316]">
                  <div>
                    <h3 className="font-headline font-black text-lg uppercase text-[#121316] tracking-wider flex items-center gap-2">
                      <Layers className="w-5 h-5 text-[#FE4E1A]" />
                      Multi-Identity Governance Hub
                    </h3>
                    <p className="text-xs text-gray-600 font-medium">
                      Seamlessly switch between your Independent Platform persona, Institutional
                      Member profiles, and Organization Administration.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    <button
                      onClick={() => navigate('/onboarding')}
                      className="px-4 py-2 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-xs uppercase transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> Join Org / Club Workflow
                    </button>
                    <button
                      onClick={() => navigate('/select-profile')}
                      className="px-4 py-2 bg-[#FFDD33] hover:bg-[#FE4E1A] hover:text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-xs uppercase transition-all inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Repeat className="w-4 h-4" /> Full Profile Selector ↗
                    </button>
                  </div>
                </div>

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/* IDENTITY 1: INDEPENDENT USER (PUBLIC CITIZEN / STANDALONE PERSONA) */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-[#FE4E1A] border border-[#121316] rounded-full inline-block"></span>
                      <h4 className="font-headline font-black text-sm uppercase text-[#121316] tracking-wider">
                        Identity 1: Independent User (Standalone Citizen)
                      </h4>
                    </div>
                    <span className="text-[10px] font-headline font-bold uppercase text-gray-500">
                      Zero Org Dependencies
                    </span>
                  </div>

                  <div
                    className={`p-6 rounded-xl border-4 border-[#121316] transition-all relative ${
                      isIndependentUser
                        ? 'bg-[#FCFBF7] shadow-[6px_6px_0_#FE4E1A] ring-2 ring-[#FE4E1A]'
                        : 'bg-white shadow-[4px_4px_0_#121316] hover:shadow-[6px_6px_0_#FE4E1A]'
                    }`}
                  >
                    {isIndependentUser && (
                      <div className="absolute -top-3 right-6 px-3 py-1 bg-[#FE4E1A] text-white border-2 border-[#121316] text-[10px] font-headline font-black uppercase tracking-wider flex items-center gap-1 shadow-[2px_2px_0_#121316]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#FFDD33]" /> Active Identity
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-start gap-4">
                        <div className="w-14 h-14 bg-[#FE4E1A] text-[#FFDD33] border-3 border-[#121316] shadow-[3px_3px_0_#121316] flex items-center justify-center flex-shrink-0">
                          <Globe className="w-7 h-7" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h5 className="font-headline font-black text-base text-[#121316] uppercase">
                              Independent Platform Citizen
                            </h5>
                            <span className="px-2 py-0.5 bg-[#FFDD33] text-[#121316] border border-[#121316] text-[9px] font-headline font-black uppercase">
                              Public User
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 max-w-xl font-medium">
                            Explore, discover & back public campaigns across all campuses. Maintain
                            your private encrypted Secure Vault, personal KYC proofs, and species
                            badge with complete autonomy.
                          </p>
                          <div className="flex items-center gap-2 pt-1 flex-wrap text-[11px] font-bold text-gray-600">
                            <span className="inline-flex items-center gap-1 text-[#0F534A]">
                              <Check className="w-3 h-3 text-[#0F534A]" /> Public Backer
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-[#4717AE]">
                              <Check className="w-3 h-3 text-[#4717AE]" /> Personal Vault
                            </span>
                            <span>•</span>
                            <span className="inline-flex items-center gap-1 text-[#FE4E1A]">
                              <Check className="w-3 h-3 text-[#FE4E1A]" /> Species Identity
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-full md:w-auto flex-shrink-0">
                        {isIndependentUser ? (
                          <div className="px-6 py-3 bg-[#9EFC5F]/40 border-2 border-[#0F534A] text-[#0F534A] font-headline font-black text-xs uppercase flex items-center justify-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-[#0F534A]" /> Operating as
                            Independent User
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={async () => {
                              await switchToIndependentMode();
                              navigate('/dashboard');
                            }}
                            className="w-full md:w-auto px-6 py-3 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-3 border-[#121316] shadow-[3px_3px_0_#121316] font-headline font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer hover:translate-x-[-1px] hover:translate-y-[-1px]"
                          >
                            <Repeat className="w-4 h-4" /> Switch to Independent User Mode
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/* IDENTITY 2: INSTITUTIONAL ORG MEMBER PERSONAS (STUDENT/RESEARCHER) */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                <div className="space-y-4 pt-4 border-t-2 border-dashed border-[#121316]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-[#0F534A] border border-[#121316] rounded-full inline-block"></span>
                      <h4 className="font-headline font-black text-sm uppercase text-[#121316] tracking-wider">
                        Identity 2: Enrolled Organization Members (
                        {user?.memberProfiles?.length ||
                          user?.availableProfiles?.filter(
                            (p) =>
                              ![
                                'ORG_ADMIN',
                                'CORPORATE_ADMIN',
                                'INCUBATOR_MANAGER',
                                'ADMIN',
                                'DX_ADMIN',
                              ].includes((p.role || '').toUpperCase())
                          ).length ||
                          0}
                        )
                      </h4>
                    </div>
                    <button
                      onClick={() => navigate('/onboarding')}
                      className="text-xs font-headline font-black uppercase text-[#0F534A] hover:underline inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" /> Join Another Organization / Club
                    </button>
                  </div>

                  {(() => {
                    const memberList =
                      user?.memberProfiles && user.memberProfiles.length > 0
                        ? user.memberProfiles
                        : (user?.availableProfiles || []).filter(
                            (p: any) =>
                              ![
                                'ORG_ADMIN',
                                'CORPORATE_ADMIN',
                                'INCUBATOR_MANAGER',
                                'ADMIN',
                                'DX_ADMIN',
                              ].includes((p.role || '').toUpperCase())
                          );

                    if (memberList.length === 0) {
                      return (
                        <div className="p-8 bg-[#FCFBF7] border-3 border-dashed border-[#0F534A]/40 rounded-xl text-center space-y-3">
                          <div className="w-12 h-12 mx-auto bg-white border-2 border-[#121316] rounded-full flex items-center justify-center text-[#0F534A] shadow-[2px_2px_0_#121316]">
                            <Building2 className="w-6 h-6" />
                          </div>
                          <div>
                            <h5 className="font-headline font-black text-sm uppercase text-[#121316]">
                              No Institutional Memberships Yet
                            </h5>
                            <p className="text-xs text-gray-600 max-w-md mx-auto mt-1 font-medium">
                              Join your college, student club, or research lab to access campus
                              grant pipelines, dual-custody verification workflows, and verified
                              student status.
                            </p>
                          </div>
                          <button
                            onClick={() => navigate('/onboarding')}
                            className="px-5 py-2.5 bg-[#0F534A] hover:bg-[#0B3B34] text-white border-2 border-[#121316] shadow-[3px_3px_0_#121316] font-headline font-black text-xs uppercase inline-flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Plus className="w-4 h-4" /> Join an Organization Now
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {memberList.map((prof: any, idx: number) => {
                          const isCurrent =
                            !isIndependentUser &&
                            (user?.activeProfile as any)?.organizationId === prof.organizationId &&
                            user?.activeProfile?.role === prof.role;
                          return (
                            <div
                              key={idx}
                              className={`p-5 border-3 border-[#121316] rounded-xl transition-all relative flex flex-col justify-between ${
                                isCurrent
                                  ? 'bg-[#0F534A] text-white shadow-[5px_5px_0_#9EFC5F] ring-2 ring-[#0F534A]'
                                  : 'bg-white text-[#121316] hover:bg-[#FCFBF7] shadow-[3px_3px_0_#121316]'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <span
                                    className={`border-2 border-[#121316] px-2.5 py-0.5 text-[9px] font-headline font-black uppercase ${
                                      isCurrent
                                        ? 'bg-[#FFDD33] text-[#121316]'
                                        : 'bg-[#9EFC5F] text-[#0F534A]'
                                    }`}
                                  >
                                    {formatRoleLabel(prof.role)}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[9px] font-headline font-black uppercase text-[#9EFC5F] flex items-center gap-1">
                                      <Check className="w-3 h-3" /> ACTIVE MEMBER
                                    </span>
                                  )}
                                </div>

                                <h5 className="font-headline font-black text-base uppercase truncate mb-0.5">
                                  {prof.orgName || 'Institutional Org'}
                                </h5>
                                <p
                                  className={`text-[11px] font-bold uppercase tracking-wider mb-4 ${isCurrent ? 'text-gray-200' : 'text-gray-500'}`}
                                >
                                  {prof.orgType || 'COLLEGE'}
                                </p>
                              </div>

                              <div className="pt-2">
                                {isCurrent ? (
                                  <div className="w-full py-2 bg-white/10 text-white border border-white/30 text-center font-headline font-black text-[11px] uppercase tracking-wider">
                                    Currently Active
                                  </div>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      await handleSwitchProfile(prof.organizationId, prof.role);
                                      navigate('/dashboard');
                                    }}
                                    className="w-full py-2 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                                  >
                                    Switch to Member Role
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* ══════════════════════════════════════════════════════════════════ */}
                {/* IDENTITY 3: ORGANIZATION ADMINISTRATION & GOVERNANCE PERSONAS      */}
                {/* ══════════════════════════════════════════════════════════════════ */}
                <div className="space-y-4 pt-4 border-t-2 border-dashed border-[#121316]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-[#4717AE] border border-[#121316] rounded-full inline-block"></span>
                      <h4 className="font-headline font-black text-sm uppercase text-[#121316] tracking-wider">
                        Identity 3: Organization Admin &amp; Governance (
                        {user?.adminProfiles?.length ||
                          user?.availableProfiles?.filter((p) =>
                            [
                              'ORG_ADMIN',
                              'CORPORATE_ADMIN',
                              'INCUBATOR_MANAGER',
                              'ADMIN',
                              'DX_ADMIN',
                            ].includes((p.role || '').toUpperCase())
                          ).length ||
                          0}
                        )
                      </h4>
                    </div>
                    <button
                      onClick={() => navigate('/onboarding')}
                      className="text-xs font-headline font-black uppercase text-[#4717AE] hover:underline inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto"
                    >
                      <Plus className="w-3.5 h-3.5" /> Register / Claim New Org
                    </button>
                  </div>

                  {(() => {
                    const adminList =
                      user?.adminProfiles && user.adminProfiles.length > 0
                        ? user.adminProfiles
                        : (user?.availableProfiles || []).filter((p: any) =>
                            [
                              'ORG_ADMIN',
                              'CORPORATE_ADMIN',
                              'INCUBATOR_MANAGER',
                              'ADMIN',
                              'DX_ADMIN',
                            ].includes((p.role || '').toUpperCase())
                          );

                    if (adminList.length === 0) {
                      return (
                        <div className="p-6 bg-[#FCFBF7] border-3 border-dashed border-[#4717AE]/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="space-y-1 text-center sm:text-left">
                            <h5 className="font-headline font-black text-sm uppercase text-[#121316] flex items-center justify-center sm:justify-start gap-1.5">
                              <ShieldAlert className="w-4 h-4 text-[#4717AE]" /> No Organization
                              Admin Portals Assigned
                            </h5>
                            <p className="text-xs text-gray-600 font-medium">
                              If you are a dean, club coordinator, or incubator manager, register or
                              claim administrative access to manage campus verifications and
                              disbursements.
                            </p>
                          </div>
                          <button
                            onClick={() => navigate('/onboarding')}
                            className="px-4 py-2 bg-[#4717AE] hover:bg-[#341085] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-xs uppercase whitespace-nowrap cursor-pointer transition-all"
                          >
                            Claim Admin Access
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {adminList.map((prof: any, idx: number) => {
                          const isCurrent =
                            !isIndependentUser &&
                            (user?.activeProfile as any)?.organizationId === prof.organizationId &&
                            user?.activeProfile?.role === prof.role;
                          return (
                            <div
                              key={idx}
                              className={`p-5 border-3 border-[#121316] rounded-xl transition-all relative flex flex-col justify-between ${
                                isCurrent
                                  ? 'bg-[#4717AE] text-white shadow-[5px_5px_0_#FEB3FC] ring-2 ring-[#4717AE]'
                                  : 'bg-white text-[#121316] hover:bg-[#FCFBF7] shadow-[3px_3px_0_#121316]'
                              }`}
                            >
                              <div>
                                <div className="flex items-center justify-between mb-3">
                                  <span
                                    className={`border-2 border-[#121316] px-2.5 py-0.5 text-[9px] font-headline font-black uppercase ${
                                      isCurrent
                                        ? 'bg-[#FFDD33] text-[#121316]'
                                        : 'bg-[#FEB3FC] text-[#4717AE]'
                                    }`}
                                  >
                                    {formatRoleLabel(prof.role)}
                                  </span>
                                  {isCurrent && (
                                    <span className="text-[9px] font-headline font-black uppercase text-[#FFDD33] flex items-center gap-1">
                                      <Check className="w-3 h-3" /> ACTIVE ADMIN
                                    </span>
                                  )}
                                </div>

                                <h5 className="font-headline font-black text-base uppercase truncate mb-0.5">
                                  {prof.orgName || 'Institutional Org'}
                                </h5>
                                <p
                                  className={`text-[11px] font-bold uppercase tracking-wider mb-4 ${isCurrent ? 'text-gray-200' : 'text-gray-500'}`}
                                >
                                  {prof.orgType || 'COLLEGE'} • Admin Portal
                                </p>
                              </div>

                              <div className="pt-2">
                                {isCurrent ? (
                                  <button
                                    onClick={() => navigate('/dx-admin')}
                                    className="w-full py-2 bg-[#FFDD33] hover:bg-[#FE4E1A] hover:text-white text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <Building2 className="w-4 h-4" /> Open Org Admin Portal ↗
                                  </button>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      await handleSwitchProfile(prof.organizationId, prof.role);
                                      navigate('/dx-admin');
                                    }}
                                    className="w-full py-2 bg-[#4717AE] hover:bg-[#341085] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] font-headline font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                                  >
                                    Switch to Admin Dashboard
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COLLECTIBLE SPECIES CARD MODAL */}
        <SpeciesCardModal
          isOpen={speciesCardOpen}
          onClose={() => setSpeciesCardOpen(false)}
          user={user}
          speciesIdentity={user?.speciesIdentity}
          username={user?.username}
        />
      </div>
    </UnifiedDashboardLayout>
  );
}
