import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const healthRouter = Router();

/** ใช้สำหรับ Render Health Check */
healthRouter.get('/', (_req, res) => {
  res.json({ status: 'ok', service: 'smk-smart-exam', time: new Date().toISOString() });
});

/** ตรวจสอบการเชื่อมต่อฐานข้อมูล */
healthRouter.get('/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected' });
  } catch {
    res.status(503).json({ status: 'error', database: 'unreachable' });
  }
});
