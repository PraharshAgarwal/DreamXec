import React from "react";
import { ConditionRenderer } from "./ConditionRenderer";
import { DynamicForm } from "./DynamicForm";
import { DocumentCollectionStage } from "./DocumentCollectionStage";
import { HumanReviewVerificationStage, ComplianceReviewStage } from "./HumanReviewVerificationStage";
import type { WorkflowRuleData } from "./types";

interface RuleRendererProps {
  rules?: WorkflowRuleData[];
  answers: Record<string, any>;
  uploadedFiles: Record<string, File | null>;
  onFieldChange: (fieldId: string, value: any) => void;
  onFileSelect: (docId: string, file: File | null) => void;
  orgId: string;
  context?: Record<string, any>;
  applicantEmail?: string;
  applicantName?: string;
}

export const RuleRenderer: React.FC<RuleRendererProps> = ({
  rules,
  answers,
  uploadedFiles,
  onFieldChange,
  onFileSelect,
  orgId,
  context = {},
  applicantEmail,
  applicantName,
}) => {
  if (!rules || rules.length === 0) {
    return (
      <div className="p-4 bg-gray-50 text-xs font-bold text-[#003366] text-center" style={{ border: "2px dashed #003366" }}>
        ✓ No special rule requirements for this stage. Proceed to next stage.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rules.map((rule) => {
        const config = rule.configuration || {};

        return (
          <ConditionRenderer key={rule.id} condition={config.condition} context={context}>
            <div className="space-y-3">
              {/* Dynamic Forms */}
              {config.fields && config.fields.length > 0 && (
                <DynamicForm
                  fields={config.fields}
                  answers={answers}
                  onFieldChange={onFieldChange}
                  orgId={orgId}
                />
              )}

              {/* Document Uploads */}
              {config.requiredDocuments && config.requiredDocuments.length > 0 && (
                <DocumentCollectionStage
                  documents={config.requiredDocuments}
                  uploadedFiles={uploadedFiles}
                  onFileSelect={onFileSelect}
                />
              )}

              {/* Human Review Stage */}
              {rule.ruleType === "APPROVAL_ENGINE" && config.condition?.organizationType !== "CORPORATE" && (
                <HumanReviewVerificationStage
                  reviewers={config.reviewers}
                  applicantName={applicantName}
                  applicantEmail={applicantEmail}
                />
              )}

              {/* Compliance Review Stage */}
              {rule.ruleType === "APPROVAL_ENGINE" && config.condition?.organizationType === "CORPORATE" && (
                <ComplianceReviewStage
                  reviewers={config.reviewers}
                  applicantName={applicantName}
                  applicantEmail={applicantEmail}
                />
              )}
            </div>
          </ConditionRenderer>
        );
      })}
    </div>
  );
};
