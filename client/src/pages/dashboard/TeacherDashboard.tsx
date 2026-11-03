import { Link } from 'react-router-dom';
import { BarChart3, ClipboardCheck, FilePen, GraduationCap, Library } from 'lucide-react';
import { StatCard } from '../../components/ui';
import type { TeacherDashboardData, User } from '../../types';
import { WelcomeBanner } from './WelcomeBanner';

const nf = new Intl.NumberFormat('th-TH');

export function TeacherDashboard({ data, user }: { data: TeacherDashboardData; user: User }) {
  const { stats } = data;
  return (
    <>
      <WelcomeBanner user={user} academicYear={data.academicYear}>
        แดชบอร์ดครู — ติดตามความพร้อมสอบ O-NET ของนักเรียน ม.3 และ ม.6
        {user.teacherProfile?.department && <> • กลุ่มสาระ{user.teacherProfile.department}</>}
      </WelcomeBanner>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="นักเรียน ม.3"
          value={nf.format(stats.studentsByGrade.M3 ?? 0)}
          hint={`ข้อสอบพร้อมใช้ ${nf.format(stats.publishedPapersByGrade.M3 ?? 0)} ชุด`}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          label="นักเรียน ม.6"
          value={nf.format(stats.studentsByGrade.M6 ?? 0)}
          hint={`ข้อสอบพร้อมใช้ ${nf.format(stats.publishedPapersByGrade.M6 ?? 0)} ชุด`}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          label="ข้อสอบรอตรวจสอบ"
          value={nf.format(stats.draftPapers)}
          hint="ชุด (ฉบับร่าง/รอตรวจ)"
          icon={<FilePen className="h-5 w-5" />}
          accent="gold"
        />
        <StatCard
          label="การสอบที่ส่งแล้ว"
          value={nf.format(stats.submittedAttempts)}
          hint="ครั้ง (ทุกโหมด)"
          icon={<ClipboardCheck className="h-5 w-5" />}
          accent="gold"
        />
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <Link to="/exam-bank" className="card group flex items-start gap-4 p-6 transition hover:border-gold-400">
          <div className="rounded-xl bg-navy-900 p-3 text-gold-400">
            <Library className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-navy-900 group-hover:text-navy-700">คลังข้อสอบ O-NET</h2>
            <p className="mt-1 text-sm text-slate-500">
              ดูโครงสร้างคลังข้อสอบแยกตามระดับชั้นและวิชา พร้อมสถานะการตรวจสอบกับเอกสารต้นฉบับ
            </p>
          </div>
        </Link>
        <div className="card flex items-start gap-4 p-6 opacity-80">
          <div className="rounded-xl bg-navy-100 p-3 text-navy-700">
            <BarChart3 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-navy-900">วิเคราะห์ผลและรายงาน PDF / Excel</h2>
            <p className="mt-1 text-sm text-slate-500">จะเปิดใช้งานในระยะถัดไปของการพัฒนา</p>
          </div>
        </div>
      </div>
    </>
  );
}
