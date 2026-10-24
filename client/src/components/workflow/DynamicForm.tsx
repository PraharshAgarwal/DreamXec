import React from "react";
import type { WorkflowRuleConfig } from "./types";

interface DynamicFormProps {
  fields?: WorkflowRuleConfig["fields"];
  answers: Record<string, any>;
  onFieldChange: (fieldId: string, value: any) => void;
  orgId: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({
  fields,
  answers,
  onFieldChange,
  orgId,
}) => {
  React.useEffect(() => {
    if (!fields) return;
    fields.forEach((field) => {
      const key = `${orgId}_${field.id}`;
      if (answers[key] === undefined && field.defaultValue !== undefined && field.defaultValue !== "") {
        onFieldChange(key, field.defaultValue);
      }
    });
  }, [fields, orgId, answers, onFieldChange]);

  if (!fields || fields.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {fields.map((field) => {
        const key = `${orgId}_${field.id}`;
        const defaultVal = field.defaultValue !== undefined ? field.defaultValue : "";
        const val = answers[key] !== undefined && answers[key] !== null ? answers[key] : defaultVal;

        return (
          <div key={field.id} className={field.type === "textarea" ? "sm:col-span-2" : "sm:col-span-1"}>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-black text-[#121316] uppercase tracking-widest">
                {field.label} {field.required && <span className="text-[#F4002C]">*</span>}
              </label>
              {field.autofillKey && (
                <span className="text-[10px] font-black text-[#0F534A] bg-[#0F534A]/10 px-1.5 py-0.5 border border-[#0F534A]">
                  ✨ Autofilled
                </span>
              )}
            </div>

            {field.type === "select" ? (
              <select
                value={val}
                onChange={(e) => onFieldChange(key, e.target.value)}
                required={field.required}
                className="w-full px-3 py-2.5 text-sm font-medium text-[#121316] bg-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] focus:outline-none cursor-pointer"
              >
                <option value="">Select option...</option>
                {field.options?.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                value={val}
                onChange={(e) => onFieldChange(key, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                rows={3}
                className="w-full px-3 py-2.5 text-sm font-medium text-[#121316] bg-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] focus:outline-none"
              />
            ) : (
              <input
                type={field.type === "number" ? "number" : "text"}
                value={val}
                onChange={(e) => onFieldChange(key, e.target.value)}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full px-3 py-2.5 text-sm font-medium text-[#121316] bg-white border-2 border-[#121316] shadow-[3px_3px_0px_#121316] focus:outline-none"
              />
            )}
          </div>
        );
      })}
    </div>
  );
};
