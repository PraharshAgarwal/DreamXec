/**
 * Centralized Campaign Cross-Domain Routing Utility
 * Ensures all campaign views and donation flows are hosted exclusively on dreamxec.org
 */

export function isFoundationDomain(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hostname.endsWith('dreamxec.org') ||
    new URLSearchParams(window.location.search).get('domain') === 'dreamxec.org' ||
    localStorage.getItem('dx_client_domain') === 'dreamxec.org'
  );
}

export function getFoundationBaseUrl(): string {
  if (typeof window === 'undefined') return 'https://dreamxec.org';

  if (import.meta.env?.VITE_FOUNDATION_URL) {
    return import.meta.env.VITE_FOUNDATION_URL.replace(/\/+$/, '');
  }

  // Local development fallback keeps developer on localhost with simulated domain param
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${window.location.protocol}//${hostname}${port}`;
  }

  return 'https://dreamxec.org';
}

/**
 * Returns the canonical URL for a campaign.
 * If already on dreamxec.org, returns relative path (/campaign/:slugOrId).
 * If on dreamxec.com or external domain, returns the full dreamxec.org URL.
 */
export function getCampaignUrl(slugOrId: string): string {
  const cleanId = encodeURIComponent(slugOrId || '');
  if (!cleanId) return '/campaigns';

  const onOrg = isFoundationDomain();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  if (onOrg) {
    return `/campaign/${cleanId}`;
  }

  if (isLocal) {
    // In local dev, preserve domain=dreamxec.org query parameter
    return `/campaign/${cleanId}?domain=dreamxec.org`;
  }

  return `${getFoundationBaseUrl()}/campaign/${cleanId}`;
}

/**
 * Safely navigates the user to a campaign.
 * If on dreamxec.org, uses React Router navigate() to prevent page reload.
 * If on dreamxec.com, initiates a full cross-origin window navigation to dreamxec.org.
 */
export function navigateToCampaign(
  slugOrId: string,
  navigate?: (path: string) => void
): void {
  const cleanId = encodeURIComponent(slugOrId || '');
  if (!cleanId) return;

  const onOrg = isFoundationDomain();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';

  if (onOrg && navigate) {
    navigate(`/campaign/${cleanId}`);
    return;
  }

  if (isLocal && navigate) {
    navigate(`/campaign/${cleanId}?domain=dreamxec.org`);
    return;
  }

  const targetUrl = getCampaignUrl(cleanId);
  window.location.href = targetUrl;
}
