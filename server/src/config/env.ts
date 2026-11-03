import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const here = path.dirname(fileURLToPath(import.meta.url));

/**
 * โหลดไฟล์ .env (ถ้ามี) — ลำดับ: server/.env แล้วจึง <root>/.env
 * บน Render.com ค่าต่าง ๆ มาจาก Environment Variables จึงไม่ต้องมีไฟล์
 */
function loadEnvFiles(): void {
  const candidates = [
    path.resolve(here, '../../.env'), // server/.env (ทั้งจาก src/ และ dist/)
    path.resolve(here, '../../../.env'), // <root>/.env
  ];
  for (const file of candidates) {
    if (existsSync(file)) {
      process.loadEnvFile(file);
    }
  }
}

if (process.env.NODE_ENV !== 'test') {
  loadEnvFiles();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'ต้องกำหนด DATABASE_URL'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET ต้องยาวอย่างน้อย 32 ตัวอักษร'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  CORS_ORIGIN: z.string().optional(),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(10),
  SCHOOL_NAME: z.string().default('โรงเรียนวัดศิริมงคล'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  console.error(`❌ การตั้งค่า Environment ไม่ถูกต้อง:\n${issues}`);
  process.exit(1);
}

export const env = parsed.data;
export const isProduction = env.NODE_ENV === 'production';
