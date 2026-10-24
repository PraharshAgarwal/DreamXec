const { isFuzzyNameMatch, calculateTokenSimilarity, normalizeName } = require('../src/utils/fuzzyMatch');
const platformService = require('../src/modules/platform/platform.service');
const redis = require('../src/config/redis');

describe('Fuzzy Name Matching & Academic Verification (Milestone M1 - X2)', () => {
  it('should strip academic prefixes and match identical core names', () => {
    expect(normalizeName('Dr. Ramesh Kumar')).toBe('ramesh kumar');
    expect(normalizeName('Prof. Dr. Ananya Sen')).toBe('ananya sen');
  });

  it('should match researcher names with token variations', () => {
    const result = isFuzzyNameMatch('Dr. Rajesh Sharma', 'Rajesh Sharma');
    expect(result.matched).toBe(true);
    expect(result.similarityScore).toBe(1.0);
  });

  it('should accept partial name match when middle name is omitted', () => {
    const result = isFuzzyNameMatch('Jay Kumar Gupta', 'Jay Gupta');
    expect(result.matched).toBe(true);
    expect(result.similarityScore).toBeGreaterThanOrEqual(0.5);
  });

  it('should reject completely different names', () => {
    const result = isFuzzyNameMatch('Amit Shah', 'Pooja Verma');
    expect(result.matched).toBe(false);
    expect(result.similarityScore).toBe(0);
  });
});

describe('OTP Phone Number Normalization (Milestone M1 - B8)', () => {
  it('should normalize phone variations to standard E.164 format', async () => {
    const setSpy = jest.spyOn(redis, 'set').mockResolvedValue('OK');
    const getSpy = jest.spyOn(redis, 'get').mockResolvedValue('123456');
    const delSpy = jest.spyOn(redis, 'del').mockResolvedValue(1);

    // Send to 10-digit number
    await platformService.sendOtp({ recipient: '9876543210', type: 'phone' });
    expect(setSpy).toHaveBeenCalledWith(
      'otp:phone:+919876543210',
      expect.any(String),
      expect.any(Object)
    );

    // Send to formatted number with spaces and dashes
    await platformService.sendOtp({ recipient: '+91 98765-43210', type: 'phone' });
    expect(setSpy).toHaveBeenCalledWith(
      'otp:phone:+919876543210',
      expect.any(String),
      expect.any(Object)
    );

    // Send with leading zero
    await platformService.sendOtp({ recipient: '09876543210', type: 'phone' });
    expect(setSpy).toHaveBeenCalledWith(
      'otp:phone:+919876543210',
      expect.any(String),
      expect.any(Object)
    );

    // Verify OTP with alternate formatting
    const verifyRes = await platformService.verifyOtp({
      recipient: '098765 43210',
      otp: '123456',
      type: 'phone',
    });
    expect(verifyRes.message).toContain('verified successfully');
    expect(getSpy).toHaveBeenCalledWith('otp:phone:+919876543210');
  });
});
