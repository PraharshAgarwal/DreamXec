const axios = require('axios');
const OAuthProviderPort = require('../ports/oauth-provider.port');
const { AppError } = require('../auth.errors');
const { getBackendUrl } = require('../../../utils/urlConfig');

class GoogleAuthProvider extends OAuthProviderPort {
  name = 'google';
  providerIdField = 'googleId';

  get clientId() {
    const id = (process.env.GOOGLE_CLIENT_ID || 'dummy_google_client_id.apps.googleusercontent.com').trim();
    return id.replace(/^["']|["']$/g, '');
  }

  get clientSecret() {
    const secret = (process.env.GOOGLE_CLIENT_SECRET || 'dummy_google_client_secret').trim();
    return secret.replace(/^["']|["']$/g, '');
  }

  get callbackUrl() {
    if (process.env.GOOGLE_CALLBACK_URL) {
      let url = process.env.GOOGLE_CALLBACK_URL.trim().replace(/^["']|["']$/g, '');
      if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
      return url;
    }
    return `${getBackendUrl()}/api/auth/google/callback`;
  }

  /**
   * Generates authorization redirect URL for Google OAuth2.
   */
  getAuthUrl({ state }) {
    if (!state) {
      throw new AppError('Google OAuth state is required.', 500);
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Helper for Passport compatibility
   */
  getAuthenticateOptions({ state }) {
    return {
      scope: ['profile', 'email'],
      session: false,
      state,
    };
  }

  /**
   * Exchanges authorization code for Google user profile without Passport SDK.
   */
  async exchangeCodeForUser({ code }) {
    if (!code) {
      throw new AppError('Authorization code is required for Google OAuth.', 400);
    }

    try {
      const tokenResponse = await axios.post(
        'https://oauth2.googleapis.com/token',
        new URLSearchParams({
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.callbackUrl,
          grant_type: 'authorization_code',
        }).toString(),
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        }
      );

      const { access_token } = tokenResponse.data;

      const profileResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: { Authorization: `Bearer ${access_token}` },
        }
      );

      const profile = profileResponse.data;

      return {
        provider: 'google',
        providerUserId: profile.id,
        email: profile.email ? profile.email.toLowerCase() : null,
        name: profile.name || profile.given_name || 'Google User',
        avatarUrl: profile.picture || null,
        id: profile.id,
        emails: [{ value: profile.email }],
        displayName: profile.name || profile.given_name,
      };
    } catch (err) {
      console.error('[GoogleAuthProvider] Token exchange failed:', err.response?.data || err.message);
      throw new AppError('Failed to authenticate with Google.', 401);
    }
  }

  /**
   * Universal callback handler
   */
  async handleCallback({ req, profile, role, code }) {
    const oauthService = require('../services/oauth.service');

    let userProfile = profile || req?.user;

    if (!userProfile && (code || req?.query?.code)) {
      userProfile = await this.exchangeCodeForUser({
        code: code || req.query.code,
      });
    }

    if (!userProfile) {
      throw new AppError('Google did not return a user profile.', 401);
    }

    return oauthService.processOAuthUser(
      this.name,
      userProfile,
      role || 'USER'
    );
  }
}

module.exports = new GoogleAuthProvider();
module.exports.GoogleAuthProvider = GoogleAuthProvider;