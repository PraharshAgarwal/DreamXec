import React, { useEffect, useState } from 'react';
import { X, History, ShieldCheck, CheckCircle2, Clock, XCircle, FileText } from 'lucide-react';
import { campaignService, MilestoneHistoryEntry } from '../../services/campaignService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  milestone: any | null;
}

export default function MilestoneRevisionHistoryModal({
  isOpen,
  onClose,
  campaignId,
  milestone,
}: Props) {
  const [revisions, setRevisions] = useState<MilestoneHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && milestone && campaignId) {
      loadHistory();
    }
  }, [isOpen, milestone, campaignId]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const res = await campaignService.getMilestoneHistory(campaignId, milestone.id);
      setRevisions(res.data?.revisions || (res as any)?.revisions || []);
    } catch (err) {
      console.error('Failed to load milestone history:', err);
      setRevisions([]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !milestone) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#121316]/70 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border-4 border-[#0F534A] shadow-[8px_8px_0px_#121316] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden my-auto">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 bg-[#0F534A] text-white border-b-4 border-[#121316]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#4717AE] border-2 border-white flex items-center justify-center font-black text-white shadow-[2px_2px_0px_#121316]">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-headline font-black text-lg sm:text-xl uppercase tracking-tight">
                Milestone Revision History
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading ? (
            <div className="p-10 text-center text-[#0F534A] font-headline font-black text-sm uppercase animate-pulse">
              Loading revision audit trail...
            </div>
          ) : revisions.length === 0 ? (
            <div className="p-8 text-center bg-[#FCFBF7] border-3 border-dashed border-[#0F534A]/30">
              <History className="w-8 h-8 text-[#0F534A] mx-auto mb-2 opacity-40" />
              <p className="font-headline font-bold text-sm text-[#0F534A] uppercase">
                No past revisions recorded
              </p>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                This milestone is currently on its baseline version (v1.0).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {revisions.map((rev) => {
                const isApproved = rev.status === 'APPROVED';
                const isPending = rev.status === 'PENDING_APPROVAL';
                const isRejected = rev.status === 'REJECTED';

                return (
                  <div
                    key={rev.id}
                    className="p-4 bg-white border-3 border-[#121316] shadow-[3px_3px_0px_#0F534A] space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 bg-[#4717AE] text-white font-headline font-black text-[10px] uppercase border border-[#121316]">
                          v{rev.revisionNumber}.0
                        </span>
                        <span className="font-headline font-black text-xs uppercase text-[#0F534A]">
                          {rev.title || milestone.title}
                        </span>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-headline font-black uppercase border border-[#121316] ${
                          isApproved
                            ? 'bg-[#9EFC5F] text-[#0F534A]'
                            : isPending
                            ? 'bg-[#FFDD33] text-[#121316]'
                            : 'bg-[#F4002C] text-white'
                        }`}
                      >
                        {isApproved && <CheckCircle2 className="w-3 h-3" />}
                        {isPending && <Clock className="w-3 h-3" />}
                        {isRejected && <XCircle className="w-3 h-3" />}
                        {rev.status.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Change Reason */}
                    <div className="bg-[#FCFBF7] p-2.5 border border-dashed border-[#0F534A]/30 text-xs">
                      <span className="text-[10px] font-headline font-black uppercase text-[#FE4E1A] block mb-0.5">
                        Change Justification:
                      </span>
                      <p className="text-gray-700 font-medium">{rev.changeReason}</p>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-bold text-gray-600">
                      {rev.targetAmount !== undefined && (
                        <div>
                          <span className="text-gray-400 block text-[9px] uppercase">Revised Budget</span>
                          <span className="font-headline font-black text-[#0F534A]">
                            ₹{Number(rev.targetAmount).toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase">Requested By</span>
                        <span className="text-gray-800">{rev.requestedBy?.name || 'Project Lead'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400 block text-[9px] uppercase">Date</span>
                        <span className="text-gray-800 font-mono">
                          {new Date(rev.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Reviewer Feedback if present */}
                    {rev.rejectionReason && (
                      <div className="p-2 bg-[#FFF5F5] border-l-3 border-[#F4002C] text-xs text-[#F4002C] font-bold">
                        ↳ Reviewer Feedback: {rev.rejectionReason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t-3 border-[#121316] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-[#0F534A] text-white border-2 border-[#121316] font-headline font-black text-xs uppercase shadow-[2px_2px_0px_#121316] hover:bg-[#0b3d36] cursor-pointer"
          >
            Close History
          </button>
        </div>

      </div>
    </div>
  );
}
