import React from "react";
import type { WorkflowRuleConfig } from "./types";

interface MetadataViewerProps {
  metadata?: WorkflowRuleConfig["uiMetadata"];
  stageName: string;
}

export const MetadataViewer: React.FC<MetadataViewerProps> = ({ metadata, stageName }) => {
  if (!metadata) return null;

  return (
    <div className="p-3 bg-amber-50 space-y-1" style={{ border: "2px dashed #003366" }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-black text-[#003366] uppercase tracking-wider">
          ℹ️ {stageName} Instructions
        </span>
        <div className="flex items-center gap-2">
          {metadata.estimatedCompletionTime && (
            <span className="text-[10px] font-black text-[#FF7F00] bg-white px-2 py-0.5" style={{ border: "1px solid #003366" }}>
              ⏱️ {metadata.estimatedCompletionTime}
            </span>
          )}
          {metadata.optional && (
            <span className="text-[10px] font-black text-gray-700 bg-gray-200 px-2 py-0.5">
              OPTIONAL STAGE
            </span>
          )}
        </div>
      </div>
      {metadata.helpText && (
        <p className="text-xs font-medium text-[#003366]/80">{metadata.helpText}</p>
      )}
    </div>
  );
};
