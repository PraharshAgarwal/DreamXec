import apiRequest from './api';

export interface PermissionDefinition {
  key: string;
  code: string;
  name: string;
  category: string;
  description: string;
  rolesWithPermission: string[];
}

export interface UserPermissionContext {
  userId: string;
  fullName: string;
  email: string;
  activeRole: string;
  activeOrgId: string | null;
  activeOrgName: string | null;
  totalPermissionsCount: number;
  grantedCount: number;
  restrictedCount: number;
  effectiveKeys: string[];
}

export interface PermissionMatrixResponse {
  status: string;
  syncedAt: string;
  permissions: PermissionDefinition[];
  roleMatrix: Record<string, string[]>;
  userContext: UserPermissionContext | null;
}

const matrixCache = new Map<string, { data: PermissionMatrixResponse; time: number }>();
const CACHE_TTL_MS = 30000; // 30 seconds

/**
 * Dynamically fetches the full permission catalog and role matrix from the backend.
 * Supports on-demand force refresh to pick up real-time matrix changes from DB.
 * Allows role-specific segregated permission evaluation.
 */
export async function fetchPermissionMatrix(options?: {
  role?: string;
  forceRefresh?: boolean;
}): Promise<PermissionMatrixResponse> {
  const roleKey = (options?.role || 'DEFAULT').toUpperCase();
  const now = Date.now();
  const cached = matrixCache.get(roleKey);

  if (!options?.forceRefresh && cached && now - cached.time < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const query = options?.role ? `?role=${encodeURIComponent(options.role)}` : '';
    const res = await apiRequest<PermissionMatrixResponse>(`/permissions/matrix${query}`, {
      method: 'GET',
    });

    const data = res.data || (res as any);
    if (data && data.permissions) {
      matrixCache.set(roleKey, { data, time: now });
      return data;
    }
    throw new Error('Invalid matrix response');
  } catch (error) {
    console.warn('[PermissionService] Failed to fetch dynamic matrix from server, using fallback', error);
    if (cached) return cached.data;
    throw error;
  }
}
