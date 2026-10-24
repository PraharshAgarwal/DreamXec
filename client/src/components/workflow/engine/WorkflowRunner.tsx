import React, { useState, useEffect, useRef } from "react";
import apiRequest from "../../../services/api";
import { initiateWorkflowInstance } from "./workflowCache";
import { getCurrentUser, claimRole } from "../../../services/authService";
import { WorkflowRenderer } from "./WorkflowRenderer";
import type { UiSchemaContract } from "./WorkflowRenderer";

interface WorkflowRunnerProps {
  organizationId: string;
  role: string;
  organizationName?: string;
  organizationType?: string;
  onNavigateRoleSelect?: () => void;
  onWorkflowComplete?: (result: any) => void;
}

const ROLE_BADGE_COLORS: Record<string, string> = {
  STUDENT: "bg-[#FFDD33] text-[#121316]",
  DONOR: "bg-[#FEB3FC] text-[#350f87]",
  ORG_ADMIN: "bg-[#FE4E1A] text-white",
  CORPORATE_ADMIN: "bg-[#4717AE] text-white",
  RESEARCHER: "bg-[#18D7E8] text-[#041A16]",
  STUDENT_PRESIDENT: "bg-[#9EFC5F] text-[#0F534A]",
};

/**
 * Presentational and State-Orchestration Runner for Workflows.
 * Delegates state management and asynchronous I/O to useWorkflowEngine hook.
 */
export const WorkflowRunner: React.FC<WorkflowRunnerProps> = ({
  organizationId,
  role,
  organizationName,
  organizationType,
  onNavigateRoleSelect,
  onWorkflowComplete,
}) => {
  const [instance, setInstance] = useState<any | null>(null);
  const [uiSchema, setUiSchema] = useState<UiSchemaContract | null>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPendingVerification, setIsPendingVerification] = useState(false);
  const isSubmittingRef = useRef(false);

  // Initialize or fetch workflow instance on mount / org / role change
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

        // Initiate DB WorkflowInstance NOW when Step 3 is reached
        // workflowCache.ts handles deduplicating in-flight requests safely
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
            const isReviewStage = [
              'MANUAL_REVIEW', 'MANUAL_APPROVAL', 'APPROVAL',
              'BACKGROUND_CHECK', 'COMPLIANCE_REVIEW', 'FRAUD_CHECK'
            ].includes(stageType);
            if (instData.status === "COMPLETED") {
              setIsCompleted(true);
            } else if (isReviewStage) {
              setIsPendingVerification(true);
            }
          } else {
            setError("No workflow instance could be initialized for this role and organization.");
          }
        }
      } catch (err: any) {
        console.error("WorkflowRunner initialization error:", err);
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
          // If already in state, keep it
          if (updated[comp.id] !== undefined && updated[comp.id] !== null && updated[comp.id] !== "") {
            continue;
          }

          // 1. Check existing saved data in instanceData
          if (existingStageData[comp.id] !== undefined) {
            updated[comp.id] = existingStageData[comp.id];
            changed = true;
            continue;
          }

          // 2. Check props.defaultValue
          if (comp.props?.defaultValue !== undefined && comp.props?.defaultValue !== "") {
            updated[comp.id] = comp.props.defaultValue;
            changed = true;
            continue;
          }

          // 3. For SELECT: fallback to first option as default
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

  const handleFieldChange = (id: string, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async () => {
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

        // Apply default fallback if field is not present in formData
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

        // Validate other required fields (TEXT_INPUT, DATE_PICKER, SELECT, etc.)
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

      // Convert / Upload any File objects to accessible URLs
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
        // Reset form data for the next stage
        setFormData({});
        
        const nextStageType = updatedInst.currentStage?.stageType;
        const isReviewStage = ['MANUAL_REVIEW', 'MANUAL_APPROVAL', 'APPROVAL', 'BACKGROUND_CHECK', 'COMPLIANCE_REVIEW', 'FRAUD_CHECK'].includes(nextStageType);

        if (updatedInst.status === "COMPLETED") {
          setIsCompleted(true);
          setIsPendingVerification(false);
          try {
            await claimRole(organizationId, role, updatedInst.id);
            console.log(`✅ [WorkflowRunner]: Role ${role} activated and claimed successfully!`);
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
      console.error("WorkflowRunner submission error:", err);
      setError(err?.message || "Failed to submit stage. Please verify all requirements.");
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center bg-white border-2 border-[#121316] shadow-[4px_4px_0px_#121316]">
        <div className="w-12 h-12 border-4 border-[#FE4E1A] border-t-transparent animate-spin mx-auto mb-3" />
        <p className="text-sm font-black text-[#121316] uppercase tracking-wider">Initializing Workflow Engine...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#F4002C]/10 text-[#F4002C] text-sm font-bold border-2 border-[#F4002C] shadow-[4px_4px_0px_#F4002C] space-y-3">
        <p>⚠️ {error}</p>
        <button
          type="button"
          onClick={onNavigateRoleSelect}
          className="px-4 py-2 font-black text-xs text-white bg-[#121316] uppercase tracking-wider cursor-pointer hover:bg-[#121316]/90 border-2 border-[#121316]"
        >
          ← Back to Role Selection
        </button>
      </div>
    );
  }

  if (isPendingVerification) {
    return (
      <div className="p-8 bg-white border-2 border-[#121316] shadow-[6px_6px_0px_#121316] space-y-5 text-center">
        <div className="w-16 h-16 bg-[#FFDD33] text-[#121316] flex items-center justify-center text-3xl font-black mx-auto border-2 border-[#121316] shadow-[3px_3px_0px_#FE4E1A]">
          ⏳
        </div>
        <div className="inline-block px-3 py-1 bg-[#FFDD33]/40 border-2 border-[#121316] text-[#121316] font-headline font-black text-[10px] uppercase tracking-wider">
          Verification Pending Review
        </div>
        <h3 className="text-lg font-black text-[#121316] uppercase tracking-tight">
          Application Submitted &amp; Under Review
        </h3>
        <p className="text-xs font-bold text-[#121316]/70 max-w-md mx-auto leading-relaxed">
          Your verification details and documentation for <strong>{organizationName}</strong> ({role}) have been submitted and are currently awaiting evaluation by Platform Administrators. Once approved, your role will be activated.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
          <button
            type="button"
            onClick={onNavigateRoleSelect}
            className="px-5 py-2.5 bg-white text-[#121316] font-black text-xs uppercase cursor-pointer hover:bg-gray-50 border-2 border-[#121316] shadow-[3px_3px_0px_#121316]"
          >
            ← Onboard Another Role
          </button>
          <a
            href="/dashboard"
            className="px-6 py-2.5 bg-[#121316] hover:bg-[#121316]/90 text-white font-black text-xs uppercase tracking-wider transition-all border-2 border-[#121316] shadow-[3px_3px_0px_#121316]"
          >
            Return to Dashboard →
          </a>
        </div>
      </div>
    );
  }

  if (isCompleted) {
    const badgeColor = ROLE_BADGE_COLORS[role] || "bg-[#9EFC5F] text-[#0F534A]";

    return (
      <div className="relative bg-[#FCFBF7] border-4 border-[#121316] shadow-[8px_8px_0px_#121316] overflow-hidden text-center transition-all animate-fadeIn">
        {/* Top Header Banner */}
        <div className="relative bg-gradient-to-br from-[#0F534A] to-[#4717AE] p-6 sm:p-8 text-white border-b-4 border-[#121316] overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-[#9EFC5F]/20 blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-[#FE4E1A]/20 blur-xl pointer-events-none" />

          {/* Celebratory Icon */}
          <div className="w-16 h-16 bg-[#9EFC5F] text-[#0F534A] border-3 border-[#121316] shadow-[4px_4px_0px_#121316] flex items-center justify-center text-3xl font-black mx-auto mb-3">
            ✓
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFDD33] text-[#121316] font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] mb-3">
            ✦ Instant Verification Confirmed
          </div>

          <h3 className="text-2xl sm:text-3xl font-headline font-black uppercase tracking-tight text-white leading-tight">
            Role Activated &amp; Verified!
          </h3>

          <p className="text-xs sm:text-sm text-gray-200 mt-2 font-medium max-w-md mx-auto leading-relaxed">
            Your verification details for <strong className="text-white">{organizationName}</strong> have been recorded and your role permissions are immediately active across DreamXec.
          </p>

          <div className="mt-3 font-annotation text-[#9EFC5F] text-base tracking-wide">
            "Verified &amp; Ready to Innovate 🚀"
          </div>
        </div>

        {/* Middle Role Details */}
        <div className="p-6 space-y-4 bg-white border-b-4 border-[#121316]">
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-[#FCFBF7] border-3 border-[#121316] shadow-[3px_3px_0px_#0F534A] gap-3">
            <div className="text-left">
              <span className="text-[10px] font-headline font-black uppercase tracking-wider text-gray-500">
                Active Organization &amp; Role
              </span>
              <div className="text-base font-headline font-black text-[#121316]">
                {organizationName}
              </div>
            </div>
            <span className={`px-3 py-1 font-headline font-black text-xs uppercase tracking-wider border-2 border-[#121316] shadow-[2px_2px_0px_#121316] ${badgeColor}`}>
              {role.replace(/_/g, " ")}
            </span>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-5 sm:p-6 bg-[#FCFBF7] flex flex-col sm:flex-row gap-3 justify-center items-center">
          <button
            type="button"
            onClick={onNavigateRoleSelect}
            className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-gray-100 text-[#121316] font-headline font-black text-xs uppercase tracking-wider border-3 border-[#121316] shadow-[3px_3px_0px_#121316] cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
          >
            ← Onboard Another Role
          </button>
          <a
            href={
              role === "DONOR" || role === "CORPORATE_ADMIN"
                ? "/donor/dashboard"
                : role === "MENTOR"
                ? "/mentor/dashboard"
                : role === "ORG_ADMIN"
                ? "/admin"
                : "/dashboard"
            }
            className="w-full sm:w-auto px-6 py-3 bg-[#0F534A] hover:bg-[#0c423b] text-white font-headline font-black text-xs uppercase tracking-wider border-3 border-[#121316] shadow-[4px_4px_0px_#FE4E1A] transition-all transform active:translate-x-0.5 active:translate-y-0.5"
          >
            Go to Your Portal →
          </a>
        </div>
      </div>
    );
  }

  if (!uiSchema) {
    return (
      <div className="p-6 text-center bg-white border-2 border-[#121316] shadow-[4px_4px_0px_#121316]">
        <p className="text-sm font-bold text-[#121316]">No UI Schema returned for this workflow.</p>
      </div>
    );
  }

  return (
    <WorkflowRenderer
      uiSchema={uiSchema}
      formData={formData}
      onFieldChange={handleFieldChange}
      onSubmit={handleSubmit}
      onNavigateBack={onNavigateRoleSelect}
      isSubmitting={submitting}
    />
  );
};
