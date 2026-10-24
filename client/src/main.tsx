import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { PostHogProvider } from "@posthog/react";
import { HelmetProvider } from "react-helmet-async";

import { clearApiCache } from "./services/api";

const PURGE_VERSION = "dx_db_v2_clean";
if (typeof window !== "undefined" && localStorage.getItem("dx_cache_version") !== PURGE_VERSION) {
  clearApiCache();
  localStorage.setItem("dx_cache_version", PURGE_VERSION);
}

const posthogApiKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
const hasPosthogConfig =
  typeof posthogApiKey === "string" && posthogApiKey.trim().length > 0;

const options = {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: "2026-01-30",
} as const;

import { ErrorBoundary } from "./components/ErrorBoundary";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      {hasPosthogConfig ? (
        <PostHogProvider apiKey={posthogApiKey} options={options}>
          <HelmetProvider>
            <App />
          </HelmetProvider>
        </PostHogProvider>
      ) : (
        <HelmetProvider>
          <App />
        </HelmetProvider>
      )}
    </ErrorBoundary>
  </StrictMode>,
);

