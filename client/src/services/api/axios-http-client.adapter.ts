import { HttpClientPort, HttpRequestOptions } from './http-client.port';
import apiRequest, { clearApiCache, getToken, removeToken } from '../api';
import axios from 'axios';

// ── Global Axios Configuration ──
// Synchronizes any direct axios usage (e.g. upload hooks, legacy services)
// with the core token lifecycle, cache invalidation, and session expiry events.
axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axios.interceptors.response.use(
  (response) => {
    // Invalidate API cache on successful mutations
    const method = (response.config.method || '').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const url = response.config.url || '';
      const baseNamespace = url.replace(/^\/api\/?/, '').split('/')[0] || '';
      if (baseNamespace) {
        clearApiCache(baseNamespace);
      } else {
        clearApiCache();
      }
    }
    return response;
  },
  (error) => {
    // 🔐 Centralized 401 Unauthorized handling
    if (error?.response?.status === 401) {
      if (getToken()) {
        removeToken();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('dx:auth-expired'));
        }
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Unified Hexagonal HttpClientAdapter.
 * Bridges HttpClientPort directly to the platform's core apiRequest pipeline,
 * guaranteeing unified SWR caching, request deduplication, and auth lifecycle.
 */
class AxiosHttpClientAdapter implements HttpClientPort {
  async get<T>(endpoint: string, options?: HttpRequestOptions): Promise<T> {
    const res = await apiRequest<T>(endpoint, {
      method: 'GET',
      headers: options?.headers,
      params: options?.params,
      skipCache: options?.skipCache,
    });
    return (res as unknown) as T;
  }

  async post<T>(endpoint: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    const res = await apiRequest<T>(endpoint, {
      method: 'POST',
      headers: options?.headers,
      params: options?.params,
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
    return (res as unknown) as T;
  }

  async put<T>(endpoint: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    const res = await apiRequest<T>(endpoint, {
      method: 'PUT',
      headers: options?.headers,
      params: options?.params,
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
    return (res as unknown) as T;
  }

  async patch<T>(endpoint: string, body?: unknown, options?: HttpRequestOptions): Promise<T> {
    const isFormData = body instanceof FormData;
    const res = await apiRequest<T>(endpoint, {
      method: 'PATCH',
      headers: options?.headers,
      params: options?.params,
      body: isFormData ? (body as FormData) : body !== undefined ? JSON.stringify(body) : undefined,
    });
    return (res as unknown) as T;
  }

  async delete<T>(endpoint: string, options?: HttpRequestOptions): Promise<T> {
    const res = await apiRequest<T>(endpoint, {
      method: 'DELETE',
      headers: options?.headers,
      params: options?.params,
    });
    return (res as unknown) as T;
  }
}

export const defaultHttpClient = new AxiosHttpClientAdapter();
