import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Copy,
  Check,
  Download,
  Printer,
  Share2,
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Award,
  FileText,
} from 'lucide-react';
import { getDonationStatus } from '../../services/donationService';
import { generateInvoicePdf } from '../../utils/generateInvoicePdf';
import { generate80GTaxReceiptPdf } from '../../utils/generate80GTaxReceiptPdf';
import toast from 'react-hot-toast';

export interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  campaignTitle: string;
  orderId: string;
  paymentId?: string;
  donorName?: string;
  isAnonymous?: boolean;
  status?: 'PROCESSING' | 'SETTLED' | 'FAILED';
  initialStatus?: 'PROCESSING' | 'SETTLED';
  onViewCampaign?: () => void;
  onSettled?: () => void;
}

export const PaymentConfirmationModal: React.FC<PaymentConfirmationModalProps> = ({
  isOpen,
  onClose,
  amount,
  campaignTitle,
  orderId,
  paymentId = '',
  donorName,
  isAnonymous = false,
  status: controlledStatus,
  initialStatus,
  onViewCampaign,
  onSettled,
}) => {
  const [copied, setCopied] = useState(false);
  const [isPrintingAudio, setIsPrintingAudio] = useState(false);
  const [localStatus, setLocalStatus] = useState<'PROCESSING' | 'SETTLED' | 'FAILED'>(
    controlledStatus || initialStatus || 'PROCESSING'
  );
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [activePaymentId, setActivePaymentId] = useState(paymentId || (orderId ? `pay_${orderId.slice(-8)}` : ''));
  const [showShareMenu, setShowShareMenu] = useState(false);

  // Effective status
  const effectiveStatus = controlledStatus !== undefined ? controlledStatus : localStatus;
  const isSettled = effectiveStatus === 'SETTLED';
  const isProcessing = effectiveStatus === 'PROCESSING';
  const isFailed = effectiveStatus === 'FAILED';

  const onSettledRef = useRef(onSettled);
  onSettledRef.current = onSettled;

  // Sound effect helper (tactile POS terminal printer click)
  const playTactilePrintSound = () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.09);
    } catch {
      // Audio context may be restricted by browser policy
    }
  };

  // Sync state on open
  useEffect(() => {
    if (!isOpen) return;

    if (controlledStatus) {
      setLocalStatus(controlledStatus);
      if (controlledStatus === 'SETTLED') {
        onSettledRef.current?.();
      }
    } else {
      const init = initialStatus || 'PROCESSING';
      setLocalStatus(init);
    }

    // Play subtle mechanical print cue on open
    playTactilePrintSound();
  }, [isOpen, controlledStatus, initialStatus]);

  // Sync payment ID when prop updates
  useEffect(() => {
    if (paymentId) {
      setActivePaymentId(paymentId);
    }
  }, [paymentId]);

  // Polling fallback if uncontrolled and orderId is present (awaits Razorpay webhook up to 30 mins)
  useEffect(() => {
    if (!isOpen || !orderId || controlledStatus || isSettled) return;

    let isSubscribed = true;
    let pollCount = 0;

    const checkStatus = async () => {
      try {
        const res = await getDonationStatus(orderId);
        const resolved = res?.data;
        if (!isSubscribed) return true;

        if (resolved?.isSettled || resolved?.status === 'SUCCEEDED') {
          setLocalStatus('SETTLED');
          if (resolved.paymentId) setActivePaymentId(resolved.paymentId);
          if (typeof window !== 'undefined') {
            if (resolved.campaign) {
              window.dispatchEvent(
                new CustomEvent('dx:campaign_updated', {
                  detail: { campaign: resolved.campaign, orderId },
                })
              );
            }
            window.dispatchEvent(
              new CustomEvent('dx:transaction_updated', {
                detail: {
                  campaign: resolved.campaign,
                  orderId,
                  paymentId: resolved.paymentId,
                  timestamp: Date.now(),
                },
              })
            );
            window.dispatchEvent(
              new CustomEvent('dx:ledger_updated', {
                detail: {
                  orderId,
                  paymentId: resolved.paymentId,
                  timestamp: Date.now(),
                },
              })
            );
          }
          onSettledRef.current?.();
          return true;
        } else if (resolved?.status === 'FAILED') {
          setLocalStatus('FAILED');
          if (resolved.error) {
            setStatusMessage(resolved.error);
          }
          return true;
        }
      } catch (err) {
        // Silent catch during polling
      }
      return false;
    };

    const timer = setTimeout(() => {
      checkStatus().then((done) => {
        if (done || !isSubscribed) return;

        // Poll every 3s while waiting for Razorpay webhook up to 30 minutes (600 polls)
        const interval = setInterval(async () => {
          pollCount++;
          const finished = await checkStatus();
          // Auto-mark failed after 30 minutes without webhook
          if (finished || pollCount >= 600 || !isSubscribed) {
            clearInterval(interval);
            if (pollCount >= 600 && !finished && isSubscribed) {
              setLocalStatus('FAILED');
              setStatusMessage('Transaction timed out: exceeded 30 minutes without gateway payment confirmation');
            }
          }
        }, 3000);

        return () => clearInterval(interval);
      });
    }, 400);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [isOpen, orderId, controlledStatus, isSettled]);

  if (!isOpen) return null;

  const handleClose = () => {
    if (isProcessing) return; // Prevent dismissing while securing transaction
    onClose();
    if (onViewCampaign) onViewCampaign();
  };

  const handleCopyId = () => {
    const idToCopy = activePaymentId || orderId;
    if (idToCopy) {
      navigator.clipboard.writeText(idToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPdf = () => {
    if (!isSettled) {
      toast.error('Tax invoice can only be generated after payment is completed & settled.');
      return;
    }
    generateInvoicePdf({
      amount,
      campaignTitle,
      orderId,
      paymentId: activePaymentId || orderId,
      donorName: isAnonymous ? 'Anonymous Backer' : (donorName || 'Valued Backer'),
      status: 'SETTLED',
      currency: 'INR',
    });
  };

  const handleDownload80GCertificate = async () => {
    if (!isSettled) {
      toast.error('Form 10BE (80G) Certificate can only be generated after payment is completed & settled.');
      return;
    }
    const yr = now.getFullYear();
    const nextYr = yr + 1;
    const receiptNo = `80G/DX/${yr}-${String(nextYr).slice(-2)}/${(activePaymentId || orderId || '0000').slice(-8).toUpperCase()}`;

    await generate80GTaxReceiptPdf({
      receiptNumber: receiptNo,
      approvalRegistrationNumber: 'AAATD9182PF20214',
      date: now.toISOString(),
      financialYear: `${yr}-${nextYr}`,
      assessmentYear: `${yr + 1}-${yr + 2}`,
      donor: {
        name: isAnonymous ? 'Anonymous Philanthropist' : (donorName || 'Valued Philanthropist'),
        email: isAnonymous ? 'confidential@dreamxec.com' : 'donor@dreamxec.com',
        pan: 'PAN_ON_FILE',
      },
      amount: Number(amount || 0),
      amountInWords: '',
      campaignTitle,
      paymentReference: activePaymentId || orderId || 'TXN_VERIFIED',
      institutionName: 'DreamXec Innovation Foundation',
      institutionPan: 'AAATD9182P',
      institutionSubtitle: 'A Section 8 Non-Profit Corporation for Academic Research Escrow',
      institutionAddress: 'Plot 42, Institutional Research Enclave, Sector 32, Gurugram, Haryana - 122001, India',
      institutionTan: 'DELA12345B',
      institutionCin: 'U85300HR2021NPL098234',
      section12AReg: 'AAATD9182PE20211',
      statutoryOrder: 'Order No. CIT(E)/80G/2021-22/A/10042 dated 24/09/2021',
      statutoryStandard: 'Compliant with Rule 18AB of Income-tax Rules, 1962 (Form 10BE)',
      deductionPercentage: 50,
      currency: 'INR',
      eligibleDeductionAmount: Number(amount || 0) * 0.5,
      form10BeNotice: 'This certificate certifies receipt of donation reported in Form 10BD for pre-fill in the donor’s Annual Information Statement (AIS) and Form 26AS.',
      authorizedSignatory: 'R. K. Singhania, Authorized Finance & Treasury Officer',
      qrVerificationPayload: `DX80G|URN:AAATD9182PF20214|REC:${receiptNo}|AMT:${amount}|DATE:${now.toISOString()}`,
      exemptionNote: 'Recognized under Section 80G(5)(vi) of the Income Tax Act, 1961.',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = (platform: 'twitter' | 'whatsapp' | 'copy') => {
    const text = `I just backed "${campaignTitle}" on @DreamXec! Join me in funding cutting-edge student innovation. 🚀`;
    const url = window.location.href;

    if (platform === 'twitter') {
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
        '_blank'
      );
    } else if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayDonor = isAnonymous ? 'Anonymous Backer' : (donorName || 'Valued Backer');
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="fixed inset-0 z-[999999] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white animate-fadeIn">
      {/* ── MODAL INNER CONTAINER ── */}
      <div className="relative w-full max-w-sm sm:max-w-md my-auto flex flex-col items-center">
        
        {/* Close Button Top Right */}
        {!isProcessing && (
          <button
            onClick={handleClose}
            className="absolute -top-10 right-0 sm:-right-6 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer print:hidden z-50"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* ═══════════════════════════════════════════════════════
            PINE LABS / POS TERMINAL DISPENSER MACHINE HEAD
        ═══════════════════════════════════════════════════════ */}
        <div className="w-full bg-[#18191d] border-2 border-[#2b2d35] rounded-t-2xl shadow-[0_10px_25px_rgba(0,0,0,0.6)] pt-4 px-4 pb-3 flex flex-col items-center z-20 relative">
          {/* Top Bevel Highlights & Status Bar */}
          <div className="w-full flex items-center justify-between px-2 mb-2.5">
            {/* Machine Brand Badge */}
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-[10px] sm:text-xs font-bold tracking-wider text-gray-300">
                DX-ESCROW
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 text-emerald-400 font-mono font-bold">
                TREASURY-80G
              </span>
            </div>

            {/* LED Status Light */}
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  isSettled
                    ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                    : isFailed
                    ? 'bg-red-400 shadow-[0_0_8px_#f87171]'
                    : 'bg-cyan-400 animate-ping shadow-[0_0_8px_#22d3ee]'
                }`}
              />
              <span
                className={`font-mono text-[10px] font-semibold tracking-wide ${
                  isSettled
                    ? 'text-emerald-400'
                    : isFailed
                    ? 'text-red-400'
                    : 'text-cyan-400'
                }`}
              >
                {isSettled ? 'TRANSACTION SETTLED' : isFailed ? 'TRANSACTION FAILED' : 'PRINTING RECEIPT...'}
              </span>
            </div>
          </div>

          {/* ── THE DISPENSER SLOT / MOUTH ── */}
          <div className="w-full h-4 sm:h-5 bg-[#090a0c] rounded-full shadow-[inset_0_4px_8px_rgba(0,0,0,0.95)] border border-white/5 relative flex items-center justify-center overflow-hidden">
            {/* Roller guides */}
            <div className="absolute left-2 w-3 h-2 bg-[#2c2f36] rounded-sm" />
            <div className="absolute right-2 w-3 h-2 bg-[#2c2f36] rounded-sm" />
            
            {/* Active Print Laser Scan Glow */}
            {isProcessing && (
              <motion.div
                className="w-24 h-1 bg-cyan-400/80 rounded-full blur-[2px]"
                animate={{ x: [-80, 80, -80] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            AUTHENTIC THERMAL RECEIPT PAPER (ROLLS DOWN FROM SLOT)
        ═══════════════════════════════════════════════════════ */}
        <div className="w-full relative z-10 -mt-2 overflow-hidden px-1">
          <motion.div
            initial={{ y: -160, opacity: 0, scaleY: 0.1 }}
            animate={{ y: 0, opacity: 1, scaleY: 1 }}
            transition={{
              duration: 1.0,
              ease: [0.16, 1, 0.3, 1], // Smooth paper roll expansion
            }}
            style={{ transformOrigin: 'top center' }}
            className="w-full bg-[#fdfdfd] text-[#121316] font-mono shadow-[0_20px_45px_rgba(0,0,0,0.45)] relative rounded-b-sm border-x border-[#e8e6df] pt-6 pb-2 px-4 sm:px-6 select-text"
          >
            {/* Subtle thermal paper vertical texture gradient */}
            <div className="absolute inset-0 bg-gradient-to-b from-white via-[#faf9f6]/80 to-[#f6f5f0]/90 pointer-events-none" />

            <div className="relative z-10 flex flex-col text-xs leading-relaxed">
              
              {/* ── 1. RECEIPT HEADER ── */}
              <div className="text-center space-y-1 mb-3">
                <div className="flex items-center justify-center gap-1.5 text-base sm:text-lg font-black tracking-widest text-[#0F534A] uppercase">
                  <ShieldCheck className="w-5 h-5 text-[#0F534A]" />
                  <span>DREAMXEC FOUNDATION</span>
                </div>
                <div className="inline-block bg-[#FFDD33] text-[#121316] text-[9.5px] font-black px-2 py-0.5 border border-[#121316] uppercase tracking-wider shadow-[1px_1px_0_#121316]">
                  OFFICIAL ESCROW SETTLEMENT RECEIPT
                </div>
                <div className="text-[9px] text-gray-700 font-bold tracking-tight pt-1">
                  SECTION 80G(5)(vi) COMPLIANT • URN: AAATD9182PF20214
                </div>
                <div className="text-[8.5px] text-gray-500 tracking-tight">
                  CIN: U85300HR2021NPL098234 • PAN: AAATD9182P • TAN: DELA12345B
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-600 font-semibold pt-1 border-t border-dashed border-gray-300 mt-1.5">
                  <span>DATE: {dateStr}</span>
                  <span>TIME: {timeStr}</span>
                </div>
              </div>

              {/* ── 2. DASHED DIVIDER ── */}
              <div className="border-b border-dashed border-gray-400 my-1 w-full" />

              {/* ── 3. TRANSACTION PARTICULARS ── */}
              <div className="py-2 space-y-1.5 text-[11px]">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-500 font-medium">CAMPAIGN:</span>
                  <span className="font-bold text-right text-gray-900 max-w-[200px] truncate" title={campaignTitle}>
                    {campaignTitle}
                  </span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-500 font-medium">BENEFICIARY:</span>
                  <span className="font-bold text-right text-[#0F534A]">STUDENT RESEARCH</span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-500 font-medium">BACKER:</span>
                  <span className="font-bold text-right text-gray-900">{displayDonor}</span>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-500 font-medium">PAYMENT ID:</span>
                  <button
                    onClick={handleCopyId}
                    className="inline-flex items-center gap-1 font-bold text-gray-800 hover:text-[#0F534A] transition-colors cursor-pointer"
                    title="Click to copy ID"
                  >
                    <span>{activePaymentId || orderId || 'N/A'}</span>
                    {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-gray-400" />}
                  </button>
                </div>

                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-500 font-medium">GATEWAY:</span>
                  <span className="font-semibold text-right text-gray-700">RAZORPAY 256-BIT</span>
                </div>
              </div>

              {/* ── 4. LINE ITEMS BREAKDOWN ── */}
              <div className="border-b border-dashed border-gray-400 my-1 w-full" />

              <div className="py-1.5 space-y-1 text-[11px]">
                <div className="flex justify-between text-gray-500 font-semibold text-[10px] uppercase">
                  <span>ITEM DESCRIPTION</span>
                  <span>AMOUNT</span>
                </div>

                <div className="flex justify-between items-center text-gray-900 font-semibold">
                  <span>STUDENT PLEDGE ESCROW</span>
                  <span>₹{Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>

                <div className="flex justify-between items-center text-gray-500 text-[10px]">
                  <span>PROTOCOL CLEARING (3%)</span>
                  <span className="text-emerald-700 font-bold">FREE (SUBSIDIZED)</span>
                </div>

                <div className="flex justify-between items-center text-gray-500 text-[10px]">
                  <span>GATEWAY PROCESSING</span>
                  <span className="text-emerald-700 font-bold">FREE (COVERED)</span>
                </div>
              </div>

              {/* ── 5. DOUBLE DIVIDER & TOTAL SECTION ── */}
              <div className="border-b-2 border-dashed border-gray-900 my-1.5 w-full" />

              <div className="py-1 flex items-center justify-between">
                <span className="text-sm font-black tracking-wider uppercase text-gray-900">
                  TOTAL PAID:
                </span>
                <span className="text-base sm:text-lg font-black text-[#0F534A] tracking-tight">
                  ₹{Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {/* ── 6. RUBBER STAMP OF STATUS ── */}
              <div className="my-2.5 flex items-center justify-center">
                {isSettled ? (
                  <motion.div
                    initial={{ scale: 2, opacity: 0, rotate: -15 }}
                    animate={{ scale: 1, opacity: 1, rotate: -6 }}
                    transition={{ delay: 0.3, type: 'spring', damping: 14 }}
                    className="border-2 border-dashed border-emerald-600 text-emerald-700 bg-emerald-50/90 px-3.5 py-1 rounded font-black text-xs sm:text-sm tracking-widest uppercase shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>✓ APPROVED & SETTLED</span>
                  </motion.div>
                ) : isFailed ? (
                  <motion.div
                    initial={{ scale: 2, opacity: 0, rotate: 10 }}
                    animate={{ scale: 1, opacity: 1, rotate: 4 }}
                    className="border-2 border-dashed border-red-600 text-red-700 bg-red-50 px-3.5 py-1 rounded font-black text-xs sm:text-sm tracking-widest uppercase shadow-sm flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <span>✗ FAILED / VOID</span>
                  </motion.div>
                ) : (
                  <div className="border-2 border-dashed border-cyan-600 text-cyan-800 bg-cyan-50/80 px-3 py-1 rounded font-bold text-xs tracking-wider uppercase flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-cyan-600 animate-ping" />
                    <span>PROCESSING SETTLEMENT...</span>
                  </div>
                )}
              </div>

              {/* ── 7. BRAND BARCODE & FOOTER SLOGAN ── */}
              <div className="text-center pt-1 border-t border-dashed border-gray-300 space-y-1">
                <p className="text-[10px] font-bold text-gray-800 uppercase tracking-tight">
                  THANK YOU FOR BACKING STUDENT INNOVATION!
                </p>
                <p className="text-[9px] text-gray-500 italic">
                  Research Karega India, Toh Badhega India
                </p>

                {/* Authentic POS Vector Barcode */}
                <div className="flex flex-col items-center justify-center pt-2">
                  <svg className="w-48 sm:w-56 h-8 opacity-80" viewBox="0 0 200 36">
                    <rect x="0" y="0" width="3" height="36" fill="#121316" />
                    <rect x="5" y="0" width="2" height="36" fill="#121316" />
                    <rect x="10" y="0" width="4" height="36" fill="#121316" />
                    <rect x="16" y="0" width="2" height="36" fill="#121316" />
                    <rect x="22" y="0" width="5" height="36" fill="#121316" />
                    <rect x="30" y="0" width="2" height="36" fill="#121316" />
                    <rect x="34" y="0" width="3" height="36" fill="#121316" />
                    <rect x="40" y="0" width="6" height="36" fill="#121316" />
                    <rect x="48" y="0" width="2" height="36" fill="#121316" />
                    <rect x="53" y="0" width="4" height="36" fill="#121316" />
                    <rect x="60" y="0" width="2" height="36" fill="#121316" />
                    <rect x="65" y="0" width="5" height="36" fill="#121316" />
                    <rect x="73" y="0" width="3" height="36" fill="#121316" />
                    <rect x="79" y="0" width="2" height="36" fill="#121316" />
                    <rect x="84" y="0" width="4" height="36" fill="#121316" />
                    <rect x="91" y="0" width="6" height="36" fill="#121316" />
                    <rect x="100" y="0" width="3" height="36" fill="#121316" />
                    <rect x="105" y="0" width="2" height="36" fill="#121316" />
                    <rect x="110" y="0" width="5" height="36" fill="#121316" />
                    <rect x="118" y="0" width="2" height="36" fill="#121316" />
                    <rect x="123" y="0" width="4" height="36" fill="#121316" />
                    <rect x="130" y="0" width="3" height="36" fill="#121316" />
                    <rect x="136" y="0" width="6" height="36" fill="#121316" />
                    <rect x="145" y="0" width="2" height="36" fill="#121316" />
                    <rect x="150" y="0" width="4" height="36" fill="#121316" />
                    <rect x="157" y="0" width="3" height="36" fill="#121316" />
                    <rect x="163" y="0" width="5" height="36" fill="#121316" />
                    <rect x="171" y="0" width="2" height="36" fill="#121316" />
                    <rect x="176" y="0" width="4" height="36" fill="#121316" />
                    <rect x="183" y="0" width="2" height="36" fill="#121316" />
                    <rect x="188" y="0" width="5" height="36" fill="#121316" />
                    <rect x="196" y="0" width="3" height="36" fill="#121316" />
                  </svg>
                  <span className="text-[9px] font-mono tracking-widest text-gray-500 mt-0.5">
                    DX-{(activePaymentId || orderId || '00000000').slice(-12).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* ── 8. JAGGED / ZIGZAG CUTOFF PAPER BOTTOM ── */}
            <div className="w-[calc(100%+32px)] sm:w-[calc(100%+48px)] -ml-4 sm:-ml-6 -mb-2 overflow-hidden leading-none h-3 bg-transparent mt-3">
              <svg
                viewBox="0 0 1200 20"
                preserveAspectRatio="none"
                className="w-full h-3 fill-[#fdfdfd] drop-shadow-[0_3px_1px_rgba(0,0,0,0.06)]"
              >
                <path d="M0,0 L20,20 L40,0 L60,20 L80,0 L100,20 L120,0 L140,20 L160,0 L180,20 L200,0 L220,20 L240,0 L260,20 L280,0 L300,20 L320,0 L340,20 L360,0 L380,20 L400,0 L420,20 L440,0 L460,20 L480,0 L500,20 L520,0 L540,20 L560,0 L580,20 L600,0 L620,20 L640,0 L660,20 L680,0 L700,20 L720,0 L740,20 L760,0 L780,20 L800,0 L820,20 L840,0 L860,20 L880,0 L900,20 L920,0 L940,20 L960,0 L980,20 L1000,0 L1020,20 L1040,0 L1060,20 L1080,0 L1100,20 L1120,0 L1140,20 L1160,0 L1180,20 L1200,0 Z" />
              </svg>
            </div>
          </motion.div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            ACTION BAR (DOWNLOAD PDF INVOICE, PRINT, SHARE, CLOSE)
        ═══════════════════════════════════════════════════════ */}
        <div className="w-full mt-4 flex flex-col gap-2.5 print:hidden">
          
          {/* Dual Action Buttons: A4 Tax Invoice & Form 10BE 80G Certificate */}
          <div className="flex flex-col sm:flex-row gap-2 w-full">
            <button
              onClick={handleDownloadPdf}
              disabled={!isSettled}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] transition-all rounded ${
                isSettled
                  ? 'bg-[#0F534A] hover:bg-[#156e62] text-white shadow-[3px_3px_0px_#121316] hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer'
                  : 'bg-gray-100 text-gray-400 border-gray-300 shadow-none cursor-not-allowed opacity-60'
              }`}
              title={isSettled ? 'Download Tax Invoice' : 'Available only after payment is completed'}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Official Tax Invoice (A4)</span>
            </button>
            <button
              onClick={handleDownload80GCertificate}
              disabled={!isSettled}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] transition-all rounded ${
                isSettled
                  ? 'bg-[#FE4E1A] hover:bg-[#e03d0d] text-white shadow-[3px_3px_0px_#121316] hover:translate-x-0.5 hover:translate-y-0.5 cursor-pointer'
                  : 'bg-gray-100 text-gray-400 border-gray-300 shadow-none cursor-not-allowed opacity-60'
              }`}
              title={isSettled ? 'Download 80G Certificate' : 'Available only after payment is completed'}
            >
              <Award className="w-3.5 h-3.5" />
              <span>80G Certificate (Form 10BE)</span>
            </button>
          </div>

          {!isSettled && (
            <p className="text-[11px] text-center font-bold text-gray-700 bg-gray-50 border border-gray-300 py-2 px-2.5 rounded">
              {isFailed
                ? `⚠️ ${statusMessage || 'Transaction failed or timed out: No payment confirmation was received from Razorpay within 30 minutes.'}`
                : '⏳ Awaiting Razorpay gateway confirmation. If no response or webhook is received within 30 minutes, this transaction will automatically be marked as failed.'}
            </p>
          )}

          {/* Secondary Action Row: Print, Share, Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-gray-800 font-semibold text-xs uppercase border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-gray-100 transition-all cursor-pointer rounded-lg"
              title="Print Thermal Receipt"
            >
              <Printer className="w-3.5 h-3.5 text-gray-700" />
              <span>Print</span>
            </button>

            {/* Share Menu Toggle */}
            <div className="relative flex-1">
              <button
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-gray-800 font-semibold text-xs uppercase border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-gray-100 transition-all cursor-pointer rounded-lg"
              >
                <Share2 className="w-3.5 h-3.5 text-gray-700" />
                <span>Share</span>
              </button>

              {showShareMenu && (
                <div className="absolute bottom-full mb-2 left-0 right-0 bg-white border-2 border-black shadow-[4px_4px_0px_#000] rounded-lg p-1.5 flex flex-col gap-1 z-30 animate-scaleUp">
                  <button
                    onClick={() => { handleShare('twitter'); setShowShareMenu(false); }}
                    className="text-left px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-100 rounded transition-colors"
                  >
                    Share on X (Twitter)
                  </button>
                  <button
                    onClick={() => { handleShare('whatsapp'); setShowShareMenu(false); }}
                    className="text-left px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-100 rounded transition-colors"
                  >
                    Share on WhatsApp
                  </button>
                  <button
                    onClick={() => { handleShare('copy'); setShowShareMenu(false); }}
                    className="text-left px-2.5 py-1.5 text-xs font-semibold hover:bg-gray-100 rounded transition-colors"
                  >
                    {copied ? 'Link Copied!' : 'Copy Pledge Link'}
                  </button>
                </div>
              )}
            </div>

            {/* Done / Close Button */}
            {!isProcessing && (
              <button
                onClick={handleClose}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#121316] text-white font-semibold text-xs uppercase border-2 border-black shadow-[2px_2px_0px_#000] hover:bg-gray-800 transition-all cursor-pointer rounded-lg"
              >
                <span>Done</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PaymentConfirmationModal;
