import { BookOpenCheck, ClipboardList, Library, Timer, Trophy } from 'lucide-react';
import { Badge, EmptyState, StatCard } from '../../components/ui';
import { formatThaiDateTime, GRADE_FULL_LABELS } from '../../lib/labels';
import type { StudentDashboardData, User } from '../../types';
import { WelcomeBanner } from './WelcomeBanner';

const nf = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 2 });
const score = (v: string | null) => (v === null ? '–' : nf.format(Number(v)));

export function StudentDashboard({ data, user }: { data: StudentDashboardData; user: User }) {
  const { stats, profile } = data;

  return (
    <>
      <WelcomeBanner user={user} academicYear={data.academicYear}>
        {profile ? (
          <>
            เลขประจำตัว {profile.studentCode} • {GRADE_FULL_LABELS[profile.gradeLevel]}
            {profile.classroom && <> • ห้อง {profile.classroom.name}</>}
          </>
        ) : (
          'ยังไม่ได้กำหนดข้อมูลนักเรียน กรุณาติดต่อผู้ดูแลระบบ'
        )}
      </WelcomeBanner>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="ชุดข้อสอบที่เปิดให้ฝึก"
          value={nf.format(stats.availablePapers)}
          hint="ชุด"
          icon={<Library className="h-5 w-5" />}
        />
        <StatCard
          label="ทำข้อสอบแล้ว"
          value={nf.format(stats.submittedAttempts)}
          hint="ครั้ง"
          icon={<ClipboardList className="h-5 w-5" />}
        />
        <StatCard label="คะแนนเฉลี่ย" value={score(stats.averageScore)} icon={<Trophy className="h-5 w-5" />} accent="gold" />
        <StatCard label="คะแนนสูงสุด" value={score(stats.bestScore)} icon={<Trophy className="h-5 w-5" />} accent="gold" />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="card flex items-start gap-4 p-6">
          <div className="rounded-xl bg-navy-900 p-3 text-gold-400">
            <BookOpenCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-navy-900">
              โหมดฝึกสอบ <Badge tone="gold">เร็ว ๆ นี้</Badge>
            </h2>
            <p className="mt-1 text-sm text-slate-500">ฝึกทำข้อสอบรายวิชา ดูเฉลยและแหล่งอ้างอิงหลังส่งคำตอบ</p>
          </div>
        </div>
        <div className="card flex items-start gap-4 p-6">
          <div className="rounded-xl bg-gold-500 p-3 text-navy-950">
            <Timer className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-navy-900">
              จำลองสนามสอบจริง <Badge tone="gold">เร็ว ๆ นี้</Badge>
            </h2>
            <p className="mt-1 text-sm text-slate-500">จับเวลาตามจริง หน้าจอสอบตามแนวทางระบบสอบดิจิทัลของ สทศ.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-lg font-bold text-navy-900">วิชาที่สอบ O-NET {profile && GRADE_FULL_LABELS[profile.gradeLevel]}</h2>
          {data.subjects.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="ยังไม่มีข้อมูลวิชา" />
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-navy-50">
              {data.subjects.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="font-medium text-navy-900">{s.nameTh}</span>
                  <Badge tone={s.paperCount > 0 ? 'green' : 'gray'}>{nf.format(s.paperCount)} ชุด</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card p-6">
          <h2 className="text-lg font-bold text-navy-900">การสอบล่าสุด</h2>
          {data.recentAttempts.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="ยังไม่มีประวัติการสอบ">เมื่อเปิดใช้งานโหมดฝึกสอบ ประวัติจะแสดงที่นี่</EmptyState>
            </div>
          ) : (
            <ul className="mt-4 divide-y divide-navy-50">
              {data.recentAttempts.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-navy-900">
                      {a.paper.subject.nameTh} ปี {a.paper.academicYear}
                    </p>
                    <p className="text-xs text-slate-400">{formatThaiDateTime(a.startedAt)}</p>
                  </div>
                  <span className="font-semibold tabular-nums">{score(a.rawScore)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
