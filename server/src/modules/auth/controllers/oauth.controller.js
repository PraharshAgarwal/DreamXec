const crypto = require('crypto');
const oauthService = require('../services/oauth.service');
const { getProvider } = require('../registry/auth.registry');
const catchAsync = require('../../../utils/catchAsync');
const AppError = require('../../../utils/AppError');

const { getClientUrl } = require('../../../utils/urlConfig');

const DEFAULT_ROLE = 'USER';
const SELF_REGISTRATION_ROLES = new Set(['USER']);
const OAUTH_SECRET = process.env.JWT_SECRET || process.env.SESSION_SECRET;
if (!OAUTH_SECRET) throw new Error('OAuth requires JWT_SECRET or SESSION_SECRET to be configured');

const getPublicRole = (value) => {
  const role = String(value || DEFAULT_ROLE).trim().toUpperCase();

  if (!SELF_REGISTRATION_ROLES.has(role)) {
    throw new AppError('Invalid registration role.', 400);
  }

  return role;
};

const signStatePayload = (payload) => {
  const dataStr = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', OAUTH_SECRET).update(dataStr).digest('base64url');
  return `${dataStr}.${signature}`;
};

const verifyAndDecodeState = (stateStr) => {
  if (!stateStr || typeof stateStr !== 'string') return null;
  const parts = stateStr.split('.');
  if (parts.length !== 2) return null;
  const [dataStr, signature] = parts;

  try {
    const payload = JSON.parse(Buffer.from(dataStr, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) return null;

    // Check signature if HMAC matches
    const expectedSig = crypto.createHmac('sha256', OAUTH_SECRET).update(dataStr).digest('base64url');
    if (signature === expectedSig) {
      return payload;
    }
  } catch (e) {
    return null;
  }
  return null;
};


function validateClientUrl(candidate) {
  if (!candidate || typeof candidate !== 'string') return null;
  try {
    const trimmed = candidate.trim();
    const url = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (
      ['localhost', '127.0.0.1'].includes(host) ||
      /(^|\.)dreamxec\.(com|org)$/.test(host) ||
      host.endsWith('.onrender.com')
    ) {
      return parsed.origin;
    }
  } catch {}
  return null;
}

function extractTargetDomainFromState(stateStr) {
  if (!stateStr || typeof stateStr !== 'string') return null;
  try {
    const dataStr = stateStr.split('.')[0];
    const payload = JSON.parse(Buffer.from(dataStr, 'base64url').toString('utf8'));
    if (payload?.clientUrl) {
      return validateClientUrl(payload.clientUrl);
    }
  } catch {}
  return null;
}

class OAuthController {
  constructor(svc = oauthService) {
    this.service = svc;
  }

  initiateOAuth = catchAsync(async (req, res) => {
    const providerName = String(req.params.provider || 'google').toLowerCase();
    const role = getPublicRole(req.query.role);

    // Resolve client origin with priority: query param -> x-client-domain -> origin -> referer -> getClientUrl
    let clientUrl = null;
    const candidates = [
      req.query.clientUrl,
      req.headers['x-client-domain'],
      req.headers['x-tenant-domain'],
      req.headers.origin,
      req.headers.referer,
    ];

    for (const c of candidates) {
      if (c) {
        clientUrl = validateClientUrl(c);
        if (clientUrl) break;
      }
    }

    if (!clientUrl) {
      clientUrl = getClientUrl(req);
    }

    console.log(`[OAuthController] Initiating ${providerName} OAuth with clientUrl: ${clientUrl}`);

    const statePayload = {
      provider: providerName,
      role,
      clientUrl,
      nonce: crypto.randomBytes(16).toString('hex'),
      createdAt: Date.now(),
      exp: Date.now() + 15 * 60 * 1000, // 15 min validity
    };
    const signedState = signStatePayload(statePayload);

    if (req.session) {
      req.session.oauthState = {
        provider: providerName,
        role,
        clientUrl,
        state: signedState,
        createdAt: Date.now(),
      };
    }

    const provider = getProvider(providerName);
    let authUrl = '';

    if (typeof provider.getAuthUrl === 'function') {
      authUrl = await provider.getAuthUrl({ state: signedState, role });
    } else {
      throw new AppError(`Provider '${providerName}' does not support getAuthUrl.`, 400);
    }

    res.redirect(authUrl);
  });

  handleCallback = async (req, res, next) => {
    const providerName = String(req.params.provider || 'google').toLowerCase();
    let decodedState = null;
    let oauthSession = null;
    const receivedState = req.query.state;

    try {
      decodedState = verifyAndDecodeState(receivedState);

      oauthSession = req.session?.oauthState || req.session?.[`${providerName}OAuth`];
      if (req.session?.oauthState) delete req.session.oauthState;
      if (req.session?.[`${providerName}OAuth`]) delete req.session[`${providerName}OAuth`];

      let role = 'USER';
      if (decodedState?.role) {
        role = decodedState.role;
      } else if (oauthSession?.role) {
        role = oauthSession.role;
      }

      const isValidState = decodedState !== null || (oauthSession?.state && oauthSession.state === receivedState);
      if (!isValidState && !req.user) {
        throw new AppError('Invalid or expired OAuth state parameter.', 401);
      }

      const result = await this.service.handleOAuthCallback(providerName, {
        req,
        code: req.query.code,
        expectedState: receivedState || oauthSession?.state,
        profile: req.user,
        role,
      });

      const targetClientUrl =
        (decodedState?.clientUrl && validateClientUrl(decodedState.clientUrl)) ||
        extractTargetDomainFromState(receivedState) ||
        (oauthSession?.clientUrl && validateClientUrl(oauthSession.clientUrl)) ||
        getClientUrl(req);

      console.log(`[OAuthController] Success: Redirecting ${providerName} callback to: ${targetClientUrl}`);

      const callbackUrl =
        `${targetClientUrl}/auth/callback` +
        `#token=${encodeURIComponent(result.token)}`;

      return res.redirect(callbackUrl);
    } catch (err) {
      console.error(`[OAuthController] Error during ${providerName} callback:`, err.message);
      let userFriendlyMessage = 'OAuth authentication failed. Please try again.';
      if (err.message && !err.message.includes('prisma') && !err.message.includes('invocation') && err.message.length < 100) {
        userFriendlyMessage = err.message;
      }
      const errorMsg = encodeURIComponent(userFriendlyMessage);

      const targetClientUrl =
        (decodedState?.clientUrl && validateClientUrl(decodedState.clientUrl)) ||
        extractTargetDomainFromState(receivedState) ||
        (oauthSession?.clientUrl && validateClientUrl(oauthSession.clientUrl)) ||
        getClientUrl(req);

      console.log(`[OAuthController] Failure: Redirecting ${providerName} error to: ${targetClientUrl}`);

      return res.redirect(`${targetClientUrl}/login?error=${errorMsg}`);
    }
  };

  googleInitiate = (req, res, next) => {
    req.params.provider = 'google';
    return this.initiateOAuth(req, res, next);
  };

  googleAuthenticate = (req, res, next) => next();

  googleCallback = (req, res, next) => {
    req.params.provider = 'google';
    return this.handleCallback(req, res, next);
  };
}

module.exports = new OAuthController();
module.exports.OAuthController = OAuthController;
