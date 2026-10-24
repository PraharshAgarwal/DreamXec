import { useState, useEffect, useRef, useCallback } from "react";
import apiRequest, {
  ExtendedRequestInit,
  ApiResponse,
  getCachedApiResponse,
} from "../services/api";

export interface UseDataQueryOptions<T> extends ExtendedRequestInit {
  enabled?: boolean;
  initialData?: T;
  revalidateOnFocus?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export interface UseDataQueryResult<T> {
  data: T | undefined;
  loading: boolean;
  isValidating: boolean;
  error: Error | null;
  mutate: (newData: T | ((prev: T | undefined) => T), revalidate?: boolean) => void;
  refresh: () => Promise<ApiResponse<T> | undefined>;
}

export function useDataQuery<T = any>(
  endpoint: string | null,
  options: UseDataQueryOptions<T> = {}
): UseDataQueryResult<T> {
  const {
    enabled = true,
    initialData,
    revalidateOnFocus = false,
    onSuccess,
    onError,
    ...apiOptions
  } = options;

  // 1. Synchronously probe cache for instant 0ms mount
  const initialCachedResponse = endpoint && enabled
    ? getCachedApiResponse<T>(endpoint, apiOptions.params, true)
    : null;

  const initialResolvedData: T | undefined =
    initialCachedResponse?.data !== undefined
      ? initialCachedResponse.data
      : initialData;

  const [data, setData] = useState<T | undefined>(initialResolvedData);
  const [loading, setLoading] = useState<boolean>(
    Boolean(enabled && endpoint && initialResolvedData === undefined)
  );
  const [isValidating, setIsValidating] = useState<boolean>(
    Boolean(enabled && endpoint)
  );
  const [error, setError] = useState<Error | null>(null);

  const isMountedRef = useRef(true);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const paramsKeyRef = useRef(JSON.stringify(apiOptions.params));

  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  const fetchData = useCallback(
    async (isBackground = false) => {
      if (!endpoint || !enabled) return;

      if (!isBackground) {
        setLoading(true);
      }
      setIsValidating(true);
      setError(null);

      try {
        const res = await apiRequest<T>(endpoint, {
          ...apiOptions,
          skipCache: isBackground ? true : apiOptions.skipCache, // background revalidation fetches fresh
        });

        if (!isMountedRef.current) return;

        const resolvedData = res.data !== undefined ? res.data : (res as any);
        setData(resolvedData);
        if (onSuccessRef.current) {
          onSuccessRef.current(resolvedData);
        }
        return res;
      } catch (err: any) {
        if (!isMountedRef.current) return;
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        if (onErrorRef.current) {
          onErrorRef.current(e);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          setIsValidating(false);
        }
      }
    },
    [endpoint, enabled, paramsKeyRef.current]
  );

  useEffect(() => {
    isMountedRef.current = true;

    if (!endpoint || !enabled) {
      setLoading(false);
      setIsValidating(false);
      return;
    }

    // Check if we have cached data to render instantly
    const cached = getCachedApiResponse<T>(endpoint, apiOptions.params, true);
    if (cached?.data !== undefined) {
      setData(cached.data);
      setLoading(false);
      // Revalidate in background
      fetchData(true);
    } else {
      fetchData(false);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [endpoint, enabled, paramsKeyRef.current]);

  // Window focus revalidation
  useEffect(() => {
    if (!revalidateOnFocus || !endpoint || !enabled) return;

    const handleFocus = () => {
      fetchData(true);
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [revalidateOnFocus, endpoint, enabled, fetchData]);

  const mutate = useCallback(
    (newData: T | ((prev: T | undefined) => T), shouldRevalidate = false) => {
      setData((prev) => {
        const next = typeof newData === "function" ? (newData as any)(prev) : newData;
        return next;
      });

      if (shouldRevalidate) {
        fetchData(true);
      }
    },
    [fetchData]
  );

  const refresh = useCallback(() => {
    return fetchData(false);
  }, [fetchData]);

  return {
    data,
    loading,
    isValidating,
    error,
    mutate,
    refresh,
  };
}
