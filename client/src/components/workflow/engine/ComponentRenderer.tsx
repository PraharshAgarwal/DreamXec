import React from "react";
import { ComponentRegistry, ComponentSchemaProps } from "./ComponentRegistry";

export interface ComponentSchemaItem {
  id: string;
  type: string;
  props: {
    label?: string;
    placeholder?: string;
    required?: boolean;
    options?: string[];
    helpText?: string;
    requiredDomain?: string;
    accept?: string;
    maxSizeMB?: number;
    defaultValue?: any;
  };
  validation?: Record<string, any>;
  visibleWhen?: Record<string, any>;
}

interface ComponentRendererProps {
  schema: ComponentSchemaItem;
  formData: Record<string, any>;
  onFieldChange: (id: string, value: any) => void;
  orgName?: string;
}

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  schema,
  formData,
  onFieldChange,
  orgName,
}) => {
  // Evaluate conditional visibility (if present)
  if (schema.visibleWhen) {
    const fieldTarget = schema.visibleWhen.field;
    const expectedValue = schema.visibleWhen.equals;
    if (fieldTarget && formData[fieldTarget] !== expectedValue) {
      return null;
    }
  }

  // Lookup target component from Registry (defaults to TEXT_INPUT)
  const TargetComponent = ComponentRegistry[schema.type] || ComponentRegistry.TEXT_INPUT;

  const componentProps: ComponentSchemaProps = {
    id: schema.id,
    type: schema.type,
    props: schema.props || {},
    validation: schema.validation,
    value: formData[schema.id],
    onChange: (val) => onFieldChange(schema.id, val),
    formData,
    orgName,
  };

  return <TargetComponent {...componentProps} />;
};
