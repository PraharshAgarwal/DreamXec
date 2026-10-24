import React, { useState } from 'react';
import { User, Building, Landmark, FolderLock, Sparkles, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';
import { DocVaultSelector } from '../vault/DocVaultSelector';
import { AccountVaultSelector } from '../vault/AccountVaultSelector';
import { DocVaultModal } from '../vault/DocVaultModal';

export interface BeneficiaryConfigData {
  recipientType: 'INDIVIDUAL' | 'ORGANIZATION';
  accountHolderName: string;
  bankAccountNumber: string;
  ifscCode: string;
  upiId?: string;
  kycDocumentUrl?: string;
  orgRegistrationDocUrl?: string;
  isMinor?: boolean;
  dateOfBirth?: string;
  guardianName?: string;
  guardianRelationship?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianConsentUrl?: string;
}

export interface BeneficiaryEscrowConfigProps {
  data: BeneficiaryConfigData;
  onChange: (updated: BeneficiaryConfigData) => void;
  className?: string;
}

export const BeneficiaryEscrowConfig: React.FC<BeneficiaryEscrowConfigProps> = ({
  data,
  onChange,
  className = '',
}) => {
  const [isCentralVaultOpen, setIsCentralVaultOpen] = useState(false);

  const updateField = (field: keyof BeneficiaryConfigData, val: any) => {
    onChange({ ...data, [field]: val });
  };

  const handleBankDetailsChange = (fields: {
    accountHolderName: string;
    bankAccountNumber: string;
    ifscCode: string;
    upiId?: string;
  }) => {
    onChange({
      ...data,
      accountHolderName: fields.accountHolderName,
      bankAccountNumber: fields.bankAccountNumber,
      ifscCode: fields.ifscCode,
      upiId: fields.upiId,
    });
  };

  return (
    <div className={`space-y-6 ${className}`}>
      
      {/* ── SINGLE UNIFIED DOC VAULT BANNER ── */}
      <div className="p-3.5 bg-[#FFF9F2] border-3 border-[#0F534A] shadow-[4px_4px_0px_#9EFC5F] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#0F534A] text-[#9EFC5F] border-2 border-[#121316]">
            <FolderLock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-headline font-black text-xs uppercase text-[#0F534A] tracking-wider flex items-center gap-1.5">
              Single Unified Doc Vault Active
              <span className="px-1.5 py-0.5 bg-[#9EFC5F] text-[#0F534A] border border-[#121316] text-[9px] font-black">
                REUSABLE
              </span>
            </h4>
            <p className="text-[11px] text-gray-700 font-medium">
              Every document you upload is stored in your personal vault and can be reused instantly in any field below.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsCentralVaultOpen(true)}
          className="px-3 py-1.5 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0px_#121316] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Manage My Doc Vault 📁
        </button>
      </div>

      {/* ── RECIPIENT TYPE SELECTOR ── */}
      <div>
        <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-2">
          Select Beneficiary Entity Type *
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={() => updateField('recipientType', 'INDIVIDUAL')}
            className={`p-5 border-3 cursor-pointer select-none transition-all ${
              data.recipientType === 'INDIVIDUAL'
                ? 'bg-[#FFF9F2] border-[#0F534A] shadow-[5px_5px_0px_#FE4E1A]'
                : 'bg-white border-gray-300 opacity-70 hover:opacity-100 hover:border-[#0F534A]'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#FE4E1A] text-white border-2 border-[#121316] flex items-center justify-center shadow-[2px_2px_0px_#121316]">
                <User className="w-5 h-5" />
              </div>
              <h4 className="font-headline font-black text-sm text-[#121316] uppercase">
                Individual Student / Lead
              </h4>
            </div>
            <p className="text-xs text-gray-600">
              Funds are disbursed directly to the student researcher's verified bank account upon Maker-Checker tranche sign-off.
            </p>
          </div>

          <div
            onClick={() => updateField('recipientType', 'ORGANIZATION')}
            className={`p-5 border-3 cursor-pointer select-none transition-all ${
              data.recipientType === 'ORGANIZATION'
                ? 'bg-[#FFF9F2] border-[#0F534A] shadow-[5px_5px_0px_#FE4E1A]'
                : 'bg-white border-gray-300 opacity-70 hover:opacity-100 hover:border-[#0F534A]'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-[#4717AE] text-white border-2 border-[#121316] flex items-center justify-center shadow-[2px_2px_0px_#121316]">
                <Building className="w-5 h-5" />
              </div>
              <h4 className="font-headline font-black text-sm text-[#121316] uppercase">
                University Club / Lab / NGO
              </h4>
            </div>
            <p className="text-xs text-gray-600">
              Funds are disbursed to an official institutional entity or faculty-managed university department account.
            </p>
          </div>
        </div>
      </div>

      {/* ── ACCOUNT VAULT & ESCROW PAYOUT DETAILS ── */}
      <AccountVaultSelector
        accountHolderName={data.accountHolderName}
        bankAccountNumber={data.bankAccountNumber}
        ifscCode={data.ifscCode}
        upiId={data.upiId}
        recipientType={data.recipientType}
        onChange={handleBankDetailsChange}
      />

      {/* ── DOC VAULT & KYC / INSTITUTIONAL VERIFICATION DROPZONES ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DocVaultSelector
          label="Govt ID / Student Identity Card *"
          description="Upload front & back scan of Govt ID / College ID or select from your central Doc Vault"
          suggestedType="GOVT_ID"
          maxSizeMB={15}
          value={data.kycDocumentUrl}
          onChange={(fileUrl) => updateField('kycDocumentUrl', fileUrl)}
          onRemove={() => updateField('kycDocumentUrl', '')}
        />

        <DocVaultSelector
          label={data.recipientType === 'ORGANIZATION' ? 'Club Registration Cert *' : 'University Endorsement Letter'}
          description="Institutional approval letter or official endorsement letter (PDF / Doc)"
          suggestedType={data.recipientType === 'ORGANIZATION' ? 'ORGANIZATION_REGISTRATION' : 'UNIVERSITY_ENDORSEMENT'}
          maxSizeMB={20}
          value={data.orgRegistrationDocUrl}
          onChange={(fileUrl) => updateField('orgRegistrationDocUrl', fileUrl)}
          onRemove={() => updateField('orgRegistrationDocUrl', '')}
        />
      </div>

      {/* ── MINOR GUARDIAN CONSENT & AT-NEED KYC (O8, K11) ── */}
      <div className="border-3 border-[#121316] bg-white p-5 shadow-[4px_4px_0_#4717AE] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[#4717AE] text-white border-2 border-[#121316]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-headline font-black text-xs uppercase text-[#121316]">
                Minor Student Creator Verification &amp; Guardian Consent
              </h4>
              <p className="text-[11px] text-gray-600 font-medium">
                Statutory compliance under Indian contract law for student innovators under 18 years of age (O8, K11)
              </p>
            </div>
          </div>

          <label className="flex items-center gap-2 bg-[#FCFBF7] border-2 border-[#121316] px-3 py-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={!!data.isMinor}
              onChange={(e) => updateField('isMinor', e.target.checked)}
              className="w-4 h-4 accent-[#FE4E1A] cursor-pointer"
            />
            <span className="text-xs font-headline font-black uppercase text-[#FE4E1A]">Creator is under 18</span>
          </label>
        </div>

        {data.isMinor && (
          <div className="space-y-4 pt-3 border-t-2 border-gray-100 bg-[#FFF9F2] p-4 border-2 border-[#FE4E1A]">
            <div className="p-3 bg-[#FFDD33]/40 border-2 border-[#121316] text-xs font-medium text-[#121316] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FE4E1A] shrink-0" />
              <span>
                <strong>Parental / Guardian Co-Signer Required:</strong> Under Indian contract law, disbursements to minors require signed guardian consent and adult co-signatory verification.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-headline font-black uppercase text-[#0F534A] mb-1">
                  Parent / Guardian Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={data.guardianName || ''}
                  onChange={(e) => updateField('guardianName', e.target.value)}
                  placeholder="e.g. Ramesh Kumar Patel"
                  className="w-full p-2.5 text-xs border-2 border-[#121316] bg-white font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-headline font-black uppercase text-[#0F534A] mb-1">
                  Relationship *
                </label>
                <select
                  value={data.guardianRelationship || 'PARENT'}
                  onChange={(e) => updateField('guardianRelationship', e.target.value)}
                  className="w-full p-2.5 text-xs border-2 border-[#121316] bg-white font-bold focus:outline-none"
                >
                  <option value="PARENT">Parent (Father / Mother)</option>
                  <option value="LEGAL_GUARDIAN">Court Appointed Legal Guardian</option>
                  <option value="FACULTY_SPONSOR">Faculty Advisor / Department Sponsor</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-headline font-black uppercase text-[#0F534A] mb-1">
                  Guardian Emergency Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={data.guardianPhone || ''}
                  onChange={(e) => updateField('guardianPhone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full p-2.5 text-xs border-2 border-[#121316] bg-white font-medium focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-headline font-black uppercase text-[#0F534A] mb-1">
                  Guardian Email Address
                </label>
                <input
                  type="email"
                  value={data.guardianEmail || ''}
                  onChange={(e) => updateField('guardianEmail', e.target.value)}
                  placeholder="guardian@example.com"
                  className="w-full p-2.5 text-xs border-2 border-[#121316] bg-white font-medium focus:outline-none"
                />
              </div>
            </div>

            <div>
              <DocVaultSelector
                label="Parent / Guardian Signed Consent Form (O8, K11) *"
                description="Upload signed consent document with guardian ID proof attached (PDF / JPG)"
                suggestedType="GOVT_ID"
                maxSizeMB={15}
                value={data.guardianConsentUrl}
                onChange={(fileUrl) => updateField('guardianConsentUrl', fileUrl)}
                onRemove={() => updateField('guardianConsentUrl', '')}
              />
            </div>
          </div>
        )}
      </div>

      {/* Central Doc Vault Modal */}
      <DocVaultModal
        isOpen={isCentralVaultOpen}
        onClose={() => setIsCentralVaultOpen(false)}
      />
    </div>
  );
};
