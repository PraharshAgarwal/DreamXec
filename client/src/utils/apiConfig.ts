/**
 * Centralized Environment-Aware API and Backend URL Resolution Utility
 * Automatically adapts between Development (localhost) and Production (Render / custom domain)
 * without requiring manual configuration.
 */

export function getApiBaseUrl(): string {
  let envUrl = (import.meta.env.VITE_API_URL as string)?.trim();

  // 1. If an environment variable is explicitly provided, normalize and use it
  // (Ignore baked-in dev localhost URL if the browser is running on a live production domain)
  const isLiveBrowser =
    typeof window !== "undefined" &&
    window.location &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1";

  if (
    envUrl &&
    envUrl !== "undefined" &&
    envUrl !== "" &&
    !(isLiveBrowser && (envUrl.includes("localhost") || envUrl.includes("127.0.0.1")))
  ) {
    if (envUrl.startsWith("/")) {
      return envUrl.endsWith("/api") ? envUrl : `${envUrl.replace(/\/+$/, "")}/api`;
    }

    // Fix Render internal service hostname "dreamxec-backend" if passed without .onrender.com suffix
    if (envUrl.includes("dreamxec-backend") && !envUrl.includes(".")) {
      envUrl = envUrl.replace("dreamxec-backend", "dreamxec-backend.onrender.com");
    }

    // Ensure protocol scheme is present
    if (!/^https?:\/\//i.test(envUrl)) {
      envUrl = envUrl.includes("localhost") || envUrl.includes("127.0.0.1")
        ? `http://${envUrl}`
        : `https://${envUrl}`;
    }

    // Ensure path ends with /api
    if (!envUrl.endsWith("/api")) {
      envUrl = `${envUrl.replace(/\/+$/, "")}/api`;
    }

    return envUrl;
  }

  // 2. If no VITE_API_URL is configured, auto-detect based on runtime browser location
  if (typeof window !== "undefined" && window.location) {
    const hostname = window.location.hostname;

    // Local development (localhost or local IP)
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname.startsWith("192.168.")) {
      return "http://localhost:5000/api";
    }

    // Render or Vercel deployment fallback
    if (hostname.endsWith(".onrender.com") || hostname.endsWith(".vercel.app")) {
      return "https://dreamxec-backend.onrender.com/api";
    }

    // Default to same-origin /api (EC2 host, custom domain, or reverse proxy)
    return `${window.location.origin}/api`;
  }

  // Fallback for SSR / Node test runner
  return import.meta.env.PROD || import.meta.env.MODE === "production"
    ? "https://dreamxec-backend.onrender.com/api"
    : "http://localhost:5000/api";
}

/**
 * Returns the backend root URL without '/api' suffix (e.g. for uploads, static assets, etc.)
 */
export function getBackendBaseUrl(): string {
  return getApiBaseUrl().replace(/\/api\/?$/, "");
}

/**
 * Resolves any document, image, or media URL against the correct backend host.
 * Handles absolute URLs, data URIs, and relative '/uploads/...' paths seamlessly across Dev & Prod.
 */
export function resolveBackendMediaUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = String(url).trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }

  const backendRoot = getBackendBaseUrl();
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${backendRoot}${cleanPath}`;
}

export const API_BASE_URL = getApiBaseUrl();
export const BACKEND_BASE_URL = getBackendBaseUrl();

