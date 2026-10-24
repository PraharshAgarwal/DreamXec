import React from "react";
import type { StageProgress } from "./types";

interface WorkflowStepperProps {
  stagesProgress: StageProgress[];
  currentStageOrder: number;
  onStageClick?: (order: number) => void;
}

export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({
  stagesProgress,
  currentStageOrder,
  onStageClick,
}) => {
  if (!stagesProgress || stagesProgress.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto py-2">
      <div className="flex items-center min-w-max gap-2 p-2 bg-gray-50 border-2 border-[#121316] shadow-[3px_3px_0px_#121316]">
        {stagesProgress.map((s) => {
          const isActive = s.stageOrder === currentStageOrder;
          const isCompleted = s.status === "COMPLETED";
          const isRejected = s.status === "REJECTED";

          return (
            <button
              key={s.stageId}
              type="button"
              onClick={() => onStageClick && onStageClick(s.stageOrder)}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-black text-xs transition-all border-2 border-[#121316] cursor-pointer ${
                isCompleted
                  ? "bg-[#0F534A] text-white"
                  : isRejected
                  ? "bg-[#F4002C] text-white"
                  : isActive
                  ? "bg-[#FE4E1A] text-white shadow-[2px_2px_0px_#121316]"
                  : "bg-white text-[#121316]"
              }`}
            >
              <span>
                {isCompleted ? "✓" : isRejected ? "✕" : s.stageOrder}
              </span>
              <span>{s.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
