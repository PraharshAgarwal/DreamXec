import React from 'react';
import { Plus, Trash2, CheckSquare, Calendar, AlertTriangle, Layers } from 'lucide-react';
import { BrushAnnotation } from '../ui/BrushAnnotation';
import { TactileNeobrutalistButton } from '../ui/TactileNeobrutalistButton';

export interface MilestoneItem {
  id: string;
  order: number;
  title: string;
  objective: string;
  durationDays: number;
  deadline?: string;
  budget: number;
  acceptanceCriteria: string[];
  requiredEvidenceTypes: string[];
}

export interface MilestoneTrancheBuilderProps {
  milestones: MilestoneItem[];
  totalGoal: number;
  currency?: string;
  onChange: (milestones: MilestoneItem[]) => void;
  className?: string;
}

const EVIDENCE_TYPE_OPTIONS = [
  { id: 'INVOICE', label: 'Vendor Invoice / Bill' },
  { id: 'VIDEO_WALKTHROUGH', label: 'Demo Video' },
  { id: 'ON_SITE_PHOTO', label: 'Lab / Site Photo' },
  { id: 'INSPECTION_REPORT', label: 'Faculty Sign-off' },
  { id: 'UTILIZATION_CERTIFICATE', label: 'Utilization Cert' },
];

export const MilestoneTrancheBuilder: React.FC<MilestoneTrancheBuilderProps> = ({
  milestones,
  totalGoal,
  currency = 'INR',
  onChange,
  className = '',
}) => {
  const currentTotal = milestones.reduce((sum, m) => sum + (Number(m.budget) || 0), 0);
  const delta = totalGoal - currentTotal;
  const isBalanced = Math.abs(delta) < 1;

  const handleAddMilestone = () => {
    if (milestones.length >= 6) {
      alert('Maximum 6 milestone tranches allowed per campaign.');
      return;
    }

    const nextOrder = milestones.length + 1;
    const defaultBudget = delta > 0 ? delta : Math.round(totalGoal / (milestones.length + 1));

    const newMilestone: MilestoneItem = {
      id: `m_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      order: nextOrder,
      title: `Milestone ${nextOrder}: `,
      objective: '',
      durationDays: 30,
      budget: defaultBudget,
      acceptanceCriteria: ['Prototype completion verified by faculty mentor'],
      requiredEvidenceTypes: ['INVOICE', 'ON_SITE_PHOTO'],
    };

    onChange([...milestones, newMilestone]);
  };

  const handleRemoveMilestone = (idx: number) => {
    if (milestones.length <= 1) {
      alert('A campaign must contain at least 1 milestone tranche.');
      return;
    }
    const updated = milestones
      .filter((_, i) => i !== idx)
      .map((m, i) => ({ ...m, order: i + 1 }));
    onChange(updated);
  };

  const handleUpdateMilestone = (idx: number, field: keyof MilestoneItem, value: any) => {
    const updated = [...milestones];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange(updated);
  };

  const handleAddCriterion = (mIdx: number) => {
    const m = milestones[mIdx];
    const updatedCriteria = [...m.acceptanceCriteria, ''];
    handleUpdateMilestone(mIdx, 'acceptanceCriteria', updatedCriteria);
  };

  const handleUpdateCriterion = (mIdx: number, cIdx: number, val: string) => {
    const m = milestones[mIdx];
    const updated = [...m.acceptanceCriteria];
    updated[cIdx] = val;
    handleUpdateMilestone(mIdx, 'acceptanceCriteria', updated);
  };

  const handleRemoveCriterion = (mIdx: number, cIdx: number) => {
    const m = milestones[mIdx];
    if (m.acceptanceCriteria.length <= 1) return;
    const updated = m.acceptanceCriteria.filter((_, i) => i !== cIdx);
    handleUpdateMilestone(mIdx, 'acceptanceCriteria', updated);
  };

  const toggleEvidenceType = (mIdx: number, typeId: string) => {
    const m = milestones[mIdx];
    const exists = m.requiredEvidenceTypes.includes(typeId);
    const updated = exists
      ? m.requiredEvidenceTypes.filter((t) => t !== typeId)
      : [...m.requiredEvidenceTypes, typeId];
    handleUpdateMilestone(mIdx, 'requiredEvidenceTypes', updated);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ── REAL-TIME BUDGET BALANCE BARRIER ── */}
      <div
        className={`p-4 border-3 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          isBalanced
            ? 'bg-[#9EFC5F]/20 border-[#0F534A] shadow-[4px_4px_0px_#0F534A]'
            : 'bg-[#F4002C]/10 border-[#F4002C] shadow-[4px_4px_0px_#F4002C]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 flex items-center justify-center border-2 ${
              isBalanced
                ? 'bg-[#0F534A] text-[#9EFC5F] border-[#0F534A]'
                : 'bg-[#F4002C] text-white border-[#121316]'
            }`}
          >
            {isBalanced ? <CheckSquare className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <p className="font-headline font-black text-sm uppercase text-[#121316]">
              {isBalanced ? 'Tranche Budget Balanced ✓' : 'Budget Delta Mismatch'}
            </p>
            <p className="text-xs font-semibold text-gray-700">
              Total Goal: ₹{totalGoal.toLocaleString()} • Milestones Sum: ₹{currentTotal.toLocaleString()}
            </p>
          </div>
        </div>

        {!isBalanced && (
          <div className="bg-[#F4002C] text-white px-3 py-1 text-xs font-headline font-bold uppercase tracking-wider border border-[#121316]">
            Delta: {delta > 0 ? `+₹${delta.toLocaleString()} needed` : `-₹${Math.abs(delta).toLocaleString()} over`}
          </div>
        )}
      </div>

      {/* ── MILESTONES LIST ── */}
      <div className="space-y-6">
        {milestones.map((m, mIdx) => (
          <div
            key={m.id}
            className="bg-white border-4 border-[#0F534A] shadow-[6px_6px_0px_#4717AE] p-6 relative"
          >
            {/* Top Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b-2 border-dashed border-gray-300">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 flex items-center justify-center font-headline font-black text-sm bg-[#0F534A] text-white border-2 border-[#121316] shadow-[2px_2px_0px_#FE4E1A]">
                  #{m.order}
                </span>
                <span className="font-headline font-black text-base text-[#121316] uppercase">
                  Tranche #{m.order}
                </span>
              </div>

              {milestones.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveMilestone(mIdx)}
                  className="text-xs font-headline font-bold text-[#F4002C] hover:text-black flex items-center gap-1 border border-[#F4002C] px-2.5 py-1 bg-white hover:bg-red-50 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                  Milestone Title *
                </label>
                <input
                  type="text"
                  value={m.title}
                  onChange={(e) => handleUpdateMilestone(mIdx, 'title', e.target.value)}
                  placeholder="e.g. Phase 1: Prototype Fabrication & Lab Tests"
                  className="w-full px-3 py-2 border-2 border-[#0F534A] font-medium text-sm text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A]"
                />
              </div>

              <div>
                <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                  Tranche Budget ({currency}) *
                </label>
                <input
                  type="number"
                  value={m.budget || ''}
                  onChange={(e) => handleUpdateMilestone(mIdx, 'budget', Number(e.target.value))}
                  placeholder="e.g. 50000"
                  className="w-full px-3 py-2 border-2 border-[#0F534A] font-bold text-sm text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A]"
                />
              </div>
            </div>

            {/* Objective Narrative */}
            <div className="mb-4">
              <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
                Objective & Scope of Work
              </label>
              <textarea
                rows={2}
                value={m.objective}
                onChange={(e) => handleUpdateMilestone(mIdx, 'objective', e.target.value)}
                placeholder="Describe specifically what deliverables will be executed in this phase..."
                className="w-full px-3 py-2 border-2 border-[#0F534A] font-normal text-xs text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A]"
              />
            </div>

            {/* Acceptance Criteria Dynamic Checklist */}
            <div className="mb-5 p-4 bg-[#FFF9F2] border-2 border-[#0F534A]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-headline font-black uppercase text-[#0F534A]">
                  Acceptance Criteria (Verification Checklist) *
                </label>
                <button
                  type="button"
                  onClick={() => handleAddCriterion(mIdx)}
                  className="text-[11px] font-headline font-black text-[#FE4E1A] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Criterion
                </button>
              </div>

              <div className="space-y-2">
                {m.acceptanceCriteria.map((crit, cIdx) => (
                  <div key={cIdx} className="flex items-center gap-2">
                    <span className="font-bold text-[#FE4E1A] text-xs">✓</span>
                    <input
                      type="text"
                      value={crit}
                      onChange={(e) => handleUpdateCriterion(mIdx, cIdx, e.target.value)}
                      placeholder={`Criterion #${cIdx + 1}: e.g. Operational demo video submitted & verified`}
                      className="flex-1 px-3 py-1.5 bg-white border border-[#0F534A] text-xs font-medium text-[#121316] focus:border-[#FE4E1A] outline-none"
                    />
                    {m.acceptanceCriteria.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveCriterion(mIdx, cIdx)}
                        className="text-gray-400 hover:text-red-600 p-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Required Evidence Types */}
            <div>
              <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-2">
                Required Verification Proofs for Release:
              </label>
              <div className="flex flex-wrap gap-2">
                {EVIDENCE_TYPE_OPTIONS.map((ev) => {
                  const isChecked = m.requiredEvidenceTypes.includes(ev.id);
                  return (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => toggleEvidenceType(mIdx, ev.id)}
                      className={`px-3 py-1.5 text-xs font-headline font-bold border-2 transition-all cursor-pointer select-none ${
                        isChecked
                          ? 'bg-[#0F534A] text-white border-[#121316] shadow-[2px_2px_0px_#121316]'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-[#0F534A]'
                      }`}
                    >
                      {isChecked ? '✓ ' : '+ '}
                      {ev.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Milestone Button */}
      {milestones.length < 6 && (
        <TactileNeobrutalistButton
          type="button"
          variant="outline"
          onClick={handleAddMilestone}
          className="w-full py-3"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Another Milestone Tranche ({milestones.length}/6)
        </TactileNeobrutalistButton>
      )}
    </div>
  );
};
