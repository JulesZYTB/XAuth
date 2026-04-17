import request from 'supertest';
import app from '../../src/app.js';
import sessionRepository from '../../src/modules/session/sessionRepository.js';
import licenseRepository from '../../src/modules/license/licenseRepository.js';
import appRepository from '../../src/modules/app/appRepository.js';
import geoService from '../../src/services/geoService.js';

jest.mock('../../src/modules/session/sessionRepository');
jest.mock('../../src/modules/license/licenseRepository');
jest.mock('../../src/modules/app/appRepository');
jest.mock('../../src/services/geoService');
jest.mock('../../src/modules/app/validationLogRepository');

describe('Integration - Client Handshake and Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/client/initialize', () => {
    it('should initialize a handshake session successfully', async () => {
      (appRepository.read as jest.Mock).mockResolvedValue({ id: 1, name: 'Test App' });
      (sessionRepository.create as jest.Mock).mockResolvedValue(1);
      (sessionRepository.read as jest.Mock).mockResolvedValue({ id: 1, nonce: 'rnd_nonce', expires_at: new Date(Date.now() + 10000) });

      const response = await request(app)
        .post('/api/v1/client/initialize')
        .send({ app_id: 1 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('session_id');
      expect(response.body).toHaveProperty('nonce');
    });
  });

  describe('POST /api/v1/client/validate', () => {
    it('should reject invalid session', async () => {
      (sessionRepository.read as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/client/validate')
        .send({
          license_key: 'test',
          hwid: 'hwid',
          app_secret: 'secret',
          session_id: 99
        });

      expect(response.status).toBe(403);
      expect(response.body.message).toMatch(/Invalid or expired session/);
    });

    it('should accept valid license and return encrypted response', async () => {
      // Mock session
      (sessionRepository.read as jest.Mock).mockResolvedValue({
        id: 1,
        nonce: 'aabbccdd',
        expires_at: new Date(Date.now() + 100000)
      });

      // Mock license
      (licenseRepository.readByKey as jest.Mock).mockResolvedValue({
        id: 1,
        license_key: 'TEST-1234',
        app_id: 10,
        status: 'active',
        hwid: 'my-pc',
        expiry_date: new Date(Date.now() + 100000),
        variables: '{"tier": "pro"}'
      });

      // Mock Geo
      (geoService.lookup as jest.Mock).mockResolvedValue({ country: 'FR', countryCode: 'FR' });

      // Mock App
      (appRepository.read as jest.Mock).mockResolvedValue({
        id: 10,
        secret_key: 'secret',
        is_paused: 0,
        broadcast_message: 'Hello'
      });

      const response = await request(app)
        .post('/api/v1/client/validate')
        .send({
          license_key: 'TEST-1234',
          hwid: 'my-pc',
          app_secret: 'secret',
          session_id: 1
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(typeof response.body.data).toBe('string');
      // The data should be encrypted IV:Tag:Cipher
      const parts = response.body.data.split(':');
      expect(parts.length).toBe(3);
    });
  });
});
