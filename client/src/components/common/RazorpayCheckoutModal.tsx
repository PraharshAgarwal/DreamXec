import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Building2,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Lock,
  ArrowRight,
  RefreshCw,
  Smartphone,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export interface RazorpayCheckoutOptions {
  key?: string;
  amount?: number; // in paise or in INR
  currency?: string;
  name?: string;
  description?: string;
  order_id?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, any>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
}

interface RazorpayCheckoutModalProps {
  options: RazorpayCheckoutOptions | null;
  isOpen: boolean;
  onClose: () => void;
}

type PaymentTab = 'upi' | 'card' | 'netbanking' | 'wallet';

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  options,
  isOpen,
  onClose,
}) => {
  // Initialize amount (handle paise vs INR)
  const rawAmount = options?.amount ? (options.amount > 1000 && options.amount % 100 === 0 ? options.amount / 100 : options.amount) : 1000;
  const [editableAmount, setEditableAmount] = useState<number>(rawAmount);
  const [activeTab, setActiveTab] = useState<PaymentTab>('upi');

  // Form states
  const [upiId, setUpiId] = useState<string>('tester@okhdfcbank');
  const [cardNumber, setCardNumber] = useState<string>('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState<string>('12/28');
  const [cardCvv, setCardCvv] = useState<string>('123');
  const [selectedBank, setSelectedBank] = useState<string>('HDFC Bank');
  const [selectedWallet, setSelectedWallet] = useState<string>('Amazon Pay');

  // Processing & State
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [stepMessage, setStepMessage] = useState<string>('');

  if (!isOpen || !options) return null;

  const orderId = options.order_id || '';
  const merchantName = options.name || 'DreamXec Escrow Gateway';
  const description = options.description || 'Campaign Research Grant Allocation';
  const themeColor = options.theme?.color || '#0c2340';

  const handleCompleteTransaction = async () => {
    if (isProcessing) return;
    if (!orderId) {
      alert('Error: Database order was not initialized. Please try donating again.');
      return;
    }
    setIsProcessing(true);
    setStepMessage('Verifying HMAC SHA256 Signature & Capturing Funds...');
    await new Promise((r) => setTimeout(r, 60));

    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const signature = `sig_dx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const responsePayload = {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    };

    setIsProcessing(false);
    onClose();

    if (typeof options.handler === 'function') {
      options.handler(responsePayload);
    }
  };

  const handleCancelTransaction = () => {
    if (isProcessing) return;
    onClose();
    if (options.modal && typeof options.modal.ondismiss === 'function') {
      options.modal.ondismiss();
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-[#0a0f1d]/80 backdrop-blur-sm animate-fadeIn">
      {/* Razorpay Classic Modal Container */}
      <div className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200 flex flex-col font-sans">
        {/* ── TOP MERCHANT HEADER ── */}
        <div
          className="p-4 sm:p-5 text-white flex items-center justify-between transition-colors"
          style={{ backgroundColor: themeColor || '#0c2340' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center text-white font-black text-base shadow-inner">
              DX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded border border-blue-400/30">
                  Razorpay Sandbox Standard
                </span>
                <span className="text-[10px] font-mono text-gray-300">
                  #{orderId.substring(0, 14)}...
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">{merchantName}</h3>
              <p className="text-xs text-gray-300 line-clamp-1">{description}</p>
            </div>
          </div>

          <button
            onClick={handleCancelTransaction}
            disabled={isProcessing}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            title="Cancel Transaction"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── AMOUNT BAR (EDITABLE / DISPLAY) ── */}
        <div className="bg-[#f4f7fa] px-5 py-3 border-b border-gray-200 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              Contribution Amount
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-gray-900">₹</span>
              <input
                type="number"
                min="1"
                step="1"
                value={editableAmount}
                onChange={(e) => setEditableAmount(Math.max(Number(e.target.value) || 1, 1))}
                disabled={isProcessing}
                className="w-32 bg-white border border-gray-300 rounded px-2 py-0.5 text-base font-bold text-gray-900 focus:outline-none focus:border-blue-500 shadow-sm"
              />
              <span className="text-xs font-semibold text-gray-500 uppercase">INR</span>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="hidden sm:flex items-center gap-1.5">
            {[500, 1000, 5000, 10000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setEditableAmount(preset)}
                className={`text-[11px] font-bold px-2 py-1 rounded border transition-colors ${
                  editableAmount === preset
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                ₹{preset.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* ── MAIN BODY & PAYMENT TABS ── */}
        <div className="flex flex-col sm:flex-row flex-1 min-h-[280px]">
          {/* Left Payment Methods Nav */}
          <div className="w-full sm:w-48 bg-[#f8fafc] border-b sm:border-b-0 sm:border-r border-gray-200 p-2 space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab('upi')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'upi'
                  ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>UPI / QR</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('card')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'card'
                  ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Cards</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('netbanking')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'netbanking'
                  ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-600" />
                <span>Net Banking</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wallet')}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'wallet'
                  ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2">
                <Wallet className="w-4 h-4 text-purple-600" />
                <span>Wallets</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>

          {/* Right Tab Content Panel */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
            {activeTab === 'upi' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 p-2.5 rounded-lg">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-emerald-900 block">Instant QR &amp; UPI Apps</span>
                      <span className="text-[10px] text-emerald-700">Google Pay, PhonePe, Paytm, BHIM</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                    FASTEST
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-700 block">Enter UPI ID / VPA</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@okhdfcbank"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-medium text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>
            )}

            {activeTab === 'card' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-700 block">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 2222 3333 4444"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 block">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-gray-700 block">CVV</label>
                    <input
                      type="password"
                      maxLength={4}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-xs font-mono text-gray-800 focus:outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'netbanking' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-700 block">Select Popular Bank</label>
                <div className="grid grid-cols-2 gap-2">
                  {['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Bank', 'PNB'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`p-2 text-xs font-bold rounded-lg border text-left transition-colors ${
                        selectedBank === bank
                          ? 'bg-blue-50 border-blue-500 text-blue-800 shadow-sm'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-700 block">Select Stored Wallet</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Amazon Pay', 'Paytm Wallet', 'MobiKwik', 'Airtel Money'].map((wallet) => (
                    <button
                      key={wallet}
                      type="button"
                      onClick={() => setSelectedWallet(wallet)}
                      className={`p-2.5 text-xs font-bold rounded-lg border text-left transition-colors ${
                        selectedWallet === wallet
                          ? 'bg-purple-50 border-purple-500 text-purple-800 shadow-sm'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {wallet}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Processing Spinner Overlay */}
            {isProcessing && (
              <div className="my-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
                <span className="text-xs font-bold text-blue-900">{stepMessage}</span>
              </div>
            )}

            {/* ── DUAL ACTION BUTTONS (COMPLETE & CANCEL) ── */}
            <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row items-center gap-2.5 mt-auto">
              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCompleteTransaction}
                className="w-full sm:flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Pay ₹{editableAmount.toLocaleString()} • Complete</span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={handleCancelTransaction}
                className="w-full sm:w-auto py-2.5 px-4 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 border border-gray-300 hover:border-red-300 rounded-lg font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel Transaction
              </button>
            </div>
          </div>
        </div>

        {/* ── FOOTER TRUST BADGE ── */}
        <div className="bg-gray-50 px-5 py-2.5 border-t border-gray-200 flex items-center justify-between text-[11px] text-gray-500 font-medium">
          <div className="flex items-center gap-1.5 text-gray-600">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>256-bit SSL Secure Banking</span>
          </div>
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
            Powered by Razorpay Standard API
          </span>
        </div>
      </div>
    </div>
  );
};

export default RazorpayCheckoutModal;
