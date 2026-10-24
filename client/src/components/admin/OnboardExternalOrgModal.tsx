import React, { useState } from 'react';
import { X, Building2, User, Mail, FileText, ShieldCheck, CheckCircle2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiRequest from '../../services/api';

interface OnboardExternalOrgModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (org: any) => void;
}

export const OnboardExternalOrgModal: React.FC<OnboardExternalOrgModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Organisation name is required.');
      return;
    }
    if (!contactName.trim()) {
      setErrorMsg('Point of contact (POC) name is required.');
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      setErrorMsg('Valid point of contact email is required.');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please provide a brief description of the organisation / laboratory facilities.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await apiRequest<any>('/dx-admin/onboarding/external-orgs', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          contactName: contactName.trim(),
          contactEmail: contactEmail.trim().toLowerCase(),
          description: description.trim(),
        }),
      });

      toast.success(`External organisation "${name.trim()}" onboarded successfully!`, {
        icon: '🎉',
        style: {
          border: '2px solid #121316',
          boxShadow: '4px 4px 0px #121316',
          fontFamily: 'Poppins, sans-serif',
          fontWeight: 700,
        },
      });

      if (onSuccess) {
        onSuccess(response?.data?.organization);
      }

      // Reset form
      setName('');
      setContactName('');
      setContactEmail('');
      setDescription('');
      onClose();
    } catch (err: any) {
      console.error('[OnboardExternalOrgModal] Error:', err);
      const msg = err.message || 'Failed to onboard external organisation';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-[#FCFBF7] w-full max-w-xl max-h-[92vh] overflow-y-auto border-3 border-[#121316] shadow-[8px_8px_0px_#121316] relative text-[#121316]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="bg-[#0F534A] text-white p-5 sm:p-6 border-b-3 border-[#121316] relative">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 bg-[#FFDD33] text-[#121316] border border-[#121316] font-headline font-black text-[10px] uppercase tracking-wider">
              Platform Governance · RBAC
            </span>
            <span className="px-2.5 py-0.5 bg-[#FE4E1A] text-white font-headline font-black text-[10px] uppercase tracking-wider">
              External Partner
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-headline font-black uppercase tracking-tight text-white flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-[#9EFC5F]" />
            Onboard External Organisation
          </h2>

          <p className="font-brush text-lg text-[#FFDD33] mt-0.5">
            "Dedicated dual-custody access for labs & external providers"
          </p>

          <button
            onClick={onClose}
            disabled={submitting}
            className="absolute top-4 right-4 p-2 bg-white text-[#121316] border-2 border-[#121316] hover:bg-[#FE4E1A] hover:text-white transition-colors shadow-[2px_2px_0px_#121316] cursor-pointer"
            aria-label="Close Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          {/* Permission Notice Banner */}
          <div className="p-4 bg-[#FFF9F2] border-2 border-[#121316] shadow-[3px_3px_0px_#FE4E1A]/40 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#FE4E1A] shrink-0 mt-0.5" />
            <div className="text-xs leading-relaxed">
              <span className="font-headline font-black uppercase text-[#FE4E1A] block mb-0.5">
                Segregated Access Permissions
              </span>
              <p className="text-gray-700 font-body">
                External members will be provisioned with the <strong className="text-[#0F534A]">EXTERNAL_ORG_MEMBER</strong> role. They will strictly only see the <strong className="text-[#121316]">Services</strong> and <strong className="text-[#121316]">Orders</strong> tabs with a workflow builder to manage catalog offerings.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-100 border-2 border-red-600 text-red-900 text-xs font-headline font-bold">
              {errorMsg}
            </div>
          )}

          {/* Organisation Name */}
          <div>
            <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#0F534A]" />
              Organisation / Lab Name <span className="text-[#FE4E1A]">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Apex Bio-Analytical Testing Core"
              required
              className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-body text-sm text-[#121316] placeholder-gray-400 focus:outline-none focus:border-[#FE4E1A] shadow-[2px_2px_0px_#121316]"
            />
          </div>

          {/* Point of Contact Name & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-[#0F534A]" />
                Point of Contact (POC) Name <span className="text-[#FE4E1A]">*</span>
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="e.g. Dr. Ramesh Kumar"
                required
                className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-body text-sm text-[#121316] placeholder-gray-400 focus:outline-none focus:border-[#FE4E1A] shadow-[2px_2px_0px_#121316]"
              />
            </div>

            <div>
              <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#0F534A]" />
                Point of Contact Email <span className="text-[#FE4E1A]">*</span>
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="e.g. ramesh@apexbiocore.org"
                required
                className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-body text-sm text-[#121316] placeholder-gray-400 focus:outline-none focus:border-[#FE4E1A] shadow-[2px_2px_0px_#121316]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-headline font-black uppercase tracking-wider text-[#121316] mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#0F534A]" />
              Organisation & Facilities Description <span className="text-[#FE4E1A]">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe instrument capabilities, accreditations (NABL, ISO, GLP), testing specialities, and turnaround capabilities..."
              required
              className="w-full px-3.5 py-2.5 bg-white border-2 border-[#121316] font-body text-sm text-[#121316] placeholder-gray-400 focus:outline-none focus:border-[#FE4E1A] shadow-[2px_2px_0px_#121316] resize-none"
            />
          </div>

          {/* Action Footer */}
          <div className="pt-4 border-t-2 border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 bg-white border-2 border-[#121316] text-[#121316] font-headline font-bold text-xs uppercase hover:bg-gray-100 shadow-[2px_2px_0px_#121316] transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-[#FE4E1A] hover:bg-[#e03d0d] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase tracking-wider shadow-[4px_4px_0px_#121316] active:translate-x-[1px] active:translate-y-[1px] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Onboarding...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Onboard</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
