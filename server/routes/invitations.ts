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

// Validate invitation token
router.post('/validate', async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ error: 'Token is required' });
  }

  try {
    const invitation = await prisma.invitation.findUnique({
      where: { id: token }
    });

    if (!invitation) {
      return res.json({ valid: false, message: 'Invalid invitation token' });
    }

    // Check if invitation is expired (assuming invitations expire after 24 hours)
    const invitationAge = Date.now() - new Date(invitation.createdAt).getTime();
    const isExpired = invitationAge > 24 * 60 * 60 * 1000; // 24 hours

    if (isExpired) {
      return res.json({ valid: false, message: 'Invitation token has expired' });
    }

    res.json({ 
      valid: true, 
      invitation: {
        id: invitation.id,
        visitorEmail: invitation.visitorEmail,
        createdAt: invitation.createdAt
      }
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
