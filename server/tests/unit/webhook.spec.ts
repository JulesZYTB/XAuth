import webhookService from '../../src/services/webhookService.js';
import webhookRepository from '../../src/modules/app/webhookRepository.js';

jest.mock('../../src/modules/app/webhookRepository');

describe('Webhook Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(() => Promise.resolve({ ok: true })) as jest.Mock;
  });

  it('should not dispatch if no webhooks match', async () => {
    (webhookRepository.readByAppId as jest.Mock).mockResolvedValue([]);

    await webhookService.dispatch(1, 'BAN', { id: 10 });

    expect(webhookRepository.readByAppId).toHaveBeenCalledWith(1);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should dispatch to matching webhook with HMAC signature', async () => {
    (webhookRepository.readByAppId as jest.Mock).mockResolvedValue([
      { url: 'https://test.com/hook', secret: 'mysecret', is_enabled: true, event_types: 'all' }
    ]);

    await webhookService.dispatch(1, 'REDEEM', { license: 'ABC' });

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchArgs = (global.fetch as jest.Mock).mock.calls[0];
    expect(fetchArgs[0]).toBe('https://test.com/hook');
    
    const options = fetchArgs[1];
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
    expect(options.headers['X-XAuth-Signature']).toBeDefined(); // HMAC tag
  });

  it('should skip disabled webhooks', async () => {
    (webhookRepository.readByAppId as jest.Mock).mockResolvedValue([
      { url: 'https://test.com/hook', secret: null, is_enabled: false, event_types: 'all' }
    ]);

    await webhookService.dispatch(1, 'REDEEM', { license: 'ABC' });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
