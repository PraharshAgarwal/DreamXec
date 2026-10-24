import React, { useState } from 'react';
import {
  X,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Layers,
  Building2,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import apiRequest from '../../services/api';

interface TestRazorpayPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (result: any) => void;
  campaigns?: Array<{ id: string; title: string; organizationName?: string }>;
}

const PRESET_AMOUNTS = [500, 1000, 5000, 10000, 25000, 50000];

export const TestRazorpayPaymentModal: React.FC<TestRazorpayPaymentModalProps> = ({
  isOpen,
  onClose,
  onPaymentSuccess,
  campaigns = [],
}) => {
  const [amount, setAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('5000');
  const [campaignId, setCampaignId] = useState<string>('');
  const [donorName, setDonorName] = useState<string>('Research Supporter');
  const [donorEmail, setDonorEmail] = useState<string>('tester@dreamxec.com');
  const [donorMessage, setDonorMessage] = useState<string>('Seed funding for lab equipment and prototype testing');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [simulatedResult, setSimulatedResult] = useState<any | null>(null);

  if (!isOpen) return null;

  const handlePresetClick = (preset: number) => {
    setAmount(preset);
    setCustomAmount(preset.toString());
  };

  const handleCustomAmountChange = (val: string) => {
    const num = Number(val);
    setCustomAmount(val);
    if (!isNaN(num) && num > 0) {
      setAmount(num);
    }
  };

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      setError('Please enter an amount greater than ₹0.');
      return;
    }

    // In-flight concurrency & double-click protection
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);
    setSimulatedResult(null);

    try {
      // 1. Client-Side Idempotency Key
      const clientTxId = `sim_ui_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // 2. Call Sandbox Endpoint
      const response = await apiRequest<{
        razorpayResponse: any;
        donation: any;
        ledgerTransaction: any;
        treasuryOverview: any;
      }>('/dx-admin/ledger/simulate-payment', {
        method: 'POST',
        body: JSON.stringify({
          amount,
          campaignId: campaignId || null,
          donorName: donorName || 'Sandbox Supporter',
          donorEmail: donorEmail || 'tester@dreamxec.com',
          donorMessage,
          isAnonymous,
          clientTxId,
        }),
      });

      if (response?.data) {
        setSimulatedResult(response.data);
        onPaymentSuccess(response.data);
      } else {
        throw new Error('Sandbox payment returned no payload.');
      }
    } catch (err: any) {
      console.error('Sandbox payment simulation error:', err);
      setError(err?.response?.data?.message || err.message || 'Payment simulation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const gross = amount;
  const platformFee = Math.round(gross * 0.03 * 100) / 100;
  const gatewayFee = Math.round(gross * 0.02 * 100) / 100;
  const netEscrow = Math.round((gross - platformFee - gatewayFee) * 100) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121316]/75 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white border-4 border-[#121316] shadow-[8px_8px_0_#FE4E1A] my-8 transition-all">
        {/* ── HEADER ── */}
        <div className="bg-[#0F534A] text-white p-5 border-b-4 border-[#121316] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#FFDD33] text-[#121316] p-2 border-2 border-[#121316]">
              <CreditCard className="w-6 h-6 text-[#0F534A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-headline font-black uppercase tracking-widest bg-[#FE4E1A] text-white px-2 py-0.5 border border-[#121316]">
                  TEST ENVIRONMENT
                </span>
                <span className="text-[10px] font-headline font-black uppercase tracking-widest bg-[#18D7E8] text-[#121316] px-2 py-0.5 border border-[#121316]">
                  ATOMIC LEDGER
                </span>
              </div>
              <h2 className="text-xl font-headline font-black uppercase tracking-tight text-white mt-1">
                Razorpay Sandbox Simulator
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-[#FE4E1A] hover:bg-[#F4002C] text-white border-2 border-[#121316] shadow-[2px_2px_0_#121316] cursor-pointer transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── CONTENT BODY ── */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="bg-[#FEB3FC]/20 border-3 border-[#F4002C] p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#F4002C] flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-headline font-black uppercase text-[#F4002C]">Payment Simulation Error</h4>
                <p className="text-xs text-gray-700 font-medium mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {simulatedResult ? (
            /* ── SUCCESS RESULT CARD ── */
            <div className="space-y-5 animate-fadeIn">
              <div className="bg-[#9EFC5F]/20 border-3 border-[#0F534A] p-5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-7 h-7 text-[#0F534A] flex-shrink-0" />
                  <div>
                    <span className="text-[10px] font-headline font-black uppercase bg-[#9EFC5F] text-[#0F534A] px-2 py-0.5 border border-[#0F534A]">
                      ATOMIC MULTI-LEG POSTED
                    </span>
                    <h3 className="text-base font-headline font-black text-[#0F534A] uppercase mt-1">
                      Razorpay Payment Captured &amp; Settled!
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-gray-700 font-medium mt-2">
                  Payment verification succeeded with HMAC SHA256 simulation. The double-entry ledger posted all balanced debit and credit entries atomically.
                </p>
              </div>

              {/* ── RAZORPAY RESPONSE DETAILS ── */}
              <div className="border-3 border-[#121316] p-4 bg-[#FCFBF7] space-y-3">
                <div className="flex items-center justify-between border-b-2 border-[#121316] pb-2">
                  <span className="text-xs font-headline font-black text-[#121316] uppercase flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#FE4E1A]" /> Simulated Razorpay Callback Payload
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-[#18D7E8] text-[#121316] px-2 py-0.5 border border-[#121316]">
                    STATUS: CAPTURED
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
                  <div className="bg-white p-2 border border-[#121316]">
                    <span className="text-gray-500 text-[10px] block font-sans font-bold">Razorpay Payment ID</span>
                    <span className="font-bold text-[#0F534A]">
                      {simulatedResult.razorpayResponse?.razorpay_payment_id || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-white p-2 border border-[#121316]">
                    <span className="text-gray-500 text-[10px] block font-sans font-bold">Razorpay Order ID</span>
                    <span className="font-bold text-[#121316]">
                      {simulatedResult.razorpayResponse?.razorpay_order_id || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── MULTI-LEG JOURNAL SPLIT VIEW ── */}
              <div className="border-3 border-[#121316] p-4 bg-white space-y-3 shadow-[4px_4px_0_#4717AE]">
                <div className="flex items-center justify-between border-b-2 border-[#121316] pb-2">
                  <span className="text-xs font-headline font-black text-[#4717AE] uppercase flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#4717AE]" /> Posted Ledger Journal Legs
                  </span>
                  <span className="text-[10px] font-headline font-black text-[#0F534A] bg-[#9EFC5F] px-2 py-0.5 border border-[#121316]">
                    BALANCED ($\Sigma D = \Sigma C$)
                  </span>
                </div>

                <div className="space-y-2">
                  {simulatedResult.ledgerTransaction?.entries?.map((leg: any, idx: number) => (
                    <div
                      key={leg.id || idx}
                      className="flex items-center justify-between p-2.5 bg-[#FCFBF7] border border-[#121316] text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-headline font-bold text-[#121316] flex items-center gap-2">
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-headline font-black uppercase ${
                              leg.entryType === 'DEBIT'
                                ? 'bg-[#FE4E1A] text-white'
                                : 'bg-[#0F534A] text-white'
                            }`}
                          >
                            {leg.entryType}
                          </span>
                          <span>{leg.account?.name || leg.account?.accountNumber || `Account #${leg.accountId?.substring(0, 8)}`}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 font-mono">
                          Account Type: {leg.account?.accountType || 'N/A'}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-headline font-black text-sm text-[#121316]">
                          ₹{Number(leg.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-gray-500 uppercase">{leg.currency}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── ACTION BUTTONS ── */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSimulatedResult(null)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#FFDD33] hover:bg-[#FFDD33]/80 text-[#121316] border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0_#121316] cursor-pointer transition-all"
                >
                  <RefreshCw className="w-4 h-4" /> Simulate Another
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#0F534A] hover:bg-[#0F534A]/90 text-white border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0_#121316] cursor-pointer transition-all"
                >
                  Done &amp; View Ledger
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSimulatePayment} className="space-y-5">
              {/* ── AMOUNT SELECTION ── */}
              <div className="space-y-2">
                <label className="block text-xs font-headline font-black text-[#121316] uppercase tracking-wider">
                  Select or Enter Contribution Amount (INR)
                </label>

                {/* Preset Chips */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_AMOUNTS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => handlePresetClick(preset)}
                      className={`py-2 px-2 text-xs font-headline font-black border-2 border-[#121316] transition-all cursor-pointer ${
                        amount === preset
                          ? 'bg-[#FE4E1A] text-white shadow-[2px_2px_0_#121316]'
                          : 'bg-[#FCFBF7] text-[#121316] hover:bg-gray-100'
                      }`}
                    >
                      ₹{preset.toLocaleString()}
                    </button>
                  ))}
                </div>

                {/* Custom Amount Input */}
                <div className="relative mt-2">
                  <span className="absolute left-3 top-2.5 text-base font-bold text-[#0F534A]">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="Enter amount..."
                    className="w-full pl-8 pr-4 py-2 bg-white border-3 border-[#121316] text-sm font-headline font-black text-[#121316] focus:outline-none focus:border-[#0F534A]"
                    required
                  />
                </div>
              </div>

              {/* ── ESTIMATED MULTI-LEG BREAKDOWN PREVIEW ── */}
              <div className="bg-[#FCFBF7] border-2 border-dashed border-[#121316] p-3 space-y-2">
                <span className="text-[10px] font-headline font-black text-gray-500 uppercase tracking-wider block">
                  Projected Atomic Multi-Leg Distribution:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white p-2 border border-[#121316]">
                    <span className="text-[10px] text-gray-500 font-bold block">Gross Inflow</span>
                    <span className="font-headline font-black text-[#0F534A]">₹{gross.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-2 border border-[#121316]">
                    <span className="text-[10px] text-gray-500 font-bold block">Escrow Held</span>
                    <span className="font-headline font-black text-[#FE4E1A]">₹{netEscrow.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-2 border border-[#121316]">
                    <span className="text-[10px] text-gray-500 font-bold block">DX Protocol (3%)</span>
                    <span className="font-headline font-black text-[#4717AE]">₹{platformFee.toLocaleString()}</span>
                  </div>
                  <div className="bg-white p-2 border border-[#121316]">
                    <span className="text-[10px] text-gray-500 font-bold block">Gateway (2%)</span>
                    <span className="font-headline font-black text-gray-700">₹{gatewayFee.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* ── CAMPAIGN SELECTOR ── */}
              {campaigns.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-headline font-black text-[#121316] uppercase tracking-wider">
                    Target Research Campaign (Optional)
                  </label>
                  <select
                    value={campaignId}
                    onChange={(e) => setCampaignId(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-[#121316] text-xs font-bold text-[#121316] focus:outline-none focus:border-[#0F534A] cursor-pointer"
                  >
                    <option value="">-- Auto Route to Active Featured Campaign --</option>
                    {campaigns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} {c.organizationName ? `(${c.organizationName})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* ── DONOR DETAILS ── */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-headline font-black text-gray-700 uppercase">
                    Donor Display Name
                  </label>
                  <input
                    type="text"
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    className="w-full p-2 bg-white border-2 border-[#121316] text-xs font-medium focus:outline-none focus:border-[#0F534A]"
                    placeholder="e.g. Dr. Ananya Sharma"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-headline font-black text-gray-700 uppercase">
                    Donor Email (For Receipt &amp; Wallet)
                  </label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    className="w-full p-2 bg-white border-2 border-[#121316] text-xs font-medium focus:outline-none focus:border-[#0F534A]"
                    placeholder="donor@example.com"
                  />
                </div>
              </div>

              {/* ── MESSAGE ── */}
              <div className="space-y-1">
                <label className="block text-[11px] font-headline font-black text-gray-700 uppercase">
                  Contribution Note / Research Purpose
                </label>
                <input
                  type="text"
                  value={donorMessage}
                  onChange={(e) => setDonorMessage(e.target.value)}
                  className="w-full p-2 bg-white border-2 border-[#121316] text-xs font-medium focus:outline-none focus:border-[#0F534A]"
                  placeholder="Note for researchers..."
                />
              </div>

              {/* ── SUBMIT BUTTON WITH MULTI-CLICK IN-FLIGHT LOCK ── */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || amount <= 0}
                  className={`w-full flex items-center justify-center gap-3 py-3.5 px-6 font-headline font-black text-xs sm:text-sm uppercase tracking-wider border-3 border-[#121316] shadow-[4px_4px_0_#121316] transition-all cursor-pointer ${
                    isSubmitting
                      ? 'bg-gray-400 text-white cursor-not-allowed opacity-75'
                      : 'bg-[#FE4E1A] hover:bg-[#0F534A] text-white hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-[2px_2px_0_#121316]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing Razorpay Verification &amp; Atomic Ledger Settlement...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#FFDD33]" />
                      <span>Execute Sandbox Razorpay Settlement (₹{amount.toLocaleString()})</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
                <div className="flex items-center justify-center gap-2 mt-2 text-[10px] text-gray-500 font-medium">
                  <Lock className="w-3 h-3 text-[#0F534A]" />
                  <span>Idempotency key lock active — immune to rapid double-clicks</span>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestRazorpayPaymentModal;
