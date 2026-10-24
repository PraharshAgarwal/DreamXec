import React, { useState } from 'react';
import {
  Zap,
  ShieldCheck,
  Cpu,
  Wrench,
} from 'lucide-react';
export interface KineticMilestone {
  id?: string;
  sequenceOrder?: number;
  currentVersion?: number;
  title: string;
  description?: string;
  durationDays?: number;
  deadline?: string | null;
  targetAmount?: number;
  budget?: number;
  acceptanceCriteria?: string[];
  criteria?: string[];
  requiredEvidenceTypes?: string[];
  status: string;
  disbursedAt?: string | null;
}

interface Props {
  milestones: any[];
  selectedTrancheIndex: number;
  onSelectTranche: (index: number) => void;
  currencySymbol?: string;
}

export default function KineticCircuitMilestoneTracker({
  milestones,
  selectedTrancheIndex,
  onSelectTranche,
  currencySymbol = '₹',
}: Props) {
  const [activeMode, setActiveMode] = useState<'circuit' | 'tube'>('circuit');
  const [hoveredNode, setHoveredNode] = useState<number | null>(null);
  const [isSurging, setIsSurging] = useState<boolean>(false);

  if (!milestones || milestones.length === 0) {
    return null;
  }

  // Calculate stats
  const totalAmount = milestones.reduce(
    (sum, m) => sum + Number(m.targetAmount || m.budget || 0),
    0
  );

  const completedCount = milestones.filter(
    (m) => m.status === 'COMPLETED' || m.status === 'APPROVED' || m.status === 'VERIFIED'
  ).length;

  const releasedAmount = milestones
    .filter((m) => m.status === 'COMPLETED' || m.status === 'APPROVED' || m.status === 'VERIFIED')
    .reduce((sum, m) => sum + Number(m.targetAmount || m.budget || 0), 0);

  const activeIndex = milestones.findIndex(
    (m) => m.status === 'ACTIVE' || m.status === 'IN_PROGRESS'
  );

  const currentActiveIdx = activeIndex !== -1 ? activeIndex : completedCount < milestones.length ? completedCount : milestones.length - 1;

  const progressPercent = totalAmount > 0 ? Math.round((releasedAmount / totalAmount) * 100) : 0;

  // Manual voltage pulse surge trigger
  const triggerCurrentSurge = () => {
    setIsSurging(true);
    setTimeout(() => setIsSurging(false), 2400);
  };

  const focusedIndex = hoveredNode !== null ? hoveredNode : selectedTrancheIndex;
  const focusedMilestone = milestones[focusedIndex] || milestones[0];
  const focusedBudget = Number(focusedMilestone?.targetAmount || focusedMilestone?.budget || 0);
  const focusedCriteria = focusedMilestone?.acceptanceCriteria || (focusedMilestone as any)?.criteria || [];
  const isFocusedCompleted =
    focusedMilestone?.status === 'COMPLETED' ||
    focusedMilestone?.status === 'APPROVED' ||
    focusedMilestone?.status === 'VERIFIED';
  const isFocusedActive =
    focusedMilestone?.status === 'ACTIVE' ||
    focusedMilestone?.status === 'IN_PROGRESS' ||
    focusedIndex === currentActiveIdx;

  return (
    <div className="bg-[#FCFBF7] text-[#121316] border-4 border-[#121316] shadow-[6px_6px_0px_#0F534A] overflow-hidden relative font-sans">
      {/* ── CIRCUIT SUBSTRATE TECHNICAL BLUEPRINT BACKGROUND ── */}
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: `
            radial-gradient(#0F534A 1.25px, transparent 1.25px),
            linear-gradient(to right, rgba(15, 83, 74, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(15, 83, 74, 0.08) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px, 48px 48px, 48px 48px',
        }}
      />

      {/* PCB Silkscreen Markings & Test Points */}
      <div className="absolute top-2.5 left-3 text-[9px] font-mono font-bold text-[#0F534A]/50 select-none hidden sm:block">
        DX-ESCROW-SCHEMATIC // REV 4.2 // [TP-IN 12V] [GND]
      </div>
      <div className="absolute top-2.5 right-3 text-[9px] font-mono font-bold text-[#FE4E1A]/60 select-none hidden sm:block">
        MAKER-CHECKER CONDUCTIVE BUS // 100% ESCROW BACKED
      </div>

      {/* ── TOP TELEMETRY BAR ── */}
      <div className="p-4 sm:p-5 border-b-3 border-[#121316] flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 bg-[#FFF9F2]/95 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#FFDD33] border-2 border-[#121316] flex items-center justify-center text-[#121316] shadow-[2px_2px_0px_#121316]">
            <Cpu className="w-5 h-5 animate-pulse text-[#0F534A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-headline font-black text-xs uppercase tracking-wider text-[#FE4E1A]">
                Kinetic Escrow Telemetry
              </span>
              <span className="px-2 py-0.5 text-[9px] font-mono font-black bg-[#9EFC5F] text-[#0F534A] border border-[#0F534A] shadow-[1px_1px_0px_#0F534A]">
                LIVE VOLTAGE
              </span>
              <span className="font-brush text-[#FE4E1A] text-sm hidden lg:inline-block rotate-[-2deg] ml-1">
                ★ Real-time grant release
              </span>
            </div>
            <h3 className="font-headline font-black text-lg sm:text-xl uppercase text-[#0F534A] tracking-tight flex items-center gap-2">
              Conductive Circuit Milestone Track
            </h3>
          </div>
        </div>

        {/* View Mode & Surge Trigger Controls */}
        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={triggerCurrentSurge}
            disabled={isSurging}
            className={`px-3.5 py-1.5 border-2 border-[#121316] text-[11px] font-headline font-black uppercase flex items-center gap-1.5 cursor-pointer transition-all shadow-[3px_3px_0px_#121316] active:translate-x-0.5 active:translate-y-0.5 ${
              isSurging
                ? 'bg-[#FE4E1A] text-white ring-4 ring-[#FFDD33] shadow-[0_0_16px_rgba(254,78,26,0.6)]'
                : 'bg-[#FFDD33] text-[#121316] hover:bg-[#FE4E1A] hover:text-white'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isSurging ? 'text-white fill-white' : 'text-[#FE4E1A] fill-[#FE4E1A]'}`} />
            <span>{isSurging ? '⚡ Voltage Surging...' : 'Pulse Voltage'}</span>
          </button>

          {/* Mode Switcher */}
          <div className="flex items-center bg-white border-2 border-[#121316] p-0.5 shadow-[2px_2px_0px_#121316]">
            <button
              type="button"
              onClick={() => setActiveMode('circuit')}
              className={`px-3 py-1 text-[10px] font-headline font-black uppercase transition-all cursor-pointer ${
                activeMode === 'circuit'
                  ? 'bg-[#0F534A] text-white shadow-[1px_1px_0px_#121316]'
                  : 'text-gray-600 hover:text-[#121316]'
              }`}
            >
              ⚡ Circuit
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('tube')}
              className={`px-3 py-1 text-[10px] font-headline font-black uppercase transition-all cursor-pointer ${
                activeMode === 'tube'
                  ? 'bg-[#18D7E8] text-[#121316] shadow-[1px_1px_0px_#121316]'
                  : 'text-gray-600 hover:text-[#121316]'
              }`}
            >
              🧪 Liquid Tube
            </button>
          </div>
        </div>
      </div>

      {/* ── METRIC READOUT STRIP ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-4 sm:px-6 py-3.5 bg-[#FFF9F2] border-b-2 border-[#121316] text-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
        <div>
          <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider block">
            Disbursed Energy
          </span>
          <span className="font-headline font-black text-base sm:text-lg text-[#0F534A]">
            {currencySymbol}{releasedAmount.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider block">
            Escrow Potential
          </span>
          <span className="font-headline font-black text-base sm:text-lg text-[#FE4E1A]">
            {currencySymbol}{totalAmount.toLocaleString()}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider block">
            Tranches Verified
          </span>
          <span className="font-headline font-black text-base sm:text-lg text-[#121316] flex items-center gap-1.5">
            {completedCount} / {milestones.length}{' '}
            <span className="text-[9px] font-headline font-black uppercase px-1.5 py-0.5 bg-[#FFDD33] text-[#121316] border border-[#121316] shadow-[1px_1px_0px_#121316]">
              Active
            </span>
          </span>
        </div>
        <div>
          <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider block">
            Solvency Ratio
          </span>
          <div className="flex items-center gap-2">
            <span className="font-headline font-black text-base sm:text-lg text-[#4717AE]">
              {progressPercent}%
            </span>
            <div className="w-20 h-2.5 bg-white border-2 border-[#121316] rounded-full overflow-hidden p-0.5 shadow-[1px_1px_0px_#121316]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#0F534A] via-[#18D7E8] to-[#9EFC5F] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── MODE 1: CONDUCTIVE CIRCUIT TRACK ── */}
      {activeMode === 'circuit' && (
        <div className="p-4 sm:p-6 flex flex-col justify-center space-y-4">
          {/* Scrollable Circuit Board */}
          <div className="overflow-x-auto py-4 -mx-2 px-2">
            <div className="relative min-w-[620px] py-4">
              {/* Base Copper Track */}
              <div className="absolute top-1/2 left-6 right-6 h-2.5 bg-[#E8E3D7] -translate-y-1/2 rounded-full overflow-hidden border-2 border-[#121316] shadow-[inset_0_1px_2px_rgba(0,0,0,0.12)]">
                {/* Powered/Energized Segment */}
                <div
                  className="h-full bg-gradient-to-r from-[#0F534A] via-[#FFDD33] to-[#FE4E1A] transition-all duration-700 relative"
                  style={{
                    width: `${
                      milestones.length > 1
                        ? Math.min(
                            100,
                            Math.max(
                              0,
                              ((Math.max(completedCount, currentActiveIdx + 0.5)) /
                                (milestones.length - 1)) *
                                100
                            )
                          )
                        : 100
                    }%`,
                  }}
                >
                  {/* Moving Spark along the energized segment */}
                  <div className="circuit-spark absolute top-0 right-0 w-8 h-full bg-white blur-[2px]" />
                </div>
              </div>

              {/* Additional Decorative Silkscreen Traces */}
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none opacity-30">
                <div className="h-6 border-y border-dashed border-[#0F534A]/30 mx-6" />
              </div>

              {/* Circuit Nodes (IC Chips & Relay Capacitors) */}
              <div className="relative flex items-center justify-between gap-4 z-10 px-2">
                {milestones.map((m, idx) => {
                  const isCompleted =
                    m.status === 'COMPLETED' || m.status === 'APPROVED' || m.status === 'VERIFIED';
                  const isActive =
                    m.status === 'ACTIVE' || m.status === 'IN_PROGRESS' || idx === currentActiveIdx;
                  const isSelected = idx === selectedTrancheIndex;
                  const isHovered = idx === hoveredNode;
                  const budget = Number(m.targetAmount || m.budget || 0);
                  const criteriaList = m.acceptanceCriteria || (m as any).criteria || [];

                  return (
                    <div
                      key={m.id || idx}
                      className="relative flex flex-col items-center flex-1 max-w-[210px]"
                      onMouseEnter={() => setHoveredNode(idx)}
                      onMouseLeave={() => setHoveredNode(null)}
                    >
                      {/* Upper IC Pin Legs */}
                      <div className="flex justify-between w-14 mb-0.5">
                        <div className="w-1.5 h-2 bg-gradient-to-b from-[#FFDD33] to-[#FE4E1A] border-x border-t border-[#121316]" />
                        <div className="w-1.5 h-2 bg-gradient-to-b from-[#FFDD33] to-[#FE4E1A] border-x border-t border-[#121316]" />
                        <div className="w-1.5 h-2 bg-gradient-to-b from-[#FFDD33] to-[#FE4E1A] border-x border-t border-[#121316]" />
                      </div>

                      {/* Node Interactive Chip Body */}
                      <button
                        type="button"
                        onClick={() => onSelectTranche(idx)}
                        className={`w-full p-3 text-left transition-all duration-150 cursor-pointer relative ${
                          isSelected
                            ? 'border-3 border-[#121316] bg-[#FFDD33] text-[#121316] shadow-[4px_4px_0px_#121316] -translate-y-1 z-20 ring-2 ring-[#FE4E1A]'
                            : isHovered
                            ? 'border-2 border-[#121316] bg-white text-[#121316] shadow-[4px_4px_0px_#0F534A] -translate-y-0.5 z-10'
                            : isCompleted
                            ? 'border-2 border-[#0F534A] bg-white text-[#121316] shadow-[3px_3px_0px_#0F534A]'
                            : isActive
                            ? 'border-3 border-[#FE4E1A] bg-[#FFF9F2] text-[#121316] shadow-[3px_3px_0px_#FE4E1A]'
                            : 'border-2 border-gray-300 bg-white/80 text-gray-500 shadow-[2px_2px_0px_#E5E7EB] hover:border-[#0F534A] opacity-90'
                        }`}
                      >
                        {/* Node Status Header */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-[9px] font-mono font-black uppercase ${
                              isSelected
                                ? 'text-[#121316]'
                                : isCompleted
                                ? 'text-[#0F534A]'
                                : isActive
                                ? 'text-[#FE4E1A]'
                                : 'text-gray-400'
                            }`}
                          >
                            PHASE 0{idx + 1}
                          </span>

                          <div className="flex items-center gap-1">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-black text-[#0F534A] bg-[#9EFC5F]/50 px-1 py-0.5 border border-[#0F534A]">
                                ✓ DONE
                              </span>
                            ) : isActive ? (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-mono font-black text-white bg-[#FE4E1A] px-1 py-0.5 border border-[#121316] animate-pulse">
                                LIVE
                              </span>
                            ) : (
                              <span className="text-[8px] font-mono font-bold text-gray-400">
                                QUEUED
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Chip Title (Two lines for clean readability) */}
                        <div
                          className={`font-headline font-black text-xs line-clamp-2 min-h-[32px] leading-tight mb-1.5 ${
                            isSelected || isCompleted || isActive ? 'text-[#121316]' : 'text-gray-700'
                          }`}
                        >
                          {m.title || `Tranche ${idx + 1}`}
                        </div>

                        {/* Budget Readout */}
                        <div
                          className={`font-mono font-black text-xs ${
                            isSelected
                              ? 'text-[#121316]'
                              : isCompleted
                              ? 'text-[#0F534A]'
                              : isActive
                              ? 'text-[#FE4E1A]'
                              : 'text-gray-600'
                          }`}
                        >
                          {currencySymbol}{budget.toLocaleString()}
                        </div>

                        {/* Sequential LED Hatch Marks */}
                        <div className="mt-2 pt-1.5 border-t border-gray-200 flex items-center justify-between gap-1">
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((hatch) => {
                              const isHatchLit =
                                isCompleted ||
                                (isActive && hatch <= (criteriaList.length > 0 ? 3 : 2));
                              return (
                                <div
                                  key={hatch}
                                  className={`w-1.5 h-1.5 rounded-[1px] transition-all ${
                                    isHatchLit
                                      ? isCompleted
                                        ? 'bg-[#0F534A]'
                                        : 'bg-[#FE4E1A]'
                                      : 'bg-gray-200 border border-gray-300'
                                  }`}
                                />
                              );
                            })}
                          </div>
                          <span className="text-[8px] font-mono font-bold text-gray-500">
                            {isCompleted ? '+5.0V' : isActive ? '+3.3V' : '0.0V'}
                          </span>
                        </div>
                      </button>

                      {/* Lower IC Pin Legs */}
                      <div className="flex justify-between w-14 mt-0.5">
                        <div className="w-1.5 h-2 bg-gradient-to-t from-[#FFDD33] to-[#FE4E1A] border-x border-b border-[#121316]" />
                        <div className="w-1.5 h-2 bg-gradient-to-t from-[#FFDD33] to-[#FE4E1A] border-x border-b border-[#121316]" />
                        <div className="w-1.5 h-2 bg-gradient-to-t from-[#FFDD33] to-[#FE4E1A] border-x border-b border-[#121316]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── INTEGRATED TRANCHE TELEMETRY & DELIVERABLES INSPECTOR ── */}
          {focusedMilestone && (
            <div className="bg-white border-3 border-[#121316] shadow-[4px_4px_0px_#121316] p-4 text-left relative transition-all duration-200 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 mb-2.5 border-b-2 border-[#121316]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-black text-[#0F534A] uppercase bg-[#FFF9F2] border border-[#121316] px-2 py-0.5 shadow-[1px_1px_0px_#121316]">
                    TRANCHE #{focusedIndex + 1} TELEMETRY
                  </span>
                  <span
                    className={`text-[9px] font-mono font-black px-2 py-0.5 uppercase border border-[#121316] shadow-[1px_1px_0px_#121316] ${
                      isFocusedCompleted
                        ? 'bg-[#0F534A] text-white'
                        : isFocusedActive
                        ? 'bg-[#FE4E1A] text-white'
                        : 'bg-[#FFDD33] text-[#121316]'
                    }`}
                  >
                    {focusedMilestone.status || 'PLANNED'}
                  </span>
                  {hoveredNode !== null && hoveredNode !== selectedTrancheIndex && (
                    <span className="text-[9px] font-mono font-bold text-[#FE4E1A] bg-[#FFF9F2] px-1.5 py-0.5 border border-dashed border-[#FE4E1A]">
                      Previewing (Click to Select)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="font-mono font-bold text-gray-500 uppercase text-[10px]">
                    Earmarked Tranche:
                  </span>
                  <span className="font-mono font-black text-sm text-[#FE4E1A]">
                    {currencySymbol}{focusedBudget.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <div className="mb-2.5">
                <h4 className="font-headline font-black text-sm sm:text-base text-[#121316]">
                  {focusedMilestone.title}
                </h4>
                {focusedMilestone.description && (
                  <p className="text-xs text-gray-600 font-medium mt-0.5 line-clamp-2">
                    {focusedMilestone.description}
                  </p>
                )}
              </div>

              {/* Deliverables / Acceptance Criteria Tags */}
              {focusedCriteria.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 font-headline font-black text-[11px] text-[#121316] uppercase tracking-wider">
                    <Wrench className="w-3.5 h-3.5 text-[#FE4E1A]" />
                    <span>Funded Deliverables &amp; Acceptance Criteria:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {focusedCriteria.map((crit: string, cIdx: number) => (
                      <span
                        key={cIdx}
                        className="inline-flex items-center gap-1 text-[10px] font-medium bg-[#FCFBF7] border border-[#0F534A]/30 px-2 py-1 text-gray-800"
                      >
                        <span className="text-[#0F534A] font-bold">✓</span> {crit}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sign-off & Nav hint */}
              <div className="mt-3 pt-2 border-t border-dashed border-gray-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] font-mono text-gray-600">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#121316]">Dual-Escrow Sign-off:</span>
                  <span
                    className={`font-headline font-black ${
                      isFocusedCompleted ? 'text-[#0F534A]' : 'text-[#FE4E1A]'
                    }`}
                  >
                    {isFocusedCompleted ? 'VERIFIED ✓ (Faculty Endorsed)' : 'PENDING FACULTY SUBMISSION'}
                  </span>
                </div>
                <div className="text-[10px] text-gray-500">
                  Hover or click any phase node above to inspect telemetry
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── MODE 2: GLOWING LIQUID ESCROW TUBE ── */}
      {activeMode === 'tube' && (
        <div className="p-6 sm:p-8 flex flex-col items-center justify-center space-y-4">
          <div className="text-center max-w-md">
            <span className="text-xs font-headline font-black text-[#FE4E1A] uppercase tracking-wider">
              Liquid Escrow Reservoir
            </span>
            <h4 className="text-base font-headline font-black text-[#0F534A] uppercase mt-0.5">
              Hydraulic Tranche Solvency Tube
            </h4>
          </div>

          {/* Liquid Tube Apparatus */}
          <div className="w-full max-w-xl bg-[#FCFBF7] border-4 border-[#121316] p-4 rounded-2xl shadow-[5px_5px_0px_#0F534A] relative">
            {/* Metric Markings along tube */}
            <div className="relative h-12 bg-white rounded-xl overflow-hidden border-2 border-[#121316] flex items-center shadow-[inset_0_2px_6px_rgba(0,0,0,0.08)]">
              {/* Liquid Level with Glowing Fluid */}
              <div
                className="h-full bg-gradient-to-r from-[#0F534A] via-[#18D7E8] to-[#9EFC5F] transition-all duration-1000 relative shadow-[0_0_15px_rgba(24,215,232,0.4)]"
                style={{ width: `${Math.max(6, Math.min(100, progressPercent))}%` }}
              >
                {/* Fluid Surface Bubble & Glow */}
                <div className="absolute top-0 right-0 bottom-0 w-3 bg-white/40 blur-[1px] animate-pulse" />
                <div className="absolute top-1 left-2 text-[10px] font-mono font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)] whitespace-nowrap">
                  {progressPercent}% SOLVENT
                </div>
              </div>

              {/* Tranche Threshold Dividers */}
              {milestones.map((_, mIdx) => {
                if (mIdx === 0) return null;
                const pos = (mIdx / milestones.length) * 100;
                return (
                  <div
                    key={mIdx}
                    className="absolute top-0 bottom-0 w-0.5 bg-[#121316]/40 border-r border-[#121316]/60 z-10 flex flex-col justify-between py-1"
                    style={{ left: `${pos}%` }}
                  >
                    <span className="text-[8px] font-mono font-bold text-[#121316] -ml-2 select-none">
                      T{mIdx + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Tranche interactive selector pills below tube */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              {milestones.map((m, mIdx) => {
                const isSelected = mIdx === selectedTrancheIndex;
                const isCompleted =
                  m.status === 'COMPLETED' || m.status === 'APPROVED' || m.status === 'VERIFIED';
                return (
                  <button
                    key={m.id || mIdx}
                    type="button"
                    onClick={() => onSelectTranche(mIdx)}
                    className={`p-2 text-left border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFDD33] border-[#121316] shadow-[2px_2px_0px_#121316]'
                        : isCompleted
                        ? 'bg-white border-[#0F534A] text-[#0F534A]'
                        : 'bg-white/80 border-gray-300 text-gray-600'
                    }`}
                  >
                    <div className="text-[9px] font-mono font-bold">Phase 0{mIdx + 1}</div>
                    <div className="text-[10px] font-headline font-black truncate">{m.title}</div>
                    <div className="text-[10px] font-mono font-bold">
                      {currencySymbol}{Number(m.targetAmount || m.budget || 0).toLocaleString()}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tube Base Valving Indicators */}
            <div className="mt-3 pt-2 border-t border-dashed border-gray-300 flex items-center justify-between text-[11px] font-mono text-gray-700 px-1">
              <span className="flex items-center gap-1.5 text-[#0F534A] font-bold">
                <span className="w-2 h-2 rounded-full bg-[#0F534A] animate-ping" />
                Dual-Custody Valve OPEN
              </span>
              <span className="font-bold text-[#121316]">
                Capacity: {currencySymbol}{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER VOLTAGE CONDUIT BANNER ── */}
      <div className="p-3.5 bg-[#FFF9F2] border-t-2 border-[#121316] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-[#0F534A] font-black">● LIVE TRACE:</span>
          <span>Click any node to inspect detailed tranche deliverables and proof logs.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-brush text-sm sm:text-base text-[#FE4E1A] font-bold tracking-wide">
            ⚡ 4-Eyes Escrow Architecture Active
          </span>
          <ShieldCheck className="w-4 h-4 text-[#0F534A]" />
        </div>
      </div>
    </div>
  );
}
