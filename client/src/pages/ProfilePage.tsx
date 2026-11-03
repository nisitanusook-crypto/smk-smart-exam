import { useState, type FormEvent } from 'react';
import { KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api, ApiError } from '../api/client';
import { Alert, PageHeader } from '../components/ui';
import { formatThaiDateTime, fullName, GRADE_FULL_LABELS, ROLE_LABELS } from '../lib/labels';

export function ProfilePage() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [msg, setMsg] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (newPassword !== confirm) {
      setMsg({ tone: 'error', text: 'รหัสผ่านใหม่และการยืนยันไม่ตรงกัน' });
      return;
    }
    setSaving(true);
    try {
      const res = await api<{ message: string }>('/auth/change-password', {
        method: 'POST',
        body: { currentPassword, newPassword },
      });
      setMsg({ tone: 'success', text: res.message });
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
    } catch (err) {
      const text =
        err instanceof ApiError ? (err.details?.[0]?.message ?? err.message) : 'เปลี่ยนรหัสผ่านไม่สำเร็จ';
      setMsg({ tone: 'error', text });
    } finally {
      setSaving(false);
    }
  }

  const rows: [string, string][] = [
    ['ชื่อ-นามสกุล', fullName(user)],
    ['ชื่อผู้ใช้', user.username],
    ['บทบาท', ROLE_LABELS[user.role]],
    ...(user.studentProfile
      ? ([
          ['เลขประจำตัวนักเรียน', user.studentProfile.studentCode],
          ['ระดับชั้น', GRADE_FULL_LABELS[user.studentProfile.gradeLevel]],
        ] as [string, string][])
      : []),
    ...(user.teacherProfile?.department ? ([['กลุ่มสาระ', user.teacherProfile.department]] as [string, string][]) : []),
    ['เข้าสู่ระบบล่าสุด', user.lastLoginAt ? formatThaiDateTime(user.lastLoginAt) : '–'],
  ];

  return (
    <>
      <PageHeader title="ข้อมูลส่วนตัว" />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-lg font-bold text-navy-900">ข้อมูลบัญชี</h2>
          <dl className="mt-4 divide-y divide-navy-50 text-sm">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 py-2.5">
                <dt className="text-slate-500">{k}</dt>
                <dd className="text-right font-medium text-navy-900">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="card p-6">
          <h2 className="flex items-center gap-2 text-lg font-bold text-navy-900">
            <KeyRound className="h-5 w-5 text-gold-600" /> เปลี่ยนรหัสผ่าน
          </h2>
          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
            <div>
              <label className="label" htmlFor="cur">
                รหัสผ่านปัจจุบัน
              </label>
              <input id="cur" type="password" className="input" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="new">
                รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)
              </label>
              <input id="new" type="password" className="input" autoComplete="new-password" minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
            </div>
            <div>
              <label className="label" htmlFor="confirm">
                ยืนยันรหัสผ่านใหม่
              </label>
              <input id="confirm" type="password" className="input" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
