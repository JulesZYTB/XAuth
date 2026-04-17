import securityService from '../../src/services/security.js';

describe('Security Service - Unit Tests', () => {
  const secretKey = 'super_secret_app_key_123';
  const dummyData = JSON.stringify({ status: 'success', info: 'test_data' });

  it('should encrypt data and return IV:Tag:Cipher format', () => {
    const encrypted = securityService.encrypt(dummyData, secretKey);
    expect(encrypted).toBeDefined();
    
    const parts = encrypted.split(':');
    expect(parts.length).toBe(3);
    
    // Check base64 validity
    expect(Buffer.from(parts[0], 'base64').toString('base64')).toBe(parts[0]);
    expect(Buffer.from(parts[1], 'base64').toString('base64')).toBe(parts[1]);
    expect(Buffer.from(parts[2], 'base64').toString('base64')).toBe(parts[2]);
  });

  it('encryption should be non-deterministic (different IVs)', () => {
    const encrypted1 = securityService.encrypt(dummyData, secretKey);
    const encrypted2 = securityService.encrypt(dummyData, secretKey);
    expect(encrypted1).not.toBe(encrypted2);
  });
});
