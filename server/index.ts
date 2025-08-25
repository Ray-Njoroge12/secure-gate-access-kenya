import express from 'express';
import cors from 'cors';
import { json } from 'express';
import { router as accessCodeRouter } from './routes/access-codes';
import { router as invitationRouter } from './routes/invitations';
import { router as twofaRouter } from './routes/twofa';
import { router as authRouter } from './routes/auth';
import { router as accessLogRouter } from './routes/access-logs';

const app = express();
app.use(cors());
app.use(json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/access-codes', accessCodeRouter);
app.use('/api/invitations', invitationRouter);
app.use('/api/2fa', twofaRouter);
app.use('/api/auth', authRouter);
app.use('/api/access-logs', accessLogRouter);

const port = process.env.PORT || 4000;
if (process.env.RUN_SERVER !== 'false') {
  app.listen(port, () => console.log(`[api] listening on :${port}`));
}

export default app;
