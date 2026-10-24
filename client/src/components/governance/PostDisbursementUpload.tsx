import React, { useState } from 'react';
import { Receipt, DollarSign, Upload, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { MediaDocumentUpload } from '../common/MediaDocumentUpload';
import { TactileNeobrutalistButton } from '../ui/TactileNeobrutalistButton';

export interface UtilizationClaimData {
  milestoneId: string;
  disbursementId?: string;
  vendorName: string;
  invoiceNumber: string;
  amountClaimed: number;
  currency?: string;
  receiptFileUrl: string;
  expenseCategory: string;
  notes?: string;
}

export interface PostDisbursementUploadProps {
  milestoneId: string;
  milestoneTitle: string;
  releasedAmount: number;
  currency?: string;
  onSubmitClaim: (claim: UtilizationClaimData) => Promise<void>;
  className?: string;
}

export const PostDisbursementUpload: React.FC<PostDisbursementUploadProps> = ({
  milestoneId,
  milestoneTitle,
  releasedAmount,
  currency = 'INR',
  onSubmitClaim,
  className = '',
}) => {
  const [vendorName, setVendorName] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amountClaimed, setAmountClaimed] = useState<number>(releasedAmount);
  const [expenseCategory, setExpenseCategory] = useState('EQUIPMENT_PROCUREMENT');
  const [receiptFileUrl, setReceiptFileUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim() || !invoiceNumber.trim() || !amountClaimed || amountClaimed <= 0) {
      toast.error('Please complete all vendor and invoice fields.');
      return;
    }
    if (!receiptFileUrl) {
      toast.error('Please upload the vendor invoice or receipt PDF/image.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmitClaim({
        milestoneId,
        vendorName,
        invoiceNumber,
        amountClaimed,
        currency,
        receiptFileUrl,
        expenseCategory,
        notes,
      });
      toast.success('Utilization proof submitted! Forwarded to compliance auditor.');
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit utilization proof.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`p-6 bg-white border-4 border-[#0F534A] shadow-[6px_6px_0px_#0F534A] space-y-6 ${className}`}>
      {/* Header */}
      <div className="pb-4 border-b-3 border-[#0F534A]">
        <div className="flex items-center gap-2 mb-1 text-xs font-headline font-black uppercase text-[#FE4E1A]">
          <Receipt className="w-4 h-4" /> Post-Disbursement Utilization Proof
        </div>
        <h3 className="font-headline font-black text-xl uppercase text-[#121316]">
          Submit Expense Receipts for {milestoneTitle}
        </h3>
        <p className="text-xs text-gray-600 font-medium mt-1">
          Tranche Disbursed: <strong className="text-[#0F534A]">₹{releasedAmount.toLocaleString()}</strong>. Upload vendor invoices to reconcile expenditures.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
              Vendor / Merchant Name *
            </label>
            <input
              type="text"
              value={vendorName}
              onChange={(e) => setVendorName(e.target.value)}
              placeholder="e.g. Robokits India Pvt Ltd"
              className="w-full px-3 py-2 border-2 border-[#0F534A] font-bold text-sm text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A]"
            />
          </div>

          <div>
            <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
              Invoice / Bill Number *
            </label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-2026-8941"
              className="w-full px-3 py-2 border-2 border-[#0F534A] font-bold text-sm text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A]"
            />
          </div>

          <div>
            <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
              Amount Claimed ({currency}) *
            </label>
            <input
              type="number"
              value={amountClaimed || ''}
              onChange={(e) => setAmountClaimed(Number(e.target.value))}
              placeholder="e.g. 25000"
              className="w-full px-3 py-2 border-2 border-[#0F534A] font-bold text-sm text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A]"
            />
          </div>

          <div>
            <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
              Expense Category *
            </label>
            <select
              value={expenseCategory}
              onChange={(e) => setExpenseCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border-2 border-[#0F534A] font-bold text-xs uppercase text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A]"
            >
              <option value="EQUIPMENT_PROCUREMENT">Equipment & Hardware</option>
              <option value="LAB_TESTING">Lab Testing & Fabrication</option>
              <option value="SOFTWARE_LICENSES">Cloud & Software Licenses</option>
              <option value="TRAVEL_LOGISTICS">Field Travel & Competition</option>
              <option value="CONSUMABLES">Raw Materials & Consumables</option>
            </select>
          </div>
        </div>

        {/* Upload Receipt */}
        <MediaDocumentUpload
          label="Vendor Invoice / Receipt File (PDF or JPG) *"
          description="Upload official GST/Tax invoice clearly showing vendor, amount, and items purchased."
          acceptedTypes="document"
          maxSizeMB={15}
          folder="campaigns/utilization"
          value={receiptFileUrl}
          onUploadSuccess={(res) => setReceiptFileUrl(res.secureUrl)}
          onRemove={() => setReceiptFileUrl('')}
        />

        <div>
          <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
            Itemized Expense Description / Notes
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Briefly itemize what components or services were purchased..."
            className="w-full px-3 py-2 border-2 border-[#0F534A] text-xs font-medium text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A]"
          />
        </div>

        <div className="pt-3 border-t-2 border-dashed border-gray-200 flex items-center justify-end">
          <TactileNeobrutalistButton
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Submit Expense Proof for Audit ✦
          </TactileNeobrutalistButton>
        </div>
      </form>
    </div>
  );
};
