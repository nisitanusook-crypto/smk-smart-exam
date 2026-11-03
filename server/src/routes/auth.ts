import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { hashPassword, PASSWORD_MIN_LENGTH, verifyPassword } from '../lib/password.js';
import { publicUserSelect } from '../lib/userView.js';
import { writeAudit } from '../lib/audit.js';
import { authenticate, signToken } from '../middleware/auth.js';
import { badRequest, unauthorized } from '../utils/httpError.js';

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'พยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอ 15 นาทีแล้วลองใหม่' },
});

const loginSchema = z.object({
  username: z.string().trim().min(1, 'กรุณากรอกชื่อผู้ใช้'),
  password: z.string().min(1, 'กรุณากรอกรหัสผ่าน'),
});

authRouter.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) {
    throw unauthorized('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }
  if (!user.isActive) {
    throw unauthorized('บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await writeAudit({ userId: user.id, action: 'LOGIN', ipAddress: req.ip });

  const profile = await prisma.user.findUniqueOrThrow({
    where: { id: user.id },
    select: publicUserSelect,
  });

  res.json({ token: signToken(user), user: profile });
});

authRouter.get('/me', authenticate, async (req, res) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: req.user!.id },
    select: publicUserSelect,
  });
  res.json({ user });
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `รหัสผ่านใหม่ต้องมีอย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร`),
});

authRouter.post('/change-password', authenticate, async (req, res) => {
  const { currentPassword, newPassword } = changePasswordSchema.parse(req.body);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });

  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw badRequest('รหัสผ่านปัจจุบันไม่ถูกต้อง');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  await writeAudit({ userId: user.id, action: 'PASSWORD_CHANGE', ipAddress: req.ip });

  res.json({ message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว' });
});
