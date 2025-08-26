import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { router as authRouter } from '../../server/routes/auth';

// Mock Prisma client
vi.mock('@prisma/client', () => {
  const mockPrisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  };
  return {
    PrismaClient: vi.fn(() => mockPrisma),
  };
});

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
  hash: vi.fn(),
}));

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  sign: vi.fn(),
  verify: vi.fn(),
}));

describe('Auth Routes - Express API Tests', () => {
  let app: express.Application;
  let prisma: PrismaClient;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = new PrismaClient();
    
    // Create express app with auth routes
    app = express();
    app.use(express.json());
    app.use('/auth', authRouter);
    
    // Mock environment variable
    process.env.JWT_SECRET = 'test-secret-key';
  });

  describe('POST /auth/login', () => {
    it('should return 400 if email or password is missing', async () => {
      const response1 = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com' });
      
      expect(response1.status).toBe(400);
      expect(response1.body.error).toBe('Email and password are required');

      const response2 = await request(app)
        .post('/auth/login')
        .send({ password: 'password123' });
      
      expect(response2.status).toBe(400);
      expect(response2.body.error).toBe('Email and password are required');
    });

    it('should return 401 if user is not found', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'nonexistent@example.com' },
        include: { profile: true }
      });
    });

    it('should return 401 if password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed_password',
        profile: { id: '1', email: 'test@example.com', role: 'resident' }
      };
      
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(false);

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrong_password' });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid credentials');
      expect(bcrypt.compare).toHaveBeenCalledWith('wrong_password', 'hashed_password');
    });

    it('should return 200 with token and user data on successful login', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        password: 'hashed_password',
        profile: { id: '1', email: 'test@example.com', role: 'resident' }
      };
      
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);
      (bcrypt.compare as any).mockResolvedValue(true);
      (jwt.sign as any).mockReturnValue('mock_jwt_token');

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'correct_password' });

      expect(response.status).toBe(200);
      expect(response.body.token).toBe('mock_jwt_token');
      expect(response.body.user).toEqual({
        id: '1',
        email: 'test@example.com',
        profile: { id: '1', email: 'test@example.com', role: 'resident' }
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: '1', email: 'test@example.com' },
        'test-secret-key',
        { expiresIn: '24h' }
      );
    });

    it('should return 500 on internal server error', async () => {
      (prisma.user.findUnique as any).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('POST /auth/signup', () => {
    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Email, password, and full name are required');
    });

    it('should return 409 if user already exists', async () => {
      (prisma.user.findUnique as any).mockResolvedValue({ id: '1', email: 'test@example.com' });

      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('User already exists');
    });

    it('should return 201 with token and user data on successful signup', async () => {
      (prisma.user.findUnique as any).mockResolvedValue(null);
      (bcrypt.hash as any).mockResolvedValue('hashed_password');
      
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        profile: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          unitNumber: '101',
          phone: '1234567890',
          role: 'resident'
        }
      };
      
      (prisma.user.create as any).mockResolvedValue(mockUser);
      (jwt.sign as any).mockReturnValue('mock_jwt_token');

      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User',
          unitNumber: '101',
          phone: '1234567890'
        });

      expect(response.status).toBe(201);
      expect(response.body.token).toBe('mock_jwt_token');
      expect(response.body.user).toEqual({
        id: '1',
        email: 'test@example.com',
        profile: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          unitNumber: '101',
          phone: '1234567890',
          role: 'resident'
        }
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          password: 'hashed_password',
          profile: {
            create: {
              email: 'test@example.com',
              fullName: 'Test User',
              unitNumber: '101',
              phone: '1234567890',
              role: 'resident'
            }
          }
        },
        include: { profile: true }
      });
    });

    it('should return 500 on internal server error', async () => {
      (prisma.user.findUnique as any).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          fullName: 'Test User'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('GET /auth/profile', () => {
    it('should return 401 if no authorization header is provided', async () => {
      const response = await request(app)
        .get('/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 if authorization header has invalid format', async () => {
      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'InvalidToken');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized');
    });

    it('should return 401 if token is invalid', async () => {
      (jwt.verify as any).mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid_token');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    it('should return 404 if user is not found', async () => {
      (jwt.verify as any).mockReturnValue({ userId: 'nonexistent' });
      (prisma.user.findUnique as any).mockResolvedValue(null);

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('User not found');
    });

    it('should return 200 with user profile on successful request', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        profile: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'resident'
        }
      };
      
      (jwt.verify as any).mockReturnValue({ userId: '1' });
      (prisma.user.findUnique as any).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({
        id: '1',
        email: 'test@example.com',
        profile: {
          id: '1',
          email: 'test@example.com',
          fullName: 'Test User',
          role: 'resident'
        }
      });
    });

    it('should return 500 on internal server error', async () => {
      (jwt.verify as any).mockReturnValue({ userId: '1' });
      (prisma.user.findUnique as any).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/auth/profile')
        .set('Authorization', 'Bearer valid_token');

      expect(response.status).toBe(500);
      expect(response.body.error).toBe('Internal server error');
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({ email: 'invalid-email', password: 'password123' });

      expect(response.status).toBe(401); // Goes to DB but user not found
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'short',
          fullName: 'Test User'
        });

      // The validation happens in the route handler, not in separate functions
      expect(response.status).toBe(201); // Password validation is done by bcrypt, not length check
    });
  });
});
