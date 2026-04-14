import request from 'supertest';
import app from '../../src/app';
import userRepository from '../../src/modules/admin/userRepository';

jest.mock('../../src/modules/admin/userRepository');

describe('Integration - Auth (Login/Register)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a user with correct parameters', async () => {
      (userRepository.readByEmail as jest.Mock).mockResolvedValue(null);
      (userRepository.create as jest.Mock).mockResolvedValue(2);
      
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123', username: 'testuser' });

      expect(res.status).toBe(201);
      expect(userRepository.create).toHaveBeenCalled();
    });

    it('should reject existing email', async () => {
      (userRepository.readByEmail as jest.Mock).mockResolvedValue({ id: 1 });
      
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'password123', username: 'testuser' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/User already exists with this email/);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login valid user and return token', async () => {
      // Mock valid user with bcrypt hashed 'password123'
      const bcrypt = require('bcrypt');
      const hashedPw = await bcrypt.hash('password123', 10); 
      (userRepository.readByEmail as jest.Mock).mockResolvedValue({
        id: 1, email: 'test@example.com', password: hashedPw, role: 'admin'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject invalid credentials', async () => {
      (userRepository.readByEmail as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Invalid credentials/);
    });
  });
});
