import { Router } from 'express';
import apiRouter from './api.js';
import healthRouter from './health.js';

const router = Router();

router.use('/health', healthRouter);
router.use('/api', apiRouter);

export default router;
