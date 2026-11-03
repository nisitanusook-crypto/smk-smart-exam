import type { GradeLevel, Role } from '@prisma/client';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  TEACHER: 'ครู',
  STUDENT: 'นักเรียน',
};

export const GRADE_LABELS: Record<GradeLevel, string> = {
  M3: 'มัธยมศึกษาปีที่ 3',
  M6: 'มัธยมศึกษาปีที่ 6',
};

/** ปีการศึกษาปัจจุบัน (พ.ศ.) — ปีการศึกษาไทยเริ่มเดือนพฤษภาคม */
export function currentAcademicYear(date = new Date()): number {
  const buddhistYear = date.getFullYear() + 543;
  return date.getMonth() < 4 ? buddhistYear - 1 : buddhistYear;
}

/** ช่วงปีการศึกษาที่คลังข้อสอบรองรับ (ย้อนหลัง 20 ปี) */
export function supportedAcademicYears(date = new Date()): { from: number; to: number } {
  const to = currentAcademicYear(date);
  return { from: to - 19, to };
}
