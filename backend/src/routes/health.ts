import { Router, Request, Response } from 'express';
import prisma from '../config/prisma.js';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  let dbStatus: 'connected' | 'disconnected' = 'disconnected';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch {
    // DB unreachable — fall through with 'disconnected'
  }

  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'finance-dashboard-backend',
    db: dbStatus,
  });
});

export default router;
