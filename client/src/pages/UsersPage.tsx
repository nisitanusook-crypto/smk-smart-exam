import { useState, type FormEvent } from 'react';
import { KeyRound, Search, UserPlus, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../lib/useApi';
import { api, ApiError } from '../api/client';
import { Alert, Badge, EmptyState, PageHeader, Spinner } from '../components/ui';
import { formatThaiDateTime, fullName, GRADE_LABELS, ROLE_LABELS } from '../lib/labels';
import type { GradeLevel, Paginated, Role, User } from '../types';

const PAGE_SIZE = 20;

export function UsersPage() {
  const { user: me } = useAuth();
  const isAdmin = me?.role === 'ADMIN';
  const [role, setRole] = useState<Role | ''>(isAdmin ? '' : 'STUDENT');
  const [grade, setGrade] = useState<GradeLevel | ''>('');
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (role) params.set('role', role);
  if (grade) params.set('gradeLevel', grade);
  if (search) params.set('q', search);
  const { data, error, loading, reload } = useApi<Paginated<User>>(`/users?${params}`);

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  async function toggleActive(u: User) {
    if (!confirm(`${u.isActive ? 'ระงับ' : 'เปิดใช้งาน'}บัญชี ${fullName(u)} ใช่หรือไม่?`)) return;
    try {
      await api(`/users/${u.id}`, { method: 'PATCH', body: { isActive: !u.isActive } });
      setNotice({ tone: 'success', text: 'บันทึกสถานะบัญชีแล้ว' });
      reload();
    } catch (err) {
      setNotice({ tone: 'error', text: err instanceof ApiError ? err.message : 'บันทึกไม่สำเร็จ' });
    }
  }

  async function resetPassword(u: User) {
    const newPassword = prompt(`ตั้งรหัสผ่านใหม่ให้ ${fullName(u)} (อย่างน้อย 8 ตัวอักษร)`);
    if (!newPassword) return;
    try {
      await api(`/users/${u.id}/reset-password`, { method: 'POST', body: { newPassword } });
      setNotice({ tone: 'success', text: `ตั้งรหัสผ่านใหม่ให้ ${u.username} แล้ว` });
    } catch (err) {
      const text = err instanceof ApiError ? (err.details?.[0]?.message ?? err.message) : 'ไม่สำเร็จ';
      setNotice({ tone: 'error', text });
    }
  }

  function onSearch(e: FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(q.trim());
  }

  return (
    <>
      <PageHeader
        title={isAdmin ? 'จัดการผู้ใช้งาน' : 'รายชื่อนักเรียน'}
        subtitle={isAdmin ? 'ผู้ดูแลระบบ ครู และนักเรียน ม.3 / ม.6' : 'นักเรียนที่เตรียมสอบ O-NET ม.3 / ม.6'}
        actions={
          isAdmin && (
            <button type="button" className="btn btn-gold" onClick={() => setShowCreate(true)}>
              <UserPlus className="h-4 w-4" /> เพิ่มผู้ใช้งาน
            </button>
          )
        }
      />

      {notice && (
        <div className="mb-4">
          <Alert tone={notice.tone}>{notice.text}</Alert>
        </div>
      )}

      <div className="card mb-4 flex flex-wrap items-end gap-3 p-4">
        {isAdmin && (
          <div>
            <label className="label" htmlFor="role">
              บทบาท
            </label>
            <select
              id="role"
              className="input"
              value={role}
              onChange={(e) => {
                setRole(e.target.value as Role | '');
                setPage(1);
              }}
            >
              <option value="">ทั้งหมด</option>
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="label" htmlFor="grade">
            ระดับชั้น
          </label>
          <select
            id="grade"
            className="input"
            value={grade}
            onChange={(e) => {
              setGrade(e.target.value as GradeLevel | '');
              setPage(1);
            }}
          >
            <option value="">ทุกระดับ</option>
            <option value="M3">ม.3</option>
            <option value="M6">ม.6</option>
          </select>
        </div>
        <form onSubmit={onSearch} className="flex min-w-[240px] flex-1 items-end gap-2">
          <div className="flex-1">
            <label className="label" htmlFor="q">
              ค้นหา
            </label>
            <input
              id="q"
              className="input"
              placeholder="ชื่อ นามสกุล ชื่อผู้ใช้ หรือเลขประจำตัว"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            <Search className="h-4 w-4" /> ค้นหา
          </button>
        </form>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <Alert tone="error">{error}</Alert>
      ) : !data || data.items.length === 0 ? (
        <EmptyState title="ไม่พบผู้ใช้งาน">ลองเปลี่ยนเงื่อนไขการค้นหา</EmptyState>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-navy-900 text-left text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">ชื่อ-นามสกุล</th>
                  <th className="px-4 py-3 font-semibold">ชื่อผู้ใช้</th>
                  <th className="px-4 py-3 font-semibold">บทบาท</th>
                  <th className="px-4 py-3 font-semibold">ระดับชั้น / กลุ่มสาระ</th>
                  <th className="px-4 py-3 font-semibold">เข้าใช้ล่าสุด</th>
                  <th className="px-4 py-3 font-semibold">สถานะ</th>
                  {isAdmin && <th className="px-4 py-3 text-right font-semibold">จัดการ</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {data.items.map((u) => (
                  <tr key={u.id} className="hover:bg-navy-50/60">
                    <td className="px-4 py-3 font-medium text-navy-900">
                      {fullName(u)}
                      {u.studentProfile && (
                        <div className="text-xs font-normal text-slate-400">{u.studentProfile.studentCode}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{u.username}</td>
                    <td className="px-4 py-3">
                      <Badge tone={u.role === 'ADMIN' ? 'gold' : 'navy'}>{ROLE_LABELS[u.role]}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {u.studentProfile
                        ? `${GRADE_LABELS[u.studentProfile.gradeLevel]}${u.studentProfile.classroom ? ` (${u.studentProfile.classroom.name})` : ''}`
                        : (u.teacherProfile?.department ?? '–')}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {u.lastLoginAt ? formatThaiDateTime(u.lastLoginAt) : 'ยังไม่เคยเข้าใช้'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={u.isActive ? 'green' : 'red'}>{u.isActive ? 'ใช้งาน' : 'ระงับ'}</Badge>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="btn btn-outline px-2.5 py-1.5 text-xs"
                            onClick={() => resetPassword(u)}
                            title="ตั้งรหัสผ่านใหม่"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                          </button>
                          {u.id !== me?.id && (
                            <button
                              type="button"
                              className="btn btn-outline px-2.5 py-1.5 text-xs"
                              onClick={() => toggleActive(u)}
                            >
                              {u.isActive ? 'ระงับ' : 'เปิดใช้'}
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-navy-100 px-4 py-3 text-sm text-slate-500">
            <span>ทั้งหมด {new Intl.NumberFormat('th-TH').format(data.total)} คน</span>
            <div className="flex items-center gap-2">
              <button type="button" className="btn btn-outline px-3 py-1.5" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ก่อนหน้า
              </button>
              <span>
                หน้า {page} / {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-outline px-3 py-1.5"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                ถัดไป
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateUserDialog
          onClose={() => setShowCreate(false)}
          onCreated={(u) => {
            setShowCreate(false);
            setNotice({ tone: 'success', text: `เพิ่มผู้ใช้งาน ${fullName(u)} เรียบร้อยแล้ว` });
            reload();
          }}
        />
      )}
    </>
  );
}

function CreateUserDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (u: User) => void }) {
  const [form, setForm] = useState({
    role: 'STUDENT' as Role,
    username: '',
    password: '',
    prefix: '',
    firstName: '',
    lastName: '',
    email: '',
    studentCode: '',
    gradeLevel: 'M3' as GradeLevel,
    department: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const body = {
        role: form.role,
        username: form.username,
        password: form.password,
        prefix: form.prefix || undefined,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || undefined,
        ...(form.role === 'STUDENT' && { studentCode: form.studentCode, gradeLevel: form.gradeLevel }),
        ...(form.role === 'TEACHER' && { department: form.department || undefined }),
      };
      const res = await api<{ user: User }>('/users', { method: 'POST', body });
      onCreated(res.user);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? [err.message, ...(err.details ?? []).map((d) => d.message)].join(' — ')
          : 'บันทึกไม่สำเร็จ',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/60 p-4" role="dialog" aria-modal aria-labelledby="create-title">
      <div className="card max-h-[90vh] w-full max-w-xl overflow-y-auto">
        <div className="flex items-center justify-between border-b border-navy-100 px-6 py-4">
          <h2 id="create-title" className="text-lg font-bold text-navy-900">
            เพิ่มผู้ใช้งาน
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-navy-50" aria-label="ปิด">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={onSubmit} className="grid gap-4 px-6 py-5 sm:grid-cols-2">
          {error && (
            <div className="sm:col-span-2">
              <Alert tone="error">{error}</Alert>
            </div>
          )}
          <div className="sm:col-span-2">
            <label className="label" htmlFor="c-role">
              บทบาท
            </label>
            <select id="c-role" className="input" value={form.role} onChange={set('role')}>
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="c-prefix">
              คำนำหน้า
            </label>
            <input id="c-prefix" className="input" list="prefixes" value={form.prefix} onChange={set('prefix')} />
            <datalist id="prefixes">
              {['สามเณร', 'พระ', 'เด็กชาย', 'เด็กหญิง', 'นาย', 'นางสาว', 'นาง'].map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="c-first">
              ชื่อ *
            </label>
            <input id="c-first" className="input" value={form.firstName} onChange={set('firstName')} required />
          </div>
          <div>
            <label className="label" htmlFor="c-last">
              นามสกุล *
            </label>
            <input id="c-last" className="input" value={form.lastName} onChange={set('lastName')} required />
          </div>
          <div>
            <label className="label" htmlFor="c-email">
              อีเมล
            </label>
            <input id="c-email" type="email" className="input" value={form.email} onChange={set('email')} />
          </div>

          {form.role === 'STUDENT' && (
            <>
              <div>
                <label className="label" htmlFor="c-code">
                  เลขประจำตัวนักเรียน *
                </label>
                <input id="c-code" className="input" value={form.studentCode} onChange={set('studentCode')} required />
              </div>
              <div>
                <label className="label" htmlFor="c-grade">
                  ระดับชั้น *
                </label>
                <select id="c-grade" className="input" value={form.gradeLevel} onChange={set('gradeLevel')}>
                  <option value="M3">มัธยมศึกษาปีที่ 3</option>
                  <option value="M6">มัธยมศึกษาปีที่ 6</option>
                </select>
              </div>
            </>
          )}
          {form.role === 'TEACHER' && (
            <div className="sm:col-span-2">
              <label className="label" htmlFor="c-dept">
                กลุ่มสาระการเรียนรู้
              </label>
              <input id="c-dept" className="input" value={form.department} onChange={set('department')} />
            </div>
          )}

          <div>
            <label className="label" htmlFor="c-user">
              ชื่อผู้ใช้ *
            </label>
            <input
              id="c-user"
              className="input"
              autoCapitalize="none"
              placeholder="a-z 0-9 . _ -"
              value={form.username}
              onChange={set('username')}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="c-pass">
              รหัสผ่านเริ่มต้น *
            </label>
            <input
              id="c-pass"
              type="password"
              className="input"
              autoComplete="new-password"
              minLength={8}
              value={form.password}
              onChange={set('password')}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 sm:col-span-2">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              ยกเลิก
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'กำลังบันทึก...' : 'บันทึก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
