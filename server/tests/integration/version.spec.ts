import request from 'supertest';
import app from '../../src/app.js';
import releaseRepository from '../../src/modules/app/releaseRepository.js';
import appRepository from '../../src/modules/app/appRepository.js';

jest.mock('../../src/modules/app/releaseRepository');
jest.mock('../../src/modules/app/appRepository');

describe('Integration - Version Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/client/verify-version', () => {
    it('should return 401 for invalid application credentials', async () => {
      (appRepository.read as jest.Mock).mockResolvedValue({ id: 1, secret_key: 'correct_secret' });

      const response = await request(app)
        .post('/api/v1/client/verify-version')
        .send({
          app_id: 1,
          app_secret: 'wrong_secret',
          channel: 'stable'
        });

      expect(response.status).toBe(401);
      expect(response.body.message).toMatch(/Invalid application credentials/);
    });

    it('should return 403 when application is paused (Kill-Switch)', async () => {
      (appRepository.read as jest.Mock).mockResolvedValue({ 
        id: 1, 
        secret_key: 'secret',
        is_paused: 1 
      });

      const response = await request(app)
        .post('/api/v1/client/verify-version')
        .send({
          app_id: 1,
          app_secret: 'secret',
          channel: 'stable'
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Kill-Switch Active/);
    });

    it('should return 404 when no active release exists', async () => {
      (appRepository.read as jest.Mock).mockResolvedValue({ 
        id: 1, 
        secret_key: 'secret',
        is_paused: 0 
      });
      (releaseRepository.getLatest as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/client/verify-version')
        .send({
          app_id: 1,
          app_secret: 'secret',
          channel: 'beta'
        });

      expect(response.status).toBe(404);
      expect(response.body.message).toMatch(/No active release found/);
    });

    it('should return latest release info and update availability', async () => {
      (appRepository.read as jest.Mock).mockResolvedValue({ 
        id: 1, 
        secret_key: 'secret',
        is_paused: 0,
        broadcast_message: 'Update now!'
      });
      (releaseRepository.getLatest as jest.Mock).mockResolvedValue({
        version: '2.0.0',
        channel: 'stable',
        download_url: 'https://cdn.example.com/v2.zip',
        checksum: 'sha256:123',
        created_at: '2024-01-01T00:00:00Z'
      });

      const response = await request(app)
        .post('/api/v1/client/verify-version')
        .send({
          app_id: 1,
          app_secret: 'secret',
          channel: 'stable',
          current_version: '1.0.0'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        version: '2.0.0',
        channel: 'stable',
        url: 'https://cdn.example.com/v2.zip',
        checksum: 'sha256:123',
        published_at: '2024-01-01T00:00:00Z',
        update_available: true,
        broadcast: 'Update now!'
      });
    });
  });
});
