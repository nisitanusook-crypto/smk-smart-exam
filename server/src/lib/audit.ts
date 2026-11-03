import type { Prisma } from '@prisma/client';
import { prisma } from './prisma.js';

export async function writeAudit(entry: {
  userId?: string | null;
  action: string;
  entity?: string;
  entityId?: string;
  detail?: Prisma.InputJsonValue;
  ipAddress?: string;
}): Promise<void> {
  try {
    await prisma.auditLog.create({ data: entry });
  } catch (err) {
    // การบันทึก log ล้มเหลวต้องไม่ทำให้คำขอหลักล้มเหลว
    console.error('[audit] บันทึกไม่สำเร็จ', err);
  }
}
