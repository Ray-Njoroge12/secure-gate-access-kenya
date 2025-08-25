import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
export const router = Router();

router.post('/setup', async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const secret = crypto.randomBytes(10).toString('hex');
  const setting = await prisma.twoFASetting.upsert({
    where: { userId },
    update: { secret },
    create: { userId, secret }
  });
  res.json({ secret: setting.secret });
});

router.post('/enable', async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const setting = await prisma.twoFASetting.update({ where: { userId }, data: { enabled: true } });
  res.json({ enabled: setting.enabled });
});

router.post('/disable', async (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const setting = await prisma.twoFASetting.update({ where: { userId }, data: { enabled: false } });
  res.json({ enabled: setting.enabled });
});
