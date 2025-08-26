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

// Get all security incidents
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 50, type } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause = type ? { type: String(type) } : {};

    const incidents = await prisma.securityIncident.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: Number(limit)
    });

    const total = await prisma.securityIncident.count({
      where: whereClause
    });

    res.json({
      incidents,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get incidents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific incident by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const incident = await prisma.securityIncident.findUnique({
      where: { id }
    });

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    res.json(incident);
  } catch (error) {
    console.error('Get incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new security incident
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { type, details } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Incident type is required' });
    }

    const incident = await prisma.securityIncident.create({
      data: {
        type,
        details
      }
    });

    res.status(201).json(incident);
  } catch (error) {
    console.error('Create incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a security incident
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, details } = req.body;

    const incident = await prisma.securityIncident.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(details && { details })
      }
    });

    res.json(incident);
  } catch (error) {
    console.error('Update incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a security incident
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.securityIncident.delete({
      where: { id }
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete incident error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get incident statistics
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const totalIncidents = await prisma.securityIncident.count();
    const todayIncidents = await prisma.securityIncident.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    const types = await prisma.securityIncident.groupBy({
      by: ['type'],
      _count: {
        type: true
      }
    });

    res.json({
      total: totalIncidents,
      today: todayIncidents,
      types
    });
  } catch (error) {
    console.error('Get incident stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router };
