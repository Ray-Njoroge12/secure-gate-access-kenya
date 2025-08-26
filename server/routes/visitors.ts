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

// Get all visitors
router.get('/', authenticateToken, async (req, res) => {
  try {
    const visitors = await prisma.visitor.findMany();
    res.json(visitors);
  } catch (error) {
    console.error('Get visitors error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new visitor
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const visitor = await prisma.visitor.create({
      data: {
        email,
      },
    });

    res.status(201).json(visitor);
  } catch (error) {
    console.error('Create visitor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a specific visitor by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const visitor = await prisma.visitor.findUnique({
      where: { id },
    });

    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    res.json(visitor);
  } catch (error) {
    console.error('Get visitor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a specific visitor by ID
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;

    const visitor = await prisma.visitor.update({
      where: { id },
      data: { email },
    });

    res.json(visitor);
  } catch (error) {
    console.error('Update visitor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a specific visitor by ID
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.visitor.delete({
      where: { id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Delete visitor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export { router };
