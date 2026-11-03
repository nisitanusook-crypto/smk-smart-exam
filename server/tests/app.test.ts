import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const findUnique = vi.fn();

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    user: { findUnique: (...args: unknown[]) => findUnique(...args) },
    auditLog: { create: vi.fn() },
  },
}));

const { createApp } = await import('../src/app.js');
const { signToken } = await import('../src/middleware/auth.js');

const app = createApp();

beforeEach(() => {
  findUnique.mockReset();
});

describe('Health check', () => {
  it('GET /api/health ตอบ ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('เส้นทาง API ที่ไม่มีอยู่ตอบ 404 เป็นภาษาไทย', async () => {
    const res = await request(app).get('/api/not-exists');
    expect(res.status).toBe(404);
    expect(res.body.message).toContain('ไม่พบเส้นทาง');
  });
});

describe('การยืนยันตัวตน', () => {
  it('ไม่มีโทเคน → 401', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });

  it('โทเคนปลอม → 401', async () => {
    const res = await request(app).get('/api/dashboard').set('Authorization', 'Bearer invalid.token');
    expect(res.status).toBe(401);
  });

  it('บัญชีถูกระงับ → 401', async () => {
    findUnique.mockResolvedValue({ id: 'u1', role: 'ADMIN', username: 'admin', isActive: false });
    const token = signToken({ id: 'u1', role: 'ADMIN' });
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it('login โดยไม่กรอกข้อมูล → 400 พร้อมรายละเอียด', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.details).toBeInstanceOf(Array);
  });
});

describe('การจำกัดสิทธิ์ตามบทบาท', () => {
  it('นักเรียนเข้าถึงการจัดการผู้ใช้ไม่ได้ → 403', async () => {
    findUnique.mockResolvedValue({ id: 's1', role: 'STUDENT', username: 'student', isActive: true });
    const token = signToken({ id: 's1', role: 'STUDENT' });
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('ครูสร้างผู้ใช้ไม่ได้ → 403', async () => {
    findUnique.mockResolvedValue({ id: 't1', role: 'TEACHER', username: 'teacher', isActive: true });
    const token = signToken({ id: 't1', role: 'TEACHER' });
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ username: 'x', password: 'y' });
    expect(res.status).toBe(403);
  });

  it('นักเรียนดูเอกสารต้นฉบับข้อสอบไม่ได้ → 403', async () => {
    findUnique.mockResolvedValue({ id: 's1', role: 'STUDENT', username: 'student', isActive: true });
    const token = signToken({ id: 's1', role: 'STUDENT' });
    const res = await request(app).get('/api/exam-bank/sources').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
