import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { hashPassword, PASSWORD_MIN_LENGTH } from '../lib/password.js';
import { publicUserSelect } from '../lib/userView.js';
import { writeAudit } from '../lib/audit.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { badRequest, forbidden } from '../utils/httpError.js';

export const usersRouter = Router();
usersRouter.use(authenticate);

const roleEnum = z.enum(['ADMIN', 'TEACHER', 'STUDENT']);
const gradeEnum = z.enum(['M3', 'M6']);

const listQuery = z.object({
  role: roleEnum.optional(),
  q: z.string().trim().optional(),
  gradeLevel: gradeEnum.optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

/** รายชื่อผู้ใช้ — ผู้ดูแลระบบเห็นทั้งหมด ครูเห็นเฉพาะนักเรียน */
usersRouter.get('/', requireRole('ADMIN', 'TEACHER'), async (req, res) => {
  const query = listQuery.parse(req.query);

  if (req.user!.role === 'TEACHER' && query.role && query.role !== 'STUDENT') {
    throw forbidden('ครูสามารถดูได้เฉพาะรายชื่อนักเรียน');
  }
  const role = req.user!.role === 'TEACHER' ? 'STUDENT' : query.role;

  const where: Prisma.UserWhereInput = {
    ...(role && { role }),
    ...(query.gradeLevel && { studentProfile: { gradeLevel: query.gradeLevel } }),
    ...(query.q && {
      OR: [
        { username: { contains: query.q, mode: 'insensitive' } },
        { firstName: { contains: query.q, mode: 'insensitive' } },
        { lastName: { contains: query.q, mode: 'insensitive' } },
        { studentProfile: { studentCode: { contains: query.q } } },
      ],
    }),
  };

  const [items, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: publicUserSelect,
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
    prisma.user.count({ where }),
  ]);

  res.json({ items, total, page: query.page, pageSize: query.pageSize });
});

const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9._-]{3,32}$/, 'ชื่อผู้ใช้ต้องเป็น a-z, 0-9, . _ - ความยาว 3-32 ตัวอักษร');

const createUserSchema = z
  .object({
    username: usernameSchema,
    password: z.string().min(PASSWORD_MIN_LENGTH, `รหัสผ่านต้องมีอย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร`),
    role: roleEnum,
    prefix: z.string().trim().max(30).optional(),
    firstName: z.string().trim().min(1, 'กรุณากรอกชื่อ'),
    lastName: z.string().trim().min(1, 'กรุณากรอกนามสกุล'),
    email: z.string().trim().email('อีเมลไม่ถูกต้อง').optional().or(z.literal('')),
    // ครู
    employeeCode: z.string().trim().optional(),
    department: z.string().trim().optional(),
    // นักเรียน
    studentCode: z.string().trim().optional(),
    gradeLevel: gradeEnum.optional(),
    classroomId: z.string().optional(),
  })
  .superRefine((v, ctx) => {
    if (v.role === 'STUDENT') {
      if (!v.studentCode) ctx.addIssue({ code: 'custom', path: ['studentCode'], message: 'กรุณากรอกเลขประจำตัวนักเรียน' });
      if (!v.gradeLevel) ctx.addIssue({ code: 'custom', path: ['gradeLevel'], message: 'กรุณาเลือกระดับชั้น (ม.3 หรือ ม.6)' });
    }
  });

usersRouter.post('/', requireRole('ADMIN'), async (req, res) => {
  const data = createUserSchema.parse(req.body);

  const user = await prisma.user.create({
    data: {
      username: data.username,
      passwordHash: await hashPassword(data.password),
      role: data.role,
      prefix: data.prefix || null,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      ...(data.role === 'TEACHER' && {
        teacherProfile: {
          create: { employeeCode: data.employeeCode || null, department: data.department || null },
        },
      }),
      ...(data.role === 'STUDENT' && {
        studentProfile: {
          create: {
            studentCode: data.studentCode!,
            gradeLevel: data.gradeLevel!,
            classroomId: data.classroomId || null,
          },
        },
      }),
    },
    select: publicUserSelect,
  });

  await writeAudit({
    userId: req.user!.id,
    action: 'USER_CREATE',
    entity: 'User',
    entityId: user.id,
    detail: { username: user.username, role: user.role },
    ipAddress: req.ip,
  });

  res.status(201).json({ user });
});

const updateUserSchema = z.object({
  prefix: z.string().trim().max(30).nullable().optional(),
  firstName: z.string().trim().min(1).optional(),
  lastName: z.string().trim().min(1).optional(),
  email: z.string().trim().email().nullable().optional().or(z.literal('')),
  isActive: z.boolean().optional(),
  department: z.string().trim().nullable().optional(),
  gradeLevel: gradeEnum.optional(),
  classroomId: z.string().nullable().optional(),
});

usersRouter.patch('/:id', requireRole('ADMIN'), async (req, res) => {
  const id = String(req.params.id);
  const data = updateUserSchema.parse(req.body);

  if (id === req.user!.id && data.isActive === false) {
    throw badRequest('ไม่สามารถระงับบัญชีของตนเองได้');
  }

  const existing = await prisma.user.findUniqueOrThrow({ where: { id }, select: { role: true } });

  const user = await prisma.user.update({
    where: { id },
    data: {
      prefix: data.prefix,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email === '' ? null : data.email,
      isActive: data.isActive,
      ...(existing.role === 'TEACHER' &&
        data.department !== undefined && {
          teacherProfile: { update: { department: data.department } },
        }),
      ...(existing.role === 'STUDENT' &&
        (data.gradeLevel !== undefined || data.classroomId !== undefined) && {
          studentProfile: {
            update: { gradeLevel: data.gradeLevel, classroomId: data.classroomId },
          },
        }),
    },
    select: publicUserSelect,
  });

  await writeAudit({
    userId: req.user!.id,
    action: 'USER_UPDATE',
    entity: 'User',
    entityId: id,
    detail: data as Prisma.InputJsonValue,
    ipAddress: req.ip,
  });

  res.json({ user });
});

const resetPasswordSchema = z.object({
  newPassword: z.string().min(PASSWORD_MIN_LENGTH, `รหัสผ่านต้องมีอย่างน้อย ${PASSWORD_MIN_LENGTH} ตัวอักษร`),
});

usersRouter.post('/:id/reset-password', requireRole('ADMIN'), async (req, res) => {
  const id = String(req.params.id);
  const { newPassword } = resetPasswordSchema.parse(req.body);

  await prisma.user.update({
    where: { id },
    data: { passwordHash: await hashPassword(newPassword) },
  });
  await writeAudit({
    userId: req.user!.id,
    action: 'USER_RESET_PASSWORD',
    entity: 'User',
    entityId: id,
    ipAddress: req.ip,
  });

  res.json({ message: 'ตั้งรหัสผ่านใหม่เรียบร้อยแล้ว' });
});
