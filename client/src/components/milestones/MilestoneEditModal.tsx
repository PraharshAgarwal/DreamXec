import React, { useState, useEffect } from 'react';
import { X, Sparkles, AlertCircle, Plus, Trash2, ShieldCheck, Clock, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { campaignService } from '../../services/campaignService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  milestone: any | null;
  campaignStatus?: string;
  onSuccess: () => void;
}

export default function MilestoneEditModal({
  isOpen,
  onClose,
  campaignId,
  milestone,
  campaignStatus,
  onSuccess,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationDays, setDurationDays] = useState(30);
  const [deadline, setDeadline] = useState('');
  const [budget, setBudget] = useState(0);
  const [acceptanceCriteria, setAcceptanceCriteria] = useState<string[]>([]);
  const [newCriterion, setNewCriterion] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (milestone) {
      setTitle(milestone.title || '');
      setDescription(milestone.description || milestone.objective || '');
      setDurationDays(Number(milestone.durationDays || 30));
      setDeadline(
        milestone.deadline
          ? new Date(milestone.deadline).toISOString().split('T')[0]
          : ''
      );
      setBudget(Number(milestone.targetAmount ?? milestone.budget ?? milestone.amount ?? 0));
      setAcceptanceCriteria(
        Array.isArray(milestone.acceptanceCriteria)
          ? milestone.acceptanceCriteria
          : Array.isArray(milestone.criteria)
          ? milestone.criteria
          : milestone.acceptanceCriteria
          ? [milestone.acceptanceCriteria]
          : []
      );
      setChangeReason('');
    }
  }, [milestone, isOpen]);

  if (!isOpen || !milestone) return null;

  const isLive = ['LIVE', 'APPROVED', 'DISBURSING', 'FULLY_FUNDED'].includes(
    (campaignStatus || '').toUpperCase()
  );

  const handleAddCriterion = () => {
    if (!newCriterion.trim()) return;
    setAcceptanceCriteria((prev) => [...prev, newCriterion.trim()]);
    setNewCriterion('');
  };

  const handleRemoveCriterion = (index: number) => {
    setAcceptanceCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || title.length < 2) {
      toast.error('Milestone title must be at least 2 characters.');
      return;
    }
    if (budget <= 0) {
      toast.error('Tranche budget must be a positive number.');
      return;
    }
    if (!changeReason.trim() || changeReason.length < 3) {
      toast.error('Please specify a brief change reason / justification for audit records.');
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(
      isLive
        ? 'Submitting milestone revision for Maker-Checker review...'
        : 'Updating milestone...'
    );

    try {
      await campaignService.requestMilestoneRevision(campaignId, milestone.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        durationDays: Number(durationDays),
        budget: Number(budget),
        changeReason: changeReason.trim(),
      });

      toast.success(
        isLive
          ? 'Milestone revision submitted for institutional review!'
          : 'Milestone tranche updated successfully!',
        { id: toastId }
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to update milestone:', err);
      toast.error(
        err.response?.data?.message || err.message || 'Failed to update milestone.',
        { id: toastId }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121316]/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border-4 border-[#0F534A] shadow-[8px_8px_0px_#121316] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 bg-[#0F534A] text-white border-b-4 border-[#121316]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FE4E1A] border-2 border-white flex items-center justify-center font-black text-white shadow-[2px_2px_0px_#121316]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-black text-lg sm:text-xl uppercase tracking-tight">
                {isLive ? 'Request Milestone Revision' : 'Edit Milestone Tranche'}
              </h3>
              <p className="text-[11px] text-white/80 font-bold uppercase tracking-wider">
                Phase #{milestone.sequenceOrder || milestone.order || 1} • {milestone.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-white text-[#121316] border-2 border-[#121316] hover:bg-[#FE4E1A] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Governance Notice */}
          <div
            className={`p-3.5 border-3 border-[#121316] text-xs font-bold flex items-start gap-2.5 shadow-[3px_3px_0px_#121316] ${
              isLive ? 'bg-[#FFF9F2] text-[#FE4E1A]' : 'bg-[#E8F8F5] text-[#0F534A]'
            }`}
          >
            <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-headline font-black uppercase text-[11px] mb-0.5">
                {isLive
                  ? 'Maker-Checker Governance Active (Live Campaign)'
                  : 'Pre-Launch Direct Update Mode'}
              </p>
              <p className="text-gray-700 font-medium">
                {isLive
                  ? 'Changes will create an immutable revision snapshot and require Faculty / Admin Checker approval before updating the live escrow tranche.'
                  : 'Updates will be applied directly to this milestone tranche.'}
              </p>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
              Milestone Tranche Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Phase 1: Prototype Fabrication & Telemetry"
              className="w-full px-4 py-2.5 border-3 border-[#0F534A] font-headline font-bold text-sm text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A]"
            />
          </div>

          {/* Scope / Objective */}
          <div>
            <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
              Scope &amp; Technical Objective
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed description of what will be built and achieved during this tranche..."
              className="w-full px-4 py-2.5 border-3 border-[#0F534A] font-body text-xs text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A]"
            />
          </div>

          {/* Budget & Duration Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-[#FE4E1A]" />
                Tranche Target Budget (₹) *
              </label>
              <input
                type="number"
                value={budget || ''}
                onChange={(e) => setBudget(Number(e.target.value))}
                placeholder="e.g. 50000"
                className="w-full px-4 py-2.5 border-3 border-[#0F534A] font-headline font-black text-sm text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A]"
              />
            </div>

            <div>
              <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#0F534A]" />
                Estimated Duration (Days) *
              </label>
              <input
                type="number"
                value={durationDays || ''}
                onChange={(e) => setDurationDays(Number(e.target.value))}
                placeholder="e.g. 30"
                className="w-full px-4 py-2.5 border-3 border-[#0F534A] font-headline font-bold text-sm text-[#121316] focus:border-[#FE4E1A] outline-none shadow-[2px_2px_0px_#0F534A]"
              />
            </div>
          </div>

          {/* Acceptance Criteria */}
          <div>
            <label className="block text-xs font-headline font-black uppercase text-[#0F534A] mb-1">
              Escrow Release Criteria
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newCriterion}
                onChange={(e) => setNewCriterion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCriterion();
                  }
                }}
                placeholder="Add verifiable acceptance criteria..."
                className="flex-1 px-3 py-2 border-2 border-[#0F534A] font-medium text-xs focus:border-[#FE4E1A] outline-none"
              />
              <button
                type="button"
                onClick={handleAddCriterion}
                className="px-4 py-2 bg-[#0F534A] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0px_#121316] hover:bg-[#0b3d36] cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            {acceptanceCriteria.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 bg-[#FCFBF7] border-2 border-gray-200">
                {acceptanceCriteria.map((crit, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between gap-2 p-2 bg-white border border-[#0F534A]/30 text-xs"
                  >
                    <span className="font-medium text-gray-800">
                      {idx + 1}. {crit}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCriterion(idx)}
                      className="text-red-500 hover:text-red-700 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Change Reason / Justification */}
          <div>
            <label className="block text-xs font-headline font-black uppercase text-[#FE4E1A] mb-1">
              Change Reason &amp; Justification *
            </label>
            <input
              type="text"
              required
              value={changeReason}
              onChange={(e) => setChangeReason(e.target.value)}
              placeholder="e.g. Extended testing phase due to delayed lab sensors arrival."
              className="w-full px-4 py-2.5 border-3 border-[#FE4E1A] font-body text-xs text-[#121316] focus:border-[#0F534A] outline-none shadow-[2px_2px_0px_#FE4E1A]"
            />
            <p className="text-[10px] text-gray-500 font-bold mt-1 uppercase">
              Mandatory audit explanation stored in milestone change history.
            </p>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-dashed border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 border-2 border-[#121316] font-headline font-black text-xs uppercase hover:bg-gray-200 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-[#FE4E1A] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[3px_3px_0px_#121316] hover:bg-[#d83d10] cursor-pointer disabled:opacity-50"
            >
              {isSubmitting
                ? 'Processing...'
                : isLive
                ? 'Submit Revision Request'
                : 'Save Milestone Changes'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
