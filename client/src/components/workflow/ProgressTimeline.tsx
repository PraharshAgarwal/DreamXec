import React from "react";
import type { StageProgress, WorkflowTransitionData, WorkflowStageData } from "./types";

interface ProgressTimelineProps {
  stagesProgress: StageProgress[];
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({ stagesProgress }) => {
  return (
    <div className="p-4 bg-white space-y-3 border-2 border-[#121316] shadow-[3px_3px_0px_#121316]">
      <h4 className="font-black text-xs text-[#121316] uppercase tracking-wider border-b border-[#121316]/20 pb-1">
        📊 Stage Execution Timeline
      </h4>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {stagesProgress.map((s) => (
          <div key={s.stageId} className="flex items-center justify-between p-2 bg-gray-50 text-xs border border-[#121316]">
            <span className="font-bold text-[#121316]">Stage {s.stageOrder}: {s.name}</span>
            <span className={`px-2 py-0.5 font-black text-[10px] ${
              s.status === "COMPLETED" ? "bg-[#0F534A] text-white" :
              s.status === "RUNNING" ? "bg-[#FFDD33] text-[#121316]" :
              s.status === "REJECTED" ? "bg-[#F4002C] text-white" : "bg-gray-100 text-gray-700"
            }`}>
              {s.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface TransitionButtonsProps {
  transitions: WorkflowTransitionData[];
  currentStageOrder: number;
  stages: WorkflowStageData[];
  onPrevStage: () => void;
  onNextStage: () => void;
  isSubmitting?: boolean;
}

export const TransitionButtons: React.FC<TransitionButtonsProps> = ({
  currentStageOrder,
  stages,
  onPrevStage,
  onNextStage,
  isSubmitting = false,
}) => {
  const isFirst = currentStageOrder === 1;
  const isLast = currentStageOrder === stages.length;

  return (
    <div className="pt-3 flex justify-between">
      {!isFirst ? (
        <button
          type="button"
          onClick={onPrevStage}
          className="px-5 py-2.5 font-black text-[#121316] bg-white uppercase tracking-widest text-xs border-2 border-[#121316] shadow-[3px_3px_0px_#121316] cursor-pointer hover:bg-gray-50"
        >
          ← Previous Stage
        </button>
      ) : (
        <div />
      )}

      <button
        type="button"
        onClick={onNextStage}
        disabled={isSubmitting}
        className="px-8 py-3.5 font-black text-white uppercase tracking-widest text-sm transition-all border-2 border-[#121316] shadow-[4px_4px_0px_#121316] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: isSubmitting ? "#9ca3af" : isLast ? "#0F534A" : "#FE4E1A",
        }}
      >
        {isSubmitting
          ? "⏳ Processing..."
          : isLast
          ? "Complete & Activate Account ✓"
          : `Continue to Stage ${currentStageOrder + 1} →`}
      </button>
    </div>
  );
};
