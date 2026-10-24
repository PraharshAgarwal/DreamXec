import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  FileText,
  Video,
  Camera,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  Lock,
  Sparkles,
  Layers,
  ArrowRight,
  Edit3,
  History,
} from 'lucide-react';
import type { Campaign } from '../../types';
import MilestoneEditModal from './MilestoneEditModal';
import MilestoneRevisionHistoryModal from './MilestoneRevisionHistoryModal';
import KineticCircuitMilestoneTracker from './KineticCircuitMilestoneTracker';

interface Props {
  campaign: Campaign;
  currentUser?: any;
  onRefresh?: () => void;
}

export default function PublicMilestoneEcosystem({ campaign, currentUser, onRefresh }: Props) {
  const milestones = campaign.milestones || [];
  const [selectedTrancheIndex, setSelectedTrancheIndex] = useState<number>(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const totalMilestones = milestones.length;
  const completedMilestones = milestones.filter(
    (m: any) => m.status === 'COMPLETED' || m.status === 'APPROVED' || m.status === 'VERIFIED'
  ).length;

  const isOwnerOrAdmin =
    currentUser &&
    (currentUser.id === (campaign as any).studentUserId ||
      currentUser.id === (campaign as any).userId ||
      currentUser.id === (campaign as any).student?.id ||
      currentUser.role === 'ADMIN' ||
      (currentUser.orgRoles && currentUser.orgRoles.includes('ORG_ADMIN')));

  if (totalMilestones === 0) {
    return (
      <div className="p-8 text-center bg-white border-3 border-[#0F534A] shadow-[4px_4px_0px_#4717AE]">
        <Layers className="w-10 h-10 text-[#0F534A] mx-auto mb-2 opacity-50" />
        <h4 className="font-headline font-black text-lg text-[#0F534A] uppercase">
          Standard Escrow Roadmap
        </h4>
        <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
          This research initiative disburses funds in sequential tranches upon faculty mentor validation.
        </p>
      </div>
    );
  }

  const selectedMilestone = milestones[selectedTrancheIndex] || milestones[0];

  const getStatusBadge = (status: string, index: number) => {
    const s = (status || 'PLANNED').toUpperCase();
    if (s === 'COMPLETED' || s === 'APPROVED' || s === 'VERIFIED') {
      return (
        <span className="inline-flex items-center gap-1 bg-[#0F534A] text-[#9EFC5F] border border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider shadow-[1px_1px_0px_#121316]">
          <CheckCircle2 className="w-3 h-3 text-[#9EFC5F]" /> Verified &amp; Released
        </span>
      );
    }
    if (s === 'ACTIVE' || s === 'IN_PROGRESS') {
      return (
        <span className="inline-flex items-center gap-1 bg-[#FE4E1A] text-white border border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider shadow-[1px_1px_0px_#121316] animate-pulse">
          <Clock className="w-3 h-3" /> Active Tranche
        </span>
      );
    }
    if (s === 'SUBMITTED' || s === 'UNDER_VERIFICATION') {
      return (
        <span className="inline-flex items-center gap-1 bg-[#18D7E8] text-[#041A16] border border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider shadow-[1px_1px_0px_#121316]">
          <ShieldCheck className="w-3 h-3" /> In Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-[#FFDD33] text-[#121316] border border-[#121316] px-2.5 py-0.5 text-[10px] font-headline font-black uppercase tracking-wider shadow-[1px_1px_0px_#121316]">
        <Lock className="w-3 h-3 text-[#121316]" /> Tranche #{index + 1} Locked
      </span>
    );
  };

  return (
    <div className="space-y-5">
      {/* ── ROADMAP PIPELINE HEADER ── */}
      <div className="p-5 sm:p-6 bg-white border-3 border-[#0F534A] shadow-[5px_5px_0px_#0F534A]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-dashed border-gray-200">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-headline font-black uppercase text-[#FE4E1A] tracking-wider mb-1">
              <span>✦</span> Dual-Authorization Escrow Pipeline
            </div>
            <h3 className="text-xl sm:text-2xl font-headline font-black text-[#0F534A] uppercase tracking-tight">
              Milestone Execution Stages
            </h3>
            <p className="text-xs text-gray-600 font-medium mt-0.5">
              Contributions are locked in escrow and unlocked tranche-by-tranche upon institutional faculty proof verification.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#0F534A] text-white px-3.5 py-2 border-2 border-[#121316] shadow-[3px_3px_0px_#FE4E1A] self-start sm:self-auto">
            <span className="text-xl font-headline font-black text-[#9EFC5F]">
              {completedMilestones}
            </span>
            <span className="text-white/40 font-black text-lg">/</span>
            <span className="text-white font-headline font-bold text-xs uppercase tracking-wider">
              {totalMilestones} Tranches Released
            </span>
          </div>
        </div>

        {/* ── KINETIC CIRCUIT BOARD MILESTONE TRACKER ── */}
        <div className="mt-5">
          <KineticCircuitMilestoneTracker
            milestones={milestones}
            selectedTrancheIndex={selectedTrancheIndex}
            onSelectTranche={(idx) => setSelectedTrancheIndex(idx)}
            currencySymbol="₹"
          />
        </div>

        {/* ── INTERACTIVE TRANCHE STEPPER SELECTOR ── */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {milestones.map((m: any, idx: number) => {
            const isSelected = idx === selectedTrancheIndex;
            const budget = Number(m.targetAmount || m.budget || 0);

            return (
              <button
                key={m.id || idx}
                type="button"
                onClick={() => setSelectedTrancheIndex(idx)}
                className={`p-3.5 text-left border-2 transition-all duration-150 cursor-pointer relative overflow-hidden flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'bg-[#FFDD33] border-[#121316] shadow-[4px_4px_0px_#FE4E1A] -translate-y-0.5'
                    : 'bg-[#FCFBF7] border-[#0F534A]/30 hover:border-[#0F534A] hover:bg-white shadow-[2px_2px_0px_#0F534A]/10'
                }`}
              >
                {/* Tranche Index Top Bar */}
                <div className="flex items-center justify-between gap-2 w-full">
                  <span className="font-headline font-black text-[11px] uppercase text-[#0F534A]">
                    Phase #{idx + 1}
                  </span>
                  {getStatusBadge(m.status, idx)}
                </div>

                <h4 className="font-headline font-black text-xs sm:text-sm text-[#121316] line-clamp-2">
                  {m.title || `Tranche Phase ${idx + 1}`}
                </h4>

                <div className="pt-2 border-t border-dashed border-gray-300 flex items-center justify-between text-[11px] font-bold text-gray-600 w-full">
                  <span>Tranche Budget:</span>
                  <span className="font-headline font-black text-[#0F534A] text-xs">
                    ₹{budget.toLocaleString()}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── SELECTED TRANCHE DETAILED INSPECTION CARD ── */}
      {selectedMilestone && (
        <div className="p-6 bg-white border-4 border-[#0F534A] shadow-[6px_6px_0px_#FE4E1A] space-y-5 animate-in fade-in duration-150">
          
          {/* Header Info & Action Controls */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b-2 border-gray-100">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="bg-[#0F534A] text-white px-2 py-0.5 text-xs font-headline font-black uppercase">
                  Tranche #{selectedTrancheIndex + 1}
                </span>
                {getStatusBadge(selectedMilestone.status, selectedTrancheIndex)}
              </div>
              <h3 className="font-headline font-black text-xl sm:text-2xl uppercase text-[#0F534A] tracking-tight">
                {selectedMilestone.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="bg-[#FFF9F2] border-2 border-[#0F534A] px-4 py-2 text-right shadow-[2px_2px_0px_#0F534A]">
                <div className="text-[10px] font-headline font-black uppercase text-gray-500">
                  Earmarked Target
                </div>
                <div className="text-xl font-headline font-black text-[#FE4E1A]">
                  ₹{Number(selectedMilestone.targetAmount || selectedMilestone.budget || 0).toLocaleString()}
                </div>
              </div>

              {/* Owner / Admin Edit & Revision Buttons */}
              {isOwnerOrAdmin && (
                <div className="flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FE4E1A] text-white border-2 border-[#121316] text-xs font-headline font-black uppercase shadow-[2px_2px_0px_#121316] hover:bg-[#d83d10] cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Edit Milestone
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#0F534A] border-2 border-[#0F534A] text-xs font-headline font-black uppercase shadow-[2px_2px_0px_#0F534A] hover:bg-gray-50 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" /> History
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Scope & Objective */}
          {selectedMilestone.description && (
            <div>
              <h5 className="text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-1.5">
                Scope &amp; Objective
              </h5>
              <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed bg-[#FCFBF7] p-3.5 border-2 border-dashed border-[#0F534A]/30">
                {selectedMilestone.description}
              </p>
            </div>
          )}

          {/* Acceptance Criteria */}
          {((selectedMilestone.criteria && selectedMilestone.criteria.length > 0) ||
            (selectedMilestone.acceptanceCriteria && selectedMilestone.acceptanceCriteria.length > 0)) && (
            <div>
              <h5 className="text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0B9C2C]" />
                Escrow Release Criteria (Maker-Checker Verified)
              </h5>
              <div className="space-y-2">
                {(selectedMilestone.criteria || selectedMilestone.acceptanceCriteria).map((c: string, cIdx: number) => (
                  <div
                    key={cIdx}
                    className="flex items-start gap-2.5 p-2.5 bg-white border border-[#0F534A]/20 hover:border-[#0F534A] transition-colors text-xs font-bold text-gray-800"
                  >
                    <div className="w-4 h-4 rounded-full bg-[#9EFC5F] text-[#0F534A] flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px] font-black">
                      ✓
                    </div>
                    <span>{c}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Proof Requirements */}
          <div>
            <h5 className="text-xs font-headline font-black uppercase tracking-wider text-[#0F534A] mb-2">
              Mandatory Proof Requirements:
            </h5>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-[#0F534A] text-xs font-bold text-[#0F534A] shadow-[2px_2px_0px_#0F534A]">
                <FileText className="w-3.5 h-3.5 text-[#FE4E1A]" /> GST Invoice &amp; Procurement Receipts
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-[#0F534A] text-xs font-bold text-[#0F534A] shadow-[2px_2px_0px_#0F534A]">
                <Video className="w-3.5 h-3.5 text-[#18D7E8]" /> Video Walkthrough Telemetry
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-[#0F534A] text-xs font-bold text-[#0F534A] shadow-[2px_2px_0px_#0F534A]">
                <Camera className="w-3.5 h-3.5 text-[#FF7F00]" /> Lab On-Site Photo Proofs
              </span>
            </div>
          </div>

          {/* Audit Seal Note */}
          <div className="p-3 bg-[#E8F8F5] border-2 border-[#0F534A] flex items-center gap-2 text-xs font-bold text-[#0F534A]">
            <ShieldCheck className="w-4 h-4 text-[#0B9C2C] flex-shrink-0" />
            <span>
              4-Eyes Governance: Tranche releases require Lead Maker verification and Institutional Faculty Checker authorization prior to bank disbursement.
            </span>
          </div>

        </div>
      )}

      {/* ── MILESTONE EDIT & REVISION MODAL ── */}
      <MilestoneEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        campaignId={campaign.id}
        milestone={selectedMilestone}
        campaignStatus={campaign.status}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
      />

      {/* ── REVISION HISTORY MODAL ── */}
      <MilestoneRevisionHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        campaignId={campaign.id}
        milestone={selectedMilestone}
      />

    </div>
  );
}