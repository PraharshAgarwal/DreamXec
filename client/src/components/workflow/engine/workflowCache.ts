import apiRequest from "../../../services/api";

const templateCache: Record<string, Promise<any>> = {};
const instanceCache: Record<string, Promise<any>> = {};

/**
 * Pre-fetches organization workflow template metadata (READ-ONLY GET).
 * Does NOT create a WorkflowInstance record in the database.
 */
export const prefetchWorkflowTemplate = (orgId: string, role: string) => {
  if (!orgId || !role) return;
  const cacheKey = `${orgId}:${role}`;

  if (!templateCache[cacheKey]) {
    console.log(`⚡ [Workflow Cache Manager]: Pre-fetching template metadata for ${cacheKey}`);
    templateCache[cacheKey] = apiRequest<any>(
      `/workflows?orgIds=${encodeURIComponent(orgId)}&roles=${encodeURIComponent(orgId + ":" + role)}`,
      { method: "GET" }
    ).catch((err) => {
      console.warn(`⚠️ [Workflow Cache Manager Error]: ${cacheKey}`, err);
      delete templateCache[cacheKey];
      throw err;
    });
  }

  return templateCache[cacheKey];
};

/**
 * Explicitly initiates a new Workflow Instance (POST).
 * Called ONLY when proceeding to Step 3 (Workflow execution page).
 */
export const initiateWorkflowInstance = (
  orgId: string,
  role: string,
  orgName?: string,
  orgType?: string,
  userId?: string
) => {
  if (!orgId || !role) return Promise.reject(new Error("Missing orgId or role"));
  const cacheKey = userId ? `${userId}:${orgId}:${role}` : `${orgId}:${role}`;

  if (instanceCache[cacheKey]) {
    console.log(`⚡ [Workflow Cache Manager]: Reusing existing in-flight instance promise for ${cacheKey}`);
    return instanceCache[cacheKey];
  }

  console.log(`🚀 [Workflow Engine]: Initiating DB Workflow Instance for ${cacheKey}`);
  const promise = apiRequest<any>("/workflows/instances", {
    method: "POST",
    body: JSON.stringify({
      organizationId: orgId,
      role,
      applicantId: userId || undefined,
      instanceData: {
        userId: userId || undefined,
        selectedOrgName: orgName,
        selectedOrgType: orgType,
      },
    }),
  })
    .then((res) => {
      // Retain in-flight promise for 4s so concurrent component mounts / transitions deduplicate cleanly
      setTimeout(() => {
        delete instanceCache[cacheKey];
      }, 4000);
      return res;
    })
    .catch((err) => {
      delete instanceCache[cacheKey];
      throw err;
    });

  instanceCache[cacheKey] = promise;
  return promise;
};

export const getPrefetchedTemplate = (orgId: string, role: string) => {
  return templateCache[`${orgId}:${role}`] || null;
};

export const clearWorkflowCache = () => {
  Object.keys(templateCache).forEach((key) => delete templateCache[key]);
  Object.keys(instanceCache).forEach((key) => delete instanceCache[key]);
};
