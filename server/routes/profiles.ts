import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
export const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware to verify JWT token
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

router.get('/', authenticateToken, async (req, res) => {
  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: req.userId },
      include: { user: true }
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json({
      profile: {
        id: profile.id,
        email: profile.email,
        userId: profile.userId,
        createdAt: profile.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;

    const profile = await prisma.profile.update({
      where: { userId: req.userId },
      data: { email },
      include: { user: true }
    });

    res.json({
      profile: {
        id: profile.id,
        email: profile.email,
        userId: profile.userId,
        createdAt: profile.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
