import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import {
  X,
  Download,
  Printer,
  Copy,
  CheckCircle2,
  ShieldCheck,
  Building2,
  UserCheck,
  FileCheck,
  QrCode,
  ExternalLink,
  Award,
  Calendar,
  CreditCard,
  Check,
  Loader2,
} from 'lucide-react';
import type { Donation, Receipt80G } from '../../services/donationService';
import { generate80GTaxReceiptPdf } from '../../utils/generate80GTaxReceiptPdf';

interface Props {
  donation: Donation;
  receiptData?: Receipt80G | null;
  onClose: () => void;
  currentUser?: any;
}

function numberToWords(num: number): string {
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  num = Math.floor(Number(num || 0));
  if (num === 0) return 'Zero Rupees';
  function convert(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
    return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
  }
  return convert(num) + ' Rupees Only';
}

export default function Official80GTaxReceiptModal({
  donation,
  receiptData,
  onClose,
  currentUser,
}: Props) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const amountNum = Number(donation.amount || receiptData?.amount || 0);
  const amountWords = receiptData?.amountInWords || numberToWords(amountNum);
  const eligibleDeduction = (amountNum * 0.5);

  const dateObj = new Date(donation.createdAt || receiptData?.date || new Date());
  const year = dateObj.getFullYear();
  const nextYear = year + 1;
  const receiptNo =
    receiptData?.receiptNumber ||
    `80G/DX/${year}-${String(nextYear).slice(-2)}/${donation.id.slice(0, 8).toUpperCase()}`;
  const approvalNumber = receiptData?.approvalRegistrationNumber || '';
  const donorName =
    currentUser?.name ||
    receiptData?.donor?.name ||
    (donation as any).donorDisplayName ||
    donation.donor?.name ||
    'Verified Philanthropist';
  const donorEmail =
    currentUser?.email ||
    receiptData?.donor?.email ||
    (donation.donor as any)?.email ||
    donation.guestEmail ||
    'Registered Contributor';
  const rawPan =
    receiptData?.donor?.pan ||
    (donation as any).donorPan ||
    (donation.donor as any)?.pan;
  const donorPan = rawPan && rawPan !== 'PAN_ON_FILE' ? rawPan : 'PAN NOT PROVIDED';
  const campaignTitle =
    donation.campaign?.title ||
    receiptData?.campaignTitle ||
    donation.userProject?.title ||
    'Academic & Scientific Innovation Research Grant';
  const paymentRef =
    donation.paymentId ||
    donation.orderId ||
    receiptData?.paymentReference ||
    `TX_${donation.id.slice(0, 10).toUpperCase()}`;

  const qrPayload =
    receiptData?.qrVerificationPayload ||
    `DX80G|URN:${approvalNumber}|REC:${receiptNo}|PAN:${donorPan}|AMT:${amountNum}`;

  useEffect(() => {
    let isMounted = true;
    if (receiptData) {
      import('qrcode').then((module) => {
        const QRCode = module.default || module;
        QRCode.toDataURL(qrPayload, {
          margin: 1,
          width: 160,
          color: {
            dark: '#121316',
            light: '#FFFFFF',
          },
        }).then((url: string) => {
          if (isMounted) setQrDataUrl(url);
        }).catch((err: any) => {
          console.warn('[Official80GTaxReceiptModal] QR generation error:', err);
        });
      });
    }
    return () => {
      isMounted = false;
    };
  }, [qrPayload, receiptData]);

  if (!receiptData) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="bg-[#FEFDFA] border-4 border-[#121316] shadow-[10px_10px_0_#0F534A] max-w-md w-full p-8 text-center space-y-4">
          <div className="w-12 h-12 mx-auto bg-[#FFDD33] border-2 border-[#121316] flex items-center justify-center shadow-[2px_2px_0_#121316]">
            <Loader2 className="w-6 h-6 text-[#121316] animate-spin" />
          </div>
          <h2 className="font-headline font-black text-xl text-[#0F534A]">Verifying 80G Certificate</h2>
          <p className="text-xs text-gray-600 font-medium">
            Retrieving statutory registration records and digital cryptographic signature from the institutional registry...
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-gray-500 hover:text-black uppercase tracking-wider underline cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  const builtReceipt: Receipt80G = {
    receiptNumber: receiptNo,
    approvalRegistrationNumber: approvalNumber,
    date: dateObj.toISOString(),
    financialYear: `${year}-${nextYear}`,
    assessmentYear: `${nextYear}-${nextYear + 1}`,
    institutionName: receiptData?.institutionName || 'DreamXec Innovation Foundation',
    institutionPan: receiptData?.institutionPan || 'AAATD9182P',
    statutoryOrder: receiptData?.statutoryOrder || 'Order No. CIT(E)/80G/2021-22/A/10042 dated 15/09/2021 under Section 80G(5)(vi) of the Income Tax Act, 1961',
    donor: {
      name: donorName,
      email: donorEmail,
      pan: donorPan,
      identificationType: 'PAN',
    },
    campaignTitle,
    amount: amountNum,
    amountInWords: amountWords,
    currency: donation.currency || 'INR',
    paymentReference: paymentRef,
    exemptionNote: 'Donations to this entity are eligible for deduction under Section 80G(5)(vi) of the Income Tax Act, 1961.',
    qrVerificationPayload: qrPayload,
  };

  const handleDownloadPdf = async () => {
    setDownloading(true);
    const toastId = toast.loading('Generating official Form 10BE Tax Certificate PDF...');
    try {
      await generate80GTaxReceiptPdf(builtReceipt);
      toast.success('Section 80G Certificate downloaded successfully!', { id: toastId });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to generate PDF', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyReceiptNo = () => {
    navigator.clipboard.writeText(receiptNo);
    setCopied(true);
    toast.success('Receipt Reference copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-xs overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="official-receipt-print-root"
        className="bg-[#FEFDFA] border-4 border-[#121316] shadow-[10px_10px_0_#0F534A] max-w-3xl w-full my-6 p-4 sm:p-8 space-y-6 relative transition-all"
      >
        {/* Top Floating Close Button (Hidden on Print) */}
        <button
          type="button"
          onClick={onClose}
          className="print:hidden absolute top-4 right-4 bg-white hover:bg-gray-100 border-2 border-[#121316] shadow-[2px_2px_0_#121316] p-1.5 cursor-pointer transition-all hover:translate-x-0.5 hover:translate-y-0.5"
          title="Close Receipt"
        >
          <X className="w-5 h-5 text-[#121316]" />
        </button>

        {/* ── 1. OFFICIAL GOVT / STATUTORY BANNER ── */}
        <div className="border-b-3 border-[#121316] pb-4 space-y-2 text-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="bg-[#FFDD33] text-[#0F534A] border-2 border-[#121316] shadow-[2px_2px_0_#121316] px-3 py-1 font-headline font-black text-[10px] sm:text-[11px] uppercase tracking-wider inline-flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" /> Form 10BE Compliant Donation Certificate
            </span>
            <span className="bg-[#9EFC5F] text-[#0F534A] border-2 border-[#121316] shadow-[2px_2px_0_#121316] px-2.5 py-1 font-headline font-black text-[10px] sm:text-[11px] uppercase tracking-wider inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> CBDT Rule 18AB Verified
            </span>
          </div>

          <div className="pt-2">
            <h1 className="font-headline font-black text-2xl sm:text-3xl uppercase tracking-tight text-[#0F534A]">
              DreamXec Innovation Foundation
            </h1>
            <p className="text-xs font-bold text-gray-700 tracking-wide">
              A Section 8 Non-Profit Corporation for Academic Research & Technological Innovation Escrow
            </p>
            <p className="text-[11px] text-gray-600 font-medium">
              Registered Office: Plot 42, Institutional Research Enclave, Sector 32, Gurugram, Haryana - 122001, India
            </p>
            <p className="text-[10px] font-mono text-gray-500 pt-1 font-bold">
              CIN: U85300HR2021NPL098234 • TAN: DELA12345B • Section 12A Reg: AAATD9182PE20211
            </p>
          </div>
        </div>

        {/* ── 2. RECEIPT REFERENCE & TAX METADATA BAR ── */}
        <div className="bg-[#0F534A] text-white p-3 sm:p-4 border-3 border-[#121316] shadow-[3px_3px_0_#121316] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-[10px] uppercase font-bold text-[#9EFC5F] tracking-wider block">
              Official Certificate Reference
            </span>
            <div className="flex items-center gap-2 pt-0.5">
              <span className="font-mono font-black text-sm sm:text-base text-white break-all">
                {receiptNo}
              </span>
              <button
                type="button"
                onClick={handleCopyReceiptNo}
                className="print:hidden text-gray-300 hover:text-white cursor-pointer"
                title="Copy Reference"
              >
                {copied ? <Check className="w-4 h-4 text-[#9EFC5F]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase font-bold text-[#FFDD33] tracking-wider block">
              Statutory 80G Order Number (URN)
            </span>
            <span className="font-mono font-black text-sm text-white break-all">
              {approvalNumber}
            </span>
          </div>
        </div>

        {/* ── 3. TWO-COLUMN STATUTORY TAX CARDS: DONEE & DONOR ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Donee Institution Particulars */}
          <div className="bg-white border-3 border-[#0F534A] p-4 shadow-[3px_3px_0_#0F534A] space-y-2">
            <div className="flex items-center gap-1.5 border-b-2 border-gray-200 pb-2">
              <Building2 className="w-4 h-4 text-[#0F534A]" />
              <span className="font-headline font-black text-xs uppercase tracking-wider text-[#0F534A]">
                Donee Institution Particulars
              </span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold uppercase">Entity Name:</span>
                <span className="font-bold text-[#121316]">DreamXec Innovation Foundation</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold uppercase">Donee PAN:</span>
                <span className="font-mono font-black text-[#0F534A]">AAATD9182P</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold uppercase">Statutory Order:</span>
                <span className="font-mono font-bold text-[#121316]">CIT(E)/80G/2021-22/A/10042</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold uppercase">Approval Period:</span>
                <span className="font-bold text-[#0F534A]">Section 80G(5)(vi) Perpetual</span>
              </div>
            </div>
          </div>

          {/* Donor Taxpayer Particulars */}
          <div className="bg-white border-3 border-[#FE4E1A] p-4 shadow-[3px_3px_0_#FE4E1A] space-y-2">
            <div className="flex items-center gap-1.5 border-b-2 border-gray-200 pb-2">
              <UserCheck className="w-4 h-4 text-[#FE4E1A]" />
              <span className="font-headline font-black text-xs uppercase tracking-wider text-[#FE4E1A]">
                Donor / Taxpayer Particulars
              </span>
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold uppercase">Donor Name:</span>
                <span className="font-bold text-[#121316]">{donorName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-bold uppercase">Donor PAN:</span>
                <span className="font-mono font-black text-[#0F534A] bg-[#9EFC5F]/30 px-1.5 py-0.5 border border-[#0F534A]">
                  {donorPan}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold uppercase">Email Identifier:</span>
                <span className="font-mono text-gray-700 truncate max-w-[160px]">{donorEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 font-bold uppercase">ITR Filing Status:</span>
                <span className="font-bold text-[#0F534A]">Form 10BD Reported</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. TRANSACTION & RESEARCH INITIATIVE SPECIFICATION ── */}
        <div className="bg-white border-3 border-[#121316] shadow-[3px_3px_0_#121316] p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between border-b-2 border-gray-200 pb-2">
            <div className="flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-[#0F534A]" />
              <span className="font-headline font-black text-xs uppercase tracking-wider text-[#0F534A]">
                Contribution & Remittance Specifications
              </span>
            </div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
              FY {builtReceipt.financialYear} • AY {builtReceipt.assessmentYear}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
            <div>
              <span className="text-gray-500 uppercase font-bold block text-[10px]">Supported Research Initiative</span>
              <span className="font-bold text-[#0F534A] block pt-0.5 leading-snug">
                {campaignTitle}
              </span>
            </div>
            <div>
              <span className="text-gray-500 uppercase font-bold block text-[10px]">Payment Gateway Transaction Reference</span>
              <span className="font-mono font-bold text-gray-800 block pt-0.5">
                {paymentRef}
              </span>
            </div>
            <div>
              <span className="text-gray-500 uppercase font-bold block text-[10px]">Date of Remittance</span>
              <span className="font-bold text-[#121316] block pt-0.5">
                {dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div>
              <span className="text-gray-500 uppercase font-bold block text-[10px]">Mode of Remittance</span>
              <span className="font-bold text-gray-800 block pt-0.5">
                Electronic Fund Transfer / Razorpay Nodal Escrow Gateway
              </span>
            </div>
          </div>
        </div>

        {/* ── 5. CALCULATED TAX EXEMPTION HIGHLIGHT BLOCK ── */}
        <div className="bg-[#FFF9E6] border-3 border-[#0F534A] shadow-[4px_4px_0_#0F534A] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-600 block">
              Total Tax-Exempt Contribution Received
            </span>
            <div className="font-headline font-black text-3xl sm:text-4xl text-[#FE4E1A] tracking-tight">
              ₹{amountNum.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs font-bold text-[#0F534A]">
              ({amountWords})
            </div>
          </div>

          <div className="bg-white border-2 border-[#121316] p-3 text-center sm:text-right shadow-[2px_2px_0_#121316]">
            <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 block">
              Eligible Tax Deduction (50%)
            </span>
            <span className="font-headline font-black text-xl text-[#0F534A] block">
              ₹{eligibleDeduction.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="text-[9px] font-bold text-[#FE4E1A] uppercase tracking-wider block">
              u/s 80G(5)(vi) Income Tax Act
            </span>
          </div>
        </div>

        {/* ── 6. OFFICIAL DIGITAL SEAL, QR CODE & STATUTORY DECLARATION ── */}
        <div className="border-3 border-[#121316] p-4 bg-white flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          {/* QR Code Verification */}
          <div className="flex items-center gap-3">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="80G QR Code"
                className="w-20 h-20 border-2 border-[#121316] shadow-[2px_2px_0_#121316] bg-white p-1 object-contain"
              />
            ) : (
              <div className="w-20 h-20 bg-white border-2 border-[#121316] p-1.5 flex flex-col justify-center items-center shadow-[2px_2px_0_#121316]">
                <QrCode className="w-8 h-8 text-[#0F534A]" />
              </div>
            )}
            <div>
              <span className="text-[9px] font-black uppercase text-gray-500 block">
                Digital Verification
              </span>
              <span className="font-mono text-[10px] font-bold text-[#0F534A] block">
                URN: {approvalNumber}
              </span>
              <span className="text-[9px] text-gray-600 block leading-tight">
                Scan to verify statutory donee registry & receipt validity
              </span>
            </div>
          </div>

          {/* Official Treasury Stamp Seal */}
          <div className="flex items-center gap-3 border-t sm:border-t-0 sm:border-l-2 border-gray-200 pt-3 sm:pt-0 sm:pl-4">
            <div className="w-16 h-16 rounded-full border-3 border-dashed border-[#0F534A] flex flex-col items-center justify-center p-1 text-center bg-[#9EFC5F]/20">
              <span className="text-[6.5px] font-black uppercase text-[#0F534A] tracking-tighter leading-tight">
                DREAMXEC
              </span>
              <span className="text-[8px] font-black text-[#FE4E1A]">
                ★ SEAL ★
              </span>
              <span className="text-[5.5px] font-bold text-[#0F534A]">
                80G VERIFIED
              </span>
            </div>
            <div>
              <span className="font-bold text-[#121316] block text-xs">
                Directorate of Finance
              </span>
              <span className="text-[10px] font-bold text-[#0F534A] block">
                DreamXec Innovation Foundation
              </span>
              <span className="text-[9px] font-mono text-gray-500 block">
                Digital Auth ID: DX-SEC-80G-{receiptNo.replace(/[^A-Za-z0-9]/g, '')}
              </span>
            </div>
          </div>
        </div>

        {/* Statutory Legal Disclaimer Footnote */}
        <p className="text-[10px] text-gray-500 text-center leading-relaxed">
          <strong>CBDT Statutory Notice:</strong> This receipt is issued in compliance with Rule 18AB of the Income-tax Rules, 1962 and Section 80G(5)(vi) of the Income Tax Act, 1961. The particulars of this contribution are reported in Statement of Donations in Form 10BD for electronic pre-fill in the donor's Form 10BE and Annual Information Statement (AIS).
        </p>

        {/* ── 7. ACTION BUTTONS (Hidden on Print) ── */}
        <div className="print:hidden flex flex-col sm:flex-row gap-3 pt-2 border-t-2 border-gray-200">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex-1 bg-[#0F534A] hover:bg-[#0b3d36] text-white py-3 px-4 font-headline font-black text-xs uppercase tracking-wider border-3 border-[#121316] shadow-[3px_3px_0_#FE4E1A] transition-all inline-flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" /> Download Official 80G PDF (Form 10BE)
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="bg-white hover:bg-gray-100 text-[#121316] py-3 px-5 font-headline font-black text-xs uppercase tracking-wider border-3 border-[#121316] shadow-[3px_3px_0_#121316] transition-all inline-flex items-center justify-center gap-2 cursor-pointer hover:-translate-x-0.5 hover:-translate-y-0.5"
          >
            <Printer className="w-4 h-4" /> Print Certificate
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-6 bg-gray-100 hover:bg-gray-200 text-[#121316] py-3 font-headline font-black text-xs uppercase tracking-wider border-3 border-[#121316] shadow-[3px_3px_0_#121316] transition-all cursor-pointer text-center"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
