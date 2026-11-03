import { env } from './config/env.js';
import { createApp } from './app.js';
import { prisma } from './lib/prisma.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`✅ SMK Smart Exam API พร้อมใช้งานที่พอร์ต ${env.PORT} (${env.NODE_ENV})`);
});

async function shutdown(signal: string) {
  console.log(`ได้รับสัญญาณ ${signal} กำลังปิดระบบ...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
