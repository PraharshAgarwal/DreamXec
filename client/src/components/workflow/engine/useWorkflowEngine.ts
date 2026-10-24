import { useState, useEffect, useCallback, useRef } from "react";
import apiRequest from "../../../services/api";
import { initiateWorkflowInstance } from "./workflowCache";
import { getCurrentUser, claimRole } from "../../../services/authService";
import type { UiSchemaContract } from "./WorkflowRenderer";

export interface UseWorkflowEngineProps {
  organizationId: string;
  role: string;
  organizationName?: string;
  organizationType?: string;
  onWorkflowComplete?: (result: any) => void;
}

export interface UseWorkflowEngineReturn {
  instance: any | null;
  uiSchema: UiSchemaContract | null;
  formData: Record<string, any>;
  loading: boolean;
  submitting: boolean;
  error: string;
  isCompleted: boolean;
  isPendingVerification: boolean;
  handleFieldChange: (id: string, value: any) => void;
  handleSubmit: () => Promise<void>;
  handleNavigateBack: () => Promise<void>;
  resetError: () => void;
}

const REVIEW_STAGE_TYPES = new Set([
  'MANUAL_REVIEW',
  'MANUAL_APPROVAL',
  'APPROVAL',
  'BACKGROUND_CHECK',
  'COMPLIANCE_REVIEW',
  'FRAUD_CHECK',
]);

/**
 * Custom Hook encapsulating Workflow Engine state and business operations.
 * Adheres to Single Responsibility Principle (SRP) by decoupling state orchestration from view presentation.
 */
export function useWorkflowEngine({
  organizationId,
  role,
  organizationName,
  organizationType,
  onWorkflowComplete,
}: UseWorkflowEngineProps): UseWorkflowEngineReturn {
  const [instance, setInstance] = useState<any | null>(null);
  const [uiSchema, setUiSchema] = useState<UiSchemaContract | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const initWorkflow = async () => {
      setLoading(true);
      setError("");
      setIsCompleted(false);
      setIsPendingVerification(false);
      try {
        const userRes = await getCurrentUser().catch(() => null);
        const user = userRes?.data?.user;
        const userId = user?.id || user?.email || "";

        const res = await initiateWorkflowInstance(
          organizationId,
          role,
          organizationName,
          organizationType,
          userId
        );
        const instData = res?.data?.instance || (res as any)?.instance;
        if (isMounted) {
          if (instData) {
            setInstance(instData);
            setUiSchema(instData.uiSchema || null);
            const stageType = instData.currentStage?.stageType;
            if (instData.status === "COMPLETED") {
              setIsCompleted(true);
            } else if (stageType && REVIEW_STAGE_TYPES.has(stageType)) {
              setIsPendingVerification(true);
            }
          } else {
            setError("No workflow instance could be initialized for this role and organization.");
          }
        }
      } catch (err: any) {
        console.error("[useWorkflowEngine] Initialization error:", err);
        if (isMounted) {
          setError(err?.message || err?.error || "Failed to initialize backend workflow instance.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initWorkflow();
    return () => {
      isMounted = false;
    };
  }, [organizationId, role, organizationName, organizationType]);

  // Pre-fill formData with default values or existing stage instanceData whenever uiSchema changes
  useEffect(() => {
    if (!uiSchema) return;

    const currentSections = uiSchema.ui?.sections || [];
    const currentStageName = uiSchema.currentStage?.name;
    const existingStageData =
      (currentStageName && instance?.instanceData?.[currentStageName]) ||
      instance?.instanceData ||
      {};

    setFormData((prev) => {
      const updated = { ...prev };
      let changed = false;

      for (const sec of currentSections) {
        for (const comp of sec.components || []) {
          if (updated[comp.id] !== undefined && updated[comp.id] !== null && updated[comp.id] !== "") {
            continue;
          }

          if (existingStageData[comp.id] !== undefined) {
            updated[comp.id] = existingStageData[comp.id];
            changed = true;
            continue;
          }

          if (comp.props?.defaultValue !== undefined && comp.props?.defaultValue !== "") {
            updated[comp.id] = comp.props.defaultValue;
            changed = true;
            continue;
          }

          if (comp.type === "SELECT" && comp.props?.options && comp.props.options.length > 0) {
            updated[comp.id] = comp.props.options[0];
            changed = true;
            continue;
          }
        }
      }

      return changed ? updated : prev;
    });
  }, [uiSchema, instance]);

  const handleFieldChange = useCallback((id: string, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  }, []);

  const resetError = useCallback(() => {
    setError("");
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!instance || !uiSchema) return;
    if (isSubmittingRef.current || submitting) return;

    isSubmittingRef.current = true;
    setSubmitting(true);
    setError("");

    try {
      const stageId = uiSchema.currentStage?.id;
      const currentSections = uiSchema.ui?.sections || [];
      const currentStageType = (uiSchema.currentStage as any)?.stageType;
      const allComponents = currentSections.flatMap((s) => s.components || []);

      const isVisible = (comp: any) => {
        if (!comp.visibleWhen) return true;
        const target = comp.visibleWhen.field;
        const expected = comp.visibleWhen.equals;
        return formData[target] === expected;
      };

      const visibleComponents = allComponents.filter(isVisible);

      // ── STRICT FRONTEND VALIDATION BEFORE SUBMISSION ──
      for (const comp of visibleComponents) {
        const isRequired = Boolean(comp.props?.required || comp.validation?.required);
        const label = comp.props?.label || comp.id;
        let val = formData[comp.id];

        // Apply default fallback if field is missing from formData
        if (val === undefined || val === null || val === "") {
          if (comp.props?.defaultValue !== undefined && comp.props?.defaultValue !== "") {
            val = comp.props.defaultValue;
          } else if (comp.type === "SELECT" && comp.props?.options && comp.props.options.length > 0) {
            val = comp.props.options[0];
          }
        }

        // Validate APAAR ID
        if (comp.type === "APAAR_INPUT" || currentStageType === "APAAR_VERIFICATION") {
          const isApaarVerified =
            (val && typeof val === "object" && val._apaarVerified === true) ||
            Object.values(formData).some((v: any) => v && typeof v === "object" && v._apaarVerified === true);
          if (!isApaarVerified) {
            setError("Please click 'Verify APAAR' to verify your 12-digit One Nation One Student ID before proceeding.");
            setSubmitting(false);
            isSubmittingRef.current = false;
            return;
          }
        }

        // Validate ORCID iD
        if (comp.type === "ORCID_INPUT" || currentStageType === "ORCID_VERIFICATION") {
          const isOrcidVerified =
            (val && typeof val === "object" && val._orcidVerified === true) ||
            Object.values(formData).some((v: any) => v && typeof v === "object" && v._orcidVerified === true);
          if (!isOrcidVerified) {
            setError("Please click 'Verify ORCID' to verify your researcher ORCID record with the registry before proceeding.");
            setSubmitting(false);
            isSubmittingRef.current = false;
            return;
          }
        }

        // Validate EMAIL_VERIFICATION
        if (comp.type === "EMAIL_VERIFICATION" || currentStageType === "EMAIL_VERIFICATION") {
          const isEmailVerified =
            (val && typeof val === "object" && val._emailVerified === true) ||
            formData._emailVerified === true ||
            Object.values(formData).some((v: any) => v && typeof v === "object" && v._emailVerified === true);
          if (isRequired && !isEmailVerified) {
            setError(`Please verify your institutional email via OTP before proceeding.`);
            setSubmitting(false);
            isSubmittingRef.current = false;
            return;
          }
        }

        // Validate FILE_UPLOAD
        if (comp.type === "FILE_UPLOAD") {
          if (isRequired) {
            const hasFile =
              val instanceof File ||
              (val && typeof val === "object" && (val.url || val.name)) ||
              (typeof val === "string" && val.trim().length > 0);
            if (!hasFile) {
              setError(`Please upload the required verification document: "${label}".`);
              setSubmitting(false);
              isSubmittingRef.current = false;
              return;
            }
          }
        }

        // Validate other required fields
        if (
          isRequired &&
          comp.type !== "APAAR_INPUT" &&
          comp.type !== "ORCID_INPUT" &&
          comp.type !== "EMAIL_VERIFICATION" &&
          comp.type !== "FILE_UPLOAD" &&
          comp.type !== "INFO_NOTE"
        ) {
          if (val === undefined || val === null || (typeof val === "string" && val.trim() === "")) {
            setError(`Please fill in required field: "${label}".`);
            setSubmitting(false);
            isSubmittingRef.current = false;
            return;
          }
        }
      }

      // Build stageSpecificPayload ensuring default values are always attached
      const stageSpecificPayload: Record<string, any> = {};
      for (const comp of visibleComponents) {
        let val = formData[comp.id];
        if (val === undefined || val === null || val === "") {
          if (comp.props?.defaultValue !== undefined && comp.props?.defaultValue !== "") {
            val = comp.props.defaultValue;
          } else if (comp.type === "SELECT" && comp.props?.options && comp.props.options.length > 0) {
            val = comp.props.options[0];
          }
        }
        if (val !== undefined && val !== null) {
          stageSpecificPayload[comp.id] = val;
        }
      }

      // Preserve root verification flags
      if (formData._emailVerified) stageSpecificPayload._emailVerified = true;
      if (formData._apaarVerified) stageSpecificPayload._apaarVerified = true;
      if (formData._orcidVerified) stageSpecificPayload._orcidVerified = true;

      const payloadToSend = Object.keys(stageSpecificPayload).length > 0 ? stageSpecificPayload : formData;

      const processedPayload: Record<string, any> = {};
      for (const [key, val] of Object.entries(payloadToSend)) {
        if (val instanceof File) {
          let fileObj: any = null;
          try {
            const uploadFormData = new FormData();
            uploadFormData.append("file", val);
            uploadFormData.append("folder", "verifications");

            const uploadRes = await apiRequest<any>("/upload", {
              method: "POST",
              body: uploadFormData,
            });

            const url = uploadRes?.data?.url || uploadRes?.data?.secureUrl || (uploadRes as any)?.url;
            if (url) {
              fileObj = {
                name: val.name,
                url,
                size: val.size,
                type: val.type,
              };
            }
          } catch (uploadErr) {
            console.warn(`Direct upload endpoint failed for ${key}, using base64 fallback:`, uploadErr);
          }

          if (!fileObj) {
            const base64DataUrl = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(val);
            });
            fileObj = {
              name: val.name,
              url: base64DataUrl,
              size: val.size,
              type: val.type,
            };
          }

          processedPayload[key] = fileObj;
        } else {
          processedPayload[key] = val;
        }
      }

      const res = await apiRequest<any>(`/workflows/instances/${instance.id}/submit-stage`, {
        method: "POST",
        body: JSON.stringify({
          stageId,
          formData: processedPayload,
        }),
      });

      const updatedInst = res?.data?.instance || (res as any)?.instance;
      if (updatedInst) {
        setInstance(updatedInst);
        setUiSchema(updatedInst.uiSchema || null);
        setFormData({});

        const nextStageType = updatedInst.currentStage?.stageType;
        const isReviewStage = nextStageType && REVIEW_STAGE_TYPES.has(nextStageType);

        if (updatedInst.status === "COMPLETED") {
          setIsCompleted(true);
          setIsPendingVerification(false);
          try {
            await claimRole(organizationId, role, updatedInst.id);
            console.log(`✅ [useWorkflowEngine]: Role ${role} activated and claimed successfully!`);
          } catch (claimErr) {
            console.warn("Could not automatically claim role:", claimErr);
          }
          if (onWorkflowComplete) {
            onWorkflowComplete(updatedInst);
          }
        } else if (isReviewStage || !updatedInst.currentStageId) {
          setIsPendingVerification(true);
          setIsCompleted(false);
          if (onWorkflowComplete) {
            onWorkflowComplete(updatedInst);
          }
        }
      } else {
        setIsCompleted(true);
      }
    } catch (err: any) {
      console.error("[useWorkflowEngine] Submission error:", err);
      setError(err?.message || "Failed to submit stage. Please verify all requirements.");
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [instance, uiSchema, formData, organizationId, role, onWorkflowComplete, submitting]);

  const handleNavigateBack = useCallback(async () => {
    if (!instance || !instance.id) return;
    setSubmitting(true);
    setError("");

    try {
      const res = await apiRequest<any>(`/workflows/instances/${instance.id}/previous-stage`, {
        method: "POST",
      });

      const updatedInst = res?.data?.instance || (res as any)?.instance;
      if (updatedInst) {
        setInstance(updatedInst);
        setUiSchema(updatedInst.uiSchema || null);
        setFormData({});
      }
    } catch (err: any) {
      console.error("[useWorkflowEngine] Failed to navigate back:", err);
      setError(err?.message || "Could not return to the previous stage.");
    } finally {
      setSubmitting(false);
    }
  }, [instance]);

  return {
    instance,
    uiSchema,
    formData,
    loading,
    submitting,
    error,
    isCompleted,
    isPendingVerification,
    handleFieldChange,
    handleSubmit,
    handleNavigateBack,
    resetError,
  };
}
