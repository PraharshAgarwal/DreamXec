import React from "react";
import { StageRenderer, SectionSchema } from "./StageRenderer";

export interface UiSchemaContract {
  instanceId: string;
  workflowId: string;
  status: string;
  completionPercentage: number;
  currentStage: {
    id: string;
    name: string;
    description?: string;
    executionOrder: number;
    totalStages: number;
  };
  ui: {
    header: {
      title: string;
      subtitle?: string;
      badge?: string;
      statusBanner?: {
        type: string;
        title: string;
        description: string;
      };
    };
    sections: SectionSchema[];
    actions: {
      primary: {
        id: string;
        label: string;
        actionType: string;
        style?: string;
      };
      secondary?: Array<{
        id: string;
        label: string;
        actionType: string;
      }>;
    };
  };
}

interface WorkflowRendererProps {
  uiSchema: UiSchemaContract;
  formData: Record<string, any>;
  onFieldChange: (id: string, value: any) => void;
  onSubmit: () => void;
  onNavigateBack?: () => void;
  isSubmitting?: boolean;
}

export const WorkflowRenderer: React.FC<WorkflowRendererProps> = ({
  uiSchema,
  formData,
  onFieldChange,
  onSubmit,
  onNavigateBack,
  isSubmitting = false,
}) => {
  const { header, sections, actions } = uiSchema.ui;
  const currentStage = uiSchema.currentStage;

  return (
    <div className="space-y-6">
      {/* Top Pre-Filled Status Banner */}
      {header.statusBanner && (
        <div className="p-4 bg-[#0F534A]/10 border-2 border-[#0F534A] flex items-center justify-between shadow-[3px_3px_0px_#121316]">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏛️</span>
            <div>
              <span className="text-[10px] font-black uppercase text-[#0F534A] tracking-widest block">
                ✓ {header.statusBanner.title}
              </span>
              <h4 className="text-sm font-black text-[#121316] uppercase tracking-tight">{header.subtitle}</h4>
              <p className="text-xs font-medium text-[#121316]/70">{header.statusBanner.description}</p>
            </div>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-black bg-[#0F534A] text-white uppercase tracking-wider border border-[#121316]">
            ORG DETAILS RECORDED
          </span>
        </div>
      )}

      {/* Main Workflow Renderer Card */}
      <div className="p-6 bg-white border-2 border-[#121316] shadow-[6px_6px_0px_#121316] space-y-6">
        {/* Header Metadata */}
        <div className="border-b-2 border-[#121316] pb-3 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-[#FE4E1A] tracking-widest block">
                ROLE ONBOARDING &amp; VERIFICATION FORM
              </span>
              {currentStage?.executionOrder && currentStage?.totalStages ? (
                <span className="text-[10px] font-black px-2 py-0.5 bg-[#FFDD33] text-[#121316] border border-[#121316] uppercase">
                  Stage {currentStage.executionOrder} / {currentStage.totalStages}
                </span>
              ) : null}
            </div>
            <h3 className="text-base font-black text-[#121316] uppercase tracking-tight">{header.title}</h3>
          </div>
          {header.badge && (
            <span className="px-3 py-1 bg-[#121316] text-white text-xs font-mono font-black uppercase tracking-wider">
              {header.badge}
            </span>
          )}
        </div>

        {/* Stage Content */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
          className="space-y-6"
        >
          <StageRenderer
            sections={sections}
            formData={formData}
            onFieldChange={onFieldChange}
            orgName={header.subtitle}
          />

          {/* Dynamic Action Buttons */}
          <div className="pt-4 border-t-2 border-[#121316]/20 flex justify-between items-center">
            {actions.secondary && actions.secondary.length > 0 ? (
              actions.secondary.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={onNavigateBack}
                  className="px-5 py-2.5 font-black text-[#121316] bg-white uppercase tracking-widest text-xs border-2 border-[#121316] shadow-[3px_3px_0px_#121316] hover:bg-gray-50 cursor-pointer"
                >
                  {sec.label}
                </button>
              ))
            ) : (
              <div />
            )}

            {actions.primary && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-3.5 font-black text-white bg-[#0F534A] hover:bg-[#0F534A]/90 uppercase tracking-widest text-sm transition-all border-2 border-[#121316] shadow-[4px_4px_0px_#121316] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? "⏳ Submitting Onboarding..." : actions.primary.label}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
