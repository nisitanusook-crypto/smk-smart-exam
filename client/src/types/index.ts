export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type GradeLevel = 'M3' | 'M6';
export type VerificationStatus = 'DRAFT' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
export type ExamMode = 'PRACTICE' | 'SIMULATION';

export interface User {
  id: string;
  username: string;
  role: Role;
  prefix: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  teacherProfile: { id: string; employeeCode: string | null; department: string | null } | null;
  studentProfile: {
    id: string;
    studentCode: string;
    gradeLevel: GradeLevel;
    classroom: { id: string; name: string; academicYear: number } | null;
  } | null;
}

export interface YearRange {
  from: number;
  to: number;
}

interface DashboardBase {
  academicYear: number;
  supportedYears: YearRange;
}

export interface AdminDashboardData extends DashboardBase {
  role: 'ADMIN';
  stats: {
    users: Partial<Record<Role, number>>;
    studentsByGrade: Partial<Record<GradeLevel, number>>;
    papersByStatus: Partial<Record<VerificationStatus, number>>;
    publishedPapers: number;
    sources: number;
    pendingSources: number;
    questions: number;
  };
  recentActivity: {
    id: string;
    action: string;
    createdAt: string;
    user: { firstName: string; lastName: string; role: Role } | null;
  }[];
}

export interface TeacherDashboardData extends DashboardBase {
  role: 'TEACHER';
  stats: {
    studentsByGrade: Partial<Record<GradeLevel, number>>;
    publishedPapersByGrade: Partial<Record<GradeLevel, number>>;
    draftPapers: number;
    submittedAttempts: number;
  };
}

export interface StudentDashboardData extends DashboardBase {
  role: 'STUDENT';
  profile: { studentCode: string; gradeLevel: GradeLevel; classroom: { name: string } | null } | null;
  stats: {
    availablePapers: number;
    submittedAttempts: number;
    averageScore: string | null;
    bestScore: string | null;
  };
  subjects: { id: string; code: string; nameTh: string; paperCount: number }[];
  recentAttempts: {
    id: string;
    mode: ExamMode;
    status: string;
    startedAt: string;
    rawScore: string | null;
    paper: { title: string; academicYear: number; subject: { nameTh: string } };
  }[];
}

export type DashboardData = AdminDashboardData | TeacherDashboardData | StudentDashboardData;

export interface ExamBankSubject {
  id: string;
  code: string;
  nameTh: string;
  nameEn: string | null;
  isActive: boolean;
  paperCount: number;
  verifiedCount: number;
  publishedCount: number;
  questionCount: number;
  years: number[];
}

export interface ExamBankOverview {
  supportedYears: YearRange;
  policy: string[];
  grades: { gradeLevel: GradeLevel; label: string; subjects: ExamBankSubject[] }[];
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
