import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
export const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extend the Request interface to include userId
interface AuthenticatedRequest extends Request {
  userId?: string;
}

// Middleware to verify JWT token
const authenticateToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
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
        role: profile.role,
        createdAt: profile.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { email, role } = req.body;

    // Check if user is admin to update role
    const currentUserProfile = await prisma.profile.findUnique({
      where: { userId: req.userId }
    });

    if (role && role !== currentUserProfile?.role) {
      // Only admins can change roles
      if (currentUserProfile?.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can change roles' });
      }
    }

    const profile = await prisma.profile.update({
      where: { userId: req.userId },
      data: { 
        email,
        ...(role && currentUserProfile?.role === 'admin' ? { role } : {})
      },
      include: { user: true }
    });

    res.json({
      profile: {
        id: profile.id,
        email: profile.email,
        userId: profile.userId,
        role: profile.role,
        createdAt: profile.createdAt
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
