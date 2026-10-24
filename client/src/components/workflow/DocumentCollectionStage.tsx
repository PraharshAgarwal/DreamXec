import React from "react";
import { DocumentUploader } from "./DocumentUploader";
import type { WorkflowRuleConfig } from "./types";

interface DocumentCollectionStageProps {
  documents?: WorkflowRuleConfig["requiredDocuments"];
  uploadedFiles: Record<string, File | null>;
  onFileSelect: (docId: string, file: File | null) => void;
}

export const DocumentCollectionStage: React.FC<DocumentCollectionStageProps> = (props) => {
  const fileDocuments = (props.documents || []).filter(
    (doc: any) =>
      doc.type !== "EMAIL_DOMAIN_CHECK" &&
      !doc.label?.toLowerCase().includes("email verification")
  );

  if (fileDocuments.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between border-b-2 border-[#121316] pb-2">
        <h4 className="font-black text-xs text-[#121316] uppercase tracking-wider">
          📄 Required Verification Documents
        </h4>
        <span className="text-[10px] font-black bg-[#FE4E1A] text-white px-2 py-0.5 border border-[#121316]">
          FILE UPLOAD
        </span>
      </div>
      <DocumentUploader {...props} documents={fileDocuments} />
    </div>
  );
};
