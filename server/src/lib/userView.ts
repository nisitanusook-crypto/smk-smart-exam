import type { Prisma } from '@prisma/client';

/** ฟิลด์ผู้ใช้ที่ปลอดภัยสำหรับส่งกลับ (ไม่มี passwordHash) */
export const publicUserSelect = {
  id: true,
  username: true,
  role: true,
  prefix: true,
  firstName: true,
  lastName: true,
  email: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  teacherProfile: { select: { id: true, employeeCode: true, department: true } },
  studentProfile: {
    select: {
      id: true,
      studentCode: true,
      gradeLevel: true,
      classroom: { select: { id: true, name: true, academicYear: true } },
    },
  },
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;
