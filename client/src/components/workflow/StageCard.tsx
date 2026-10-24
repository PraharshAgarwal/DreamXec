import React from "react";
import type { WorkflowStageData, WorkflowRuleConfig } from "./types";

interface StageCardProps {
  stage: WorkflowStageData;
  uiMetadata?: WorkflowRuleConfig["uiMetadata"];
  children: React.ReactNode;
}

export const StageCard: React.FC<StageCardProps> = ({ stage, children }) => {
  return (
    <div className="p-5 bg-white space-y-4 border-2 border-[#121316] shadow-[4px_4px_0px_#121316]">
      <div className="flex items-center justify-between border-b-2 border-[#121316] pb-2">
        <div>
          <h3 className="font-black text-sm text-[#121316] uppercase tracking-wider">
            🏛️ {stage.name}
          </h3>
          {stage.description && (
            <p className="text-[11px] font-medium text-[#121316]/70 mt-0.5">{stage.description}</p>
          )}
        </div>
      </div>

      <div className="pt-1">{children}</div>
    </div>
  );
};
