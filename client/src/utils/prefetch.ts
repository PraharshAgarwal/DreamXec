import { prefetchApi } from "../services/api";

const prefetchedEndpoints = new Set<string>();

/**
 * Prefetches an endpoint when user intends to navigate (e.g. on mouse hover or focus).
 * Deduplicates to prevent redundant network traffic.
 */
export function prefetchEndpoint(endpoint: string, params?: Record<string, any>): void {
  const key = `${endpoint}:${JSON.stringify(params || {})}`;
  if (prefetchedEndpoints.has(key)) return;

  prefetchedEndpoints.add(key);
  prefetchApi(endpoint, { params, cacheTtl: 120000 }); // 2 min prefetch TTL
}

/**
 * Prefetch helper for campaign details
 */
export function prefetchCampaign(idOrSlug: string): void {
  if (!idOrSlug) return;
  prefetchEndpoint(`/campaigns/${idOrSlug}`);
}

/**
 * Prefetch helper for club details
 */
export function prefetchClub(idOrSlug: string): void {
  if (!idOrSlug) return;
  prefetchEndpoint(`/clubs/${idOrSlug}`);
}

/**
 * Prefetch helper for public browse data
 */
export function prefetchBrowseCampaigns(category?: string): void {
  prefetchEndpoint("/campaigns", {
    limit: 20,
    category: category || "ALL",
  });
}
