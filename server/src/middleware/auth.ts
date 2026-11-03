import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { forbidden, unauthorized } from '../utils/httpError.js';

export interface AuthUser {
  id: string;
  role: Role;
  username: string;
}

interface TokenPayload {
  sub: string;
  role: Role;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export function signToken(user: { id: string; role: Role }): string {
  const payload: TokenPayload = { sub: user.id, role: user.role };
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    issuer: 'smk-smart-exam',
  });
}

export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, { issuer: 'smk-smart-exam' });
  if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
    throw unauthorized('โทเคนไม่ถูกต้อง');
  }
  return decoded as unknown as TokenPayload;
}

/** ตรวจสอบ JWT และโหลดผู้ใช้จากฐานข้อมูล (บัญชีที่ถูกระงับจะใช้งานไม่ได้ทันที) */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw unauthorized();
  }

  let payload: TokenPayload;
  try {
    payload = verifyToken(header.slice(7));
  } catch {
    throw unauthorized('เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    select: { id: true, role: true, username: true, isActive: true },
  });
  if (!user || !user.isActive) {
    throw unauthorized('บัญชีผู้ใช้นี้ไม่สามารถใช้งานได้');
  }

  req.user = { id: user.id, role: user.role, username: user.username };
  next();
}

/** จำกัดสิทธิ์ตามบทบาท */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw unauthorized();
    if (!roles.includes(req.user.role)) throw forbidden();
    next();
  };
}
