/**
 * Centralized Environment-Aware URL Resolution Utility
 * Maps frontend and backend URLs dynamically based on environment (Dev vs Production).
 */

function getClientUrl(reqOrOrigin) {
  if (reqOrOrigin) {
    let candidate = '';
    if (typeof reqOrOrigin === 'string') {
      candidate = reqOrOrigin.trim();
    } else if (typeof reqOrOrigin === 'object') {
      const req = reqOrOrigin;
      candidate =
        req.headers?.['x-client-domain'] ||
        req.headers?.['x-tenant-domain'] ||
        req.query?.clientUrl ||
        req.query?.domain ||
        req.headers?.origin ||
        req.headers?.referer ||
        '';
    }

    if (candidate) {
      try {
        if (!candidate.startsWith('http://') && !candidate.startsWith('https://')) {
          candidate = `https://${candidate}`;
        }
        const parsed = new URL(candidate);
        const host = parsed.hostname.toLowerCase();
        if (
          ['localhost', '127.0.0.1'].includes(host) ||
          /(^|\.)dreamxec\.(com|org)$/.test(host)
        ) {
          return parsed.origin;
        }
      } catch {}
    }
  }

  let url = process.env.CLIENT_URL ? process.env.CLIENT_URL.trim() : '';

  if (!url || url === 'undefined' || url === 'null') {
    url = process.env.NODE_ENV === 'production'
      ? 'https://dreamxec-frontend.onrender.com'
      : 'http://localhost:5173';
  }

  // Fix Render internal service hostname if missing domain suffix
  if (url.includes('dreamxec-frontend') && !url.includes('.')) {
    url = url.replace('dreamxec-frontend', 'dreamxec-frontend.onrender.com');
  }

  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    url = url.includes('localhost') || url.includes('127.0.0.1')
      ? `http://${url}`
      : `https://${url}`;
  }

  // Strip trailing slashes
  return url.replace(/\/+$/, '');
}

function getBackendUrl() {
  let url = (process.env.SERVER_URL || process.env.RENDER_EXTERNAL_URL || '').trim();

  if (!url || url === 'undefined' || url === 'null') {
    url = process.env.NODE_ENV === 'production'
      ? 'https://dreamxec-backend.onrender.com'
      : 'http://localhost:5000';
  }

  // Fix Render internal service hostname if missing domain suffix
  if (url.includes('dreamxec-backend') && !url.includes('.')) {
    url = url.replace('dreamxec-backend', 'dreamxec-backend.onrender.com');
  }

  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(url)) {
    url = url.includes('localhost') || url.includes('127.0.0.1')
      ? `http://${url}`
      : `https://${url}`;
  }

  // Strip trailing slashes
  return url.replace(/\/+$/, '');
}

module.exports = {
  getClientUrl,
  getBackendUrl,
};
