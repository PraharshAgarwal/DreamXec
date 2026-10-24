/**
 * Multi-Domain Razorpay Gateway Configuration & Credential Resolver
 * Supports hosting the same backend for multiple frontend domains,
 * routing each domain to its designated Razorpay key pair and webhook secret.
 */

function cleanHostname(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim().toLowerCase();
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return new URL(trimmed).hostname;
    }
  } catch {
    // Fallback if not standard URL
  }
  return trimmed.replace(/^https?:\/\//, '').split('/')[0].split(':')[0];
}

/**
 * Extracts origin or domain hostname from express request or origin string
 */
function extractDomainFromRequest(reqOrOrigin) {
  if (!reqOrOrigin) return '';
  if (typeof reqOrOrigin === 'string') {
    return cleanHostname(reqOrOrigin);
  }

  // If Express req object
  const req = reqOrOrigin;
  const customHeader = req.headers?.['x-client-domain'] || req.headers?.['x-tenant-domain'];
  if (customHeader) return cleanHostname(customHeader);

  if (req.query?.domain) return cleanHostname(req.query.domain);
  if (req.query?.clientUrl) return cleanHostname(req.query.clientUrl);

  if (req.body?.domain) return cleanHostname(req.body.domain);
  if (req.body?.clientUrl) return cleanHostname(req.body.clientUrl);

  const origin = req.headers?.origin;
  if (origin) return cleanHostname(origin);

  const referer = req.headers?.referer;
  if (referer) return cleanHostname(referer);

  const host = req.headers?.host;
  if (host) return cleanHostname(host);

  return '';
}

/**
 * Resolves Razorpay credentials based on incoming request origin or explicit domain.
 * Defaults to Domain 1 / primary RAZORPAY_KEY_ID credentials.
 */
function resolveRazorpayCredentials(reqOrOrigin, options = {}) {
  const domain = extractDomainFromRequest(reqOrOrigin);

  const domain1 = cleanHostname(process.env.DOMAIN_1 || process.env.DOMAIN_PRIMARY || 'dreamxec.com');
  const domain2 = cleanHostname(process.env.DOMAIN_2 || process.env.DOMAIN_SECONDARY || 'dreamxec.org');

  // Secondary Domain Credentials (DAF / dreamxec.org - Foundation / Campaign Grants)
  const creds2 = {
    domain: domain2 || 'dreamxec.org',
    keyId: process.env.RAZORPAY_KEY_ID_2 || process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id',
    keySecret: process.env.RAZORPAY_KEY_SECRET_2 || process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
    webhookSecret:
      process.env.RAZORPAY_WEBHOOK_SECRET_2 ||
      process.env.RAZORPAY_KEY_SECRET_2 ||
      process.env.RAZORPAY_WEBHOOK_SECRET ||
      'dummy_key_secret',
  };

  // Primary / Default Domain Credentials (FICPL / dreamxec.com - Tech Platform)
  const creds1 = {
    domain: domain1 || 'default',
    keyId: process.env.RAZORPAY_KEY_ID_1 || process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id',
    keySecret: process.env.RAZORPAY_KEY_SECRET_1 || process.env.RAZORPAY_KEY_SECRET || 'dummy_key_secret',
    webhookSecret:
      process.env.RAZORPAY_WEBHOOK_SECRET_1 ||
      process.env.RAZORPAY_WEBHOOK_SECRET ||
      process.env.RAZORPAY_KEY_SECRET ||
      'dummy_key_secret',
  };

  // Explicit foundation override (all campaigns strictly use Account 2 / DAF)
  if (options?.forceFoundation || options?.forcedEntity === 'DAF' || options?.purpose === 'CAMPAIGN_DONATION') {
    console.log(`[RazorpayConfig] Force Foundation/DAF routing active -> using Account 2 Key ID: ${creds2.keyId.substring(0, 14)}...`);
    return creds2;
  }

  // Match Domain 2 (secondary) if configured and request matches
  if (domain2 && creds2.keyId && (domain === domain2 || domain.endsWith(`.${domain2}`))) {
    console.log(`[RazorpayConfig] Request domain "${domain}" matched secondary domain "${domain2}" -> using Key ID: ${creds2.keyId.substring(0, 14)}...`);
    return creds2;
  }

  // Fallback to primary / default
  console.log(`[RazorpayConfig] Request domain "${domain}" -> resolved to primary domain "${creds1.domain}" -> using Key ID: ${creds1.keyId.substring(0, 14)}...`);
  return creds1;
}

/**
 * Returns strictly the Foundation (Account 2) Razorpay credentials for all campaign donations
 */
function getFoundationRazorpayCredentials() {
  return resolveRazorpayCredentials('dreamxec.org', { forceFoundation: true });
}

/**
 * Returns all configured Razorpay HMAC key secrets for fallback verification
 */
function getAllKeySecrets() {
  const secrets = [
    process.env.RAZORPAY_KEY_SECRET_1,
    process.env.RAZORPAY_KEY_SECRET_2,
    process.env.RAZORPAY_KEY_SECRET,
  ].filter(Boolean);

  return Array.from(new Set(secrets));
}

/**
 * Returns all configured webhook secrets across all domains
 */
function getAllWebhookSecrets() {
  const secrets = [
    process.env.RAZORPAY_WEBHOOK_SECRET_1,
    process.env.RAZORPAY_WEBHOOK_SECRET_2,
    process.env.RAZORPAY_WEBHOOK_SECRET,
    process.env.RAZORPAY_KEY_SECRET_1,
    process.env.RAZORPAY_KEY_SECRET_2,
    process.env.RAZORPAY_KEY_SECRET,
  ].filter(Boolean);

  return Array.from(new Set(secrets));
}

/**
 * Resolves RazorpayX Payout credentials and virtual/source account numbers per domain.
 * Ensures DAF grant payouts originate from DAF's account and FICPL operations from FICPL.
 */
function resolveRazorpayXPayoutCredentials(reqOrOrigin) {
  const domain = extractDomainFromRequest(reqOrOrigin);
  const domain1 = cleanHostname(process.env.DOMAIN_1 || process.env.DOMAIN_PRIMARY || 'dreamxec.com');
  const domain2 = cleanHostname(process.env.DOMAIN_2 || process.env.DOMAIN_SECONDARY || '');

  // Secondary Domain (e.g. DAF / dreamxec.org - Foundation / Grants)
  const creds2 = {
    domain: domain2 || 'domain_2',
    entity: 'DAF',
    accountNumber: process.env.RAZORPAYX_ACCOUNT_NUMBER_2 || null,
    keyId: process.env.RAZORPAYX_KEY_ID_2 || process.env.RAZORPAY_KEY_ID_2 || '',
    keySecret: process.env.RAZORPAYX_KEY_SECRET_2 || process.env.RAZORPAY_KEY_SECRET_2 || '',
    webhookSecret: process.env.RAZORPAYX_WEBHOOK_SECRET_2 || process.env.RAZORPAY_WEBHOOK_SECRET_2 || '',
  };

  // Primary Domain (e.g. FICPL / dreamxec.com - Tech Platform / Commercial)
  const creds1 = {
    domain: domain1 || 'default',
    entity: 'FICPL',
    accountNumber: process.env.RAZORPAYX_ACCOUNT_NUMBER_1 || process.env.RAZORPAYX_ACCOUNT_NUMBER || null,
    keyId: process.env.RAZORPAYX_KEY_ID_1 || process.env.RAZORPAYX_KEY_ID || process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAYX_KEY_SECRET_1 || process.env.RAZORPAYX_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAYX_WEBHOOK_SECRET_1 || process.env.RAZORPAYX_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET || '',
  };

  if (domain2 && (domain === domain2 || domain.endsWith(`.${domain2}`))) {
    if (creds2.keyId || creds2.accountNumber) {
      return creds2;
    }
  }

  return creds1;
}

/**
 * Returns all configured domain strings for CORS and whitelist management
 */
function getConfiguredDomains() {
  return [
    process.env.DOMAIN_1,
    process.env.DOMAIN_PRIMARY,
    process.env.DOMAIN_2,
    process.env.DOMAIN_SECONDARY,
  ].filter(Boolean).map(cleanHostname);
}

module.exports = {
  extractDomainFromRequest,
  resolveRazorpayCredentials,
  getFoundationRazorpayCredentials,
  resolveRazorpayXPayoutCredentials,
  getAllKeySecrets,
  getAllWebhookSecrets,
  getConfiguredDomains,
};

