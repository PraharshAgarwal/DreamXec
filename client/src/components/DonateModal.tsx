import React, { useState, useEffect } from 'react';
import { ShieldCheck, Heart, Lock, X } from 'lucide-react';
import type { User, Campaign } from '../types';
import { TactileNeobrutalistButton } from './ui/TactileNeobrutalistButton';
import { BrushAnnotation } from './ui/BrushAnnotation';

interface DonateModalProps {
  show: boolean;
  onClose: () => void;
  campaign?: Campaign | null;
  donationAmount: string;
  setDonationAmount: (amount: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  currentUser: User | null;
  email: string;
  setEmail: (email: string) => void;
  isAnonymous?: boolean;
  setIsAnonymous?: (isAnonymous: boolean) => void;
  selectedMilestoneId?: string;
  setSelectedMilestoneId?: (milestoneId: string) => void;
}

const PRESET_AMOUNTS = [
  { label: '₹500', value: '500', desc: 'Component Kit' },
  { label: '₹1,000', value: '1000', desc: 'Lab Supplies' },
  { label: '₹2,500', value: '2500', desc: 'Test Equipment' },
  { label: '₹5,000', value: '5000', desc: 'Prototype Phase' },
];

export default function DonateModal({
  show,
  onClose,
  campaign,
  donationAmount,
  setDonationAmount,
  onSubmit,
  currentUser,
  email,
  setEmail,
  isAnonymous,
  setIsAnonymous,
  selectedMilestoneId,
  setSelectedMilestoneId,
}: DonateModalProps) {
  const [localMilestoneId, setLocalMilestoneId] = useState<string>('ALL');
  const [localAnonymous, setLocalAnonymous] = useState<boolean>(false);

  const activeMilestoneId = selectedMilestoneId ?? localMilestoneId;
  const setActiveMilestoneId = setSelectedMilestoneId ?? setLocalMilestoneId;

  const activeAnonymous = isAnonymous ?? localAnonymous;
  const setActiveAnonymous = setIsAnonymous ?? setLocalAnonymous;

  // Lock body scroll when modal is open
  useEffect(() => {
    if (show) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [show]);

  if (!show) return null;

  const numericAmount = Number(donationAmount) || 0;
  const milestones = campaign?.milestones || [];

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-[#0F534A]/80 backdrop-blur-sm"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-xl bg-[#FCFBF7] border-4 border-[#0F534A] shadow-[8px_8px_0px_#4717AE] text-left transition-all my-8 overflow-hidden">
        
        {/* ── HEADER BANNER ── */}
        <div className="p-5 sm:p-6 bg-[#0F534A] text-white flex items-start justify-between border-b-4 border-[#0F534A]">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#FFDD33] text-[#0F534A] px-2.5 py-0.5 text-xs font-headline font-black uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#FE4E1A]" /> Milestone Escrow Protected
            </div>
            <h2 id="modal-title" className="text-2xl sm:text-3xl font-headline font-black uppercase tracking-tight text-white leading-tight flex items-center gap-2 flex-wrap">
              <span>Support</span>
              <span className="text-[#FE4E1A]">Research</span>
              <BrushAnnotation color="yellow" rotate={-2} className="text-sm normal-case tracking-normal">
                ✦ Verified Impact
              </BrushAnnotation>
            </h2>
            <p className="text-xs text-[#FFF9F2] font-medium mt-1 truncate max-w-md">
              {campaign?.title || 'Student Innovation Campaign'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-white text-[#121316] border-2 border-[#121316] shadow-[2px_2px_0px_#FE4E1A] hover:bg-[#FE4E1A] hover:text-white transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── FORM BODY ── */}
        <form onSubmit={onSubmit} className="p-5 sm:p-6 space-y-5">
          
          {/* Preset Contribution Chips */}
          <div>
            <label className="block text-xs font-headline font-black uppercase text-[#0F534A] tracking-wider mb-2">
              Select Preset Amount or Custom
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {PRESET_AMOUNTS.map((chip) => {
                const isSelected = donationAmount === chip.value;
                return (
                  <button
                    key={chip.value}
                    type="button"
                    onClick={() => setDonationAmount(chip.value)}
                    className={`p-3 text-left border-3 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFDD33] text-[#121316] border-[#0F534A] shadow-[4px_4px_0px_#FE4E1A] -translate-x-0.5 -translate-y-0.5'
                        : 'bg-white text-[#121316] border-[#0F534A] shadow-[2px_2px_0px_#0F534A] hover:border-[#FE4E1A] hover:shadow-[3px_3px_0px_#FE4E1A]'
                    }`}
                  >
                    <div className="font-headline font-black text-base text-[#121316]">{chip.label}</div>
                    <div className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">{chip.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Amount Input */}
          <div>
            <label className="block text-xs font-headline font-black uppercase text-[#0F534A] tracking-wider mb-1">
              Contribution Amount (₹ INR) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-headline font-black text-2xl text-[#FE4E1A] pointer-events-none select-none">
                ₹
              </span>
              <input
                type="number"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                placeholder="Enter custom amount (e.g. 2500)"
                min="10"
                step="1"
                required
                className="w-full pl-12 pr-4 py-3 bg-white border-3 border-[#0F534A] shadow-[3px_3px_0px_#0F534A] font-headline font-black text-xl text-[#121316] focus:border-[#FE4E1A] focus:shadow-[5px_5px_0px_#FE4E1A] outline-none transition-all"
              />
            </div>
          </div>

          {/* Milestone Allocation Target */}
          {milestones.length > 0 && (
            <div>
              <label className="block text-xs font-headline font-black uppercase text-[#0F534A] tracking-wider mb-1">
                Earmark Allocation Target
              </label>
              <select
                value={activeMilestoneId}
                onChange={(e) => setActiveMilestoneId(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border-3 border-[#0F534A] shadow-[3px_3px_0px_#0F534A] font-headline font-bold text-xs uppercase text-[#121316] focus:border-[#FE4E1A] focus:shadow-[4px_4px_0px_#FE4E1A] outline-none transition-all"
              >
                <option value="ALL">General Campaign Escrow Pool (Pro-rata)</option>
                {milestones.map((m: any, idx: number) => (
                  <option key={m.id || idx} value={m.id || idx}>
                    Tranche #{m.order || idx + 1}: {m.title} (₹{Number(m.budget || m.targetAmount || 0).toLocaleString()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Guest Donor Email */}
          {!currentUser && (
            <div>
              <label className="block text-xs font-headline font-black uppercase text-[#0F534A] tracking-wider mb-1">
                Donor Email Address (For Tax Receipt & Updates) *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="donor@example.com"
                required
                className="w-full px-3 py-2.5 bg-white border-3 border-[#0F534A] shadow-[3px_3px_0px_#0F534A] font-medium text-sm text-[#121316] focus:border-[#FE4E1A] focus:shadow-[4px_4px_0px_#FE4E1A] outline-none transition-all"
              />
            </div>
          )}

          {/* Payment Method Badge */}
          <div className="p-3 bg-[#FCFBF7] border-2 border-[#0F534A] shadow-[2px_2px_0px_#0F534A] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-[#0F534A] border border-[#121316] animate-pulse" />
              <span className="font-headline font-black text-xs uppercase text-[#0F534A]">
                Razorpay Escrow Gateway
              </span>
            </div>
            <span className="text-[11px] font-bold text-[#0F534A]/90 tracking-tight">
              UPI • Cards • NetBanking • Wallets
            </span>
          </div>

          {/* Anonymous Attribution Toggle */}
          <label
            htmlFor="anonymous-donor"
            className="flex items-center gap-3 p-3 bg-[#FFF9F2] border-2 border-[#0F534A] shadow-[2px_2px_0px_#0F534A] cursor-pointer hover:bg-[#FFF4E5] transition-colors"
          >
            <input
              type="checkbox"
              id="anonymous-donor"
              checked={activeAnonymous}
              onChange={(e) => setActiveAnonymous(e.target.checked)}
              className="w-4 h-4 accent-[#FE4E1A] cursor-pointer shrink-0"
            />
            <span className="text-xs font-bold text-[#121316] cursor-pointer">
              Hide my identity on the public backers feed (Anonymous donation).
            </span>
          </label>

          {/* Action Button */}
          <div className="pt-2">
            <TactileNeobrutalistButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-base sm:text-lg"
              leftIcon={<Heart className="w-5 h-5 fill-white" />}
            >
              Proceed to Secure Checkout (₹{numericAmount.toLocaleString()}) ✦
            </TactileNeobrutalistButton>
            
            <p className="text-[11px] text-center text-gray-500 font-medium mt-2 flex items-center justify-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#0F534A]" /> Funds held in dual-entry escrow until milestone verification.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
