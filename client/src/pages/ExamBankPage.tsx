import { useState } from 'react';
import { BookMarked, FileSearch, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../lib/useApi';
import { Alert, Badge, EmptyState, PageHeader, Spinner } from '../components/ui';
import type { ExamBankOverview, GradeLevel } from '../types';
import { GRADE_FULL_LABELS } from '../lib/labels';

const nf = new Intl.NumberFormat('th-TH');

export function ExamBankPage() {
  const { user } = useAuth();
  const { data, error, loading } = useApi<ExamBankOverview>('/exam-bank/overview');
  const [grade, setGrade] = useState<GradeLevel>(user?.studentProfile?.gradeLevel ?? 'M3');

  if (loading) return <Spinner />;
  if (error || !data) return <Alert tone="error">{error ?? 'ไม่สามารถโหลดข้อมูลได้'}</Alert>;

  const current = data.grades.find((g) => g.gradeLevel === grade);
  const years = Array.from(
    { length: data.supportedYears.to - data.supportedYears.from + 1 },
    (_, i) => data.supportedYears.to - i,
  );
  const isStaff = user?.role !== 'STUDENT';

  return (
    <>
      <PageHeader
        title="คลังข้อสอบ O-NET"
        subtitle={`ข้อสอบจริงย้อนหลัง ปีการศึกษา ${data.supportedYears.from}–${data.supportedYears.to} (สูงสุด 20 ปี)`}
      />

      <section className="card mb-6 border-gold-200 bg-gold-50 p-5">
        <h2 className="flex items-center gap-2 font-bold text-gold-900">
          <ShieldCheck className="h-5 w-5 text-gold-700" /> นโยบายคลังข้อสอบ
        </h2>
        <ul className="mt-2 list-disc space-y-1 pl-6 text-sm text-gold-900">
          {data.policy.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </section>

      <div className="mb-5 inline-flex rounded-xl border border-navy-200 bg-white p-1" role="tablist" aria-label="ระดับชั้น">
        {(['M3', 'M6'] as GradeLevel[]).map((g) => (
          <button
            key={g}
            type="button"
            role="tab"
            aria-selected={grade === g}
            onClick={() => setGrade(g)}
            className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
              grade === g ? 'bg-navy-900 text-white shadow' : 'text-navy-700 hover:bg-navy-50'
            }`}
          >
            O-NET {g === 'M3' ? 'ม.3' : 'ม.6'}
          </button>
        ))}
      </div>

      {!current || current.subjects.length === 0 ? (
        <EmptyState title="ยังไม่มีข้อมูลวิชา" icon={<BookMarked className="h-10 w-10" />}>
          ผู้ดูแลระบบต้องรันคำสั่ง seed เพื่อสร้างโครงสร้างวิชา
        </EmptyState>
      ) : (
        <section className="card overflow-hidden">
          <div className="border-b border-navy-100 bg-navy-900 px-5 py-3 text-white">
            <h2 className="font-bold">
              {GRADE_FULL_LABELS[grade]} <span className="text-gold-400">• ความครอบคลุมรายปี</span>
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="bg-navy-50 text-left text-navy-900">
                  <th className="sticky left-0 z-10 bg-navy-50 px-4 py-3 font-semibold">วิชา</th>
                  <th className="px-3 py-3 text-center font-semibold">ชุด</th>
                  {isStaff && <th className="px-3 py-3 text-center font-semibold">ตรวจแล้ว</th>}
                  <th className="px-3 py-3 text-center font-semibold">ข้อ</th>
                  {years.map((y) => (
                    <th key={y} className="px-1.5 py-3 text-center text-xs font-medium text-slate-500">
                      {String(y).slice(2)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {current.subjects.map((s) => (
                  <tr key={s.id} className={s.isActive ? '' : 'text-slate-400'}>
                    <td className="sticky left-0 z-10 bg-white px-4 py-3">
                      <div className="font-medium text-navy-900">{s.nameTh}</div>
                      {!s.isActive && <Badge tone="gray">ไม่ได้สอบในปัจจุบัน</Badge>}
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums">{nf.format(s.paperCount)}</td>
                    {isStaff && <td className="px-3 py-3 text-center tabular-nums">{nf.format(s.verifiedCount)}</td>}
                    <td className="px-3 py-3 text-center tabular-nums">{nf.format(s.questionCount)}</td>
                    {years.map((y) => (
                      <td key={y} className="px-1.5 py-3 text-center">
                        <span
                          className={`mx-auto block h-3.5 w-3.5 rounded ${
                            s.years.includes(y) ? 'bg-gold-500' : 'bg-navy-100'
                          }`}
                          title={`ปีการศึกษา ${y}: ${s.years.includes(y) ? 'มีข้อสอบ' : 'ยังไม่มีข้อสอบ'}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-4 border-t border-navy-100 px-5 py-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-gold-500" /> มีข้อสอบในคลัง
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded bg-navy-100" /> ยังไม่มีข้อสอบ
            </span>
            <span>หัวคอลัมน์ = ปีการศึกษา (พ.ศ. 2 หลักท้าย)</span>
          </div>
        </section>
      )}

      {isStaff && (
        <div className="mt-6">
          <Alert tone="info">
            <span className="inline-flex items-center gap-1.5 font-semibold">
              <FileSearch className="h-4 w-4" /> การนำเข้าข้อสอบ
            </span>{' '}
            — เครื่องมือบันทึกข้อสอบจากเอกสารต้นฉบับ สทศ. และขั้นตอนตรวจสอบ จะเปิดใช้งานในระยะถัดไป
            (โครงสร้างฐานข้อมูลและ API สำหรับเอกสารอ้างอิงพร้อมแล้ว)
          </Alert>
        </div>
      )}
    </>
  );
}
