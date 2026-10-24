const AppError = require('../utils/AppError');

class OrcidService {
  constructor() {
    this.clientId = process.env.ORCID_CLIENT_ID || 'APP-V0CYQ31Q96ZCLOUQ';
    this.clientSecret = process.env.ORCID_CLIENT_SECRET || '';
    this.cachedToken = null;
    this.tokenExpiresAt = 0;
  }

  /**
   * Cleans and validates an ORCID iD string format: 0000-0002-1825-0097
   */
  normalizeOrcid(orcidInput) {
    if (!orcidInput) return '';
    const clean = String(orcidInput)
      .replace(/^https?:\/\/orcid\.org\//i, '')
      .trim();
    return clean;
  }

  isValidFormat(cleanOrcid) {
    const orcidRegex = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
    return orcidRegex.test(cleanOrcid);
  }

  /**
   * Retrieves or refreshes a client_credentials public read access token from ORCID
   */
  async getPublicAccessToken() {
    if (this.cachedToken && Date.now() < this.tokenExpiresAt) {
      return this.cachedToken;
    }

    if (!this.clientId || !this.clientSecret) {
      return null;
    }

    try {
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'client_credentials',
        scope: '/read-public',
      });

      const res = await fetch('https://orcid.org/oauth/token', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.warn('[OrcidService] Failed to obtain machine access token:', res.status, errText);
        return null;
      }

      const data = await res.json();
      if (data.access_token) {
        this.cachedToken = data.access_token;
        // Expire 60 seconds before actual expires_in
        const expiresInMs = (data.expires_in || 3600) * 1000 - 60000;
        this.tokenExpiresAt = Date.now() + Math.max(expiresInMs, 60000);
        return this.cachedToken;
      }
    } catch (err) {
      console.warn('[OrcidService] Error fetching client token:', err.message);
    }

    return null;
  }

  /**
   * Verifies an ORCID iD against the official public registry in real time
   */
  async verifyOrcidRecord(orcidInput) {
    const cleanOrcid = this.normalizeOrcid(orcidInput);
    if (!cleanOrcid) {
      throw new AppError('ORCID iD is required', 400);
    }

    if (!this.isValidFormat(cleanOrcid)) {
      throw new AppError('Invalid ORCID iD format. Expected format: 0000-0002-1825-0097', 400);
    }

    const token = await this.getPublicAccessToken();

    const headers = {
      Accept: 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`https://pub.orcid.org/v3.0/${cleanOrcid}/person`, {
        method: 'GET',
        headers,
      });

      if (response.status === 404) {
        return {
          verified: false,
          orcidId: cleanOrcid,
          message: `ORCID iD ${cleanOrcid} not found in the official ORCID registry.`,
        };
      }

      if (!response.ok) {
        console.warn(`[OrcidService] Registry returned ${response.status} for ${cleanOrcid}`);
        throw new AppError('Official ORCID registry is temporarily unavailable', 502);
      }

      const data = await response.json();
      const nameData = data?.name || {};
      const givenNames = nameData['given-names']?.value || '';
      const familyName = nameData['family-name']?.value || '';
      const fullName = `${givenNames} ${familyName}`.trim() || 'Verified Researcher';

      const biography = data?.biography?.content || '';
      const keywords = (data?.keywords?.keyword || []).map((k) => k.content).filter(Boolean);

      return {
        verified: true,
        orcidId: cleanOrcid,
        orcidUrl: `https://orcid.org/${cleanOrcid}`,
        name: fullName,
        givenNames,
        familyName,
        biography: biography.slice(0, 400),
        keywords: keywords.slice(0, 8),
        creditName: nameData['credit-name']?.value || null,
        verifiedAt: new Date().toISOString(),
      };
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error('[OrcidService] Fetch error:', err);
      throw new AppError('Failed to reach official ORCID registry service.', 502);
    }
  }

  /**
   * Exchanges an authorization code for an authenticated ORCID iD and user token
   */
  async exchangeOAuthCode(code, redirectUri) {
    if (!code) throw new AppError('Authorization code is required', 400);
    if (!this.clientId || !this.clientSecret) {
      throw new AppError('ORCID credentials not configured on server', 500);
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    });

    const res = await fetch('https://orcid.org/oauth/token', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error('[OrcidService] Token exchange failed:', res.status, errBody);
      throw new AppError('Failed to exchange ORCID authorization code', 400);
    }

    const data = await res.json();
    return {
      orcidId: data.orcid,
      name: data.name || '',
      scope: data.scope,
      accessToken: data.access_token,
      orcidUrl: `https://orcid.org/${data.orcid}`,
    };
  }

  /**
   * Generates the OAuth 2.0 Authorization URL for 1-click ORCID connection
   */
  getOAuthUrl(redirectUri) {
    const uri = redirectUri || 'https://dreamxec-frontend.onrender.com/auth/callback';
    return `https://orcid.org/oauth/authorize?client_id=${encodeURIComponent(
      this.clientId
    )}&response_type=code&scope=/authenticate&redirect_uri=${encodeURIComponent(uri)}`;
  }
}

module.exports = new OrcidService();
module.exports.OrcidService = OrcidService;
