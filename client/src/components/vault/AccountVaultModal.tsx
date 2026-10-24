import React, { useState, useEffect } from 'react';
import {
  Landmark,
  CreditCard,
  Trash2,
  CheckCircle2,
  X,
  Plus,
  RefreshCw,
  Sparkles,
  Building2,
  User,
  ShieldCheck,
  Tag,
  Zap,
  Check,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  vaultService,
  UserAccountVaultItem,
  VaultAccountType,
  IfscLookupResult,
} from '../../services/vaultService';
import { loadRazorpayScript } from '../../utils/loadRazorpay';

export interface AccountVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount?: (account: UserAccountVaultItem) => void;
}

const ACCOUNT_TYPE_LABELS: Record<VaultAccountType, string> = {
  INDIVIDUAL_SAVINGS: 'Individual Savings',
  INDIVIDUAL_CURRENT: 'Individual Current',
  INSTITUTIONAL_CURRENT: 'Institutional / Lab Current',
  STUDENT_CLUB: 'Student Club / Team',
};

export const AccountVaultModal: React.FC<AccountVaultModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
}) => {
  const [accounts, setAccounts] = useState<UserAccountVaultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingMode, setIsAddingMode] = useState(false);

  // New Account Form State
  const [accountNickname, setAccountNickname] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [accountType, setAccountType] = useState<VaultAccountType>('INDIVIDUAL_SAVINGS');
  const [isPrimary, setIsPrimary] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verifyingKyc, setVerifyingKyc] = useState(false);
  const [verifyingExistingId, setVerifyingExistingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // IFSC Validation State
  const [ifscInfo, setIfscInfo] = useState<IfscLookupResult | null>(null);
  const [ifscLoading, setIfscLoading] = useState(false);
  const [ifscError, setIfscError] = useState('');

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const result = await vaultService.getAccounts();
      setAccounts(result);
    } catch (err) {
      console.error('Failed to load account vault:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchAccounts();
    }
  }, [isOpen]);

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

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountHolderName.trim() || !bankAccountNumber.trim() || !ifscCode.trim()) {
      toast.error('Account holder name, account number, and IFSC code are required.');
      return;
    }

    setSaving(true);
    try {
      const saved = await vaultService.saveAccount({
        accountNickname: accountNickname.trim() || undefined,
        accountHolderName: accountHolderName.trim(),
        bankAccountNumber: bankAccountNumber.trim().replace(/\s+/g, ''),
        ifscCode: ifscCode.trim().toUpperCase(),
        bankName: bankName.trim() || undefined,
        upiId: upiId.trim() || undefined,
        accountType,
        isPrimary,
      });

      toast.success(`Bank account "${saved.accountNickname || saved.accountHolderName}" saved to your Account Vault! 🏦`);
      resetForm();
      await fetchAccounts();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save account');
    } finally {
      setSaving(false);
    }
  };

  // ₹1 Reverse Penny Drop Rapid KYC
  const handleRapidKyc = async () => {
    if (!accountHolderName.trim() || !bankAccountNumber.trim() || !ifscCode.trim()) {
      toast.error('Account holder name, account number, and IFSC code are required for KYC.');
      return;
    }

    setVerifyingKyc(true);
    try {
      const accountData = {
        accountNickname: accountNickname.trim() || undefined,
        accountHolderName: accountHolderName.trim(),
        bankAccountNumber: bankAccountNumber.trim().replace(/\s+/g, ''),
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

            toast.success('🎉 Bank account verified via ₹1 KYC & secured in your Vault!');
            resetForm();
            await fetchAccounts();
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

  // Verify an existing account via ₹1 KYC
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
            await fetchAccounts();
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

  const resetForm = () => {
    setAccountNickname('');
    setAccountHolderName('');
    setBankAccountNumber('');
    setIfscCode('');
    setBankName('');
    setUpiId('');
    setIfscInfo(null);
    setIfscError('');
    setIsAddingMode(false);
  };

  const confirmDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await vaultService.deleteAccount(id);
      toast.success('Account removed from your Account Vault');
      setDeletingId(null);
      await fetchAccounts();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete account');
    } finally {
      setIsDeleting(false);
    }
  };

  const maskNumber = (acc: string) => {
    if (!acc || acc.length < 4) return acc;
    return `•••• •••• ${acc.slice(-4)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#FCFBF7] border-4 border-[#0F534A] shadow-[8px_8px_0_#4717AE] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-[#0F534A] text-white flex items-center justify-between border-b-4 border-[#121316]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] shadow-[2px_2px_0_#121316]">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-headline font-black text-lg uppercase tracking-wider text-white">
                My Central Account Vault
              </h2>
              <p className="text-xs text-[#9EFC5F] font-medium">
                Store and manage verified settlement bank accounts for automatic escrow disbursements
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-white text-[#121316] hover:bg-[#FE4E1A] hover:text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="p-4 bg-white border-b-2 border-[#0F534A]/20 flex items-center justify-between">
          <span className="text-xs font-bold text-[#0F534A]">
            Saved Settlement Accounts: <strong>{accounts.length}</strong>
          </span>

          <button
            type="button"
            onClick={() => setIsAddingMode(!isAddingMode)}
            className="px-4 py-2 bg-[#4717AE] hover:bg-[#38118d] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[3px_3px_0_#121316] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            {isAddingMode ? 'Cancel' : 'Add New Bank Account'}
          </button>
        </div>

        {/* Add Account Drawer */}
        {isAddingMode && (
          <form onSubmit={handleSaveAccount} className="p-4 bg-[#FFF9F2] border-b-3 border-[#4717AE] space-y-3 animate-fadeIn">
            <h4 className="font-headline font-black text-xs uppercase text-[#4717AE] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Enter Bank Details to Secure in Vault
            </h4>

            <div>
              <label className="block text-xs font-headline font-black uppercase text-[#4717AE] mb-1 flex items-center gap-1">
                <Tag className="w-3 h-3 text-[#FE4E1A]" />
                Account Nickname / Label in Vault (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. My Primary HDFC / Robotics Lab SBI / Club Account"
                value={accountNickname}
                onChange={(e) => setAccountNickname(e.target.value)}
                className="w-full px-3 py-1.5 border-2 border-[#4717AE] text-xs font-bold text-[#121316] focus:outline-none bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                  Account Holder Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className="w-full px-3 py-1.5 border-2 border-[#0F534A] text-xs font-bold text-[#121316] focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                  Bank Account Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 501002348921"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  className="w-full px-3 py-1.5 border-2 border-[#0F534A] text-xs font-mono font-bold text-[#121316] focus:outline-none bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-headline font-black uppercase text-[#0F534A]">
                    IFSC / Routing Code *
                  </label>
                  {ifscLoading && (
                    <span className="text-[10px] text-[#0F534A] font-bold flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Verifying...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="e.g. SBIN0000691"
                  maxLength={11}
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-1.5 border-2 border-[#0F534A] text-xs font-mono font-bold text-[#121316] focus:outline-none uppercase bg-white"
                />
                {ifscError && (
                  <p className="text-[10px] text-red-600 font-bold mt-1">⚠️ {ifscError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                  Bank Name (Auto-fetched or Custom)
                </label>
                <input
                  type="text"
                  placeholder="e.g. State Bank of India"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3 py-1.5 border-2 border-[#0F534A] text-xs font-bold text-[#121316] focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                  UPI VPA (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. rahul@okhdfcbank"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-1.5 border-2 border-[#0F534A] text-xs font-medium text-[#121316] focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                  Account Type
                </label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value as VaultAccountType)}
                  className="w-full px-3 py-1.5 border-2 border-[#0F534A] text-xs font-bold text-[#121316] focus:outline-none bg-white"
                >
                  {Object.entries(ACCOUNT_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* IFSC Details & Payment Rails Preview */}
            {ifscInfo && ifscInfo.valid && (
              <div className="p-2.5 bg-white border-2 border-[#0B9C2C] shadow-[2px_2px_0_#0B9C2C] rounded space-y-1.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-headline font-black text-[#0B9C2C] uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified Branch: {ifscInfo.bank}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500">
                    {ifscInfo.branch} {ifscInfo.city ? `• ${ifscInfo.city}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap pt-0.5">
                  <span className="text-[9px] font-bold text-gray-500 uppercase">Supported Rails:</span>
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

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#121316] font-bold">
                <input
                  type="checkbox"
                  checked={isPrimary}
                  onChange={(e) => setIsPrimary(e.target.checked)}
                  className="w-3.5 h-3.5 accent-[#0F534A]"
                />
                <span>Set as primary account for payouts</span>
              </label>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="submit"
                  disabled={saving || verifyingKyc}
                  className="px-3 py-1.5 bg-white text-[#121316] border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0_#121316] hover:bg-gray-100 cursor-pointer"
                >
                  {saving ? 'Saving...' : 'Save (Unverified)'}
                </button>

                <button
                  type="button"
                  onClick={handleRapidKyc}
                  disabled={saving || verifyingKyc}
                  className="px-4 py-1.5 bg-[#FE4E1A] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0_#121316] hover:bg-[#e03d0d] cursor-pointer flex items-center gap-1.5"
                  title="Verify bank account ownership instantly by paying ₹1.00 via Razorpay"
                >
                  {verifyingKyc ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Opening KYC...
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 fill-current text-[#FFDD33]" />
                      ⚡ Verify & Add (₹1 Rapid KYC)
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Accounts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="py-12 text-center text-sm font-bold text-gray-500 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#0F534A]" />
              Loading your Account Vault...
            </div>
          ) : accounts.length === 0 ? (
            <div className="py-12 bg-white border-2 border-dashed border-[#0F534A]/40 text-center space-y-2">
              <Landmark className="w-8 h-8 text-[#0F534A] mx-auto opacity-50" />
              <p className="text-sm font-headline font-black text-[#121316] uppercase">
                No bank accounts stored in your Account Vault
              </p>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Save your bank account details once to auto-fill escrow disbursement setups across all student campaigns.
              </p>
              <button
                type="button"
                onClick={() => setIsAddingMode(true)}
                className="mt-2 px-4 py-1.5 bg-[#4717AE] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0_#121316]"
              >
                + Add First Bank Account
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  className={`p-4 bg-white border-2 border-[#0F534A] shadow-[3px_3px_0_#0F534A] flex items-center justify-between gap-3 ${
                    acc.isPrimary ? 'ring-2 ring-[#FE4E1A] bg-[#FFF9F2]' : ''
                  }`}
                >
                  <div className="space-y-1 truncate flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-headline font-black text-[#121316] truncate">
                        {acc.accountHolderName}
                      </span>
                      {acc.accountNickname && (
                        <span className="px-1.5 py-0.5 bg-[#FFDD33] text-[#121316] border border-[#121316] text-[9px] font-headline font-black uppercase flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" />
                          {acc.accountNickname}
                        </span>
                      )}
                      {acc.isPrimary && (
                        <span className="px-1.5 py-0.5 bg-[#FE4E1A] text-white text-[9px] font-headline font-black uppercase">
                          ★ PRIMARY
                        </span>
                      )}
                      {acc.isVerified ? (
                        <span className="px-1.5 py-0.5 bg-[#9EFC5F] text-[#0F534A] border border-[#0F534A] text-[9px] font-headline font-black uppercase flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          ✓ VERIFIED VIA ₹1 KYC
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 border border-gray-300 text-[9px] font-headline font-black uppercase">
                          UNVERIFIED
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-mono font-bold text-[#0F534A]">
                      {maskNumber(acc.bankAccountNumber)}
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold">
                      <span>
                        IFSC: <strong className="text-[#121316]">{acc.ifscCode}</strong>
                      </span>
                      {acc.bankName && <span>• {acc.bankName}</span>}
                      {acc.upiId && (
                        <span>
                          • UPI: <strong className="text-[#121316]">{acc.upiId}</strong>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <span className="inline-block px-1.5 py-0.5 bg-[#FFF9F2] text-[#0F534A] border border-[#121316] text-[9px] font-headline font-black uppercase">
                        {ACCOUNT_TYPE_LABELS[acc.accountType] || acc.accountType}
                      </span>
                      {!acc.isVerified && (
                        <button
                          type="button"
                          onClick={() => handleVerifyExistingAccount(acc)}
                          disabled={verifyingExistingId === acc.id}
                          className="px-1.5 py-0.5 bg-[#FE4E1A] text-white border border-[#121316] text-[9px] font-headline font-black uppercase hover:bg-[#e03d0d] flex items-center gap-1 cursor-pointer"
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
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {onSelectAccount && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectAccount(acc);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-[#9EFC5F] hover:bg-[#8cee4b] text-[#0F534A] border border-[#121316] font-headline font-black text-[11px] uppercase shadow-[1px_1px_0_#121316] cursor-pointer"
                      >
                        Select
                      </button>
                    )}

                    {deletingId === acc.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => confirmDelete(acc.id)}
                          disabled={isDeleting}
                          className="px-2 py-1 bg-[#F4002C] hover:bg-[#d00025] text-white border border-[#121316] font-headline font-black text-[10px] uppercase shadow-[1px_1px_0_#121316] cursor-pointer"
                        >
                          {isDeleting ? '...' : 'Remove'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingId(null)}
                          disabled={isDeleting}
                          className="px-1.5 py-1 bg-gray-200 hover:bg-gray-300 text-[#121316] border border-[#121316] font-headline font-black text-[10px] uppercase cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeletingId(acc.id)}
                        className="p-1.5 bg-white hover:bg-red-50 border border-[#121316] text-red-600 hover:text-red-700 cursor-pointer transition-colors"
                        title="Delete account from vault"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#FCFBF7] border-t-2 border-[#0F534A]/20 flex items-center justify-between text-xs text-gray-600 font-medium">
          <span>
            Accounts in Vault: <strong>{accounts.length}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#0F534A] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0_#121316] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
