import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { HttpError } from '../utils/httpError.js';

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ message: `ไม่พบเส้นทาง ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ message: err.message, details: err.details });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'ข้อมูลไม่ถูกต้อง',
      details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({ message: 'ข้อมูลซ้ำกับที่มีอยู่แล้วในระบบ', details: err.meta });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({ message: 'ไม่พบข้อมูลที่ต้องการ' });
      return;
    }
  }

  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ message: 'รูปแบบ JSON ไม่ถูกต้อง' });
    return;
  }

  console.error('[error]', err);
  res.status(500).json({ message: 'เกิดข้อผิดพลาดภายในระบบ กรุณาลองใหม่อีกครั้ง' });
}
