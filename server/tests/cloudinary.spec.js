const { generateUploadSignature } = require('../src/services/cloudinary.service');

describe('Cloudinary Direct Upload Service', () => {
  it('should generate a valid HMAC-SHA256 signature payload for direct uploads', () => {
    const result = generateUploadSignature({
      folder: 'campaigns/test',
      tags: 'test_tag',
      resourceType: 'image',
    });

    expect(result).toHaveProperty('signature');
    expect(typeof result.signature).toBe('string');
    expect(result.signature.length).toBeGreaterThan(0);

    expect(result).toHaveProperty('timestamp');
    expect(typeof result.timestamp).toBe('number');

    expect(result).toHaveProperty('apiKey');
    expect(result).toHaveProperty('cloudName');
    expect(result.folder).toBe('campaigns/test');
    expect(result.tags).toBe('test_tag');
    expect(result.resourceType).toBe('image');
    expect(result.uploadUrl).toContain('https://api.cloudinary.com/v1_1/');
    expect(result.uploadUrl).toContain('/image/upload');
  });
});
