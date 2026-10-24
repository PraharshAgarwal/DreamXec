const { authRegistry, orcidProvider } = require('../src/modules/auth/registry/auth.registry');

describe('ORCID Researcher Verification Provider (Milestone M1 - X2)', () => {
  it('should be registered in authRegistry under "orcid"', () => {
    const provider = authRegistry.getProvider('orcid');
    expect(provider).toBeDefined();
    expect(provider.name).toBe('orcid');
    expect(provider.providerIdField).toBe('orcidId');
  });

  it('should generate valid OAuth authorization URL with required params', () => {
    const state = 'test_state_entropy_123';
    const authUrl = orcidProvider.getAuthUrl({ state });

    expect(authUrl).toContain('/oauth/authorize?');
    expect(authUrl).toContain('client_id=');
    expect(authUrl).toContain('response_type=code');
    expect(authUrl).toContain('scope=%2Fauthenticate');
    expect(authUrl).toContain('state=test_state_entropy_123');
    expect(authUrl).toContain(encodeURIComponent(orcidProvider.callbackUrl));
  });

  it('should throw error if state is missing from getAuthUrl', () => {
    expect(() => orcidProvider.getAuthUrl({})).toThrow(/ORCID OAuth state is required/);
  });
});
