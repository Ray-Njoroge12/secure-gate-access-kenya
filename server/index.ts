import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { json } from 'express';
import { router as accessCodeRouter } from './routes/access-codes';
import { router as invitationRouter } from './routes/invitations';
import { router as twofaRouter } from './routes/twofa';
import { router as authRouter } from './routes/auth';
import { router as accessLogRouter } from './routes/access-logs';
import { router as visitorsRouter } from './routes/visitors';
import { router as incidentsRouter } from './routes/incidents';
import { router as analyticsRouter } from './routes/analytics';

const app = express();
app.use(cors());
app.use(json());

app.get('/api/health', (_req, res) => res.json({ ok: true, message: 'Server is running' }));

// Test endpoint that doesn't require database access
app.get('/api/test', (_req, res) => {
  res.json({ 
    message: 'API server is working correctly',
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/health - GET - Health check',
      '/api/auth/login - POST - User authentication',
      '/api/auth/signup - POST - User registration',
      '/api/access-codes/generate - POST - Generate access code',
      '/api/access-codes/verify - POST - Verify access code',
      '/api/visitors - GET - Get visitors (requires auth)'
    ]
  });
});
app.use('/api/access-codes', accessCodeRouter);
app.use('/api/invitations', invitationRouter);
app.use('/api/2fa', twofaRouter);
app.use('/api/auth', authRouter);
app.use('/api/access-logs', accessLogRouter);
app.use('/api/visitors', visitorsRouter);

const port = process.env.PORT || 4001;
if (process.env.RUN_SERVER !== 'false') {
  app.listen(port, () => console.log(`[api] listening on :${port}`));
}

export default app;
