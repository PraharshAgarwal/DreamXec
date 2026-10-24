import React from "react";

interface ConditionRendererProps {
  condition?: Record<string, any>;
  context?: Record<string, any>;
  children: React.ReactNode;
}

export const ConditionRenderer: React.FC<ConditionRendererProps> = ({
  condition,
  context = {},
  children,
}) => {
  if (!condition || Object.keys(condition).length === 0) {
    return <>{children}</>;
  }

  // Evaluate condition against context
  const isMatch = Object.entries(condition).every(([key, val]) => {
    if (!context[key]) return true; // If key is absent from context, default to visible
    return String(context[key]).toUpperCase() === String(val).toUpperCase();
  });

  if (!isMatch) return null;

  return <>{children}</>;
};
