const crypto = require('crypto');
const digilockerService = require('../../../services/digilocker.service');
const catchAsync = require('../../../utils/catchAsync');
const { getClientUrl } = require('../../../utils/urlConfig');

function encodeDigiLockerState({ clientUrl, nonce }) {
  const payload = {
    u: clientUrl || '',
    n: nonce || crypto.randomBytes(6).toString('hex'),
    t: Date.now(),
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64url');
}

function decodeDigiLockerState(stateStr) {
  if (!stateStr || typeof stateStr !== 'string') return null;
  try {
    const raw = Buffer.from(stateStr, 'base64url').toString('utf8');
    const parsed = JSON.parse(raw);
    if (parsed && parsed.u) {
      return getClientUrl(parsed.u);
    }
  } catch {}
  return null;
}

class DigiLockerController {
  initiate = catchAsync(async (req, res) => {
    const redirectUri = req.query.redirectUri || undefined;
    const clientUrl = getClientUrl(req);
    const state = encodeDigiLockerState({ clientUrl });
    const { authUrl } = await digilockerService.getAuthorizeUrl(redirectUri, state);
    res.redirect(authUrl);
  });

  getAuthUrl = catchAsync(async (req, res) => {
    const redirectUri = req.query.redirectUri || undefined;
    const clientUrl = getClientUrl(req);
    const state = encodeDigiLockerState({ clientUrl });
    const { authUrl } = await digilockerService.getAuthorizeUrl(redirectUri, state);
    res.status(200).json({
      status: 'success',
      data: { authUrl, state },
    });
  });

  callback = catchAsync(async (req, res) => {
    const { code, state, error, error_description } = req.query;
    const stateClientUrl = decodeDigiLockerState(state);
    const clientUrl = stateClientUrl || getClientUrl(req);
    const safeClientUrl = clientUrl.replace(/['"\\]/g, '');

    if (error) {
      console.warn('[DigiLockerCallback] Auth returned error:', error, error_description);
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>DigiLocker Verification</title></head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #FFFDF8;">
          <div style="text-align: center; max-width: 400px; padding: 24px; border: 2px solid #121316; background: #fff; box-shadow: 4px 4px 0px #121316;">
            <h2 style="color: #F4002C; margin-top: 0;">Verification Cancelled</h2>
            <p style="color: #666; font-size: 14px;">${error_description || error}</p>
            <script>
              const targetOrigin = '${safeClientUrl}';
              if (window.opener) {
                window.opener.postMessage({ type: 'DIGILOCKER_ERROR', error: '${encodeURIComponent(error)}' }, targetOrigin);
                setTimeout(() => window.close(), 1500);
              } else {
                window.location.href = '${safeClientUrl}/login?error=${encodeURIComponent(error)}';
              }
            </script>
          </div>
        </body>
        </html>
      `);
    }

    try {
      const tokens = await digilockerService.exchangeCodeForTokens(code, state);
      const profile = await digilockerService.getUserProfile(tokens.access_token, tokens.id_token);

      // Auto-save consented documents to user vault if authenticated
      const userId = req.user?.id || req.session?.user?.id || null;
      if (userId && profile.documents && profile.documents.length > 0) {
        try {
          await digilockerService.saveConsentedDocumentsToVault(userId, profile.documents, profile, tokens.access_token);
        } catch (saveErr) {
          console.warn('[DigiLockerCallback] Auto vault save warning:', saveErr.message);
        }
      }

      const safeDataJson = JSON.stringify(profile);

      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>DigiLocker Verification Success</title></head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #FFFDF8;">
          <div style="text-align: center; max-width: 420px; padding: 28px; border: 3px solid #121316; background: #fff; box-shadow: 6px 6px 0px #121316;">
            <div style="font-size: 40px; margin-bottom: 12px;">✅</div>
            <h2 style="color: #0F534A; margin: 0 0 8px 0; font-size: 20px; text-transform: uppercase;">Identity Verified</h2>
            <p style="color: #121316; font-weight: bold; margin: 4px 0;">Student: ${profile.studentName}</p>
            ${profile.apaarId ? `<p style="font-family: monospace; font-size: 13px; color: #003366;">APAAR ID: ${profile.formattedApaarId || profile.apaarId}</p>` : ''}
            <p style="font-size: 12px; color: #666; margin-top: 12px;">Transmitting verified credentials securely to onboarding window...</p>
            <script>
              const targetOrigin = '${safeClientUrl}';
              const payload = ${safeDataJson};
              if (window.opener) {
                window.opener.postMessage({ type: 'DIGILOCKER_SUCCESS', data: payload }, targetOrigin);
                setTimeout(() => window.close(), 1200);
              } else {
                localStorage.setItem('digilocker_verified_student', JSON.stringify(payload));
                window.location.href = '${safeClientUrl}/onboarding?digilocker=success';
              }
            </script>
          </div>
        </body>
        </html>
      `);
    } catch (err) {
      console.error('[DigiLockerCallback] Exchange error:', err.message);
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
        <head><title>DigiLocker Verification Failed</title></head>
        <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #FFFDF8;">
          <div style="text-align: center; max-width: 420px; padding: 24px; border: 2px solid #F4002C; background: #fff; box-shadow: 4px 4px 0px #F4002C;">
            <h3 style="color: #F4002C; margin-top: 0;">Verification Failed</h3>
            <p style="font-size: 13px; color: #444;">${err.message}</p>
            <script>
              const targetOrigin = '${safeClientUrl}';
              if (window.opener) {
                window.opener.postMessage({ type: 'DIGILOCKER_ERROR', error: '${encodeURIComponent(err.message)}' }, targetOrigin);
                setTimeout(() => window.close(), 2000);
              }
            </script>
          </div>
        </body>
        </html>
      `);
    }
  });

  exchange = catchAsync(async (req, res) => {
    const { code, state, codeVerifier, redirectUri } = req.body;
    const tokens = await digilockerService.exchangeCodeForTokens(code, codeVerifier || state, redirectUri);
    const profile = await digilockerService.getUserProfile(tokens.access_token, tokens.id_token);

    // Auto-save consented documents to user vault if authenticated
    const userId = req.user?.id || req.session?.user?.id || null;
    if (userId && profile.documents && profile.documents.length > 0) {
      try {
        await digilockerService.saveConsentedDocumentsToVault(userId, profile.documents, profile, tokens.access_token);
      } catch (saveErr) {
        console.warn('[DigiLockerExchange] Auto vault save warning:', saveErr.message);
      }
    }

    res.status(200).json({
      status: 'success',
      data: profile,
    });
  });
}

module.exports = new DigiLockerController();
module.exports.DigiLockerController = DigiLockerController;
