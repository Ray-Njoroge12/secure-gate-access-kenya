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

// Get overall system analytics
router.get('/overview', authenticateToken, async (req, res) => {
  try {
    const [
      totalUsers,
      totalVisitors,
      totalAccessLogs,
      totalIncidents,
      todayAccessLogs,
      todayIncidents,
      activeAccessCodes
    ] = await Promise.all([
      prisma.user.count(),
      prisma.visitor.count(),
      prisma.accessLog.count(),
      prisma.securityIncident.count(),
      prisma.accessLog.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.securityIncident.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      prisma.accessCode.count({
        where: {
          expiresAt: {
            gt: new Date()
          },
          used: false
        }
      })
    ]);

    res.json({
      users: totalUsers,
      visitors: totalVisitors,
      accessLogs: totalAccessLogs,
      incidents: totalIncidents,
      todayAccessLogs,
      todayIncidents,
      activeAccessCodes
    });
  } catch (error) {
    console.error('Get analytics overview error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get access logs analytics by time period
router.get('/access-logs', authenticateToken, async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    let startDate = new Date();

    switch (period) {
      case '24h':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setDate(startDate.getDate() - 7);
    }

    const accessLogs = await prisma.accessLog.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Format data for charts
    const chartData = accessLogs.map(log => ({
      date: log.createdAt.toISOString().split('T')[0],
      time: log.createdAt.toISOString().split('T')[1].split('.')[0],
      count: log._count.id
    }));

    res.json({
      period,
      data: chartData,
      total: accessLogs.reduce((sum, log) => sum + log._count.id, 0)
    });
  } catch (error) {
    console.error('Get access logs analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get incidents analytics by type
router.get('/incidents', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const incidentsByType = await prisma.securityIncident.groupBy({
      by: ['type'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      }
    });

    const incidentsByDate = await prisma.securityIncident.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json({
      period,
      byType: incidentsByType,
      byDate: incidentsByDate.map(incident => ({
        date: incident.createdAt.toISOString().split('T')[0],
        count: incident._count.id
      })),
      total: incidentsByType.reduce((sum, type) => sum + type._count.id, 0)
    });
  } catch (error) {
    console.error('Get incidents analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user registration analytics
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    let startDate = new Date();

    switch (period) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 90);
        break;
      default:
        startDate.setDate(startDate.getDate() - 30);
    }

    const usersByDate = await prisma.user.groupBy({
      by: ['createdAt'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    const usersByRole = await prisma.profile.groupBy({
      by: ['role'],
      _count: {
        id: true
      }
    });

    res.json({
      period,
      byDate: usersByDate.map(user => ({
        date: user.createdAt.toISOString().split('T')[0],
        count: user._count.id
      })),
      byRole: usersByRole,
      total: usersByDate.reduce((sum, user) => sum + user._count.id, 0)
    });
  } catch (error) {
    console.error('Get users analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router };
