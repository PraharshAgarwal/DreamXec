export interface WorkflowRuleConfig {
  condition?: Record<string, any>;
  fields?: Array<{
    id: string;
    label: string;
    type: "text" | "number" | "select" | "textarea";
    placeholder?: string;
    options?: string[];
    required?: boolean;
    autofillKey?: string;
    defaultValue?: any;
  }>;
  requiredDocuments?: Array<{
    id: string;
    label: string;
    allowedTypes?: string[];
    maxSizeMb?: number;
    required?: boolean;
    multiple?: boolean;
    preview?: boolean;
    ocrRequired?: boolean;
    virusScanRequired?: boolean;
  }>;
  validators?: string[];
  domainPattern?: string;
  reviewers?: Array<{
    reviewerType: string;
    required?: boolean;
  }>;
  allowSkip?: boolean;
  uiMetadata?: {
    icon?: string;
    helpText?: string;
    displayOrder?: number;
    estimatedCompletionTime?: string;
    optional?: boolean;
  };
}

export interface WorkflowRuleData {
  id: string;
  stageId: string;
  ruleName: string;
  ruleType: string;
  configuration: WorkflowRuleConfig;
  isRequired: boolean;
}

export interface WorkflowStageData {
  id: string;
  templateId: string;
  name: string;
  stageOrder: number;
  description?: string;
  rules?: WorkflowRuleData[];
}

export interface WorkflowTransitionData {
  id: string;
  templateId: string;
  fromStageId?: string;
  toStageId: string;
  triggerType: string;
}

export interface WorkflowTemplateData {
  id: string;
  tenantId?: string;
  name: string;
  description?: string;
  appliesToOrgTypes: string[];
  version: number;
  isActive: boolean;
  stages: WorkflowStageData[];
  transitions: WorkflowTransitionData[];
}

export interface StageProgress {
  stageId: string;
  stageOrder: number;
  name: string;
  description?: string;
  status: "PENDING" | "RUNNING" | "COMPLETED" | "REJECTED" | "SKIPPED" | "BLOCKED";
  completedAt?: string | null;
}

export interface WorkflowInstanceData {
  id: string;
  templateId: string;
  tenantId: string;
  applicantEmail: string;
  applicantName: string;
  orgType: string;
  status: "DRAFT" | "SUBMITTED" | "IN_PROGRESS" | "REVIEW_PENDING" | "APPROVED" | "REJECTED";
  currentStageId?: string;
}
