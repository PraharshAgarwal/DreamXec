import React from "react";
import type { WorkflowRuleConfig } from "./types";

interface DocumentUploaderProps {
  documents?: WorkflowRuleConfig["requiredDocuments"];
  uploadedFiles: Record<string, File | null>;
  onFileSelect: (docId: string, file: File | null) => void;
}

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({
  documents,
  uploadedFiles,
  onFileSelect,
}) => {
  const validDocs = (documents || []).filter(
    (doc: any) =>
      doc.type !== "EMAIL_DOMAIN_CHECK" &&
      !doc.label?.toLowerCase().includes("email verification")
  );

  if (!validDocs || validDocs.length === 0) return null;

  return (
    <div className="space-y-3">
      {validDocs.map((doc) => {
        const file = uploadedFiles[doc.id];
        const allowedTypesStr = doc.allowedTypes?.join(",") || ".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp";

        return (
          <div key={doc.id} className="p-3.5 bg-gray-50 space-y-2 border-2 border-[#121316] shadow-[3px_3px_0px_#121316]">
            <div className="flex items-center justify-between">
              <span className="font-black text-xs text-[#121316] uppercase">{doc.label}</span>
              <div className="flex items-center gap-1.5">
                {doc.ocrRequired && (
                  <span className="px-2 py-0.5 text-[10px] font-black bg-[#18D7E8]/20 text-[#121316] border border-[#121316]">
                    🔍 OCR SCAN
                  </span>
                )}
                {doc.virusScanRequired && (
                  <span className="px-2 py-0.5 text-[10px] font-black bg-[#0F534A]/10 text-[#0F534A] border border-[#0F534A]">
                    🛡️ VIRUS SCANNED
                  </span>
                )}
                {doc.required && (
                  <span className="px-2 py-0.5 text-[10px] font-black bg-[#F4002C]/10 text-[#F4002C] border border-[#F4002C]">
                    REQUIRED
                  </span>
                )}
              </div>
            </div>

            <label className="block p-4 border-2 border-dashed border-[#121316] bg-white cursor-pointer text-center hover:bg-amber-50 transition-colors">
              <div className="text-xl mb-1">📁</div>
              <span className="text-xs font-black text-[#121316] uppercase block">
                {file ? `Selected: ${file.name}` : `Upload ${doc.label}`}
              </span>
              <span className="text-[10px] font-bold text-[#121316]/60">
                Max {doc.maxSizeMb || 20}MB • Supported formats: {doc.allowedTypes?.join(", ") || "PDF, DOCX, DOC, PPTX, PNG, JPG"}
              </span>
              <input
                type="file"
                className="hidden"
                accept={allowedTypesStr}
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] || null;
                  onFileSelect(doc.id, selectedFile);
                }}
              />
            </label>

            {file && doc.preview && (
              <div className="p-2 bg-white flex items-center justify-between border border-[#121316]">
                <span className="text-xs font-bold text-[#121316] truncate">{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
                <span className="text-xs font-black text-[#0F534A]">Ready for upload ✓</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
