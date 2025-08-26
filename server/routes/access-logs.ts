import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const router = Router();

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

// Get all access logs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const accessLogs = await prisma.accessLog.findMany({
      include: {
        accessCode: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: Number(limit)
    });

    const total = await prisma.accessLog.count();

    res.json({
      accessLogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get access logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get access logs for a specific access code
router.get('/access-code/:accessCodeId', authenticateToken, async (req, res) => {
  try {
    const { accessCodeId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const accessLogs = await prisma.accessLog.findMany({
      where: {
        accessCodeId
      },
      include: {
        accessCode: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: Number(limit)
    });

    const total = await prisma.accessLog.count({
      where: {
        accessCodeId
      }
    });

    res.json({
      accessLogs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get access logs by code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new access log entry
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { accessCodeId, method } = req.body;

    if (!accessCodeId || !method) {
      return res.status(400).json({ error: 'Access code ID and method are required' });
    }

    // Verify access code exists
    const accessCode = await prisma.accessCode.findUnique({
      where: { id: accessCodeId }
    });

    if (!accessCode) {
      return res.status(404).json({ error: 'Access code not found' });
    }

    const accessLog = await prisma.accessLog.create({
      data: {
        accessCodeId,
        method
      },
      include: {
        accessCode: true
      }
    });

    res.status(201).json(accessLog);
  } catch (error) {
    console.error('Create access log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get access log statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalLogs = await prisma.accessLog.count();
    const todayLogs = await prisma.accessLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    const methods = await prisma.accessLog.groupBy({
      by: ['method'],
      _count: {
        method: true
      }
    });

    res.json({
      total: totalLogs,
      today: todayLogs,
      methods
    });
  } catch (error) {
    console.error('Get access log stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router };
