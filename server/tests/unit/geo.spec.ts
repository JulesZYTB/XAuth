import geoService from '../../src/services/geoService';

describe('Geo Service - Unit Tests', () => {
  it('should return Local Development for localhost IPs', async () => {
    const geo1 = await geoService.lookup('127.0.0.1');
    expect(geo1.country).toBe('Local Development');
    expect(geo1.countryCode).toBe('FR');

    const geo2 = await geoService.lookup('::1');
    expect(geo2.country).toBe('Local Development');
  });

  it('should handle API fetch for a public IP', async () => {
    // Mock the global fetch
    global.fetch = jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ status: 'success', country: 'United States', countryCode: 'US' }),
      })
    ) as jest.Mock;

    const geo = await geoService.lookup('8.8.8.8');
    expect(geo.country).toBe('United States');
    expect(geo.countryCode).toBe('US');
    expect(global.fetch).toHaveBeenCalledWith('http://ip-api.com/json/8.8.8.8?fields=status,country,countryCode');
  });

  it('should fallback gracefully if fetch fails', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('Network error'))) as jest.Mock;
    
    // Attempt lookup
    const geo = await geoService.lookup('1.1.1.1');
    
    expect(geo.country).toBe('Unknown');
    expect(geo.countryCode).toBe('??');
  });
});
