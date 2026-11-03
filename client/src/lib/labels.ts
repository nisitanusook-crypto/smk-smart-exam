import type { GradeLevel, Role, VerificationStatus } from '../types';

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'ผู้ดูแลระบบ',
  TEACHER: 'ครู',
  STUDENT: 'นักเรียน',
};

export const GRADE_LABELS: Record<GradeLevel, string> = {
  M3: 'ม.3',
  M6: 'ม.6',
};

export const GRADE_FULL_LABELS: Record<GradeLevel, string> = {
  M3: 'มัธยมศึกษาปีที่ 3',
  M6: 'มัธยมศึกษาปีที่ 6',
};

export const VERIFICATION_LABELS: Record<VerificationStatus, string> = {
  DRAFT: 'ฉบับร่าง',
  PENDING_REVIEW: 'รอตรวจสอบ',
  VERIFIED: 'ตรวจสอบแล้ว',
  REJECTED: 'ไม่ผ่าน',
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  LOGIN: 'เข้าสู่ระบบ',
  PASSWORD_CHANGE: 'เปลี่ยนรหัสผ่าน',
  USER_CREATE: 'เพิ่มผู้ใช้งาน',
  USER_UPDATE: 'แก้ไขผู้ใช้งาน',
  USER_RESET_PASSWORD: 'ตั้งรหัสผ่านใหม่ให้ผู้ใช้',
  PAPER_CREATE: 'เพิ่มชุดข้อสอบ',
  SOURCE_CREATE: 'เพิ่มเอกสารอ้างอิง',
  SOURCE_VERIFIED: 'ยืนยันเอกสารอ้างอิง',
  SOURCE_REJECTED: 'ปฏิเสธเอกสารอ้างอิง',
};

const thaiDateTime = new Intl.DateTimeFormat('th-TH', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatThaiDateTime(value: string | Date): string {
  return thaiDateTime.format(typeof value === 'string' ? new Date(value) : value);
}

export function fullName(u: { prefix?: string | null; firstName: string; lastName: string }): string {
  return `${u.prefix ?? ''}${u.firstName} ${u.lastName}`.trim();
}
