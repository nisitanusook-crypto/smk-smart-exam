import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { currentAcademicYear, supportedAcademicYears } from '../utils/labels.js';

export const dashboardRouter = Router();
dashboardRouter.use(authenticate);

dashboardRouter.get('/', async (req, res) => {
  const { role, id } = req.user!;
  const base = {
    role,
    academicYear: currentAcademicYear(),
    supportedYears: supportedAcademicYears(),
  };

  if (role === 'ADMIN') {
    const [usersByRole, studentsByGrade, papersByStatus, publishedPapers, sources, pendingSources, questions, recentActivity] =
      await Promise.all([
        prisma.user.groupBy({ by: ['role'], _count: { _all: true }, where: { isActive: true } }),
        prisma.studentProfile.groupBy({ by: ['gradeLevel'], _count: { _all: true } }),
        prisma.examPaper.groupBy({ by: ['verificationStatus'], _count: { _all: true } }),
        prisma.examPaper.count({ where: { isPublished: true } }),
        prisma.examSource.count(),
        prisma.examSource.count({ where: { verificationStatus: 'PENDING_REVIEW' } }),
        prisma.question.count(),
        prisma.auditLog.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            createdAt: true,
            user: { select: { firstName: true, lastName: true, role: true } },
          },
        }),
      ]);

    res.json({
      ...base,
      stats: {
        users: Object.fromEntries(usersByRole.map((r) => [r.role, r._count._all])),
        studentsByGrade: Object.fromEntries(studentsByGrade.map((r) => [r.gradeLevel, r._count._all])),
        papersByStatus: Object.fromEntries(papersByStatus.map((r) => [r.verificationStatus, r._count._all])),
        publishedPapers,
        sources,
        pendingSources,
        questions,
      },
      recentActivity,
    });
    return;
  }

  if (role === 'TEACHER') {
    const [studentsByGrade, papersByGrade, draftPapers, attempts] = await Promise.all([
      prisma.studentProfile.groupBy({
        by: ['gradeLevel'],
        _count: { _all: true },
        where: { user: { isActive: true } },
      }),
      prisma.examPaper.groupBy({
        by: ['gradeLevel'],
        _count: { _all: true },
        where: { isPublished: true },
      }),
      prisma.examPaper.count({ where: { verificationStatus: { in: ['DRAFT', 'PENDING_REVIEW'] } } }),
      prisma.examAttempt.count({ where: { status: 'SUBMITTED' } }),
    ]);

    res.json({
      ...base,
      stats: {
        studentsByGrade: Object.fromEntries(studentsByGrade.map((r) => [r.gradeLevel, r._count._all])),
        publishedPapersByGrade: Object.fromEntries(papersByGrade.map((r) => [r.gradeLevel, r._count._all])),
        draftPapers,
        submittedAttempts: attempts,
      },
    });
    return;
  }

  // STUDENT
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: id },
    select: {
      studentCode: true,
      gradeLevel: true,
      classroom: { select: { name: true } },
    },
  });
  const gradeLevel = profile?.gradeLevel;

  const [subjects, availablePapers, attemptsAgg, recentAttempts] = await Promise.all([
    prisma.subject.findMany({
      where: { gradeLevel, isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        code: true,
        nameTh: true,
        _count: { select: { papers: { where: { isPublished: true, verificationStatus: 'VERIFIED' } } } },
      },
    }),
    prisma.examPaper.count({ where: { gradeLevel, isPublished: true, verificationStatus: 'VERIFIED' } }),
    prisma.examAttempt.aggregate({
      where: { userId: id, status: 'SUBMITTED' },
      _count: { _all: true },
      _avg: { rawScore: true },
      _max: { rawScore: true },
    }),
    prisma.examAttempt.findMany({
      where: { userId: id },
      take: 5,
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        mode: true,
        status: true,
        startedAt: true,
        rawScore: true,
        paper: { select: { title: true, academicYear: true, subject: { select: { nameTh: true } } } },
      },
    }),
  ]);

  res.json({
    ...base,
    profile,
    stats: {
      availablePapers,
      submittedAttempts: attemptsAgg._count._all,
      averageScore: attemptsAgg._avg.rawScore,
      bestScore: attemptsAgg._max.rawScore,
    },
    subjects: subjects.map((s) => ({ id: s.id, code: s.code, nameTh: s.nameTh, paperCount: s._count.papers })),
    recentAttempts,
  });
});
