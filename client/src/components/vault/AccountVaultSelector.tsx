import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  CheckCircle2,
  X,
  RefreshCw,
  Sparkles,
  Layers,
  Edit2,
  Tag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { vaultService, UserAccountVaultItem, VaultAccountType } from '../../services/vaultService';
import { AccountVaultModal } from './AccountVaultModal';

export interface AccountVaultSelectorProps {
  accountHolderName: string;
  bankAccountNumber: string;
  ifscCode: string;
  upiId?: string;
  recipientType?: 'INDIVIDUAL' | 'ORGANIZATION';
  onChange: (fields: {
    accountHolderName: string;
    bankAccountNumber: string;
    ifscCode: string;
    upiId?: string;
  }) => void;
  className?: string;
}

export const AccountVaultSelector: React.FC<AccountVaultSelectorProps> = ({
  accountHolderName,
  bankAccountNumber,
  ifscCode,
  upiId,
  recipientType = 'INDIVIDUAL',
  onChange,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'VAULT' | 'NEW'>('VAULT');
  const [vaultAccounts, setVaultAccounts] = useState<UserAccountVaultItem[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);
  const [selectedVaultId, setSelectedVaultId] = useState<string>('');
  const [autoSaveToVault, setAutoSaveToVault] = useState(true);
  const [accountNickname, setAccountNickname] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch accounts from user's personal Account Vault
  const fetchVaultAccounts = async () => {
    setLoadingVault(true);
    try {
      const accounts = await vaultService.getAccounts();
      setVaultAccounts(accounts);

      // If current inputs match a vaulted account, match selectedVaultId
      if (bankAccountNumber && ifscCode) {
        const cleanAcc = bankAccountNumber.replace(/\s+/g, '');
        const cleanIfsc = ifscCode.trim().toUpperCase();
        const match = accounts.find(
          (a) => a.bankAccountNumber === cleanAcc && a.ifscCode.toUpperCase() === cleanIfsc
        );
        if (match) {
          setSelectedVaultId(match.id);
        }
      } else if (accounts.length === 0) {
        setActiveTab('NEW');
      }
    } catch (err) {
      console.warn('Could not load user account vault:', err);
    } finally {
      setLoadingVault(false);
    }
  };

  useEffect(() => {
    fetchVaultAccounts();
  }, []);

  const handleSelectFromVault = (accountId: string) => {
    setSelectedVaultId(accountId);
    const acc = vaultAccounts.find((a) => a.id === accountId);
    if (acc) {
      onChange({
        accountHolderName: acc.accountHolderName,
        bankAccountNumber: acc.bankAccountNumber,
        ifscCode: acc.ifscCode,
        upiId: acc.upiId || '',
      });
      toast.success(`Selected "${acc.accountNickname || acc.accountHolderName}" from your Account Vault 🏦`);
    }
  };

  const handleSaveCurrentToVault = async () => {
    if (!accountHolderName.trim() || !bankAccountNumber.trim() || !ifscCode.trim()) {
      toast.error('Please enter complete bank account details before saving to vault.');
      return;
    }

    const toastId = toast.loading('Saving bank account to your Account Vault...');
    try {
      const accType: VaultAccountType =
        recipientType === 'ORGANIZATION' ? 'INSTITUTIONAL_CURRENT' : 'INDIVIDUAL_SAVINGS';

      const saved = await vaultService.saveAccount({
        accountNickname: accountNickname.trim() || undefined,
        accountHolderName: accountHolderName.trim(),
        bankAccountNumber: bankAccountNumber.trim().replace(/\s+/g, ''),
        ifscCode: ifscCode.trim().toUpperCase(),
        upiId: upiId?.trim() || undefined,
        accountType: accType,
      });

      toast.success(`Bank account "${saved.accountNickname || saved.accountHolderName}" saved in your Account Vault! 🏦`, { id: toastId });
      await fetchVaultAccounts();
      setSelectedVaultId(saved.id);
      setActiveTab('VAULT');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save account to vault', { id: toastId });
    }
  };

  const handleClear = () => {
    setSelectedVaultId('');
    onChange({
      accountHolderName: '',
      bankAccountNumber: '',
      ifscCode: '',
      upiId: '',
    });
    setActiveTab('NEW');
  };

  const maskAccountNumber = (accNum: string) => {
    if (!accNum || accNum.length < 4) return accNum;
    return `•••• •••• ${accNum.slice(-4)}`;
  };

  const isAttached = Boolean(accountHolderName && bankAccountNumber && ifscCode);
  const selectedAcc = vaultAccounts.find((a) => a.id === selectedVaultId);

  return (
    <div className={`bg-white border-4 border-[#0F534A] shadow-[6px_6px_0px_#4717AE] p-6 space-y-4 ${className}`}>
      {/* Header & Vault Count */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b-2 border-dashed border-gray-200">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-[#0F534A]" />
          <h3 className="font-headline font-black text-base uppercase text-[#0F534A]">
            Escrow Settlement &amp; Bank Account
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="text-xs font-headline font-black uppercase text-[#4717AE] hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <Layers className="w-3.5 h-3.5" />
          Manage Account Vault ({vaultAccounts.length})
        </button>
      </div>

      {/* ── ATTACHED / CONFIRMED STATE ── */}
      {isAttached && activeTab === 'VAULT' && selectedVaultId ? (
        <div className="p-4 bg-[#FFF9F2] border-3 border-[#0F534A] shadow-[4px_4px_0_#9EFC5F] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fadeIn">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-headline font-black text-sm text-[#121316] uppercase">
                {accountHolderName}
              </span>
              {selectedAcc?.accountNickname && (
                <span className="px-2 py-0.5 bg-[#FFDD33] text-[#121316] border border-[#121316] text-[10px] font-headline font-black uppercase flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  {selectedAcc.accountNickname}
                </span>
              )}
              <span className="px-2 py-0.5 bg-[#9EFC5F] text-[#0F534A] border border-[#121316] text-[10px] font-headline font-black uppercase">
                ✓ Linked for Escrow
              </span>
            </div>

            <div className="text-xs font-mono font-bold text-[#0F534A]">
              Account: {maskAccountNumber(bankAccountNumber)} • IFSC: {ifscCode}
              {upiId ? ` • UPI: ${upiId}` : ''}
            </div>

            <p className="text-[11px] text-gray-600 font-medium">
              Disbursements will be routed to this verified escrow settlement account upon tranche approvals.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('NEW')}
              className="px-3 py-1.5 bg-white hover:bg-gray-100 text-[#121316] border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0_#121316] cursor-pointer flex items-center gap-1"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Edit / New
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 bg-white hover:bg-red-50 text-red-600 border-2 border-[#121316] shadow-[2px_2px_0_#121316] cursor-pointer"
              title="Clear attached bank account"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* ── SELECTION MODES (VAULT vs ADD NEW) ── */
        <div className="space-y-4">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('VAULT')}
              className={`py-2 px-3 border-3 font-headline font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'VAULT'
                  ? 'bg-[#0F534A] text-white border-[#121316] shadow-[3px_3px_0px_#121316]'
                  : 'bg-[#FCFBF7] text-gray-700 border-gray-300 hover:border-[#0F534A]'
              }`}
            >
              <Landmark className="w-4 h-4 text-[#9EFC5F]" />
              Select from Account Vault ({vaultAccounts.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('NEW')}
              className={`py-2 px-3 border-3 font-headline font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'NEW'
                  ? 'bg-[#4717AE] text-white border-[#121316] shadow-[3px_3px_0px_#121316]'
                  : 'bg-[#FCFBF7] text-gray-700 border-gray-300 hover:border-[#4717AE]'
              }`}
            >
              <Plus className="w-4 h-4 text-white" />
              Enter New Bank Account
            </button>
          </div>

          {/* TAB 1: SELECT OLD ACCOUNT FROM VAULT */}
          {activeTab === 'VAULT' && (
            <div className="space-y-3">
              {loadingVault ? (
                <div className="p-4 text-center text-xs text-gray-500 font-bold flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0F534A]" />
                  Loading your Account Vault...
                </div>
              ) : vaultAccounts.length > 0 ? (
                <div className="space-y-2">
                  <label className="block text-xs font-headline font-black uppercase text-[#0F534A]">
                    Choose Saved Bank Account:
                  </label>
                  <select
                    value={selectedVaultId}
                    onChange={(e) => handleSelectFromVault(e.target.value)}
                    className="w-full p-3 bg-white border-2 border-[#0F534A] text-xs font-bold text-[#121316] focus:outline-none shadow-[3px_3px_0px_#0F534A]"
                  >
                    <option value="">-- Choose from your saved accounts ({vaultAccounts.length}) --</option>
                    {vaultAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.accountNickname ? `🏷️ [${acc.accountNickname}] ` : '🏦 '}
                        {acc.accountHolderName} • {maskAccountNumber(acc.bankAccountNumber)} ({acc.ifscCode})
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium pt-1">
                    <span>Instantly reuse your verified settlement details across all campaigns</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('NEW')}
                      className="text-[#FE4E1A] font-bold hover:underline cursor-pointer"
                    >
                      + Add different bank account
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-5 bg-[#FFF9F2] border-2 border-dashed border-[#0F534A]/40 text-center space-y-2">
                  <Landmark className="w-7 h-7 text-[#0F534A] mx-auto opacity-60" />
                  <p className="text-xs font-headline font-black uppercase text-[#121316]">
                    No accounts stored in your Account Vault yet
                  </p>
                  <p className="text-[11px] text-gray-600 max-w-sm mx-auto">
                    Enter your bank account details once and save them with a friendly name to your personal Account Vault for 1-click reuse.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('NEW')}
                    className="px-4 py-2 bg-[#4717AE] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0_#121316] hover:bg-[#38118d] cursor-pointer"
                  >
                    + Enter &amp; Save Bank Account
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: ENTER NEW BANK ACCOUNT */}
          {activeTab === 'NEW' && (
            <div className="space-y-4 animate-fadeIn">
              {/* Account Nickname / Name in Vault */}
              <div>
                <label className="block text-xs font-headline font-black uppercase text-[#4717AE] mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#FE4E1A]" />
                  Account Name / Label in Vault (Optional)
                </label>
                <input
                  type="text"
                  value={accountNickname}
                  onChange={(e) => setAccountNickname(e.target.value)}
                  placeholder="e.g. My Primary HDFC / Robotics Lab SBI Account / Personal Savings"
                  className="w-full px-3 py-2 border-2 border-[#4717AE] font-bold text-sm text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#4717AE] bg-[#FFF9F2]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                    Account Holder Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={accountHolderName}
                    onChange={(e) =>
                      onChange({
                        accountHolderName: e.target.value,
                        bankAccountNumber,
                        ifscCode,
                        upiId,
                      })
                    }
                    placeholder="e.g. Rahul Sharma / Robotics Lab NITK"
                    className="w-full px-3 py-2 border-2 border-[#0F534A] font-bold text-sm text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                    Bank Account Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={bankAccountNumber}
                    onChange={(e) =>
                      onChange({
                        accountHolderName,
                        bankAccountNumber: e.target.value,
                        ifscCode,
                        upiId,
                      })
                    }
                    placeholder="e.g. 501002348921"
                    className="w-full px-3 py-2 border-2 border-[#0F534A] font-bold text-sm text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                    IFSC / Routing Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={ifscCode}
                    onChange={(e) =>
                      onChange({
                        accountHolderName,
                        bankAccountNumber,
                        ifscCode: e.target.value.toUpperCase(),
                        upiId,
                      })
                    }
                    placeholder="e.g. HDFC0001234"
                    className="w-full px-3 py-2 border-2 border-[#0F534A] font-bold text-sm text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A] uppercase"
                  />
                </div>

                <div>
                  <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                    UPI VPA (Optional)
                  </label>
                  <input
                    type="text"
                    value={upiId || ''}
                    onChange={(e) =>
                      onChange({
                        accountHolderName,
                        bankAccountNumber,
                        ifscCode,
                        upiId: e.target.value,
                      })
                    }
                    placeholder="e.g. username@okhdfcbank"
                    className="w-full px-3 py-2 border-2 border-[#0F534A] font-medium text-sm text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A]"
                  />
                </div>
              </div>

              {/* Auto-Save to Account Vault Action */}
              <div className="p-3 bg-[#FFF9F2] border border-[#4717AE]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-[#121316] font-bold">
                  <input
                    type="checkbox"
                    checked={autoSaveToVault}
                    onChange={(e) => setAutoSaveToVault(e.target.checked)}
                    className="w-4 h-4 accent-[#4717AE]"
                  />
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-[#FE4E1A]" />
                    Auto-save this bank account to my personal Account Vault for future payouts
                  </span>
                </label>

                {accountHolderName && bankAccountNumber && ifscCode && (
                  <button
                    type="button"
                    onClick={handleSaveCurrentToVault}
                    className="px-3 py-1.5 bg-[#4717AE] hover:bg-[#38118d] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0_#121316] transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    + Save to Account Vault 🏦
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Account Vault Management Modal */}
      <AccountVaultModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          fetchVaultAccounts();
        }}
        onSelectAccount={(acc) => {
          handleSelectFromVault(acc.id);
        }}
      />
    </div>
  );
};
