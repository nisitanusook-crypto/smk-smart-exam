import { Link } from 'react-router-dom';
import { Activity, FileCheck2, GraduationCap, Library, ShieldCheck, Users } from 'lucide-react';
import { Badge, EmptyState, StatCard } from '../../components/ui';
import { AUDIT_ACTION_LABELS, formatThaiDateTime, ROLE_LABELS, VERIFICATION_LABELS } from '../../lib/labels';
import type { AdminDashboardData, User, VerificationStatus } from '../../types';
import { WelcomeBanner } from './WelcomeBanner';

const nf = new Intl.NumberFormat('th-TH');

export function AdminDashboard({ data, user }: { data: AdminDashboardData; user: User }) {
  const { stats } = data;
  const totalPapers = Object.values(stats.papersByStatus).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <>
      <WelcomeBanner user={user} academicYear={data.academicYear}>
        แดชบอร์ดผู้ดูแลระบบ — ภาพรวมผู้ใช้งานและคลังข้อสอบ O-NET ม.3 / ม.6 (รองรับปีการศึกษา{' '}
        {data.supportedYears.from}–{data.supportedYears.to})
      </WelcomeBanner>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="นักเรียน ม.3"
          value={nf.format(stats.studentsByGrade.M3 ?? 0)}
          hint="คน"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          label="นักเรียน ม.6"
          value={nf.format(stats.studentsByGrade.M6 ?? 0)}
          hint="คน"
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          label="ครูผู้ใช้งาน"
          value={nf.format(stats.users.TEACHER ?? 0)}
          hint={`ผู้ดูแลระบบ ${nf.format(stats.users.ADMIN ?? 0)} คน`}
          icon={<Users className="h-5 w-5" />}
          accent="gold"
        />
        <StatCard
          label="ชุดข้อสอบที่เผยแพร่"
          value={nf.format(stats.publishedPapers)}
          hint={`จากทั้งหมด ${nf.format(totalPapers)} ชุด • ${nf.format(stats.questions)} ข้อ`}
          icon={<Library className="h-5 w-5" />}
          accent="gold"
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <section className="card p-6 lg:col-span-1">
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy-900">
            <FileCheck2 className="h-5 w-5 text-gold-600" /> สถานะการตรวจสอบข้อสอบ
          </h2>
          <ul className="mt-4 divide-y divide-navy-50">
            {(['VERIFIED', 'PENDING_REVIEW', 'DRAFT', 'REJECTED'] as VerificationStatus[]).map((s) => (
              <li key={s} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-slate-600">{VERIFICATION_LABELS[s]}</span>
                <span className="font-semibold tabular-nums text-navy-900">
                  {nf.format(stats.papersByStatus[s] ?? 0)} ชุด
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-slate-600">เอกสารอ้างอิงรอตรวจสอบ</span>
              <Badge tone={stats.pendingSources > 0 ? 'gold' : 'gray'}>
                {nf.format(stats.pendingSources)} / {nf.format(stats.sources)}
              </Badge>
            </li>
          </ul>
          <Link to="/exam-bank" className="btn btn-outline mt-4 w-full">
            ไปที่คลังข้อสอบ
          </Link>
        </section>

        <section className="card p-6 lg:col-span-2">
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy-900">
            <Activity className="h-5 w-5 text-gold-600" /> กิจกรรมล่าสุดในระบบ
          </h2>
          {data.recentActivity.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="ยังไม่มีกิจกรรม" />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-navy-50">
              {data.recentActivity.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <div>
                    <span className="font-medium text-navy-900">{AUDIT_ACTION_LABELS[a.action] ?? a.action}</span>
                    {a.user && (
                      <span className="text-slate-500">
                        {' '}
                        — {a.user.firstName} {a.user.lastName} ({ROLE_LABELS[a.user.role]})
                      </span>
                    )}
                  </div>
                  <time className="text-xs text-slate-400" dateTime={a.createdAt}>
                    {formatThaiDateTime(a.createdAt)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card mt-6 flex flex-wrap items-center gap-4 border-gold-200 bg-gold-50 p-5">
        <ShieldCheck className="h-8 w-8 shrink-0 text-gold-700" />
        <div className="min-w-0 flex-1 text-sm text-gold-900">
          <p className="font-semibold">นโยบายคลังข้อสอบ</p>
          <p>
            ระบบใช้เฉพาะข้อสอบ O-NET จริงที่มีเอกสารต้นฉบับตรวจสอบได้ ห้ามใช้ AI สร้างข้อสอบหรือเฉลย
            และทุกชุดต้องได้รับการยืนยันจากผู้ดูแลระบบก่อนเผยแพร่
          </p>
        </div>
        <Link to="/users" className="btn btn-primary">
          <Users className="h-4 w-4" /> จัดการผู้ใช้งาน
        </Link>
      </section>
    </>
  );
}
