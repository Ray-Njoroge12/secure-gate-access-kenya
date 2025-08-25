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

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { accessCodeId, method } = req.body;

    const accessLog = await prisma.accessLog.create({
      data: {
        accessCodeId,
        method,
      },
    });

    res.status(201).json(accessLog);
  } catch (error) {
    console.error('Create access log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    const accessLogs = await prisma.accessLog.findMany({
      include: {
        accessCode: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(accessLogs);
  } catch (error) {
    console.error('Get access logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const accessLog = await prisma.accessLog.findUnique({
      where: { id },
      include: {
        accessCode: true,
      },
    });

    if (!accessLog) {
      return res.status(404).json({ error: 'Access log not found' });
    }

    res.json(accessLog);
  } catch (error) {
    console.error('Get access log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/access-code/:accessCodeId', authenticateToken, async (req, res) => {
  try {
    const { accessCodeId } = req.params;

    const accessLogs = await prisma.accessLog.findMany({
      where: { accessCodeId },
      include: {
        accessCode: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(accessLogs);
  } catch (error) {
    console.error('Get access logs by access code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
