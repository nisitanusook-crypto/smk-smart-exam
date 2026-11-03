import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { Logo } from '../components/Logo';
import { Alert } from '../components/ui';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';
  if (user) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(username.trim(), password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* แผงข้อมูลโรงเรียน */}
      <section className="relative hidden overflow-hidden bg-navy-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full border-[28px] border-gold-500/15"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-navy-600/30 blur-3xl"
          aria-hidden
        />
        <div className="relative flex items-center gap-4">
          <Logo size={56} />
          <div>
            <p className="text-2xl font-bold">
              SMK <span className="text-gold-400">Smart Exam</span>
            </p>
            <p className="text-sm text-navy-200">ระบบจำลองการสอบ O-NET</p>
          </div>
        </div>

        <div className="relative max-w-lg">
          <h1 className="text-4xl font-bold leading-snug">
            เตรียมความพร้อมสอบ <span className="text-gold-400">O-NET</span>
            <br />
            ระดับชั้น ม.3 และ ม.6
          </h1>
          <p className="mt-4 text-navy-200">
            ฝึกทำข้อสอบจริงย้อนหลังจากเอกสารที่ตรวจสอบได้ พร้อมหน้าจอสอบตามแนวทางระบบสอบดิจิทัลของ สทศ.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-navy-100">
            {[
              'คลังข้อสอบจริงย้อนหลังสูงสุด 20 ปี',
              'โหมดฝึกสอบ และโหมดจำลองสนามสอบจริง',
              'วิเคราะห์ผลและออกรายงาน PDF / Excel',
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-gold-400" aria-hidden />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative border-t border-white/10 pt-5 text-sm text-navy-200">
          <p className="font-semibold text-gold-400">โรงเรียนวัดศิริมงคล</p>
          <p>ตำบลหนองเม็ก อำเภอหนองหาน จังหวัดอุดรธานี</p>
          <p>สังกัดสำนักเขตการศึกษาพระปริยัติธรรม แผนกสามัญ เขต 8</p>
        </div>
      </section>

      {/* ฟอร์มเข้าสู่ระบบ */}
      <section className="flex items-center justify-center bg-white px-4 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <Logo size={64} />
            <p className="mt-3 text-2xl font-bold text-navy-900">
              SMK <span className="text-gold-600">Smart Exam</span>
            </p>
            <p className="text-sm text-slate-500">โรงเรียนวัดศิริมงคล จ.อุดรธานี</p>
          </div>

          <h2 className="text-2xl font-bold text-navy-900">เข้าสู่ระบบ</h2>
          <p className="mt-1 text-sm text-slate-500">สำหรับผู้ดูแลระบบ ครู และนักเรียน</p>
          <div className="mt-3 h-1 w-14 rounded-full bg-gold-500" aria-hidden />

          <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
            {error && <Alert tone="error">{error}</Alert>}

            <div>
              <label htmlFor="username" className="label">
                ชื่อผู้ใช้
              </label>
              <input
                id="username"
                className="input"
                autoComplete="username"
                autoCapitalize="none"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="เช่น เลขประจำตัวนักเรียน"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="label">
                รหัสผ่าน
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-11"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 hover:text-navy-700"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full py-3 text-base"
              disabled={submitting || !username || !password}
            >
              <LogIn className="h-5 w-5" />
              {submitting ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            ลืมรหัสผ่าน? กรุณาติดต่อผู้ดูแลระบบของโรงเรียน
          </p>
        </div>
      </section>
    </div>
  );
}
