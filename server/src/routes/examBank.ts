import { Router } from 'express';
import { z } from 'zod';
import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { writeAudit } from '../lib/audit.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { badRequest } from '../utils/httpError.js';
import { GRADE_LABELS, supportedAcademicYears } from '../utils/labels.js';

export const examBankRouter = Router();
examBankRouter.use(authenticate);

const gradeEnum = z.enum(['M3', 'M6']);

/** นโยบายคลังข้อสอบ — แสดงในหน้าจอเพื่อย้ำแนวปฏิบัติ */
export const EXAM_BANK_POLICY = [
  'รองรับเฉพาะการสอบ O-NET ระดับชั้น ม.3 และ ม.6 (ไม่รองรับ V-NET)',
  'ใช้ข้อสอบจริงย้อนหลังไม่เกิน 20 ปี เฉพาะที่มีเอกสารต้นฉบับตรวจสอบได้',
  'ห้ามใช้ AI สร้างข้อสอบหรือเฉลย ทุกข้อต้องถอดความตรงจากต้นฉบับ',
  'ทุกชุดข้อสอบต้องผูกกับเอกสารอ้างอิง และผ่านการตรวจสอบโดยผู้ดูแลระบบก่อนเผยแพร่',
] as const;

// ---------------------------------------------------------------------------
// ภาพรวมคลังข้อสอบแยกตามระดับชั้น/วิชา
// ---------------------------------------------------------------------------
examBankRouter.get('/overview', async (req, res) => {
  const isStudent = req.user!.role === 'STUDENT';
  const paperFilter: Prisma.ExamPaperWhereInput = isStudent
    ? { isPublished: true, verificationStatus: 'VERIFIED' }
    : {};

  const subjects = await prisma.subject.findMany({
    orderBy: [{ gradeLevel: 'asc' }, { sortOrder: 'asc' }],
    include: {
      papers: {
        where: paperFilter,
        select: {
          academicYear: true,
          verificationStatus: true,
          isPublished: true,
          _count: { select: { questions: true } },
        },
        orderBy: { academicYear: 'desc' },
      },
    },
  });

  const grades = (['M3', 'M6'] as const).map((gradeLevel) => ({
    gradeLevel,
    label: GRADE_LABELS[gradeLevel],
    subjects: subjects
      .filter((s) => s.gradeLevel === gradeLevel)
      .map((s) => ({
        id: s.id,
        code: s.code,
        nameTh: s.nameTh,
        nameEn: s.nameEn,
        isActive: s.isActive,
        paperCount: s.papers.length,
        verifiedCount: s.papers.filter((p) => p.verificationStatus === 'VERIFIED').length,
        publishedCount: s.papers.filter((p) => p.isPublished).length,
        questionCount: s.papers.reduce((sum, p) => sum + p._count.questions, 0),
        years: s.papers.map((p) => p.academicYear),
      })),
  }));

  res.json({ supportedYears: supportedAcademicYears(), policy: EXAM_BANK_POLICY, grades });
});

examBankRouter.get('/subjects', async (req, res) => {
  const { gradeLevel } = z.object({ gradeLevel: gradeEnum.optional() }).parse(req.query);
  const subjects = await prisma.subject.findMany({
    where: gradeLevel ? { gradeLevel } : undefined,
    orderBy: [{ gradeLevel: 'asc' }, { sortOrder: 'asc' }],
  });
  res.json({ items: subjects });
});

// ---------------------------------------------------------------------------
// ชุดข้อสอบ
// ---------------------------------------------------------------------------
const paperListQuery = z.object({
  gradeLevel: gradeEnum.optional(),
  subjectId: z.string().optional(),
  academicYear: z.coerce.number().int().optional(),
});

examBankRouter.get('/papers', async (req, res) => {
  const q = paperListQuery.parse(req.query);
  const isStudent = req.user!.role === 'STUDENT';

  const papers = await prisma.examPaper.findMany({
    where: {
      gradeLevel: q.gradeLevel,
      subjectId: q.subjectId,
      academicYear: q.academicYear,
      ...(isStudent && { isPublished: true, verificationStatus: 'VERIFIED' }),
    },
    orderBy: [{ academicYear: 'desc' }, { subject: { sortOrder: 'asc' } }],
    select: {
      id: true,
      title: true,
      gradeLevel: true,
      academicYear: true,
      durationMinutes: true,
      totalScore: true,
      totalQuestions: true,
      verificationStatus: true,
      isPublished: true,
      subject: { select: { id: true, code: true, nameTh: true } },
      source: isStudent ? false : { select: { id: true, title: true, url: true } },
      _count: { select: { questions: true } },
    },
  });

  res.json({ items: papers });
});

const createPaperSchema = z.object({
  subjectId: z.string().min(1, 'กรุณาเลือกวิชา'),
  academicYear: z.coerce.number().int(),
  title: z.string().trim().min(1, 'กรุณากรอกชื่อชุดข้อสอบ'),
  durationMinutes: z.coerce.number().int().min(1).max(300),
  totalScore: z.coerce.number().positive().max(1000).default(100),
  totalQuestions: z.coerce.number().int().positive().optional(),
  instructions: z.string().trim().optional(),
  sourceId: z.string().min(1, 'ต้องอ้างอิงเอกสารต้นฉบับ'),
  answerKeySourceId: z.string().optional(),
});

examBankRouter.post('/papers', requireRole('ADMIN', 'TEACHER'), async (req, res) => {
  const data = createPaperSchema.parse(req.body);
  const { from, to } = supportedAcademicYears();
  if (data.academicYear < from || data.academicYear > to) {
    throw badRequest(`ปีการศึกษาต้องอยู่ระหว่าง ${from}–${to} (ย้อนหลังไม่เกิน 20 ปี)`);
  }

  const subject = await prisma.subject.findUniqueOrThrow({ where: { id: data.subjectId } });
  const source = await prisma.examSource.findUniqueOrThrow({ where: { id: data.sourceId } });
  if (source.verificationStatus === 'REJECTED') {
    throw badRequest('ไม่สามารถใช้เอกสารอ้างอิงที่ไม่ผ่านการตรวจสอบได้');
  }

  const paper = await prisma.examPaper.create({
    data: {
      ...data,
      gradeLevel: subject.gradeLevel,
      verificationStatus: 'DRAFT',
      createdById: req.user!.id,
    },
  });

  await writeAudit({
    userId: req.user!.id,
    action: 'PAPER_CREATE',
    entity: 'ExamPaper',
    entityId: paper.id,
    ipAddress: req.ip,
  });
  res.status(201).json({ paper });
});

// ---------------------------------------------------------------------------
// เอกสารอ้างอิง (ต้นฉบับข้อสอบ/เฉลย)
// ---------------------------------------------------------------------------
examBankRouter.get('/sources', requireRole('ADMIN', 'TEACHER'), async (_req, res) => {
  const sources = await prisma.examSource.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      createdBy: { select: { firstName: true, lastName: true } },
      verifiedBy: { select: { firstName: true, lastName: true } },
      _count: { select: { papers: true, questions: true } },
    },
  });
  res.json({ items: sources });
});

const createSourceSchema = z
  .object({
    title: z.string().trim().min(1, 'กรุณากรอกชื่อเอกสาร'),
    sourceType: z.enum(['NIETS_OFFICIAL', 'NIETS_RELEASED_ARCHIVE', 'OTHER_VERIFIED']),
    publisher: z.string().trim().optional(),
    url: z.string().trim().url('ลิงก์ไม่ถูกต้อง').optional().or(z.literal('')),
    fileUrl: z.string().trim().optional(),
    fileChecksum: z.string().trim().optional(),
    publishedYear: z.coerce.number().int().optional(),
    notes: z.string().trim().optional(),
  })
  .refine((v) => Boolean(v.url || v.fileUrl), {
    message: 'ต้องระบุลิงก์ต้นฉบับหรือไฟล์เอกสารอย่างน้อยหนึ่งอย่าง เพื่อให้ตรวจสอบย้อนกลับได้',
    path: ['url'],
  });

examBankRouter.post('/sources', requireRole('ADMIN', 'TEACHER'), async (req, res) => {
  const data = createSourceSchema.parse(req.body);
  const source = await prisma.examSource.create({
    data: {
      ...data,
      url: data.url || null,
      publisher: data.publisher || undefined,
      verificationStatus: 'PENDING_REVIEW',
      createdById: req.user!.id,
    },
  });
  await writeAudit({
    userId: req.user!.id,
    action: 'SOURCE_CREATE',
    entity: 'ExamSource',
    entityId: source.id,
    ipAddress: req.ip,
  });
  res.status(201).json({ source });
});

const verifySchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED']),
  notes: z.string().trim().optional(),
});

/** ผู้ดูแลระบบยืนยันว่าเอกสารเป็นต้นฉบับจริง */
examBankRouter.post('/sources/:id/verify', requireRole('ADMIN'), async (req, res) => {
  const id = String(req.params.id);
  const { status, notes } = verifySchema.parse(req.body);
  const source = await prisma.examSource.update({
    where: { id },
    data: {
      verificationStatus: status,
      verifiedById: req.user!.id,
      verifiedAt: new Date(),
      ...(notes && { notes }),
    },
  });
  await writeAudit({
    userId: req.user!.id,
    action: `SOURCE_${status}`,
    entity: 'ExamSource',
    entityId: id,
    ipAddress: req.ip,
  });
  res.json({ source });
});
