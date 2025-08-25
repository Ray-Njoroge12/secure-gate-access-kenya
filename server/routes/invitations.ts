import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
export const router = Router();

router.post('/', async (req, res) => {
  const { visitor_email } = req.body || {};
  if (!visitor_email) return res.status(400).json({ error: 'visitor_email required' });
  try {
    const invitation = await prisma.invitation.create({ data: { visitorEmail: visitor_email } });
    res.json({ invitation });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/', async (_req, res) => {
  const invitations = await prisma.invitation.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ invitations });
});
