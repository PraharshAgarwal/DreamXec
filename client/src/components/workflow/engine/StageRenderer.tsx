import React from "react";
import { ComponentRenderer, ComponentSchemaItem } from "./ComponentRenderer";

export interface SectionSchema {
  id: string;
  stageId?: string;
  stageName?: string;
  stageType?: string;
  title: string;
  description?: string;
  components: ComponentSchemaItem[];
}

interface StageRendererProps {
  sections: SectionSchema[];
  formData: Record<string, any>;
  onFieldChange: (id: string, value: any) => void;
  orgName?: string;
}

export const StageRenderer: React.FC<StageRendererProps> = ({
  sections,
  formData,
  onFieldChange,
  orgName,
}) => {
  if (!sections || sections.length === 0) {
    return (
      <div className="p-6 text-center text-xs font-bold text-[#121316]/70">
        No active form fields required for this stage.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {sections.map((sec) => (
        <div key={sec.id} className="space-y-4 pt-2">
          {sec.title && (
            <div className="border-b border-[#121316]/20 pb-2">
              <h4 className="font-black text-xs text-[#121316] uppercase tracking-wider">
                {sec.title}
              </h4>
              {sec.description && (
                <p className="text-[11px] font-medium text-[#121316]/70 mt-0.5">{sec.description}</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sec.components.map((comp) => {
              const isFullWidth =
                comp.type === "EMAIL_VERIFICATION" ||
                comp.type === "FILE_UPLOAD" ||
                comp.type === "APAAR_INPUT" ||
                comp.type === "ORCID_INPUT" ||
                comp.type === "INFO_NOTE";
              return (
                <div key={comp.id} className={isFullWidth ? "sm:col-span-2" : "col-span-1"}>
                  <ComponentRenderer
                    schema={comp}
                    formData={formData}
                    onFieldChange={onFieldChange}
                    orgName={orgName}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
};
