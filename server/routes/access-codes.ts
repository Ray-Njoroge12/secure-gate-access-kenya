import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();
export const router = Router();

router.post('/generate', async (req, res) => {
  const code = (req.body?.code || crypto.randomBytes(3).toString('hex')).toUpperCase();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
  try {
    const created = await prisma.accessCode.create({ data: { code, expiresAt } });
    res.json({ code: created.code, expires_at: created.expiresAt });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/verify', async (req, res) => {
  const { code, pin } = req.body || {};
  if (!code) return res.status(400).json({ ok: false, reason: 'MISSING_CODE' });
  const found = await prisma.accessCode.findUnique({ where: { code } });
  if (!found || found.used) return res.json({ ok: false, reason: 'NOT_FOUND' });
  if (found.expiresAt < new Date()) return res.json({ ok: false, reason: 'EXPIRED' });
  await prisma.accessCode.update({ where: { id: found.id }, data: { used: true } });
  await prisma.accessLog.create({ data: { accessCodeId: found.id, method: pin ? 'PIN' : 'QR' } });
  res.json({ ok: true, method: pin ? 'PIN' : 'QR', access_code_id: found.id });
});
