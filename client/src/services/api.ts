import { API_BASE_URL } from "../utils/apiConfig";


// ===============================
// TYPES
// ===============================
export interface ApiResponse<T> {
  success: boolean;
  status?: string;
  message?: string;
  data?: T;
  meta?: any;
  token?: string;
  otp?: string;
  results?: number;
  pagination?: { nextCursor: string | null; hasNextPage: boolean };
}

export interface ApiError {
  status: "error";
  message: string;
}


// ===============================
// TOKEN HELPERS
// ===============================
export const getToken = (): string | null =>
  localStorage.getItem("token");

export const setToken = (token: string): void =>
  localStorage.setItem("token", token);

export const removeToken = (): void => {
  localStorage.removeItem("token");
  clearApiCache();
};


import toast from "react-hot-toast";

// ===============================
// EXTENDED REQUEST TYPE
// ===============================
export interface ExtendedRequestInit extends RequestInit {
  params?: Record<string, any>;
  cacheTtl?: number; // In milliseconds (default: 30000 for GET)
  skipCache?: boolean; // Set to true to bypass cache
  showSuccessToast?: boolean;
  successToastMessage?: string;
  showErrorToast?: boolean;
  noRetry?: boolean;
  invalidatePrefixes?: string[]; // Endpoints or prefixes to bust from SWR cache upon successful mutation
}


// ===============================
// IN-MEMORY & PERSISTENT SWR CACHE & DEDUPLICATION
// ===============================
interface CacheEntry<T = any> {
  data: ApiResponse<T>;
  timestamp: number;
  ttl: number;
}

const MAX_MEMORY_CACHE_ENTRIES = 200;
const apiCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<ApiResponse<any>>>();

const PERSISTENT_CACHE_PREFIX = "dx_api_cache:";
const MAX_LOCAL_STORAGE_BYTES = 4096; // Only small metadata (<=4KB) is stored in localStorage to protect 5MB quota

function setMemoryCache(key: string, entry: CacheEntry) {
  if (apiCache.size >= MAX_MEMORY_CACHE_ENTRIES) {
    const oldestKey = apiCache.keys().next().value;
    if (oldestKey) apiCache.delete(oldestKey);
  }
  apiCache.set(key, entry);
}

// Helper to build canonical cache key
export function buildCacheKey(
  method: string,
  endpoint: string,
  params?: Record<string, any>,
  tokenOverride?: string | null
): string {
  const token = tokenOverride !== undefined ? tokenOverride : getToken();
  const queryString = params
    ? "?" +
      new URLSearchParams(
        Object.entries(params)
          .filter(([_, value]) => value !== undefined && value !== null)
          .reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {} as Record<string, string>)
      ).toString()
    : "";

  return `${method.toUpperCase()}:${endpoint}${queryString}:${token ? token.slice(-10) : "anon"}`;
}

/**
 * Reads from in-memory (L1) or localStorage (L2) cache synchronously.
 * Returns data if valid (or stale if allowStale=true), otherwise null.
 */
export function getCachedApiResponse<T = any>(
  endpoint: string,
  params?: Record<string, any>,
  allowStale: boolean = false
): ApiResponse<T> | null {
  const cacheKey = buildCacheKey("GET", endpoint, params);

  // 1. Check L1 Memory Cache
  const memoryEntry = apiCache.get(cacheKey);
  if (memoryEntry) {
    const isFresh = Date.now() - memoryEntry.timestamp < memoryEntry.ttl;
    if (isFresh || allowStale) {
      return memoryEntry.data as ApiResponse<T>;
    }
  }

  // 2. Check L2 Persistent Storage (only for small cached entries)
  try {
    const raw = localStorage.getItem(PERSISTENT_CACHE_PREFIX + cacheKey);
    if (raw) {
      const entry: CacheEntry<T> = JSON.parse(raw);
      const isFresh = Date.now() - entry.timestamp < entry.ttl;
      // Populate L1 cache
      setMemoryCache(cacheKey, entry);
      if (isFresh || allowStale) {
        return entry.data;
      }
    }
  } catch {
    // Storage access error fallback
  }

  return null;
}

/**
 * Saves response into L1 and selectively into L2 persistent cache if small.
 */
export function setCachedApiResponse<T = any>(
  endpoint: string,
  params: Record<string, any> | undefined,
  data: ApiResponse<T>,
  ttl: number = 60000
): void {
  const cacheKey = buildCacheKey("GET", endpoint, params);
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    ttl,
  };
  setMemoryCache(cacheKey, entry);

  // Guard localStorage against large payloads that cause QuotaExceededError or UI blocking
  try {
    const serialized = JSON.stringify(entry);
    if (serialized.length <= MAX_LOCAL_STORAGE_BYTES) {
      localStorage.setItem(PERSISTENT_CACHE_PREFIX + cacheKey, serialized);
    }
  } catch {
    // If quota exceeded, clean up stale persistent api caches to free quota
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith(PERSISTENT_CACHE_PREFIX)) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
  }
}

/**
 * Clears the API cache.
 * If pattern is provided, only keys matching the string/regex are removed.
 */
export function clearApiCache(pattern?: string | RegExp): void {
  if (!pattern) {
    apiCache.clear();
    try {
      const keys = Object.keys(localStorage);
      for (const k of keys) {
        if (k.startsWith(PERSISTENT_CACHE_PREFIX)) {
          localStorage.removeItem(k);
        }
      }
    } catch {}
    return;
  }

  const rawPattern = typeof pattern === "string" ? pattern : null;
  const strippedPattern = rawPattern ? rawPattern.replace(/^\/+/, '') : null;

  const matches = (key: string) => {
    if (typeof pattern === "string") {
      return key.includes(pattern) || (strippedPattern ? key.includes(strippedPattern) : false);
    }
    return pattern.test(key);
  };

  for (const key of apiCache.keys()) {
    if (matches(key)) {
      apiCache.delete(key);
    }
  }

  try {
    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (k.startsWith(PERSISTENT_CACHE_PREFIX)) {
        const sub = k.replace(PERSISTENT_CACHE_PREFIX, "");
        if (matches(sub)) {
          localStorage.removeItem(k);
        }
      }
    }
  } catch {}
}

/**
 * Prefetches an API request and warms the cache ahead of time.
 */
export function prefetchApi(endpoint: string, options: ExtendedRequestInit = {}): void {
  apiRequest(endpoint, {
    ...options,
    method: "GET",
    cacheTtl: options.cacheTtl ?? 60000,
  }).catch(() => {});
}

// ===============================
// MAIN API FUNCTION
// ===============================
async function apiRequest<T>(
  rawEndpoint: string,
  options: ExtendedRequestInit = {}
): Promise<ApiResponse<T>> {
  const endpoint = rawEndpoint.startsWith("/api/") ? rawEndpoint.replace(/^\/api/, "") : rawEndpoint;
  const method = (options.method || "GET").toUpperCase();
  const token = getToken();
  const isGet = method === "GET";
  const ttl = options.cacheTtl ?? 60000; // 60 seconds default TTL for GET

  // Build query string
  const queryString = options.params
    ? "?" +
      new URLSearchParams(
        Object.entries(options.params)
          .filter(([_, value]) => value !== undefined && value !== null)
          .reduce((acc, [key, value]) => {
            acc[key] = String(value);
            return acc;
          }, {} as Record<string, string>)
      ).toString()
    : "";

  const cacheKey = buildCacheKey(method, endpoint, options.params);

  // 1. Check in-memory / persistent cache for valid fresh GET request
  if (isGet && !options.skipCache) {
    const cached = getCachedApiResponse<T>(endpoint, options.params, false);
    if (cached) {
      return cached;
    }
  }

  // 2. Deduplicate in-flight GET requests (only when not explicitly skipping cache)
  if (isGet && !options.skipCache && inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey) as Promise<ApiResponse<T>>;
  }

  // 3. Invalidate relevant cache on mutations (POST, PUT, PATCH, DELETE)
  if (!isGet) {
    // Determine endpoint namespace to invalidate
    const baseNamespace = endpoint.split("/")[1] || "";
    if (baseNamespace) {
      clearApiCache(baseNamespace);
    } else {
      clearApiCache();
    }
  }

  // ✅ Handle FormData correctly
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...((options.headers as Record<string, string>) ?? {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Multi-Domain Gateway Routing (Localhost override or hostname)
  const urlParamDomain =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search).get("domain") ||
        new URLSearchParams(window.location.search).get("clientUrl")
      : null;

  const activeClientDomain =
    urlParamDomain ||
    localStorage.getItem("dx_client_domain") ||
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_CLIENT_DOMAIN) ||
    (typeof window !== "undefined" && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1"
      ? window.location.hostname
      : undefined);

  if (activeClientDomain && !headers["x-client-domain"]) {
    headers["x-client-domain"] = activeClientDomain;
  }

  const { params: _params, cacheTtl: _cacheTtl, skipCache: _skipCache, ...fetchOptions } = options;

  let requestQueryString = queryString;
  if (options.skipCache) {
    const separator = requestQueryString ? '&' : '?';
    requestQueryString = `${requestQueryString}${separator}_t=${Date.now()}`;
  }

  const executeRequest = async (attempt = 0): Promise<ApiResponse<T>> => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}${requestQueryString}`, {
        ...fetchOptions,
        headers,
      });

      const data = await response.json().catch(() => ({}));

      // ===============================
      // 🔐 HANDLE 401
      // ===============================
      if (response.status === 401) {
        if (getToken()) {
          removeToken();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("dx:auth-expired"));
          }
        }
        throw new Error(data?.message || "Your session has expired. Please login again.");
      }


      // ===============================
      // ❌ HANDLE BACKEND ERRORS
      // ===============================
      if (!response.ok) {
        // Retry transient 5xx server errors on idempotent GET requests before throwing
        if (isGet && !options.noRetry && response.status >= 500 && attempt < 2) {
          const delay = (attempt + 1) * 600;
          await new Promise((resolve) => setTimeout(resolve, delay));
          return executeRequest(attempt + 1);
        }

        // 🔥 Handle Zod structured errors
        if (data?.errors && Array.isArray(data.errors)) {
          const combinedMessage = data.errors.map((e: any) => e.message).join("\n");
          throw new Error(combinedMessage);
        }

        throw new Error(data?.message || data?.error || "Something went wrong");
      }

      const result = data as ApiResponse<T>;

      // Always populate fresh GET responses in L1 and L2 so downstream components are up-to-date
      if (isGet) {
        setCachedApiResponse(endpoint, options.params, result, ttl);
      } else {
        // Automatic SWR cache invalidation for successful mutations (POST, PUT, PATCH, DELETE)
        if (options.invalidatePrefixes && options.invalidatePrefixes.length > 0) {
          options.invalidatePrefixes.forEach((prefix) => clearApiCache(prefix));
        } else {
          // Derive root resource segment (e.g. /campaigns/create -> campaigns, /clubs/join -> clubs)
          const cleanEndpoint = endpoint.replace(/^\/+/, '');
          const primarySegment = cleanEndpoint.split('/')[0];
          if (primarySegment) {
            clearApiCache(primarySegment);
          }
        }
      }

      if (options.showSuccessToast || options.successToastMessage) {
        const msg = options.successToastMessage || result.message || "Action completed successfully!";
        toast.success(msg);
      }

      return result;
    } catch (error: any) {
      // Retry transient network errors on idempotent GET requests
      if (
        isGet &&
        !options.noRetry &&
        attempt < 2 &&
        !(error?.message?.includes("session has expired") || error?.message?.includes("401"))
      ) {
        const delay = (attempt + 1) * 600;
        await new Promise((resolve) => setTimeout(resolve, delay));
        return executeRequest(attempt + 1);
      }

      const finalError = error instanceof Error ? error : new Error("Network error. Please check your connection.");
      
      if (options.showErrorToast) {
        toast.error(finalError.message);
      }
      
      throw finalError;
    } finally {
      if (isGet) {
        inFlightRequests.delete(cacheKey);
      }
    }
  };

  const requestPromise = executeRequest();

  if (isGet) {
    inFlightRequests.set(cacheKey, requestPromise);
  }

  return requestPromise;
}

export default apiRequest;
